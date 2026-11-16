import test from 'node:test'
import assert from 'node:assert/strict'
import { createLadder, findPair, botScore, POOL, KEEP } from './ladder.mjs'

const songs = Array.from({ length: 8 }, (_, i) => ({ dir: `s${i}`, diff: 'hard', title: `T${i}`, artist: 'A' }))
const sock = () => { const s = { st: {}, got: [], send(x) { s.got.push(JSON.parse(x)) } }; return s }
const last = (s, t) => s.got.filter(m => m.t === t).at(-1)
const user = (id, lp = 0) => ({ id, nick: id.toUpperCase(), lp, exp: 0 })
const setup = () => { let saved = 0, t = 1000; const L = createLadder({ pool: () => songs, save: () => saved++, now: () => t, roundGap: 0 }); return { L, saved: () => saved, adv: ms => { t += ms } } }
const pairUp = (L, ua, ub) => { const a = sock(), b = sock(); L.join(a, ua); L.join(b, ub); return [a, b] }

test('짝짓기: LP 차이가 허용 범위 안일 때만, 기다릴수록 넓어진다', () => {
  const q = [{ user: user('a', 0), since: 0 }, { user: user('b', 500), since: 0 }]
  assert.equal(findPair(q, 0), undefined)
  assert.equal(findPair(q, 20000), undefined) // 100 + 25*4 = 200 LP까지: 아직 모자람
  assert.ok(findPair(q, 100000)) // 100 + 25*20 = 600 LP까지: 붙는다
  assert.equal(findPair([{ user: user('a'), since: 0 }, { user: user('a'), since: 0 }], 1e6), undefined) // 같은 계정끼리는 안 붙는다
})

