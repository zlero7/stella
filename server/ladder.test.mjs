import test from 'node:test'
import assert from 'node:assert/strict'
import { createLadder, findPair, POOL } from './ladder.mjs'

const songs = Array.from({ length: 8 }, (_, i) => ({ dir: `s${i}`, diff: 'hard', title: `T${i}`, artist: 'A' }))
const sock = () => { const s = { st: {}, got: [], send(x) { s.got.push(JSON.parse(x)) } }; return s }
const last = (s, t) => s.got.filter(m => m.t === t).at(-1)
const user = (id, lp = 0) => ({ id, nick: id.toUpperCase(), lp, exp: 0 })
const setup = () => { let saved = 0, t = 1000; const L = createLadder({ pool: () => songs, save: () => saved++, now: () => t }); return { L, saved: () => saved, adv: ms => { t += ms } } }
const pairUp = (L, ua, ub) => { const a = sock(), b = sock(); L.join(a, ua); L.join(b, ub); return [a, b] }

test('짝짓기: LP 차이가 허용 범위 안일 때만, 기다릴수록 넓어진다', () => {
  const q = [{ user: user('a', 0), since: 0 }, { user: user('b', 500), since: 0 }]
  assert.equal(findPair(q, 0), undefined)
  assert.equal(findPair(q, 20000), undefined) // 100 + 25*4 = 200 LP까지: 아직 모자람
  assert.ok(findPair(q, 100000)) // 100 + 25*20 = 600 LP까지: 붙는다
  assert.equal(findPair([{ user: user('a'), since: 0 }, { user: user('a'), since: 0 }], 1e6), undefined) // 같은 계정끼리는 안 붙는다
})

test('매치 → 밴 → 마지막 한 곡 → 준비 → 연결', () => {
  const { L } = setup()
  const [a, b] = pairUp(L, user('a'), user('b'))
  const ma = last(a, 'l_match'), mb = last(b, 'l_match')
  assert.equal(ma.songs.length, POOL); assert.equal(ma.mid, mb.mid)
  assert.notEqual(ma.turn, mb.turn) // 한 명만 먼저 밴
  const players = ma.turn === 'you' ? [a, b] : [b, a] // [먼저 밴하는 쪽, 나머지]
  players[1].got.length = 0
  L.message(players[1], { t: 'l_ban', idx: 0 }); assert.equal(last(players[1], 'l_ban'), undefined) // 차례가 아닌 쪽의 밴은 무시
  for (let i = 0; i < POOL - 1; i++) L.message(players[i % 2], { t: 'l_ban', idx: i })
  L.message(players[0], { t: 'l_ban', idx: 0 }) // 이미 끝난 뒤의 밴은 무시
  const sa = last(a, 'l_start'), sb = last(b, 'l_start')
  assert.equal(sa.idx, POOL - 1); assert.equal(sa.dir, sb.dir); assert.equal(sa.keys, 4)
  L.message(a, { t: 'l_ready' }); assert.equal(last(a, 'l_go'), undefined) // 한쪽만 준비: 아직
  L.message(b, { t: 'l_ready' })
  const ga = last(a, 'l_go'), gb = last(b, 'l_go')
  assert.deepEqual([ga.role, gb.role].sort(), ['guest', 'host'])
  assert.equal(a.st.peer, b); assert.equal(b.st.peer, a) // 이제 중계로 이어졌다
})

test('중복 밴 인덱스·범위 밖은 무시한다', () => {
  const { L } = setup()
  const [a, b] = pairUp(L, user('a'), user('b'))
  const first = last(a, 'l_match').turn === 'you' ? a : b, second = first === a ? b : a
  L.message(first, { t: 'l_ban', idx: 99 }); L.message(first, { t: 'l_ban', idx: 1.5 }); L.message(first, { t: 'l_ban', idx: 2 })
  L.message(second, { t: 'l_ban', idx: 2 }) // 이미 밴된 곡
  assert.equal(last(second, 'l_ban').turn, 'you'); // 첫 밴만 반영돼 이제 두 번째 차례
  assert.equal(second.got.filter(m => m.t === 'l_ban').length, 1)
})

function playedMatch(L, ua, ub) {
  const [a, b] = pairUp(L, ua, ub), turnA = last(a, 'l_match').turn === 'you'
  const ps = turnA ? [a, b] : [b, a]
  for (let i = 0; i < POOL - 1; i++) L.message(ps[i % 2], { t: 'l_ban', idx: i })
  L.message(a, { t: 'l_ready' }); L.message(b, { t: 'l_ready' })
  return { a, b, mid: last(a, 'l_match').mid }
}

test('결과: 둘 다 올리면 점수로 가르고 LP를 바꾼다', () => {
  const { L, saved } = setup()
  const ua = user('a', 1000), ub = user('b', 1000)
  const { mid } = playedMatch(L, ua, ub)
  assert.equal(L.result(ua, mid).state, 'wait')
  assert.equal(L.report(ua, mid, { score: 900000, failed: false }), true)
  assert.equal(L.report(ua, mid, { score: 999999, failed: false }), false) // 한 번만
  assert.equal(L.result(ua, mid).state, 'wait') // 상대를 기다린다
  L.report(ub, mid, { score: 800000, failed: false })
  const ra = L.result(ua, mid), rb = L.result(ub, mid)
  assert.equal(ra.result, 'WIN'); assert.equal(rb.result, 'LOSE')
  assert.ok(ra.delta > 0 && rb.delta < 0); assert.equal(ua.lp, 1000 + ra.delta); assert.equal(saved(), 1)
  assert.ok(ua.exp > 0 && ub.exp > 0)
})

