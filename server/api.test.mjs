// 서버 API 시험: 진짜 relay.mjs를 임시 데이터·곡 폴더와 빈 포트로 띄워서 가입·로그인·닉네임/비밀번호 변경·곡 파일·랭킹을 HTTP로 확인한다
import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import net from 'node:net'

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'stella-api-'))
const songs = path.join(tmp, 'songs', 'a-b'), data = path.join(tmp, 'data')
fs.mkdirSync(songs, { recursive: true }); fs.mkdirSync(data)
fs.writeFileSync(path.join(songs, 'meta.json'), JSON.stringify({ title: 'T', artist: 'A', audio: 'audio.mp4', bpm: 0, previewStart: 0, charts: [] }))
fs.writeFileSync(path.join(songs, 'audio.mp4'), 'x'.repeat(100))
fs.writeFileSync(path.join(songs, 'cover.png'), 'p')
fs.writeFileSync(path.join(songs, '4k-hard.json'), JSON.stringify({ notes: [{ time: 0.1, lane: 0 }, { time: 0.5, lane: 1 }] })) // 곡 길이 0.5초: 시작 0.4초 뒤부터 점수를 받는다

let proc, base
before(async () => {
  const port = await new Promise(ok => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => ok(p)) }) })
  proc = spawn(process.execPath, [path.join(import.meta.dirname, 'relay.mjs')], { env: { ...process.env, PORT: String(port), STELLA_DATA: data, STELLA_SONGS: path.join(tmp, 'songs'), STELLA_DL_MAX: '350', STELLA_BACKUP_MS: '300' }, stdio: 'ignore' })
  base = `http://127.0.0.1:${port}`
  for (let i = 0; i < 50; i++) { try { await fetch(base); return } catch { await new Promise(r => setTimeout(r, 100)) } }
  throw new Error('서버가 안 뜸')
})
after(() => { proc?.kill(); fs.rmSync(tmp, { recursive: true, force: true }) })

const call = async (p, body, token, method = body ? 'POST' : 'GET') => {
  const r = await fetch(base + p, { method, headers: { ...(body && { 'Content-Type': 'application/json' }), ...(token && { Authorization: `Bearer ${token}` }) }, body: body && JSON.stringify(body) })
  return { status: r.status, body: await r.json().catch(() => ({})) }
}
const sleep = ms => new Promise(r => setTimeout(r, ms))
const PW = 'correct-horse-9'
let tokA, tokB

test('가입: 규칙·아이디/닉네임 중복(대소문자·공백 무시)을 막는다', async () => {
  assert.equal((await call('/auth/register', { id: 'ab', pw: PW, nick: 'Nova' })).status, 400) // 아이디가 짧다
  assert.equal((await call('/auth/register', { id: 'alice', pw: 'short', nick: 'Nova' })).status, 400)
  assert.equal((await call('/auth/register', { id: 'alice', pw: 'alice', nick: 'Nova' })).status, 400)
  assert.equal((await call('/auth/register', { id: 'alice', pw: PW, nick: 'admin' })).status, 400) // 예약어
  const a = await call('/auth/register', { id: 'alice', pw: PW, nick: 'Nova' })
  assert.equal(a.status, 200); tokA = a.body.token; assert.match(tokA, /^[\w-]{43}$/)
  assert.equal((await call('/auth/register', { id: 'alice', pw: PW, nick: 'Other' })).status, 409)
  assert.equal((await call('/auth/register', { id: 'bobby', pw: PW, nick: 'n o v a' })).status, 409)
  const b = await call('/auth/register', { id: 'bobby', pw: PW, nick: 'Bob' }); tokB = b.body.token
  assert.equal(b.status, 200)
})

test('로그인: 틀리면 401, 맞으면 토큰, me는 토큰이 있어야', async () => {
  assert.equal((await call('/auth/login', { id: 'alice', pw: 'wrong-wrong' })).status, 401)
  assert.equal((await call('/auth/login', { id: 'nobody', pw: PW })).status, 401)
  const l = await call('/auth/login', { id: 'alice', pw: PW }); assert.equal(l.status, 200)
  assert.equal((await call('/auth/me', undefined, l.body.token)).body.nick, 'Nova')
  assert.equal((await call('/auth/me')).status, 401)
})

