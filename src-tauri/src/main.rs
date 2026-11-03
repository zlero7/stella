#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::BTreeMap;
use std::fs;
use std::io::{BufRead, BufReader, Read, Seek, SeekFrom, Write};
use std::net::{TcpListener, TcpStream, ToSocketAddrs};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;
use std::path::{Component, Path, PathBuf};
use std::sync::{Mutex, OnceLock};

use percent_encoding::percent_decode_str;
use serde_json::{json, Value};
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

const IMG_EXT: [&str; 5] = ["png", "jpg", "jpeg", "webp", "svg"];
const AUDIO_EXT: [&str; 7] = ["wav", "mp3", "ogg", "flac", "m4a", "aac", "mp4"];
// 끝을 정하지 않은 구간 요청(bytes=N-)에 한 번에 줄 최대 크기: 큰 영상을 통째로 메모리에 올리지 않는다
const CHUNK: u64 = 8 << 20;

fn songs_root() -> &'static Path {
    static ROOT: OnceLock<PathBuf> = OnceLock::new();
    ROOT.get_or_init(|| {
        if cfg!(debug_assertions) {
            Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap().join("songs")
        } else {
            std::env::current_exe().ok().and_then(|p| p.parent().map(|d| d.join("songs"))).unwrap_or_else(|| "songs".into())
        }
    })
}

fn plain(s: &str) -> bool {
    !s.is_empty() && Path::new(s).components().all(|c| matches!(c, Component::Normal(_)))
}

// 곡 폴더 밖으로 나가는 경로(.., 절대 경로, 드라이브 문자)를 막는다
fn safe_join(dir: &str, file: &str) -> Result<PathBuf, String> {
    if !plain(dir) || dir.contains(['/', '\\']) || !plain(file) {
        return Err("bad path".into());
    }
    Ok(songs_root().join(dir).join(file))
}

// 4k-normal.json 같은 채보 파일 이름만 쓸 수 있다
fn is_chart_file(n: &str) -> bool {
    let Some(m) = n.strip_suffix(".json").map(str::as_bytes) else { return false };
    m.len() > 3 && m[0].is_ascii_digit() && &m[1..3] == b"k-" && m[3..].iter().all(|c| c.is_ascii_alphanumeric() || *c == b'_' || *c == b'-')
}

fn ext_of(name: &str) -> String {
    Path::new(name).extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase()
}

#[tauri::command]
async fn songs_scan() -> Vec<Value> {
    let root = songs_root();
    let mut names: Vec<String> = fs::read_dir(root).into_iter().flatten().flatten()
        .filter(|e| e.path().is_dir()).map(|e| e.file_name().to_string_lossy().into_owned()).collect();
    names.sort();
    let mut songs = vec![];
    for name in names {
        let dir = root.join(&name);
        // meta.json 없거나 깨진 폴더는 건너뜀
        let Ok(txt) = fs::read_to_string(dir.join("meta.json")) else { continue };
        let Ok(Value::Object(mut meta)) = serde_json::from_str::<Value>(&txt) else { continue };
        // 실제로 있는 이미지 파일만 남긴다 (meta 지정 우선, 없으면 cover.* / bg.*)
        for (key, base) in [("cover", "cover"), ("bg", "bg")] {
            let first = meta.get(key).and_then(Value::as_str).map(String::from);
            let found = first.into_iter().chain(IMG_EXT.iter().map(|x| format!("{base}.{x}"))).find(|f| dir.join(f).is_file());
            match found { Some(f) => { meta.insert(key.into(), json!(f)); } None => { meta.remove(key); } }
        }
        // 폴더에 있는 채보 파일(4k-normal.json ...)을 목록에 합친다
        let mut charts: Vec<String> = meta.get("charts").and_then(Value::as_array).into_iter().flatten().filter_map(|v| v.as_str().map(String::from)).collect();
        for f in fs::read_dir(&dir).into_iter().flatten().flatten().map(|e| e.file_name().to_string_lossy().into_owned()) {
            if is_chart_file(&f) && !charts.contains(&f) { charts.push(f); }
        }
        meta.insert("charts".into(), json!(charts));
        songs.push(json!({ "dir": name, "meta": meta }));
    }
    songs
}

#[tauri::command]
async fn songs_read(dir: String, file: String) -> Result<tauri::ipc::Response, String> {
    fs::read(safe_join(&dir, &file)?).map(tauri::ipc::Response::new).map_err(|e| e.to_string())
}

