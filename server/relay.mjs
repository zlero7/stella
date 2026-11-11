// STELLA 대결 중계 서버 (웹소켓): 방장이 방을 만들면 방 코드를 주고, 손님이 그 코드로 들어오면 두 연결을 이어 준다.
// 이어진 뒤에는 게임이 주고받는 메시지를 그대로 전달만 한다 (내용은 보지 않는다).
// Cloudflare 터널이 relay.example.com → http://localhost:9777 로 이 서버에 연결한다. 사용: node server/relay.mjs  (포트는 PORT 환경 변수, 기본 9777)
import http from 'node:http'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer } from 'ws'
import { applyPlay, canEquip, levelOf, nickKey, profileView } from './progress.mjs'
import { createLadder } from './ladder.mjs'
import { plausible } from './verify.mjs'
// 앱이 판정 개수를 셀 때 쓰는 채보 정리(cleanChart)를 서버도 같이 써서 노트 총수를 구한다. 불러오지 못하면 총수 대조만 건너뛴다
let cleanChart
try { ({ cleanChart } = await import('../src/renderer/game/chartCheck.ts')) } catch (e) { console.error('채보 정리 모듈을 못 불러와 노트 총수 대조를 건너뜁니다:', e.message) }

const PORT = Number(process.env.PORT) || 9777
const MAX_ROOMS = 200, WAIT_MS = 10 * 60 * 1000 // 짝이 안 맞는 방은 10분 뒤에 닫는다
const rooms = new Map() // 방 코드 -> 방장 소켓
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 헷갈리는 글자(I, O, 0, 1) 제외
const newCode = () => { for (;;) { const c = Array.from({ length: 5 }, () => ABC[Math.floor(Math.random() * ABC.length)]).join(''); if (!rooms.has(c)) return c } }
const send = (s, o) => s.send(JSON.stringify(o))
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)
process.on('unhandledRejection', e => log('처리 안 된 오류', e?.message ?? e)) // 요청 하나의 오류가 서버 전체를 끄지 않게
// 앱이 "새 버전이 있다"를 알리는 데 쓴다: 지금 서버가 있는 저장소의 버전이 최신이다 (릴리스를 만들 때 package.json 버전을 올린다)
const APP = { latest: (() => { try { return JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version } catch { return '' } })(), url: 'https://github.com/zlero7/stella/releases/latest' }

