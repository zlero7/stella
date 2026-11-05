// STELLA 대결 중계 서버 (웹소켓): 방장이 방을 만들면 방 코드를 주고, 손님이 그 코드로 들어오면 두 연결을 이어 준다.
// 이어진 뒤에는 게임이 주고받는 메시지를 그대로 전달만 한다 (내용은 보지 않는다).
// Cloudflare 터널이 relay.example.com → http://localhost:9777 로 이 서버에 연결한다. 사용: node server/relay.mjs  (포트는 PORT 환경 변수, 기본 9777)
import http from 'node:http'
import crypto from 'node:crypto'
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

// 계정: 비밀번호는 솔트를 쳐서 scrypt로만 저장한다 (원문은 저장도 로그도 안 한다). 로그인하면 임의 토큰(32바이트)을 주고, 서버에는 토큰의 sha256만 남긴다.
// 비밀번호가 오가므로 터널(HTTPS)로만 공개한다는 전제다. 무차별 대입은 아이디+IP·IP별 실패 횟수로 막는다.
// shortcut: 비밀번호 변경·탈퇴·이메일 복구는 없다 (잊으면 users.json에서 그 계정을 지워야 한다), 필요해지면 /auth/password 를 추가한다
const USERS = fileURLToPath(new URL('./users.json', import.meta.url)), TOKEN_TTL = 90 * 864e5, MAX_TOKENS = 5, MAX_USERS = 5000
const users = Object.assign(Object.create(null), (() => { try { return JSON.parse(fs.readFileSync(USERS, 'utf8')) } catch { return {} } })()) // 아이디 -> {id, nick, salt, hash, tokens: [{h, at}], at}. 프로토타입 없는 객체: 아이디 "__proto__"가 통과하므로
const tokenIdx = new Map() // 토큰 해시 -> 아이디
const reindex = () => { tokenIdx.clear(); for (const u of Object.values(users)) for (const t of u.tokens) tokenIdx.set(t.h, u.id) }
reindex()
const saveUsers = () => { fs.writeFileSync(USERS + '.tmp', JSON.stringify(users)); fs.renameSync(USERS + '.tmp', USERS) } // 임시 파일을 거쳐서: 쓰다 끊겨도 기존 파일은 안 깨진다
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
const userOf = req => {
  const tok = bearer(req); if (!tok) return null
  const h = sha(tok), u = users[tokenIdx.get(h)], t = u?.tokens.find(t => t.h === h)
  if (!t) return null
  if (Date.now() - t.at > TOKEN_TTL) { u.tokens = u.tokens.filter(x => x !== t); reindex(); saveUsers(); return null }
  return u
}
const readBody = (req, max) => new Promise(ok => { let b = ''; req.on('data', c => { b += c; if (b.length > max) { req.destroy(); ok(null) } }); req.on('end', () => ok(b)); req.on('error', () => ok(null)) })
const NICK = /^[\p{L}\p{N}_ -]{2,12}$/u, RESERVED = /^(player|admin|guest|stella|운영자|관리자)$/i
async function authApi(req, res, route) {
  const json = (code, body) => { res.writeHead(code, { ...CORS, 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)) }
  if (route === 'me') { const u = userOf(req); return u ? json(200, { id: u.id, nick: u.nick }) : json(401, { error: '로그인이 필요합니다' }) }
  if (req.method !== 'POST') return json(405, { error: 'POST만 됩니다' })
  if (route === 'logout') {
    const tok = bearer(req), u = userOf(req)
    if (u && tok) { u.tokens = u.tokens.filter(t => t.h !== sha(tok)); reindex(); saveUsers() }
    return json(200, {})
  }
  let m; try { m = JSON.parse(await readBody(req, 1024)) } catch { return json(400, { error: '형식이 올바르지 않습니다' }) }
  if (!m || typeof m !== 'object') return json(400, { error: '형식이 올바르지 않습니다' })
  const ip = ipOf(req), id = String(m.id ?? '').trim().toLowerCase(), pw = String(m.pw ?? '')
  if (route === 'register') {
    const nick = String(m.nick ?? '').trim(), WIN = 36e5
    if (spent('reg|' + ip, 5, WIN)) return json(429, { error: '가입 시도가 너무 많습니다. 나중에 다시 해 주세요' })
    if (!/^[a-z0-9_]{4,16}$/.test(id)) return json(400, { error: '아이디는 영문 소문자·숫자·_ 4~16자입니다' })
    if (pw.length < 8 || pw.length > 64) return json(400, { error: '비밀번호는 8~64자입니다' })
    if (pw.toLowerCase() === id) return json(400, { error: '아이디와 같은 비밀번호는 쓸 수 없습니다' })
    if (!NICK.test(nick) || RESERVED.test(nick)) return json(400, { error: '닉네임은 한글·영문·숫자 2~12자입니다' })
    const taken = () => (users[id] ? '이미 있는 아이디입니다' : Object.values(users).some(u => u.nick.toLowerCase() === nick.toLowerCase()) ? '이미 있는 닉네임입니다' : '')
    if (taken()) return json(409, { error: taken() })
    if (Object.keys(users).length >= MAX_USERS) return json(503, { error: '지금은 가입할 수 없습니다' })
    bump('reg|' + ip, WIN)
    const salt = crypto.randomBytes(16), hash = (await kdf(pw, salt)).toString('hex')
    if (taken()) return json(409, { error: taken() }) // 해시를 계산하는 동안 같은 이름이 가입했을 수 있다
    const u = users[id] = { id, nick, salt: salt.toString('hex'), hash, tokens: [], at: Date.now() }
    log('가입', id); return json(200, { token: issue(u), id, nick })
  }
  // 로그인
  const WIN = 15 * 60 * 1000, kf = `fail|${id}|${ip}`, ki = 'failip|' + ip
  if (spent(kf, 8, WIN) || spent(ki, 30, WIN)) return json(429, { error: '실패가 너무 많습니다. 잠시 후 다시 해 주세요' })
  const u = users[id], h = await kdf(pw.slice(0, 64), u ? Buffer.from(u.salt, 'hex') : DUMMY)
  if (!u || pw.length > 64 || !crypto.timingSafeEqual(h, Buffer.from(u.hash, 'hex'))) { bump(kf, WIN); bump(ki, WIN); return json(401, { error: '아이디 또는 비밀번호가 틀렸습니다' }) }
  buckets.delete(kf)
  return json(200, { token: issue(u), id: u.id, nick: u.nick })
}