#[tauri::command]
async fn songs_write(dir: String, file: String, text: String) -> Result<(), String> {
    if !is_chart_file(&file) { return Err("bad file".into()); }
    fs::write(safe_join(&dir, &file)?, text).map_err(|e| e.to_string())
}

// 서버에서 받은 곡 파일 하나를 곡 폴더에 둔다 (곡을 만드는 유일한 길). 헤더 dir·file(퍼센트 인코딩), 몸통은 파일 바이트.
// meta.json은 맨 마지막에 받으므로 meta.json이 있는 폴더 = 다 받은 곡. 받는 도중 끊겨도 반쪽 파일은 .part로만 남는다
#[tauri::command]
async fn songs_put(request: tauri::ipc::Request<'_>) -> Result<(), String> {
    let tauri::ipc::InvokeBody::Raw(body) = request.body() else { return Err("bad request".into()) };
    let hdr = |k: &str| request.headers().get(k).and_then(|v| v.to_str().ok()).and_then(|v| percent_decode_str(v).decode_utf8().ok()).map(|c| c.into_owned()).ok_or_else(|| "bad request".to_string());
    let (dir, file) = (hdr("dir")?, hdr("file")?);
    let x = ext_of(&file);
    let stem_ok = file.strip_suffix(&format!(".{x}")).is_some_and(|s| !s.is_empty() && s.bytes().all(|c| c.is_ascii_alphanumeric() || c == b'_' || c == b'-'));
    if !(file == "meta.json" || is_chart_file(&file) || (stem_ok && (AUDIO_EXT.contains(&x.as_str()) || IMG_EXT.contains(&x.as_str())))) { return Err("bad file".into()); }
    let path = safe_join(&dir, &file)?;
    fs::create_dir_all(path.parent().unwrap()).map_err(|e| e.to_string())?;
    let tmp = path.with_file_name(format!("{file}.part"));
    fs::write(&tmp, body).and_then(|_| fs::rename(&tmp, &path)).map_err(|e| { let _ = fs::remove_file(&tmp); e.to_string() })
}

// 설정·점수 기록: 앱 데이터 폴더의 state.json
struct StateStore { path: PathBuf, map: Mutex<BTreeMap<String, String>> }

#[tauri::command]
fn state_save(store: tauri::State<StateStore>, key: String, value: String) {
    let mut m = store.map.lock().unwrap();
    m.insert(key, value);
    let _ = fs::write(&store.path, serde_json::to_vec(&*m).unwrap_or_default()); // 저장 못 해도 이번 실행은 계속
}

// 대결: 한 번에 한 명과 TCP로 연결해 JSON 한 줄씩 주고받는다. 렌더러는 'net' 이벤트로 열림·메시지·끊김을 받는다
struct Net { writer: Mutex<Option<TcpStream>>, gen: AtomicU64 } // gen이 바뀌면 이전 연결의 스레드는 스스로 끝낸다

fn net_event(app: &tauri::AppHandle, kind: &str, data: Option<String>) {
    let _ = app.emit("net", json!({ "kind": kind, "data": data }));
}

// 연결이 맺어진 뒤: 쓰기용 복사본을 보관하고, 받은 줄을 이벤트로 올린다 (끊기면 close)
fn net_run(app: tauri::AppHandle, id: u64, stream: TcpStream) {
    let _ = stream.set_nodelay(true);
    let Ok(w) = stream.try_clone() else { net_event(&app, "close", None); return };
    *app.state::<Net>().writer.lock().unwrap() = Some(w);
    net_event(&app, "open", None);
    for line in BufReader::new(stream).lines() {
        let Ok(line) = line else { break };
        if app.state::<Net>().gen.load(Ordering::SeqCst) != id { return; }
        net_event(&app, "msg", Some(line));
    }
    if app.state::<Net>().gen.load(Ordering::SeqCst) == id { net_event(&app, "close", None); }
}

fn net_reset(net: &Net) -> u64 {
    let id = net.gen.fetch_add(1, Ordering::SeqCst) + 1;
    if let Some(s) = net.writer.lock().unwrap().take() { let _ = s.shutdown(std::net::Shutdown::Both); }
    id
}