// 곡 목록·파일 배포: songs/ 폴더가 모든 유저가 보는 곡 목록의 원본이다. 앱은 /songs/index.json 에 있는 곡만 보여 주고, 고를 때 파일을 받아 간다
const SONGS = process.env.STELLA_SONGS ? path.resolve(process.env.STELLA_SONGS) : fileURLToPath(new URL('../songs/', import.meta.url)) // STELLA_SONGS: 시험 서버는 작은 곡 폴더를 따로 쓴다
const IMG = ['png', 'jpg', 'jpeg', 'webp', 'svg'], AUDIO = ['wav', 'mp3', 'ogg', 'flac', 'm4a', 'aac', 'mp4']
const TYPES = { mp4: 'video/mp4', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac', m4a: 'audio/mp4', aac: 'audio/aac', json: 'application/json', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml' }
const CORS = { 'Access-Control-Allow-Origin': '*', 'X-Content-Type-Options': 'nosniff' } // 로그인은 쿠키가 아니라 Authorization 헤더로 하므로 *여도 다른 사이트가 세션을 쓸 수 없다
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
    const fl = files.map(name => { const s = fs.statSync(path.join(dir, name)); return { name, size: s.size, mt: AUDIO.includes(name.split('.').pop().toLowerCase()) ? 0 : Math.round(s.mtimeMs) } }) // 영상·음원은 크기만 본다 (다시 만들어 시각만 바뀐 큰 파일 때문에 모두가 다시 받지 않게)
    // v: 곡 내용의 지문. 앱은 받아 둔 곡의 v가 서버와 다르면 그 곡을 다시 받는다 (채보를 고쳐도 유저에게 전해지게)
    out.push({ dir: d.name, meta, v: crypto.createHash('sha1').update(JSON.stringify(fl)).digest('hex').slice(0, 10), files: fl.map(({ name, size }) => ({ name, size })) })
  }
  indexCache = { at: Date.now(), body: JSON.stringify(out) }
  return indexCache.body
}
const CHUNK = 2 << 20
function sendSong(req, res, dir, file) {
  const p = path.join(SONGS, dir, file)
  let st; try { st = fs.statSync(p) } catch { /* 없음 */ }
  if (!st?.isFile() || !servable(file)) { res.writeHead(404, CORS); res.end(); return }
  const media = AUDIO.includes(file.split('.').pop().toLowerCase()) // 음원·영상(저작물)은 로그인한 계정에게만: 앱의 <video>는 헤더를 못 붙이므로 ?t=토큰 도 받는다. 표지·채보·목록은 공개
  const who = media && (userOf(req) ?? mediaUser(new URL(req.url, 'http://x').searchParams.get('t'))) // 주소의 ?t=는 10분짜리 미디어 토큰만 받는다 (진짜 로그인 토큰이 주소·로그에 남지 않게)
  if (media && !who) return json(res, 401, { error: '곡을 받으려면 로그인이 필요합니다' })
  const r = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '') // 영상 미리듣기는 구간 요청으로 온다
  let a = 0, b = st.size - 1
  if (r && (r[1] || r[2])) { if (r[1]) { a = +r[1]; if (r[2]) b = Math.min(+r[2], b) } else a = Math.max(st.size - +r[2], 0) }
  if (r?.[1] && !r[2]) b = Math.min(b, a + CHUNK - 1) // 끝을 안 정한 요청(bytes=N-)에 통째로 보내지 않는다: 터널 대역폭을 영상 한 개가 독차지하지 않게 (브라우저가 이어서 또 요청한다)
  if (a > b) { res.writeHead(416, { ...CORS, 'Content-Range': `bytes */${st.size}` }); res.end(); return }
  const part = a > 0 || b < st.size - 1
  if (media && req.method !== 'HEAD') { // 계정 하나가 곡 전체를 긁어 가 회선을 막지 못하게: 하루 DL_MAX 바이트까지
    if (overQuota(who.id)) return json(res, 429, { error: '오늘 받을 수 있는 곡 용량을 다 썼습니다. 내일 다시 해 주세요' })
    addBytes(who.id, b - a + 1)
  }
  res.writeHead(part ? 206 : 200, { ...CORS, 'Content-Type': TYPES[file.split('.').pop().toLowerCase()] ?? 'application/octet-stream', 'Accept-Ranges': 'bytes', ...(media && { 'Cache-Control': 'private, no-store' }), 'Content-Length': b - a + 1, ...(part && { 'Content-Range': `bytes ${a}-${b}/${st.size}` }) })
  if (req.method === 'HEAD') res.end(); else fs.createReadStream(p, { start: a, end: b }).on('error', () => res.destroy()).pipe(res)
}