test('닉네임 변경: 남의 닉네임 불가, 하루 한 번', async () => {
  assert.equal((await call('/profile/nick', { nick: 'bob' }, tokA)).status, 409)
  assert.equal((await call('/profile/nick', { nick: 'Nova' }, tokA)).status, 400) // 지금과 같다
  const ok = await call('/profile/nick', { nick: 'Star' }, tokA); assert.equal(ok.status, 200); assert.equal(ok.body.nick, 'Star')
  assert.equal((await call('/profile/nick', { nick: 'Star2' }, tokA)).status, 429)
})

test('비밀번호 변경: 현재 비밀번호 확인, 다른 기기 로그아웃', async () => {
  const other = (await call('/auth/login', { id: 'bobby', pw: PW })).body.token
  assert.equal((await call('/profile/password', { old: 'nope-nope-1', pw: 'brand-new-pw1' }, tokB)).status, 403)
  assert.equal((await call('/profile/password', { old: PW, pw: 'brand-new-pw1' }, tokB)).status, 200)
  assert.equal((await call('/auth/me', undefined, other)).status, 401) // 다른 기기는 로그아웃
  assert.equal((await call('/auth/me', undefined, tokB)).status, 200) // 지금 기기는 유지
  assert.equal((await call('/auth/login', { id: 'bobby', pw: PW })).status, 401)
  assert.equal((await call('/auth/login', { id: 'bobby', pw: 'brand-new-pw1' })).status, 200)
})

test('곡 파일: 음원·영상은 로그인(헤더 또는 10분짜리 ?t= 미디어 토큰)이 있어야, 표지는 공개', async () => {
  assert.equal((await fetch(`${base}/songs/a-b/audio.mp4`)).status, 401)
  assert.equal((await fetch(`${base}/songs/a-b/cover.png`)).status, 200)
  assert.equal((await fetch(`${base}/songs/a-b/audio.mp4?t=${tokA}`)).status, 401) // 진짜 로그인 토큰은 주소로 받지 않는다
  assert.equal((await call('/auth/media')).status, 405) // GET은 안 된다
  assert.equal((await call('/auth/media', {})).status, 401) // 로그인 필요
  const mt = (await call('/auth/media', {}, tokA)).body.token; assert.match(mt, /^[\w-]{32}$/)
  assert.equal((await fetch(`${base}/songs/a-b/audio.mp4?t=${mt}`)).status, 200)
  assert.equal((await fetch(`${base}/songs/a-b/audio.mp4?t=${'x'.repeat(32)}`)).status, 401)
  assert.equal((await fetch(`${base}/songs/a-b/audio.mp4`, { headers: { Authorization: `Bearer ${tokA}` } })).status, 200)
  assert.equal((await fetch(`${base}/songs/index.json`)).status, 200)
})

test('랭킹: 시작 기록이 있어야, 곡 길이의 80%가 지나야, 한 번만 받는다', async () => {
  const score = { score: 900000, acc: 99, mc: 2, badge: '' }, board = 'a-b/4k-hard'
  assert.equal((await call(`/rank/${board}`, score)).status, 401)
  assert.equal((await call(`/rank/${board}`, score, tokA)).status, 409) // 시작 기록이 없다
  assert.equal((await call('/play/start', { board: 'a-b/4k-none' }, tokA)).status, 400)
  assert.equal((await call('/play/start', { board }, tokA)).status, 200)
  assert.equal((await call(`/rank/${board}`, score, tokA)).status, 409) // 너무 빨리
  await sleep(450)
  assert.equal((await call(`/rank/${board}`, { ...score, n: [1, 0, 0, 0, 0, 0] }, tokA)).status, 400) // 판정 개수와 점수가 안 맞으면 막는다 (시작 기록은 남는다)
  const ok = await call(`/rank/${board}`, score, tokA); assert.equal(ok.status, 200); assert.equal(ok.body[0].score, 900000)
  assert.equal((await call(`/rank/${board}`, score, tokA)).status, 409) // 기록은 한 번 쓰면 끝
  const me = await call('/profile/me', undefined, tokA); assert.equal(me.body.plays, 1)
  assert.equal((await call(`/rank/${board}`, undefined)).body.length, 1) // 순위는 로그인 없이도 본다
})