#[tauri::command]
fn net_host(app: tauri::AppHandle, net: tauri::State<Net>, port: u16) -> Result<(), String> {
    let id = net_reset(&net);
    let l = TcpListener::bind(("0.0.0.0", port)).map_err(|e| format!("포트 {port}를 열 수 없습니다 ({e})"))?;
    l.set_nonblocking(true).map_err(|e| e.to_string())?;
    std::thread::spawn(move || loop {
        if app.state::<Net>().gen.load(Ordering::SeqCst) != id { return; } // 취소됨
        match l.accept() {
            Ok((s, _)) => { let _ = s.set_nonblocking(false); net_run(app, id, s); return; }
            Err(_) => std::thread::sleep(Duration::from_millis(100)),
        }
    });
    Ok(())
}

#[tauri::command]
async fn net_join(app: tauri::AppHandle, net: tauri::State<'_, Net>, addr: String) -> Result<(), String> {
    let id = net_reset(&net);
    let sa = addr.to_socket_addrs().map_err(|_| "주소를 읽을 수 없습니다 (예: 192.168.0.5:9777)".to_string())?.next().ok_or("주소를 찾을 수 없습니다")?;
    let s = TcpStream::connect_timeout(&sa, Duration::from_secs(5)).map_err(|_| "연결하지 못했습니다 (주소·포트·방화벽을 확인하세요)".to_string())?;
    std::thread::spawn(move || net_run(app, id, s));
    Ok(())
}