// 계정: 비밀번호는 솔트를 쳐서 scrypt로만 저장한다 (원문은 저장도 로그도 안 한다). 로그인하면 임의 토큰(32바이트)을 주고, 서버에는 토큰의 sha256만 남긴다.
// 비밀번호가 오가므로 터널(HTTPS)로만 공개한다는 전제다. 무차별 대입은 아이디+IP·IP별 실패 횟수로 막는다.
// shortcut: 탈퇴·이메일 복구는 없다 (비밀번호를 잊으면 users.json에서 그 계정을 지워야 한다)
const DATA = process.env.STELLA_DATA ? path.resolve(process.env.STELLA_DATA) : fileURLToPath(new URL('.', import.meta.url)) // 계정·랭킹 파일 폴더 (시험 서버는 STELLA_DATA로 따로 쓴다: 진짜 계정 파일을 건드리지 않게)
const USERS = path.join(DATA, 'users.json'), TOKEN_TTL = 90 * 864e5, MAX_TOKENS = 5, MAX_USERS = 5000
const users = Object.assign(Object.create(null), (() => { try { return JSON.parse(fs.readFileSync(USERS, 'utf8')) } catch { return {} } })()) // 아이디 -> {id, nick, salt, hash, tokens: [{h, at}], at}. 프로토타입 없는 객체: 아이디 "__proto__"가 통과하므로
const tokenIdx = new Map() // 토큰 해시 -> 아이디
const reindex = () => { tokenIdx.clear(); for (const u of Object.values(users)) for (const t of u.tokens) tokenIdx.set(t.h, u.id) }
reindex()
const saveUsers = () => { // 임시 파일을 거쳐서: 쓰다 끊겨도 기존 파일은 안 깨진다. 덮기 전의 파일은 .bak 으로 한 벌 남긴다
  fs.writeFileSync(USERS + '.tmp', JSON.stringify(users))
  try { fs.copyFileSync(USERS, USERS + '.bak') } catch { /* 처음엔 없다 */ }
  fs.renameSync(USERS + '.tmp', USERS)
}
const sha = s => crypto.createHash('sha256').update(s).digest('hex')
const kdf = (pw, salt) => new Promise((ok, no) => crypto.scrypt(pw.normalize('NFKC'), salt, 64, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? no(e) : ok(k))))
const DUMMY = crypto.randomBytes(16) // 없는 아이디도 똑같이 해시를 계산해서 응답 시간으로 아이디 유무를 알 수 없게
const ipOf = req => req.headers['cf-connecting-ip'] ?? req.socket.remoteAddress
const buckets = new Map() // 키 -> [시작, 횟수]
const spent = (key, max, win) => { const b = buckets.get(key); return !!b && Date.now() - b[0] <= win && b[1] >= max }
const bump = (key, win) => { const now = Date.now(), b = buckets.get(key); if (!b || now - b[0] > win) buckets.set(key, [now, 1]); else b[1]++ }
setInterval(() => { const now = Date.now(); for (const [k, b] of buckets) if (now - b[0] > 36e5) buckets.delete(k) }, 10 * 60 * 1000).unref()
const issue = u => { const tok = crypto.randomBytes(32).toString('base64url'); u.tokens.push({ h: sha(tok), at: Date.now() }); while (u.tokens.length > MAX_TOKENS) u.tokens.shift(); reindex(); saveUsers(); return tok }
const bearer = req => /^Bearer ([\w-]{43})$/.exec(req.headers.authorization ?? '')?.[1]
// 미디어 토큰: 곡 영상·음원 주소에 붙이는 10분짜리 토큰 (<video>는 헤더를 못 붙인다). 로그인 토큰으로만 받는다
const MEDIA_TTL = 10 * 60 * 1000, mediaTokens = new Map() // 토큰 -> {uid, at}
const mediaUser = t => { const m = t && mediaTokens.get(t); return m && Date.now() - m.at <= MEDIA_TTL ? users[m.uid] : null }
// 하루 받기 한도 (계정별 바이트). 곡 전체가 3GB 남짓이라 2GB면 평소엔 닿지 않는다
const DL_MAX = Number(process.env.STELLA_DL_MAX) || 2e9, DAY = 864e5, dl = new Map() // 계정 id -> [시작, 바이트]
const overQuota = id => { const d = dl.get(id); return !!d && Date.now() - d[0] <= DAY && d[1] >= DL_MAX }
const addBytes = (id, n) => { const now = Date.now(), d = dl.get(id); if (!d || now - d[0] > DAY) dl.set(id, [now, n]); else d[1] += n }
setInterval(() => { const now = Date.now(); for (const [k, v] of mediaTokens) if (now - v.at > MEDIA_TTL) mediaTokens.delete(k); for (const [k, d] of dl) if (now - d[0] > DAY) dl.delete(k) }, 60000).unref()
let usersTimer
const saveUsersSoon = () => { clearTimeout(usersTimer); usersTimer = setTimeout(() => { try { saveUsers() } catch (e) { log('계정 저장 실패', e.message) } }, 2000) } // 경험치처럼 자주 바뀌는 값은 모아서 쓴다
const userOf = req => userByToken(bearer(req))
const userByToken = tok => {
  if (!tok) return null
  const h = sha(tok), u = users[tokenIdx.get(h)], t = u?.tokens.find(t => t.h === h)
  if (!t) return null
  if (Date.now() - t.at > TOKEN_TTL) { u.tokens = u.tokens.filter(x => x !== t); reindex(); saveUsers(); return null }
  return u
}
const readBuf = (req, max) => new Promise(ok => { const a = []; let n = 0; req.on('data', c => { n += c.length; if (n > max) ok(null); else a.push(c) }); req.on('end', () => ok(Buffer.concat(a))); req.on('error', () => ok(null)) })
const readBody = (req, max) => new Promise(ok => { let b = ''; req.on('data', c => { b += c; if (b.length > max) { req.destroy(); ok(null) } }); req.on('end', () => ok(b)); req.on('error', () => ok(null)) })
// 닉네임: 글자나 숫자가 하나는 있어야 한다 ("--" 같은 이름 방지)
const NICK = /^(?=.*[\p{L}\p{N}])[\p{L}\p{N}_ -]{2,12}$/u, RESERVED = /^(player|admin|guest|stella|운영자|관리자)$/
const json = (res, code, body) => { res.writeHead(code, { ...CORS, 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)) }
// 가입·닉네임 변경이 같이 쓰는 닉네임 검사 (self: 변경하는 계정, 자기 자신과의 겹침은 제외). 막히면 응답을 보내고 true
const nickRejected = (res, nick, self = '') => {
  const bad = !NICK.test(nick) || RESERVED.test(nickKey(nick)) ? [400, '닉네임은 한글·영문·숫자 2~12자입니다'] : Object.values(users).some(u => u.id !== self && nickKey(u.nick) === nickKey(nick)) ? [409, '이미 있는 닉네임입니다'] : undefined
  if (bad) json(res, bad[0], { error: bad[1] })
  return !!bad
}
// 로그인·비밀번호 변경이 같이 쓰는 실패 횟수 제한: 아이디+IP 8번, IP 30번 (15분)
const FAIL_WIN = 15 * 60 * 1000
const lockedOut = (id, ip) => spent(`fail|${id}|${ip}`, 8, FAIL_WIN) || spent('failip|' + ip, 30, FAIL_WIN)
const noteFail = (id, ip) => { bump(`fail|${id}|${ip}`, FAIL_WIN); bump('failip|' + ip, FAIL_WIN) }
const AVATARS = path.join(DATA, 'avatars'), AVATAR_MAX = 64 * 1024
// 백업: 한 시간마다 계정·랭킹·프로필 이미지를 날짜 폴더에 복사한다 (그날 마지막 것이 남고, 7일치만 둔다). 다른 드라이브에 두려면 STELLA_BACKUP
const BACKUPS = process.env.STELLA_BACKUP ? path.resolve(process.env.STELLA_BACKUP) : path.join(DATA, 'backups')
function backup() {
  try {
    const dir = path.join(BACKUPS, new Date().toISOString().slice(0, 10))
    fs.mkdirSync(dir, { recursive: true })
    for (const f of ['users.json', 'ranks.json']) if (fs.existsSync(path.join(DATA, f))) fs.copyFileSync(path.join(DATA, f), path.join(dir, f))
    if (fs.existsSync(AVATARS)) { // fs.cpSync는 쓰지 않는다: 이 PC의 Node(24.14, Windows)에서 프로세스가 통째로 죽는다. 이미지는 한 폴더에 파일뿐이다
      fs.mkdirSync(path.join(dir, 'avatars'), { recursive: true })
      for (const f of fs.readdirSync(AVATARS)) if (f.endsWith('.jpg')) fs.copyFileSync(path.join(AVATARS, f), path.join(dir, 'avatars', f))
    }
    for (const d of fs.readdirSync(BACKUPS).filter(d => /^\d{4}-\d\d-\d\d$/.test(d)).sort().slice(0, -7)) fs.rmSync(path.join(BACKUPS, d), { recursive: true, force: true })
  } catch (e) { log('백업 실패', e.message) }
}
backup(); setInterval(backup, Number(process.env.STELLA_BACKUP_MS) || 36e5).unref()
const BAD_FORM = { error: '형식이 올바르지 않습니다' }
async function authApi(req, res, route) {
  if (route === 'me') { const u = userOf(req); return u ? json(res, 200, { id: u.id, nick: u.nick }) : json(res, 401, { error: '로그인이 필요합니다' }) }
  if (req.method !== 'POST') return json(res, 405, { error: 'POST만 됩니다' })
  if (route === 'logout') {
    const tok = bearer(req), u = userOf(req)
    if (u && tok) { u.tokens = u.tokens.filter(t => t.h !== sha(tok)); reindex(); saveUsers() }
    return json(res, 200, {})
  }
  if (route === 'media') { // 곡 주소에 붙일 10분짜리 토큰
    const u = userOf(req)
    if (!u) return json(res, 401, { error: '로그인이 필요합니다' })
    if (spent('media|' + u.id, 30, 60000)) return json(res, 429, { error: '잠시 후 다시' })
    bump('media|' + u.id, 60000)
    const t = crypto.randomBytes(24).toString('base64url'); mediaTokens.set(t, { uid: u.id, at: Date.now() })
    return json(res, 200, { token: t, ttl: MEDIA_TTL })
  }
  let m; try { m = JSON.parse(await readBody(req, 1024)) } catch { return json(res, 400, BAD_FORM) }
  if (!m || typeof m !== 'object') return json(res, 400, BAD_FORM)
  const ip = ipOf(req), id = String(m.id ?? '').trim().toLowerCase(), pw = String(m.pw ?? '')
  if (route === 'register') {
    const nick = String(m.nick ?? '').trim(), WIN = 36e5
    if (spent('reg|' + ip, 5, WIN)) return json(res, 429, { error: '가입 시도가 너무 많습니다. 나중에 다시 해 주세요' })
    if (!/^[a-z0-9_]{4,16}$/.test(id)) return json(res, 400, { error: '아이디는 영문 소문자·숫자·_ 4~16자입니다' })
    if (pw.length < 8 || pw.length > 64) return json(res, 400, { error: '비밀번호는 8~64자입니다' })
    if (pw.toLowerCase() === id) return json(res, 400, { error: '아이디와 같은 비밀번호는 쓸 수 없습니다' })
    if (users[id]) return json(res, 409, { error: '이미 있는 아이디입니다' })
    if (nickRejected(res, nick)) return
    if (Object.keys(users).length >= MAX_USERS) return json(res, 503, { error: '지금은 가입할 수 없습니다' })
    bump('reg|' + ip, WIN)
    const salt = crypto.randomBytes(16), hash = (await kdf(pw, salt)).toString('hex')
    if (users[id]) return json(res, 409, { error: '이미 있는 아이디입니다' }) // 해시를 계산하는 동안 같은 이름이 가입했을 수 있다
    if (nickRejected(res, nick)) return
    const u = users[id] = { id, nick, salt: salt.toString('hex'), hash, tokens: [], at: Date.now() }
    log('가입', id); return json(res, 200, { token: issue(u), id, nick })
  }
  // 로그인
  if (lockedOut(id, ip)) return json(res, 429, { error: '실패가 너무 많습니다. 잠시 후 다시 해 주세요' })
  const u = users[id], h = await kdf(pw.slice(0, 64), u ? Buffer.from(u.salt, 'hex') : DUMMY)
  if (!u || pw.length > 64 || !crypto.timingSafeEqual(h, Buffer.from(u.hash, 'hex'))) { noteFail(id, ip); return json(res, 401, { error: '아이디 또는 비밀번호가 틀렸습니다' }) }
  buckets.delete(`fail|${id}|${ip}`)
  return json(res, 200, { token: issue(u), id: u.id, nick: u.nick })
}

