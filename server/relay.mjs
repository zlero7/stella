// STELLA 대결 중계 서버 (웹소켓): 방장이 방을 만들면 방 코드를 주고, 손님이 그 코드로 들어오면 두 연결을 이어 준다.
// 이어진 뒤에는 게임이 주고받는 메시지를 그대로 전달만 한다 (내용은 보지 않는다).
// Cloudflare 터널이 relay.example.com → http://localhost:9777 로 이 서버에 연결한다. 사용: node server/relay.mjs  (포트는 PORT 환경 변수, 기본 9777)
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer } from 'ws'

const PORT = Number(process.env.PORT) || 9777
const MAX_ROOMS = 200, WAIT_MS = 10 * 60 * 1000 // 짝이 안 맞는 방은 10분 뒤에 닫는다
const rooms = new Map() // 방 코드 -> 방장 소켓
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 헷갈리는 글자(I, O, 0, 1) 제외
const newCode = () => { for (;;) { const c = Array.from({ length: 5 }, () => ABC[Math.floor(Math.random() * ABC.length)]).join(''); if (!rooms.has(c)) return c } }
const send = (s, o) => s.send(JSON.stringify(o))
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)

// 곡 목록·파일 배포: songs/ 폴더가 모든 유저가 보는 곡 목록의 원본이다. 앱은 /songs/index.json 에 있는 곡만 보여 주고, 고를 때 파일을 받아 간다
const SONGS = fileURLToPath(new URL('../songs/', import.meta.url))
const IMG = ['png', 'jpg', 'jpeg', 'webp', 'svg'], AUDIO = ['wav', 'mp3', 'ogg', 'flac', 'm4a', 'aac', 'mp4']
const TYPES = { mp4: 'video/mp4', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac', m4a: 'audio/mp4', aac: 'audio/aac', json: 'application/json', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml' }
const CORS = { 'Access-Control-Allow-Origin': '*' }
const CHART = /^\dk-[\w-]+\.json$/, MEDIA = /^[\w-]+\.(\w+)$/
const servable = n => n === 'meta.json' || CHART.test(n) || (MEDIA.exec(n) && [...AUDIO, ...IMG].includes(MEDIA.exec(n)[1].toLowerCase()))
let indexCache = { at: 0, body: '' }
function songIndex() {
  if (Date.now() - indexCache.at < 30000) return indexCache.body
  const out = []
  for (const d of fs.readdirSync(SONGS, { withFileTypes: true })) {
    if (!d.isDirectory() || !/^[\w-]{1,64}$/.test(d.name)) continue
    const dir = path.join(SONGS, d.name)
    let meta, names
    try { meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')); names = fs.readdirSync(dir) } catch { continue }
    if (!meta || typeof meta !== 'object' || typeof meta.audio !== 'string') continue
    for (const k of ['cover', 'bg']) { const f = [meta[k], ...IMG.map(x => `${k}.${x}`)].find(f => f && names.includes(f)); if (f) meta[k] = f; else delete meta[k] }
    meta.charts = names.filter(n => CHART.test(n))
    // meta.json은 맨 끝: 앱은 meta.json이 있는 폴더를 "다 받은 곡"으로 본다
    const files = [...new Set([meta.audio, meta.video, meta.cover, meta.bg, ...meta.charts, 'meta.json'])].filter(n => n && names.includes(n) && servable(n))
    out.push({ dir: d.name, meta, files: files.map(name => ({ name, size: fs.statSync(path.join(dir, name)).size })) })
  }
  indexCache = { at: Date.now(), body: JSON.stringify(out) }
  return indexCache.body
}
const CHUNK = 2 << 20
function sendSong(req, res, dir, file) {
  const p = path.join(SONGS, dir, file)
  let st; try { st = fs.statSync(p) } catch { /* 없음 */ }
  if (!st?.isFile() || !servable(file)) { res.writeHead(404, CORS); res.end(); return }
  const r = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '') // 영상 미리듣기는 구간 요청으로 온다
  let a = 0, b = st.size - 1
  if (r && (r[1] || r[2])) { if (r[1]) { a = +r[1]; if (r[2]) b = Math.min(+r[2], b) } else a = Math.max(st.size - +r[2], 0) }
  if (r?.[1] && !r[2]) b = Math.min(b, a + CHUNK - 1) // 끝을 안 정한 요청(bytes=N-)에 통째로 보내지 않는다: 터널 대역폭을 영상 한 개가 독차지하지 않게 (브라우저가 이어서 또 요청한다)
  if (a > b) { res.writeHead(416, { ...CORS, 'Content-Range': `bytes */${st.size}` }); res.end(); return }
  const part = a > 0 || b < st.size - 1
  res.writeHead(part ? 206 : 200, { ...CORS, 'Content-Type': TYPES[file.split('.').pop().toLowerCase()] ?? 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1, ...(part && { 'Content-Range': `bytes ${a}-${b}/${st.size}` }) })
  if (req.method === 'HEAD') res.end(); else fs.createReadStream(p, { start: a, end: b }).on('error', () => res.destroy()).pipe(res)
}

