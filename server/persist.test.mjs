// 서버 시작 때 데이터 파일을 읽는 방식 시험: 깨진 파일을 빈 값으로 보고 덮어쓰지 않는지, 목록 ETag
import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import net from 'node:net'

const relay = path.join(import.meta.dirname, 'relay.mjs')
const free = () => new Promise(ok => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => ok(p)) }) })
const setup = () => { const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'stella-persist-')), data = path.join(tmp, 'data'), songs = path.join(tmp, 'songs'); fs.mkdirSync(data); fs.mkdirSync(songs); return { tmp, data, songs } }
const start = async ({ data, songs }) => {
  const port = await free(), proc = spawn(process.execPath, [relay], { env: { ...process.env, PORT: String(port), STELLA_DATA: data, STELLA_SONGS: songs }, stdio: 'ignore' })
  const exited = new Promise(ok => proc.on('exit', code => ok(code)))
  for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${port}/version`); return { proc, port, exited } } catch { if (proc.exitCode !== null) break; await new Promise(r => setTimeout(r, 100)) } }
  return { proc, port: 0, exited }
}

test('users.json이 깨졌고 되살릴 곳도 없으면 서버가 켜지지 않고 파일도 그대로다', async () => {
  const d = setup(); fs.writeFileSync(path.join(d.data, 'users.json'), '{"zlero":{"id":')
  const s = await start(d)
  assert.equal(await s.exited, 1)
  assert.equal(fs.readFileSync(path.join(d.data, 'users.json'), 'utf8'), '{"zlero":{"id":') // 빈 값으로 덮어쓰지 않았다
  fs.rmSync(d.tmp, { recursive: true, force: true })
})

test('users.json이 깨졌어도 .bak이 있으면 거기서 되살려 켠다', async () => {
  const d = setup(), u = { bob: { id: 'bob', nick: 'Bob', salt: '', hash: '', tokens: [], at: 1 } }
  fs.writeFileSync(path.join(d.data, 'users.json'), 'garbage'); fs.writeFileSync(path.join(d.data, 'users.json.bak'), JSON.stringify(u))
  const s = await start(d)
  assert.ok(s.port, '서버가 떠야 한다')
  s.proc.kill(); await s.exited
  fs.rmSync(d.tmp, { recursive: true, force: true })
})

test('곡 목록은 음원이 있는 폴더만 싣고, ETag가 같으면 304를 준다', async () => {
  const d = setup(), ok = path.join(d.songs, 'good'), bad = path.join(d.songs, 'half')
  for (const dir of [ok, bad]) { fs.mkdirSync(dir); fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ title: 'T', artist: 'A', audio: 'play.mp4', charts: [] })) }
  fs.writeFileSync(path.join(ok, 'play.mp4'), 'x') // half에는 음원이 없다
  const s = await start(d), url = `http://127.0.0.1:${s.port}/songs/index.json`
  const r1 = await fetch(url), list = await r1.json(), tag = r1.headers.get('etag')
  assert.deepEqual(list.map(x => x.dir), ['good']); assert.ok(tag)
  assert.equal((await fetch(url, { headers: { 'If-None-Match': tag } })).status, 304)
  s.proc.kill(); await s.exited
  fs.rmSync(d.tmp, { recursive: true, force: true })
})