test('매치 → 밴(3곡이 남을 때까지) → 첫 곡 → 준비 → 연결', () => {
  const { L } = setup()
  const [a, b] = pairUp(L, user('a'), user('b'))
  const ma = last(a, 'l_match'), mb = last(b, 'l_match')
  assert.equal(ma.songs.length, POOL); assert.equal(ma.mid, mb.mid)
  assert.notEqual(ma.turn, mb.turn) // 한 명만 먼저 밴
  const players = ma.turn === 'you' ? [a, b] : [b, a] // [먼저 밴하는 쪽, 나머지]
  players[1].got.length = 0
  L.message(players[1], { t: 'l_ban', idx: 0 }); assert.equal(last(players[1], 'l_ban'), undefined) // 차례가 아닌 쪽의 밴은 무시
  for (let i = 0; i < POOL - KEEP; i++) L.message(players[i % 2], { t: 'l_ban', idx: i }) // 5곡 중 2곡만 밴: 한 명이 한 곡씩
  L.message(players[0], { t: 'l_ban', idx: 2 }) // 이미 끝난 뒤의 밴은 무시
  const sa = last(a, 'l_start'), sb = last(b, 'l_start')
  assert.equal(sa.idx, 2); assert.deepEqual(sa.order, [2, 3, 4]); assert.equal(sa.round, 1); assert.deepEqual(sa.wins, [0, 0])
  assert.equal(sa.dir, sb.dir); assert.equal(sa.keys, 4)
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
  for (let i = 0; i < POOL - KEEP; i++) L.message(ps[i % 2], { t: 'l_ban', idx: i })
  L.message(a, { t: 'l_ready' }); L.message(b, { t: 'l_ready' })
  return { a, b, mid: last(a, 'l_match').mid }
}
const sleep = ms => new Promise(r => setTimeout(r, ms))
// 한 판: 둘이 점수를 올린다. 매치가 안 끝났으면 다음 판 곡이 오고, 둘이 준비한다 (roundGap 0)
async function round(L, ua, ub, mid, a, b, sa, sb, more = true) {
  L.report(ua, mid, { score: sa, failed: false }); L.report(ub, mid, { score: sb, failed: false })
  if (more) { await sleep(10); L.message(a, { t: 'l_ready' }); L.message(b, { t: 'l_ready' }) }
}

test('3판 2선승: 2:0이면 두 판으로 끝나고 LP는 매치가 끝날 때 한 번만 바뀐다', async () => {
  const { L, saved } = setup()
  const ua = user('a', 1000), ub = user('b', 1000)
  const { a, b, mid } = playedMatch(L, ua, ub)
  assert.equal(L.result(ua, mid).state, 'wait')
  assert.equal(L.report(ua, mid, { score: 900000, failed: false }), true)
  assert.equal(L.report(ua, mid, { score: 999999, failed: false }), false) // 한 번만
  assert.equal(L.result(ua, mid).state, 'wait') // 상대를 기다린다
  L.report(ub, mid, { score: 800000, failed: false })
  assert.deepEqual([last(a, 'l_round').res, last(a, 'l_round').wins, last(a, 'l_round').final], ['WIN', [1, 0], false])
  assert.equal(last(b, 'l_round').res, 'LOSE'); assert.deepEqual(last(b, 'l_round').wins, [0, 1])
  assert.equal(L.result(ua, mid).state, 'wait'); assert.equal(saved(), 0); assert.equal(ua.lp, 1000) // 아직 안 끝났다
  await sleep(10); const s2 = last(a, 'l_start'); assert.equal(s2.round, 2); assert.equal(s2.idx, 3); assert.deepEqual(s2.wins, [1, 0]) // 다음 곡
  L.message(a, { t: 'l_ready' }); L.message(b, { t: 'l_ready' })
  assert.equal(L.report(ua, mid, { score: 910000, failed: false }), true) // 새 판이라 다시 올릴 수 있다
  L.report(ub, mid, { score: 700000, failed: false })
  assert.equal(last(a, 'l_round').final, true)
  const ra = L.result(ua, mid), rb = L.result(ub, mid)
  assert.equal(ra.result, 'WIN'); assert.equal(rb.result, 'LOSE'); assert.deepEqual(ra.wins, [2, 0])
  assert.ok(ra.delta > 0 && rb.delta < 0); assert.equal(ua.lp, 1000 + ra.delta); assert.equal(saved(), 1)
  assert.ok(ua.exp > 0 && ub.exp > 0)
  await sleep(10); assert.equal(a.got.filter(m => m.t === 'l_start').length, 2) // 세 번째 판은 없다
})

test('3판 2선승: 1:1이면 세 번째 판이 결정한다', async () => {
  const { L } = setup()
  const ua = user('a', 500), ub = user('b', 500)
  const { a, b, mid } = playedMatch(L, ua, ub)
  await round(L, ua, ub, mid, a, b, 900000, 800000) // a 승
  await round(L, ua, ub, mid, a, b, 700000, 850000) // b 승
  assert.equal(last(a, 'l_start').round, 3); assert.deepEqual(last(a, 'l_start').wins, [1, 1])
  assert.equal(L.result(ua, mid).state, 'wait')
  await round(L, ua, ub, mid, a, b, 600000, 950000, false) // b 승
  const ra = L.result(ua, mid), rb = L.result(ub, mid)
  assert.equal(ra.result, 'LOSE'); assert.equal(rb.result, 'WIN'); assert.deepEqual(rb.wins, [2, 1])
})

test('3판 2선승: 첫 판을 시작한 뒤 사람끼리 판 사이에 나가면 기권패, 시작 전에는 취소', async () => {
  const { L } = setup()
  const ua = user('a', 500), ub = user('b', 500)
  const { a, b, mid } = playedMatch(L, ua, ub)
  L.report(ua, mid, { score: 900000, failed: false }); L.report(ub, mid, { score: 800000, failed: false }) // 1판 a 승, 다음 판 준비 중
  L.close(a) // 이긴 a가 나가도 기권이니 매치는 b의 승
  assert.equal(L.result(ub, mid).result, 'WIN'); assert.equal(L.result(ua, mid).result, 'LOSE')
  const L2 = setup().L, ua2 = user('c', 500), ub2 = user('d', 500), [c, d] = pairUp(L2, ua2, ub2)
  const first = last(c, 'l_match').turn === 'you' ? [c, d] : [d, c]
  for (let i = 0; i < POOL - KEEP; i++) L2.message(first[i % 2], { t: 'l_ban', idx: i })
  L2.close(c) // 곡을 받는 중(첫 판 시작 전)
  assert.ok(last(d, 'l_cancel')); assert.equal(ua2.lp, 500)
})

test('봇 점수: LP가 높을수록 세지만 최고도 만점과 거리가 있다', () => {
  const lo = Array.from({ length: 200 }, () => botScore(0)), hi = Array.from({ length: 200 }, () => botScore(800))
  assert.ok(Math.min(...lo) >= 0.55 && Math.max(...lo) <= 0.69 + 1e-9)
  assert.ok(Math.min(...hi) >= 0.75 && Math.max(...hi) <= 0.89 + 1e-9)
  assert.equal(botScore(5000) >= 0.75, true); assert.equal(botScore(-50) <= 0.69, true) // 범위 밖 LP도 같은 구간
})

test('결과: 곡 길이의 80%가 지나기 전 "끝까지 쳤다"는 결과는 받지 않는다 (포기는 받는다)', () => {
  let t = 1000
  const L = createLadder({ pool: () => songs, len: () => 100, save() {}, now: () => t })
  const ua = user('a'), ub = user('b'), [a, b] = pairUp(L, ua, ub), m = last(a, 'l_match')
  const first = m.turn === 'you' ? [a, b] : [b, a]
  for (let i = 0; i < POOL - KEEP; i++) L.message(first[i % 2], { t: 'l_ban', idx: i })
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
  const L = createLadder({ pool: () => songs, save() {}, now: () => t, botWait: 0, botDelay: 0, botTick: 5, botMinLen: 0.05, roundGap: 0 })
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
  const done = last(a, 'done'); assert.ok(done); assert.ok(done.s >= 570000 && done.s <= 720000, '낮은 LP의 봇은 약하다'); assert.equal(done.failed, false)
  assert.ok(a.got.some(x => x.t === 'score' || x.t === 'done'))
  t += 100_000 // 사람이 포기(실패)로 올리면 결과가 난다
  assert.equal(L.report(ua, mid, { score: 1000, failed: true }), true)
  assert.deepEqual([last(a, 'l_round').res, last(a, 'l_round').wins], ['LOSE', [0, 1]]) // 첫 판은 졌고 아직 안 끝났다
  assert.equal(L.result(ua, mid).state, 'wait')
})

test('치는 중에 나가도 판이 끝나기 전에 다시 래더를 할 수 있다', () => {
  const { L } = setup()
  const a = sock(), b = sock(), ua = user('a'), ub = user('b'); L.join(a, ua); L.join(b, ub)
  const mid = last(a, 'l_match').mid, turn = [a, b].find(s => turnOf(s).turn === 'you')
  const order = turn === a ? [a, b] : [b, a]
  for (let i = 0; i < POOL - KEEP; i++) L.message(order[i % 2], { t: 'l_ban', idx: i })
  L.message(a, { t: 'l_ready' }); L.message(b, { t: 'l_ready' }) // 연결되어 치는 중
  L.close(a) // a가 나갔다 (b는 아직 치는 중이라 판은 끝나지 않았다)
  const a2 = sock(); L.join(a2, ua)
  assert.ok(last(a2, 'l_wait'), '이미 래더 중인 계정이라는 오류 없이 대기열에 들어간다')
  assert.equal(last(a2, 'r_err'), undefined)
})