// 온라인 랭킹: 곡·키 수·난이도마다 닉네임 하나당 최고 점수만 남기고 상위 50명을 ranks.json에 저장한다.
// shortcut: 점수는 클라이언트가 보낸 값을 그대로 믿는다 (친구끼리 쓰는 규모), 부정 방지가 필요해지면 서버가 판정 기록을 검증하도록 바꾼다
const RANKS = fileURLToPath(new URL('./ranks.json', import.meta.url)), TOP = 50
let ranks = {}
try { ranks = JSON.parse(fs.readFileSync(RANKS, 'utf8')) } catch { /* 처음엔 없다 */ }
let saveTimer
const saveRanks = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => fs.writeFile(RANKS, JSON.stringify(ranks), e => e && log('랭킹 저장 실패', e.message)), 2000) }
const hits = new Map() // IP -> [분 시작, 횟수]: 점수 올리기는 분당 30번까지
const tooMany = ip => { const now = Date.now(), h = hits.get(ip); if (!h || now - h[0] > 60000) { hits.set(ip, [now, 1]); return false } return ++h[1] > 30 }
const BADGES = ['ALL PERFECT', 'FULL COMBO']
function rankApi(req, res, dir, key) {
  const json = (code, body) => { res.writeHead(code, { ...CORS, 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)) }
  if (!fs.existsSync(path.join(SONGS, dir, key + '.json'))) { json(404, { error: '없는 곡' }); return }
  const id = dir + '/' + key, list = (ranks[id] ??= [])
  if (req.method === 'GET') { json(200, list.slice(0, 10)); return }
  if (tooMany(req.headers['cf-connecting-ip'] ?? req.socket.remoteAddress)) { json(429, { error: '잠시 후 다시' }); return }
  let body = ''
  req.on('data', c => { body += c; if (body.length > 512) req.destroy() })
  req.on('end', () => {
    let m; try { m = JSON.parse(body) } catch { json(400, { error: '형식' }); return }
    const nick = String(m.nick ?? '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 12), score = m.score, acc = m.acc, mc = m.mc
    if (!nick || !Number.isInteger(score) || score < 0 || score > 1_000_000 || !(acc >= 0 && acc <= 100) || !Number.isInteger(mc) || mc < 0 || mc > 99999) { json(400, { error: '값' }); return }
    const rec = { nick, score, acc: +acc.toFixed(2), mc, badge: BADGES.includes(m.badge) ? m.badge : '', at: Date.now() }, cur = list.find(r => r.nick === nick)
    if (!cur) list.push(rec); else if (score > cur.score) Object.assign(cur, rec)
    list.sort((a, b) => b.score - a.score || a.at - b.at); list.length = Math.min(list.length, TOP)
    saveRanks(); json(200, list.slice(0, 10))
  })
}

const server = http.createServer((req, res) => {
  const url = req.url?.split('?')[0] ?? '', song = /^\/songs\/([\w-]{1,64})\/([\w.-]{1,80})$/.exec(url), rank = /^\/rank\/([\w-]{1,64})\/([46]k-(?:easy|normal|hard|stella))$/.exec(url)
  if (req.method === 'OPTIONS') { res.writeHead(204, { ...CORS, 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type' }); res.end(); return }
  if (rank && (req.method === 'GET' || req.method === 'POST')) { rankApi(req, res, rank[1], rank[2]); return }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return }
  if (url === '/songs/index.json') {
    try { res.writeHead(200, { ...CORS, 'Content-Type': 'application/json; charset=utf-8' }); res.end(songIndex()) } catch (e) { log('목록 오류', e.message); res.destroy() }
  } else if (song) sendSong(req, res, song[1], song[2])
  else { res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(`STELLA relay OK (${rooms.size} rooms)\n`) } // 터널·브라우저로 살아 있는지 보는 용도
})
const wss = new WebSocketServer({ server, maxPayload: 1 << 20 }) // 채보(수십 KB)가 한 메시지로 오가므로 1MB까지

wss.on('connection', sock => {
  const st = { code: '', peer: null, timer: null, alive: true } // 이 연결의 상태 (방장이면 code, 이어진 뒤에는 peer)
  sock.st = st
  sock.on('pong', () => { st.alive = true })
  sock.on('error', () => sock.terminate())
  sock.on('close', () => {
    clearTimeout(st.timer)
    if (st.code && rooms.get(st.code) === sock) rooms.delete(st.code)
    if (st.peer) { st.peer.st.peer = null; st.peer.close(); st.peer = null }
  })
  const hello = setTimeout(() => { if (!st.code && !st.peer) sock.terminate() }, 15000) // 요청도 안 보내고 붙어 있는 연결은 끊는다
  sock.on('close', () => clearTimeout(hello))

  sock.on('message', (data, isBinary) => {
    if (st.peer) { st.peer.send(data, { binary: isBinary }); return } // 이어진 뒤: 그대로 전달
    let m
    try { m = JSON.parse(data.toString()) } catch { sock.terminate(); return }
    if (st.code) return // 방장은 손님이 올 때까지 말이 없어야 한다
    if (m.t === 'host') {
      if (rooms.size >= MAX_ROOMS) { send(sock, { t: 'r_err', msg: '서버가 가득 찼습니다' }); sock.close(); return }
      st.code = newCode(); rooms.set(st.code, sock)
      st.timer = setTimeout(() => sock.terminate(), WAIT_MS)
      send(sock, { t: 'r_room', code: st.code }); log('방 열림', st.code, `(${rooms.size}개)`)
    } else if (m.t === 'join') {
      const c = String(m.code ?? '').toUpperCase().trim(), host = rooms.get(c)
      if (!host || host === sock || host.st.peer) { send(sock, { t: 'r_err', msg: '그 코드의 방이 없습니다' }); sock.close(); return }
      rooms.delete(c); clearTimeout(host.st.timer)
      st.peer = host; host.st.peer = sock
      send(sock, { t: 'r_paired' }); send(host, { t: 'r_paired' }); log('연결됨', c)
    } else sock.terminate()
  })
})

// 25초마다 핑: 터널·프록시가 조용한 연결을 끊지 않게 하고, 응답 없는 죽은 연결을 정리한다
setInterval(() => wss.clients.forEach(s => { if (!s.st.alive) return s.terminate(); s.st.alive = false; s.ping() }), 25000)

server.listen(PORT, '127.0.0.1', () => log(`STELLA 중계 서버 시작: http://127.0.0.1:${PORT} (터널로만 공개)`))