test('계정 파일은 덮기 전에 .bak 으로 한 벌 남는다', () => {
  assert.ok(fs.existsSync(path.join(data, 'users.json.bak')))
})

test('프로필 이미지: JPEG만, 올리면 공개 주소로 보이고 지우면 사라진다', async () => {
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(300, 7), Buffer.from([0xff, 0xd9])])
  const up = (body, token) => fetch(`${base}/profile/avatar`, { method: 'POST', headers: { 'Content-Type': 'image/jpeg', ...(token && { Authorization: `Bearer ${token}` }) }, body })
  assert.equal((await up(jpeg)).status, 401) // 로그인 필요
  assert.equal((await up(Buffer.from('<svg onload=alert(1)>'.padEnd(300, ' ')), tokA)).status, 400) // JPEG가 아니다
  assert.equal((await up(Buffer.alloc(70_000, 1), tokA)).status, 400) // 너무 크다
  const ok = await up(jpeg, tokA); assert.equal(ok.status, 200)
  const key = (await ok.json()).avatar; assert.match(key, /^[0-9a-f]{16}\.\d+$/)
  assert.ok(!key.includes('alice')) // 주소에 아이디가 없다
  const img = await fetch(`${base}/avatar/${key.split('.')[0]}.jpg`)
  assert.equal(img.status, 200); assert.equal(img.headers.get('content-type'), 'image/jpeg'); assert.equal(img.headers.get('x-content-type-options'), 'nosniff')
  const del = await fetch(`${base}/profile/avatar`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokA}` } })
  assert.equal((await del.json()).avatar, '')
  assert.equal((await fetch(`${base}/avatar/${key.split('.')[0]}.jpg`)).status, 404)
})

test('랭킹 본문이 null이거나 너무 커도 서버는 살아 있다 (예전엔 서버가 죽었다)', async () => {
  const post = body => fetch(`${base}/rank/a-b/4k-hard`, { method: 'POST', headers: { Authorization: `Bearer ${tokA}` }, body }).then(r => r.status).catch(() => 0)
  assert.equal(await post('null'), 400)
  assert.equal(await post('7'), 400)
  await post('x'.repeat(2000)) // 너무 크면 연결이 끊겨도 된다
  assert.equal((await fetch(`${base}/version`)).status, 200) // 아직 살아 있다
})

test('하루 받기 한도: 계정마다, 넘으면 429', async () => {
  const c = (await call('/auth/register', { id: 'carol', pw: PW, nick: 'Carol' })).body.token
  const get = () => fetch(`${base}/songs/a-b/audio.mp4`, { headers: { Authorization: `Bearer ${c}` } }).then(async r => { await r.arrayBuffer(); return r.status })
  const got = []; for (let i = 0; i < 5; i++) got.push(await get())
  assert.deepEqual(got, [200, 200, 200, 200, 429]) // 한도 350바이트, 한 번에 100바이트
  assert.equal((await fetch(`${base}/songs/a-b/audio.mp4`, { headers: { Authorization: `Bearer ${tokA}` } })).status, 200) // 다른 계정은 영향 없다
})

test('버전 안내와 곡 지문(v): 앱이 새 버전·바뀐 곡을 알아챈다', async () => {
  const v = await (await fetch(`${base}/version`)).json()
  assert.equal(v.latest, JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '..', 'package.json'), 'utf8')).version)
  const idx = await (await fetch(`${base}/songs/index.json`)).json()
  assert.match(idx[0].v, /^[0-9a-f]{10}$/)
  assert.ok(idx[0].files.every(f => f.name && f.size >= 0 && f.mt === undefined)) // 앱에는 이름·크기만 준다
})

test('백업: 계정·랭킹이 날짜 폴더에 복사된다', async () => {
  await sleep(700)
  const day = fs.readdirSync(path.join(data, 'backups'))
  assert.equal(day.length, 1)
  assert.ok(fs.existsSync(path.join(data, 'backups', day[0], 'users.json')))
})