// 온라인 랭킹: 곡·키 수·난이도마다 계정 하나당 최고 점수만 남기고 상위 50명을 ranks.json에 저장한다. 올리려면 로그인해야 하고, 이름은 계정의 닉네임으로 남는다
// 닉네임은 계정 안에서 겹치지 않으므로 남의 이름으로 올릴 수 없다.
// 점수 올리기는 "곡을 시작했다"는 기록(/play/start)이 있어야 하고, 시작한 뒤 곡 길이의 80%가 지나야 받는다 (경험치도 이 한 번만). 점수 값 자체는 클라이언트를 믿는다.
// shortcut: 시작 기록은 가짜 점수를 "느리게" 할 뿐 막지는 못한다 (곡 길이만큼 기다린 뒤 만점을 올리는 건 가능), 필요해지면 판정 기록(리플레이)을 서버가 검증하게 바꾼다
const RANKS = path.join(DATA, 'ranks.json'), TOP = 50, MIN_PLAY = 0.8
let ranks = {}
try { ranks = JSON.parse(fs.readFileSync(RANKS, 'utf8')) } catch { /* 처음엔 없다 */ }
let saveTimer
const saveRanks = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => fs.writeFile(RANKS, JSON.stringify(ranks), e => e && log('랭킹 저장 실패', e.message)), 2000) }
const BADGES = ['ALL PERFECT', 'FULL COMBO']
const BOARD = /^([\w-]{1,64})\/([46]k-(?:easy|normal|hard|stella))$/
// 채보의 마지막 노트 시각(초) = 곡을 끝까지 치는 데 걸리는 최소 시간. 채보가 없으면 undefined
// 파일이 바뀌지 않았으면(수정 시각) 다시 읽지 않는다: 순위 조회는 누구나 부르는 주소라서
const lenCache = new Map()
const chartLen = (dir, key) => {
  const f = path.join(SONGS, dir, key + '.json')
  try {
    const mt = fs.statSync(f).mtimeMs, c = lenCache.get(f)
    if (c?.mt === mt) return c.len
    const notes = JSON.parse(fs.readFileSync(f, 'utf8')).notes, len = notes.at(-1)?.time ?? 0
    const lanes = +/^(\d)k-/.exec(key)?.[1] || 4, total = cleanChart ? cleanChart(notes, lanes).notes.reduce((n, x) => n + (x.duration ? 2 : 1), 0) : undefined // 롱노트는 시작·끝 두 번
    lenCache.set(f, { mt, len, total }); return len
  } catch { return undefined }
}
const REQUIRE_COUNTS = false // true면 판정 개수가 없는 점수는 받지 않는다 (옛 앱 호환을 위해 아직 꺼 둔다)
const chartTotal = (dir, key) => { chartLen(dir, key); return lenCache.get(path.join(SONGS, dir, key + '.json'))?.total } // 앱이 세는 판정 총수 (롱노트 2)
const plays = new Map() // 계정 id -> {board, at}: 지금 치고 있는 곡 (한 번 쓰면 지운다)
function rankApi(req, res, dir, key) {
  if (chartLen(dir, key) === undefined) return json(res, 404, { error: '없는 곡' })
  const id = dir + '/' + key, list = (ranks[id] ??= []), top = () => list.slice(0, 10).map(({ uid, ...r }) => ({ ...r, lv: levelOf(users[uid]?.exp ?? 0).level })) // 계정 id는 내보내지 않고 레벨을 붙인다
  if (req.method === 'GET') return json(res, 200, top())
  const user = userOf(req)
  if (!user) return json(res, 401, { error: '로그인이 필요합니다' })
  if (spent('rank|' + ipOf(req), 30, 60000)) return json(res, 429, { error: '잠시 후 다시' })
  bump('rank|' + ipOf(req), 60000)
  readBody(req, 512).then(body => {
    let m; try { m = JSON.parse(body) } catch { return json(res, 400, { error: '형식' }) }
    if (!m || typeof m !== 'object') return json(res, 400, { error: '형식' }) // 본문이 null이거나 너무 커서 비면 여기서 막는다 (예전엔 서버가 죽었다)
    const score = m.score, acc = m.acc, mc = m.mc
    if (!Number.isInteger(score) || score < 0 || score > 1_000_000 || !(acc >= 0 && acc <= 100) || !Number.isInteger(mc) || mc < 0 || mc > 99999) return json(res, 400, { error: '값' })
    // 판정 개수(n)를 보낸 요청은 점수와 앞뒤가 맞는지 본다. 옛 앱은 n을 안 보내서 일단 받아 준다 (앱이 다 바뀌면 REQUIRE_COUNTS를 켠다)
    if (m.n === undefined ? REQUIRE_COUNTS : !plausible({ score, acc, mc, badge: typeof m.badge === 'string' ? m.badge : '', n: m.n }, chartTotal(dir, key))) return json(res, 400, { error: '점수 검증 실패' })
    const p = plays.get(user.id)
    if (p?.board !== id || Date.now() - p.at < chartLen(dir, key) * 1000 * MIN_PLAY) return json(res, 409, { error: '곡을 시작한 기록이 없거나 너무 빨리 끝났습니다' })
    plays.delete(user.id)
    const rec = { uid: user.id, nick: user.nick, score, acc: +acc.toFixed(2), mc, badge: BADGES.includes(m.badge) ? m.badge : '', at: Date.now() }, cur = list.find(r => r.uid === user.id)
    if (!cur) list.push(rec); else if (score > cur.score) Object.assign(cur, rec)
    list.sort((a, b) => b.score - a.score || a.at - b.at); list.length = Math.min(list.length, TOP)
    applyPlay(user, id, score, rec.badge)
    saveRanks(); saveUsersSoon(); json(res, 200, top())
  }).catch(e => { log('랭킹 오류', e.message); if (!res.headersSent) json(res, 500, { error: '서버 오류' }) })
}

