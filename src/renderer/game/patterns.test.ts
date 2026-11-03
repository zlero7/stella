import test from 'node:test'
import assert from 'node:assert/strict'
import { layout, type Hit } from './patterns.ts'

// 일정한 간격의 타격 (세기는 번갈아 약·강, 멜로디는 두 음만 오가서 예전 방식이면 dfdf가 되는 입력)
const hits = (n: number, gap: number, want = 0): Hit[] =>
  Array.from({ length: n }, (_, i) => ({ t: 1 + i * gap, v: i % 4 === 0 ? 3 : 1, q: i % 2 ? 1 : 2, want: i % 9 === 0 ? want : 0, hl: true }))

test('두 레인만 오가는 트릴(dfdf)을 만들지 않는다', () => {
  for (const diff of ['easy', 'normal', 'hard', 'stella']) {
    const lanes = layout(hits(200, 0.3), diff, 1).filter((n, i, a) => i === 0 || n.time !== a[i - 1].time).map(n => n.lane)
    for (let i = 3; i < lanes.length; i++) assert.ok(!(lanes[i] === lanes[i - 2] && lanes[i - 1] === lanes[i - 3] && lanes[i] !== lanes[i - 1]), `${diff} ${i}: ${lanes.slice(i - 3, i + 1)}`) // ABAB 금지 (AAAA 연타는 허용)
  }
})

test('스텔라는 동타·3중동타가 나오고 쉬운 난이도는 동타가 없다', () => {
  const count = (diff: string) => {
    const by = new Map<number, number>()
    for (const n of layout(hits(300, 0.25), diff, 1)) by.set(n.time, (by.get(n.time) ?? 0) + 1)
    return [...by.values()]
  }
  const st = count('stella')
  assert.ok(st.some(c => c === 2) && st.some(c => c === 3), '스텔라 동타')
  assert.ok(Math.max(...count('easy')) === 1 && Math.max(...count('normal')) === 2) // 노말은 센 타격에서 가끔 2동타
  assert.ok(Math.max(...count('hard')) >= 2 && count('hard').filter(c => c === 3).length < count('stella').filter(c => c === 3).length) // 하드의 3동타는 스텔라보다 드물다
})

test('롱노트를 잡는 동안 같은 레인에는 노트가 없고, 다른 레인 노트는 친다', () => {
  const ns = layout(hits(200, 0.3, 1.2), 'stella', 1)
  const holds = ns.filter(n => n.duration)
  assert.ok(holds.length > 5)
  let others = 0
  for (const h of holds) {
    const during = ns.filter(n => n !== h && n.time > h.time && n.time < h.time + h.duration!)
    assert.ok(during.every(n => n.lane !== h.lane), '잡는 레인에 노트')
    others += during.length
  }
  assert.ok(others > 5, '롱노트 중 다른 노트')
})

test('연타(같은 레인 연속)가 하드·스텔라에 나온다', () => {
  const jacks = (diff: string) => {
    const ns = layout(hits(400, 0.15), diff, 1).filter(n => !n.duration)
    let c = 0
    ns.forEach((n, i) => { if (i && n.lane === ns[i - 1].lane && n.time > ns[i - 1].time) c++ })
    return c
  }
  assert.ok(jacks('stella') > 5)
  assert.ok(jacks('normal') < jacks('stella') / 3) // 노말은 연타 모드가 없다 (센 타격의 2동타가 같은 레인으로 이어지는 우연만)
})

test('하이라이트 밖에서는 동타·3중동타가 줄고 3중동타는 안에서만 나온다', () => {
  const chordOf = (hl: boolean) => {
    const by = new Map<number, number>()
    for (const n of layout(hits(400, 0.25).map(h => ({ ...h, hl })), 'stella', 1)) by.set(n.time, (by.get(n.time) ?? 0) + 1)
    const c = [...by.values()]
    return { chords: c.filter(k => k >= 2).length / c.length, triples: c.filter(k => k >= 3).length }
  }
  const inside = chordOf(true), outside = chordOf(false)
  assert.ok(inside.chords > outside.chords * 1.5, `${inside.chords} vs ${outside.chords}`)
  assert.equal(outside.triples, 0)
  assert.ok(inside.triples > 0)
})

test('6키: 레인 0~5를 모두 쓰고 두 레인 왕복·같은 시각 중복이 없다', () => {
  const h6 = hits(300, 0.3).map((h, i) => ({ ...h, q: i % 6 }))
  for (const diff of ['easy', 'stella']) {
    const ns = layout(h6, diff, 1, 6)
    assert.deepEqual([...new Set(ns.map(n => n.lane))].sort(), [0, 1, 2, 3, 4, 5], diff)
    const by = new Map<string, number>()
    for (const n of ns) by.set(`${n.time}/${n.lane}`, (by.get(`${n.time}/${n.lane}`) ?? 0) + 1)
    assert.ok([...by.values()].every(c => c === 1), '같은 시각·레인 중복')
  }
})