#[tauri::command]
fn net_send(net: tauri::State<Net>, line: String) {
    if let Some(w) = net.writer.lock().unwrap().as_mut() { let _ = w.write_all(format!("{line}
").as_bytes()); }
}

#[tauri::command]
fn net_close(net: tauri::State<Net>) { net_reset(&net); }

// 이 PC의 IPv4 주소들 (같은 공유기·Tailscale 등에서 상대가 접속할 주소)
#[tauri::command]
fn net_ips() -> Vec<String> {
    local_ip_address::list_afinet_netifas().unwrap_or_default().into_iter()
        .filter_map(|(_, ip)| match ip { std::net::IpAddr::V4(v) if !v.is_loopback() && !v.is_link_local() => Some(v.to_string()), _ => None }).collect()
}

// 화면 모드: 0 창모드, 1 전체화면 창모드(테두리 없는 창을 모니터 크기로), 2 전체화면
fn apply_screen(w: &tauri::WebviewWindow, mode: u8) -> tauri::Result<()> {
    match mode {
        0 => { w.set_fullscreen(false)?; w.set_decorations(true)?; w.set_size(tauri::LogicalSize::new(1280.0, 720.0))?; w.center()?; }
        1 => {
            w.set_fullscreen(false)?; w.set_decorations(false)?;
            if let Some(m) = w.current_monitor()? { w.set_position(*m.position())?; w.set_size(*m.size())?; }
        }
        _ => w.set_fullscreen(true)?,
    }
    Ok(())
}

#[tauri::command]
fn set_screen_mode(app: tauri::AppHandle, mode: u8) -> Result<(), String> {
    let w = app.get_webview_window("main").ok_or("창을 찾을 수 없습니다")?;
    apply_screen(&w, mode).map_err(|e| e.to_string())
}

#[tauri::command]
fn quit(app: tauri::AppHandle) { app.exit(0); }

fn mime(p: &Path) -> &'static str {
    match ext_of(&p.to_string_lossy()).as_str() {
        "mp4" => "video/mp4", "mp3" => "audio/mpeg", "wav" => "audio/wav", "ogg" => "audio/ogg", "flac" => "audio/flac",
        "m4a" | "aac" => "audio/mp4", "png" => "image/png", "jpg" | "jpeg" => "image/jpeg", "webp" => "image/webp", "svg" => "image/svg+xml",
        _ => "application/octet-stream",
    }
}

// song://<폴더>/<파일>: <video>/<audio>가 곡 폴더의 파일을 구간(Range) 요청으로 직접 스트리밍한다
fn serve(req: &tauri::http::Request<Vec<u8>>) -> tauri::http::Response<Vec<u8>> {
    let reply = |status: u16| tauri::http::Response::builder().status(status).header("Access-Control-Allow-Origin", "*");
    let segs: Vec<String> = req.uri().path().split('/').filter(|s| !s.is_empty()).map(|s| percent_decode_str(s).decode_utf8_lossy().into_owned()).collect();
    let [dir, file] = segs.as_slice() else { return reply(404).body(vec![]).unwrap() };
    let Ok(p) = safe_join(dir, file) else { return reply(403).body(vec![]).unwrap() }; // songs/ 밖은 막는다
    let Ok(mut f) = fs::File::open(&p) else { return reply(404).body(vec![]).unwrap() };
    let size = f.metadata().map(|m| m.len()).unwrap_or(0);
    let range = req.headers().get("range").and_then(|v| v.to_str().ok()).and_then(|v| v.strip_prefix("bytes=")).and_then(|v| v.split_once('-'));
    let (start, end) = match range {
        Some((a, b)) if !a.is_empty() => {
            let s = a.parse().unwrap_or(u64::MAX);
            (s, b.parse().map_or(s.saturating_add(CHUNK - 1), |e: u64| e.min(s.saturating_add(CHUNK - 1))).min(size.saturating_sub(1)))
        }
        Some((_, b)) if !b.is_empty() => (size.saturating_sub(b.parse().unwrap_or(0)), size.saturating_sub(1)), // bytes=-N : 끝에서 N바이트
        _ => (0, size.saturating_sub(1)),
    };
    if size == 0 || start > end { return reply(416).header("Content-Range", format!("bytes */{size}")).body(vec![]).unwrap(); }
    let mut buf = Vec::with_capacity((end - start + 1) as usize);
    if f.seek(SeekFrom::Start(start)).is_err() || f.take(end - start + 1).read_to_end(&mut buf).is_err() { return reply(500).body(vec![]).unwrap(); }
    let mut r = reply(if range.is_some() { 206 } else { 200 }).header("Content-Type", mime(&p)).header("Accept-Ranges", "bytes");
    if range.is_some() { r = r.header("Content-Range", format!("bytes {start}-{end}/{size}")); }
    r.body(buf).unwrap()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .register_asynchronous_uri_scheme_protocol("song", |_ctx, req, responder| {
            std::thread::spawn(move || responder.respond(serve(&req)));
        })
        .invoke_handler(tauri::generate_handler![songs_scan, songs_read, songs_write, songs_put, state_save, quit, set_screen_mode, net_host, net_join, net_send, net_close, net_ips])
        .setup(|app| {
            let dir = app.path().app_data_dir()?;
            fs::create_dir_all(&dir)?;
            let path = dir.join("state.json");
            let map: BTreeMap<String, String> = fs::read_to_string(&path).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default();
            // 렌더러가 시작할 때 동기로 읽을 수 있게 페이지에 미리 심는다
            let init = format!("window.__STATE__ = {};", serde_json::to_string(&map)?);
            // 저장된 화면 모드(설정의 screen)로 시작한다. 처음이면 전체화면. 깜박임 없이 처음부터 그 모양으로 연다
            let mode = map.get("rg.settings").and_then(|t| serde_json::from_str::<Value>(t).ok()).and_then(|v| v["screen"].as_u64()).unwrap_or(2) as u8;
            app.manage(StateStore { path, map: Mutex::new(map) });
            app.manage(Net { writer: Mutex::new(None), gen: AtomicU64::new(0) });
            let win = WebviewWindowBuilder::new(app, "main", WebviewUrl::default()).title("STELLA").inner_size(1280.0, 720.0)
                .fullscreen(mode == 2).decorations(mode != 1).initialization_script(init).build()?;
            if mode == 1 { let _ = apply_screen(&win, 1); }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn chart_file_names() {
        for ok in ["4k-normal.json", "6k-my-chart_2.json"] { assert!(is_chart_file(ok), "{ok}"); }
        for bad in ["meta.json", "4k-.json", "4k-a/b.json", "../4k-a.json", "x4k-a.json"] { assert!(!is_chart_file(bad), "{bad}"); }
    }

    // 곡 폴더 안만 허용하고, 옆 폴더·상위 폴더·절대 경로는 막는다
    #[test]
    fn safe_join_blocks_escapes() {
        let root = songs_root();
        assert_eq!(safe_join("imp-1", "meta.json").unwrap(), root.join("imp-1").join("meta.json"));
        for (d, f) in [("..", "secret.txt"), ("../songs-old", "a.json"), ("imp-1", "../../x"), ("", ""), ("imp-1", "C:\\x"), ("/abs", "a")] {
            assert!(safe_join(d, f).is_err(), "{d} / {f}");
        }
    }
}
