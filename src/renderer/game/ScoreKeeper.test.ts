import test from 'node:test'
import assert from 'node:assert/strict'
import { ScoreKeeper, judgeOf, pickTarget, comboMult, MISS } from './ScoreKeeper.ts'

test('판정 경계', () => {
  assert.equal(judgeOf(0.055), 0)
  assert.equal(judgeOf(-0.07), 1)
  assert.equal(judgeOf(0.14), 2)
  assert.equal(judgeOf(0.15), 3) // NICE
  assert.equal(judgeOf(-0.19), 4) // BAD
  assert.equal(judgeOf(0.201), MISS)
})

test('전부 Perfect면 1,000,000점·All Perfect', () => {
  const s = new ScoreKeeper(4)
  for (let i = 0; i < 4; i++) s.add(0)
  assert.equal(s.score, 1_000_000)
  assert.equal(s.badge, 'ALL PERFECT')
  assert.equal(s.rank, 'S+')
})

test('미스는 콤보를 끊고 비중 0', () => {
  const s = new ScoreKeeper(4)
  s.add(0); s.add(0); s.add(MISS); s.add(1)
  assert.equal(s.maxCombo, 2)
  assert.equal(s.combo, 1)
  const m = comboMult, den = m(1) + m(2) + m(3) + m(4)
  assert.equal(s.score, Math.round(1_000_000 * (m(1) + m(2) + 0.7 * m(1)) / den))
  assert.equal(s.accuracy, 100 * 2.7 / 4)
  assert.equal(s.badge, '')
})

test('평균 타이밍 오차: 양수=빠름, 기록이 없으면 0', () => {
  const s = new ScoreKeeper(3)
  assert.equal(s.avgMs, 0)
  s.press(0.03); s.press(-0.01)
  assert.equal(s.avgMs, 10)
})

test('입력 오차 분포: 빠름은 왼쪽, 느림은 오른쪽, 범위 밖은 끝 칸', () => {
  const s = new ScoreKeeper(5)
  s.press(0.05); s.press(-0.05); s.press(-0.05); s.press(0.5); s.press(-0.5)
  const h = s.histogram(20, 200) // 20칸, 가운데는 9·10번
  assert.equal(h.length, 20)
  assert.equal(h[7], 1) // 빠름 50ms
  assert.equal(h[12], 2) // 느림 50ms
  assert.equal(h[0], 1)
  assert.equal(h[19], 1)
})

test('체력: 잘 치면 조금씩 차고(100 위로는 안 감), NICE·BAD·MISS는 깎이며 0이면 실패', () => {
  const s = new ScoreKeeper(100)
  s.add(0); assert.equal(s.hp, 100) // 이미 가득
  s.add(MISS); assert.equal(s.hp, 95)
  s.add(4); assert.equal(s.hp, 92)
  s.add(3); assert.equal(s.hp, 90.5)
  s.add(0); s.add(1); s.add(2)
  assert.ok(Math.abs(s.hp - 91.35) < 1e-9)
  assert.equal(s.failed, false)
  for (let i = 0; i < 20; i++) s.add(MISS)
  assert.equal(s.hp, 0)
  assert.equal(s.failed, true)
})

test('앞 노트를 놓치고 뒤 노트를 제때 치면 뒤 노트가 판정된다 (가장 가까운 노트)', () => {
  const ns = [{ lane: 1, time: 1.0, state: 'wait' }, { lane: 1, time: 1.15, state: 'wait' }, { lane: 2, time: 1.15, state: 'wait' }]
  assert.equal(pickTarget(ns, 0, 1, 1.15), ns[1])
  assert.equal(pickTarget(ns, 0, 1, 1.0), ns[0])
  assert.equal(pickTarget(ns, 0, 2, 1.0), ns[2]) // 다른 레인은 섞이지 않는다
  assert.equal(pickTarget(ns, 0, 3, 1.0), undefined)
  ns[1].state = 'done'
  assert.equal(pickTarget(ns, 0, 1, 1.15), ns[0]) // 이미 친 노트는 제외
  assert.equal(pickTarget([{ lane: 0, time: 5, state: 'wait' }], 0, 0, 1), undefined) // 너무 이른 입력은 무시
})

test('같은 시각에 놓친 동타는 체력을 최대 8까지만 깎는다', () => {
  const s = new ScoreKeeper(10)
  s.add(MISS, 5); s.add(MISS, 5); s.add(MISS, 5)
  assert.equal(s.hp, 92) // -5, -3, 0
  s.add(MISS, 6) // 다른 시각은 다시 -5
  assert.equal(s.hp, 87)
  s.add(MISS) // 시각을 모르면 제한 없이 -5
  assert.equal(s.hp, 82)
})

test('콤보가 높을수록 같은 판정도 점수가 크다 (끊긴 판이 더 낮다)', () => {
  const a = new ScoreKeeper(10), b = new ScoreKeeper(10)
  for (let i = 0; i < 10; i++) { a.add(i === 5 ? 1 : 0); b.add(i === 1 ? MISS : 0) }
  assert.ok(a.score < 1_000_000 && a.score > b.score)
  assert.equal(new ScoreKeeper(0).score, 0)
})

test('판정 수가 5%씩 쌓일 때마다 점수를 기록하고, ±25ms 이내 입력은 MAX로 센다', () => {
  const s = new ScoreKeeper(40)
  for (let i = 0; i < 40; i++) { s.press(i % 2 ? 0.01 : 0.04); s.add(0) }
  assert.equal(s.pace.length, 20)
  assert.equal(s.pace[19], s.score)
  assert.ok(s.pace.every((v, i) => i === 0 || v >= s.pace[i - 1]))
  assert.equal(s.maxCount, 20)
})