// 프로필(레벨·티어·DJ CLASS·꾸미기)과 래더 결과 API. 모두 로그인(Bearer 토큰)이 필요하다
const ladder = createLadder({
  len: (dir, diff) => chartLen(dir, '4k-' + diff) ?? 0,
  pool: () => JSON.parse(songIndex()).filter(s => s.meta.charts?.includes('4k-hard.json') && s.meta.title).map(s => ({ dir: s.dir, diff: 'hard', title: s.meta.title, artist: s.meta.artist ?? '' })),
  save: () => saveUsersSoon(), log
})
setInterval(() => ladder.tick(), 2000).unref()
async function playerApi(req, res, url) {
  const user = userOf(req)
  if (!user) return json(res, 401, { error: '로그인이 필요합니다' })
  if (url === '/profile/me' && req.method === 'GET') return json(res, 200, profileView(user))
  if (url === '/ladder/result' && req.method === 'GET') return json(res, 200, ladder.result(user, new URL(req.url, 'http://x').searchParams.get('mid')))
  if (url === '/profile/avatar') { // 프로필 이미지: 앱이 160x160 JPEG로 줄여서 올린다. JPEG 머리·꼬리만 확인하고 그대로 저장 (그림으로만 쓰고 image/jpeg로만 내보낸다)
    const file = () => path.join(AVATARS, user.pid + '.jpg')
    if (req.method === 'DELETE') { if (user.avatarAt) { fs.rmSync(file(), { force: true }); user.avatarAt = 0; saveUsers() } return json(res, 200, profileView(user)) }
    if (req.method !== 'POST') return json(res, 405, { error: 'POST만 됩니다' })
    if (spent('avatar|' + user.id, 10, 36e5)) return json(res, 429, { error: '이미지는 한 시간에 10번까지 바꿀 수 있습니다' })
    bump('avatar|' + user.id, 36e5)
    const b = await readBuf(req, AVATAR_MAX)
    if (!b) res.once('finish', () => req.destroy()) // 너무 큰 몸통은 응답을 보낸 뒤 연결을 끊는다 (먼저 끊으면 앱이 이유를 못 받는다)
    if (!b || b.length < 200 || b[0] !== 0xff || b[1] !== 0xd8 || b[2] !== 0xff || b.at(-2) !== 0xff || b.at(-1) !== 0xd9) return json(res, 400, { error: '올릴 수 없는 이미지입니다 (64KB 이하 JPEG)' })
    user.pid ??= crypto.randomBytes(8).toString('hex')
    fs.mkdirSync(AVATARS, { recursive: true }); fs.writeFileSync(file() + '.tmp', b); fs.renameSync(file() + '.tmp', file())
    user.avatarAt = Date.now(); saveUsers()
    return json(res, 200, profileView(user))
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'POST만 됩니다' })
  let m; try { m = JSON.parse(await readBody(req, 512)) } catch { return json(res, 400, { error: '형식이 올바르지 않습니다' }) }
  if (!m || typeof m !== 'object') return json(res, 400, { error: '형식이 올바르지 않습니다' })
  if (url === '/play/start') { // 곡을 시작했다고 알린다: 점수·경험치는 이 기록이 있어야 받는다
    const b = BOARD.exec(String(m?.board ?? ''))
    if (!b || chartLen(b[1], b[2]) === undefined) return json(res, 400, { error: '없는 곡' })
    plays.set(user.id, { board: m.board, at: Date.now() }); return json(res, 200, {})
  }
  if (url === '/profile/equip') { // 해금한 플레이트·칭호만 낄 수 있다
    for (const [kind, key] of [['plate', 'plate'], ['title', 'title']]) if (m[key] !== undefined) { if (typeof m[key] !== 'string' || !canEquip(user, kind, m[key])) return json(res, 400, { error: '아직 쓸 수 없는 항목입니다' }); user[key] = m[key] }
    saveUsersSoon(); return json(res, 200, profileView(user))
  }
  if (url === '/profile/nick') { // 닉네임 변경: 가입 때와 같은 규칙, 하루에 한 번만. 랭킹에 남은 이름도 같이 바뀐다
    const nick = String(m.nick ?? '').trim()
    if (nick === user.nick) return json(res, 400, { error: '지금 쓰는 닉네임과 같습니다' })
    if (nickRejected(res, nick, user.id)) return
    const wait = (user.nickAt ?? 0) + 864e5 - Date.now()
    if (wait > 0) return json(res, 429, { error: `닉네임은 하루에 한 번만 바꿀 수 있습니다 (${Math.ceil(wait / 36e5)}시간 뒤)` })
    user.nick = nick; user.nickAt = Date.now()
    for (const list of Object.values(ranks)) for (const r of list) if (r.uid === user.id) r.nick = nick
    saveRanks(); saveUsersSoon(); log('닉네임 변경', user.id)
    return json(res, 200, profileView(user))
  }
  if (url === '/profile/password') { // 비밀번호 변경: 현재 비밀번호를 확인하고(틀리면 로그인 실패와 같은 횟수 제한), 지금 기기 말고는 모두 로그아웃시킨다. 403: 401은 앱이 "로그아웃됨"으로 읽는다
    const ip = ipOf(req), old = String(m.old ?? ''), pw = String(m.pw ?? '')
    if (lockedOut(user.id, ip)) return json(res, 429, { error: '실패가 너무 많습니다. 잠시 후 다시 해 주세요' })
    const same = old.length <= 64 && crypto.timingSafeEqual(await kdf(old, Buffer.from(user.salt, 'hex')), Buffer.from(user.hash, 'hex'))
    if (!same) { noteFail(user.id, ip); return json(res, 403, { error: '현재 비밀번호가 틀렸습니다' }) }
    if (pw.length < 8 || pw.length > 64) return json(res, 400, { error: '새 비밀번호는 8~64자입니다' })
    if (pw.toLowerCase() === user.id) return json(res, 400, { error: '아이디와 같은 비밀번호는 쓸 수 없습니다' })
    if (pw === old) return json(res, 400, { error: '지금 비밀번호와 같습니다' })
    const salt = crypto.randomBytes(16), hash = (await kdf(pw, salt)).toString('hex'), cur = sha(bearer(req))
    user.salt = salt.toString('hex'); user.hash = hash
    user.tokens = user.tokens.filter(t => t.h === cur); reindex(); saveUsers(); log('비밀번호 변경', user.id)
    return json(res, 200, {})
  }
  if (url === '/ladder/report') return json(res, ladder.report(user, m.mid, { score: m.score, failed: m.failed }) ? 200 : 400, {})
  json(res, 404, { error: '없는 주소' })
}