// 온라인 랭킹: 곡·키 수·난이도마다 계정 하나당 최고 점수만 남기고 상위 50명을 ranks.json에 저장한다. 올리려면 로그인해야 하고, 이름은 계정의 닉네임으로 남는다
// 닉네임은 계정 안에서 겹치지 않으므로 남의 이름으로 올릴 수 없다.
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
  const id = dir + '/' + key, list = (ranks[id] ??= []), top = () => list.slice(0, 10).map(({ uid, ...r }) => r) // 계정 id는 내보내지 않는다
  if (req.method === 'GET') { json(200, top()); return }
  const user = userOf(req)
  if (!user) { json(401, { error: '로그인이 필요합니다' }); return }
  if (tooMany(ipOf(req))) { json(429, { error: '잠시 후 다시' }); return }
  let body = ''
  req.on('data', c => { body += c; if (body.length > 512) req.destroy() })
  req.on('end', () => {
    let m; try { m = JSON.parse(body) } catch { json(400, { error: '형식' }); return }
    const nick = user.nick, score = m.score, acc = m.acc, mc = m.mc
    if (!Number.isInteger(score) || score < 0 || score > 1_000_000 || !(acc >= 0 && acc <= 100) || !Number.isInteger(mc) || mc < 0 || mc > 99999) { json(400, { error: '값' }); return }
    const rec = { uid: user.id, nick, score, acc: +acc.toFixed(2), mc, badge: BADGES.includes(m.badge) ? m.badge : '', at: Date.now() }, cur = list.find(r => r.uid === user.id)
    if (!cur) list.push(rec); else if (score > cur.score) Object.assign(cur, rec)
    list.sort((a, b) => b.score - a.score || a.at - b.at); list.length = Math.min(list.length, TOP)
    saveRanks(); json(200, top())
  })
}

const server = http.createServer((req, res) => {
  const url = req.url?.split('?')[0] ?? '', song = /^\/songs\/([\w-]{1,64})\/([\w.-]{1,80})$/.exec(url), rank = /^\/rank\/([\w-]{1,64})\/([46]k-(?:easy|normal|hard|stella))$/.exec(url)
  if (req.method === 'OPTIONS') { res.writeHead(204, { ...CORS, 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }); res.end(); return }
  const auth = /^\/auth\/(register|login|logout|me)$/.exec(url)
  if (auth) { authApi(req, res, auth[1]).catch(e => { log('인증 오류', e.message); if (!res.headersSent) res.writeHead(500, CORS); res.end() }); return }
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