test('결과: 곡 길이의 80%가 지나기 전 "끝까지 쳤다"는 결과는 받지 않는다 (포기는 받는다)', () => {
  let t = 1000
  const L = createLadder({ pool: () => songs, len: () => 100, save() {}, now: () => t })
  const ua = user('a'), ub = user('b'), [a, b] = pairUp(L, ua, ub), m = last(a, 'l_match')
  const first = m.turn === 'you' ? [a, b] : [b, a]
  for (let i = 0; i < POOL - 1; i++) L.message(first[i % 2], { t: 'l_ban', idx: i })
  L.message(a, { t: 'l_ready' }); L.message(b, { t: 'l_ready' })
  t += 50_000; assert.equal(L.report(ua, m.mid, { score: 1_000_000, failed: false }), false)
  assert.equal(L.report(ub, m.mid, { score: 0, failed: true }), true)
  t += 30_000; assert.equal(L.report(ua, m.mid, { score: 1_000_000, failed: false }), true)
})

test('결과: 상대가 나가면(연결 끊김) 끝까지 친 쪽이 이긴다. 남의 판에는 못 올린다', () => {
  const { L } = setup()
  const ua = user('a', 0), ub = user('b', 0), uc = user('c', 0)
  const { a, b, mid } = playedMatch(L, ua, ub)
  assert.equal(L.report(uc, mid, { score: 1, failed: false }), false)
  L.report(ua, mid, { score: 700000, failed: false })
  assert.equal(L.result(ua, mid).state, 'wait')
  L.close(b) // 상대가 나감
  assert.equal(L.result(ua, mid).result, 'WIN'); assert.equal(L.result(ub, mid).result, 'LOSE')
  void a
})

test('밴 중에 나가면 LP 변화 없이 취소된다', () => {
  const { L } = setup()
  const ua = user('a', 300), ub = user('b', 300)
  const [a, b] = pairUp(L, ua, ub)
  L.close(a)
  assert.equal(last(b, 'l_cancel') !== undefined, true); assert.equal(ua.lp, 300); assert.equal(ub.lp, 300)
})

test('같은 계정이 두 번 대기열에 못 들어간다', () => {
  const { L } = setup()
  const u = user('a'); const s1 = sock(), s2 = sock()
  L.join(s1, u); L.join(s2, u)
  assert.equal(last(s2, 'r_err') !== undefined, true); assert.equal(L.queued(), 1)
})

const sleep = ms => new Promise(r => setTimeout(r, ms))
const turnOf = s => [...s.got].reverse().find(x => x.t === 'l_match' || x.t === 'l_ban')

test('봇: 오래 기다린 낮은 티어만 붙고, 높은 티어는 사람을 기다린다', () => {
  let t = 1000
  const L = createLadder({ pool: () => songs, save() {}, now: () => t, botDelay: 0 })
  const low = sock(), high = sock(); L.join(low, user('low', 100)); L.join(high, user('high', 900))
  t += 44_000; L.tick(); assert.equal(last(low, 'l_match'), undefined) // 아직 기다리는 중
  t += 2_000; L.tick()
  const m = last(low, 'l_match'); assert.ok(m); assert.equal(m.opp.nick, '스텔라 봇'); assert.equal(m.opp.lp, 100)
  assert.equal(last(high, 'l_match'), undefined) // LP 900은 봇이 붙지 않는다
})

test('봇: 밴 → 곡 결정 → 준비 → 사람이 방장 → 점수가 흐르고 끝에 결과가 난다', async () => {
  let t = 1000
  const L = createLadder({ pool: () => songs, save() {}, now: () => t, botWait: 0, botDelay: 0, botTick: 5, botMinLen: 0.05 })
  const a = sock(), ua = user('a', 100); L.join(a, ua); L.tick()
  const mid = last(a, 'l_match').mid
  for (let i = 0; i < 60 && !last(a, 'l_start'); i++) {
    const tm = turnOf(a)
    if (tm.turn === 'you') { const used = a.got.filter(x => x.t === 'l_ban').map(x => x.idx); L.message(a, { t: 'l_ban', idx: [0, 1, 2, 3, 4].find(k => !used.includes(k)) }) }
    await sleep(5)
  }
  assert.ok(last(a, 'l_start'), '곡이 정해진다')
  L.message(a, { t: 'l_ready' }); await sleep(20)
  assert.equal(last(a, 'l_go')?.role, 'host') // 봇 판은 늘 사람이 방장
  const bot = a.st.peer; assert.equal(typeof bot.send, 'function')
  bot.send(JSON.stringify({ t: 'chart', chart: {} })) // 방장이 채보를 보내면 봇이 인사하고 준비를 알린다
  assert.ok(last(a, 'hello')); assert.ok(last(a, 'ready'))
  bot.send(JSON.stringify({ t: 'ready' })); t += 2000; await sleep(80) // 방장도 준비 → 봇이 치기 시작해 곧 끝낸다
  const done = last(a, 'done'); assert.ok(done); assert.ok(done.s >= 880000 && done.s <= 970000); assert.equal(done.failed, false)
  assert.ok(a.got.some(x => x.t === 'score' || x.t === 'done'))
  t += 100_000 // 사람이 포기(실패)로 올리면 결과가 난다
  assert.equal(L.report(ua, mid, { score: 1000, failed: true }), true)
  const r = L.result(ua, mid); assert.equal(r.state, 'done'); assert.equal(r.result, 'LOSE')
})
