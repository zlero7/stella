import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanChart } from './chartCheck.ts'

test('멀쩡한 채보는 그대로', () => {
  const r = cleanChart([{ time: 1, lane: 0 }, { time: 1, lane: 3 }, { time: 2, lane: 0, duration: 0.5 }])
  assert.equal(r.notes.length, 3)
  assert.deepEqual(r.fixed, [])
})

test('잘못된 레인·시각·같은 자리 중복을 지운다', () => {
  const r = cleanChart([{ time: 1, lane: 4 }, { time: -1, lane: 0 }, { time: 2, lane: 1 }, { time: 2, lane: 1, duration: 1 }])
  assert.equal(r.notes.length, 1)
  assert.equal(r.notes[0].duration, 1) // 중복 중 더 긴 롱노트를 남긴다
  assert.equal(r.fixed.length, 2)
})

test('길이 0 롱노트는 일반 노트로, 다음 노트를 덮는 롱노트는 앞에서 줄인다', () => {
  const r = cleanChart([{ time: 1, lane: 0, duration: 0 }, { time: 2, lane: 1, duration: 2 }, { time: 3, lane: 1 }, { time: 5, lane: 2, duration: 2 }, { time: 5.1, lane: 2 }])
  assert.equal(r.notes[0].duration, undefined)
  assert.equal(r.notes[1].duration, 0.95) // 3 - 0.05 - 2
  assert.equal(r.notes.find(n => n.time === 5)!.duration, undefined) // 줄일 여유가 없으면 일반 노트
})

test('변속: 위치는 속도를 쌓은 거리, 변속 전은 그대로, 배율은 제한', async () => {
  const { speedTable, posAt } = await import('./chartCheck.ts')
  const tbl = speedTable([{ time: 10, mult: 2 }, { time: 20, mult: 0.5 }, { time: 30, mult: 99 }])
  assert.equal(posAt(tbl, 5), 5)
  assert.equal(posAt(tbl, 10), 10)
  assert.equal(posAt(tbl, 15), 20) // 10초 뒤부터 2배
  assert.equal(posAt(tbl, 20), 30)
  assert.equal(posAt(tbl, 24), 32) // 0.5배
  assert.equal(posAt(tbl, 31), 35 + 4) // 30초부터는 최대 4배
  assert.equal(posAt(speedTable(), 7), 7)
})

test('하이라이트 구간: 겹치면 합치고 시작순으로 정렬한다', async () => {
  const { mergeSpans } = await import('./chartCheck.ts')
  assert.deepEqual(mergeSpans([[50, 60], [10, 20], [18, 30], [30, 35]]), [[10, 35], [50, 60]])
  assert.deepEqual(mergeSpans([]), [])
})