const server = http.createServer((req, res) => {
  const url = req.url?.split('?')[0] ?? '', song = /^\/songs\/([\w-]{1,64})\/([\w.-]{1,80})$/.exec(url), avatar = /^\/avatar\/([0-9a-f]{16})\.jpg$/.exec(url), rank = /^\/rank\/([\w-]{1,64})\/([46]k-(?:easy|normal|hard|stella))$/.exec(url)
  if (req.method === 'OPTIONS') { res.writeHead(204, { ...CORS, 'Access-Control-Allow-Methods': 'GET, POST, DELETE', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }); res.end(); return }
  if (/^\/(profile\/(me|equip|nick|password)|ladder\/(result|report)|play\/start)$|^\/profile\/avatar$/.test(url)) { playerApi(req, res, url).catch(e => { log('API 오류', e.message); if (!res.headersSent) res.writeHead(500, CORS); res.end() }); return }
  const auth = /^\/auth\/(register|login|logout|me|media)$/.exec(url)
  if (auth) { authApi(req, res, auth[1]).catch(e => { log('인증 오류', e.message); if (!res.headersSent) res.writeHead(500, CORS); res.end() }); return }
  if (rank && (req.method === 'GET' || req.method === 'POST')) { rankApi(req, res, rank[1], rank[2]); return }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return }
  if (url === '/version') json(res, 200, APP)
  else if (url === '/songs/index.json') {
    try { res.writeHead(200, { ...CORS, 'Content-Type': 'application/json; charset=utf-8' }); res.end(songIndex()) } catch (e) { log('목록 오류', e.message); res.destroy() }
  } else if (song) sendSong(req, res, song[1], song[2])
  else if (avatar) { // 프로필 이미지는 공개 (주소의 ?v=가 바뀌면 새 파일)
    fs.readFile(path.join(AVATARS, avatar[1] + '.jpg'), (e, b) => { if (e) { res.writeHead(404, CORS); res.end() } else { res.writeHead(200, { ...CORS, 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable', 'Content-Length': b.length }); res.end(b) } })
  } else { res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(`STELLA relay OK (${rooms.size} rooms)\n`) } // 터널·브라우저로 살아 있는지 보는 용도
})
const wss = new WebSocketServer({ server, maxPayload: 1 << 20 }) // 채보(수십 KB)가 한 메시지로 오가므로 1MB까지

wss.on('connection', sock => {
  const st = { code: '', peer: null, timer: null, alive: true } // 이 연결의 상태 (방장이면 code, 이어진 뒤에는 peer)
  sock.st = st
  sock.on('pong', () => { st.alive = true })
  sock.on('error', () => sock.terminate())
  sock.on('close', () => {
    ladder.close(sock)
    clearTimeout(st.timer)
    if (st.code && rooms.get(st.code) === sock) rooms.delete(st.code)
    if (st.peer) { st.peer.st.peer = null; st.peer.close(); st.peer = null }
  })
  const hello = setTimeout(() => { if (!st.code && !st.peer && !st.ladder) sock.terminate() }, 15000) // 요청도 안 보내고 붙어 있는 연결은 끊는다
  sock.on('close', () => clearTimeout(hello))

  sock.on('message', (data, isBinary) => {
    if (st.peer) { st.peer.send(data, { binary: isBinary }); return } // 이어진 뒤: 그대로 전달
    let m
    try { m = JSON.parse(data.toString()) } catch { sock.terminate(); return }
    if (st.code) return // 방장은 손님이 올 때까지 말이 없어야 한다
    if (st.ladder) { ladder.message(sock, m); return } // 래더 중: 대기열·밴·준비
    if (m.t === 'ladder') { // 래더 입장: 로그인한 계정만 (토큰은 연결 첫 메시지로 받는다)
      const u = userByToken(typeof m.token === 'string' ? m.token : '')
      if (!u) { send(sock, { t: 'r_err', msg: '로그인이 필요합니다' }); sock.close(); return }
      ladder.join(sock, u)
    } else if (m.t === 'host') {
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
