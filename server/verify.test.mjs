import test from 'node:test'
import assert from 'node:assert/strict'
import { plausible } from './verify.mjs'

const ok = { score: 1_000_000, acc: 100, mc: 300, badge: 'ALL PERFECT', n: [300, 0, 0, 0, 0, 0] }

test('앞뒤가 맞는 기록은 통과한다', () => {
  assert.ok(plausible(ok))
  assert.ok(plausible({ score: 960000, acc: 99.2, mc: 300, badge: 'FULL COMBO', n: [292, 8, 0, 0, 0, 0] }))
  assert.ok(plausible({ score: 900000, acc: 90.17, mc: 150, badge: '', n: [250, 20, 10, 10, 5, 5] }))
})

test('판정 개수와 점수·정확도·콤보·배지가 어긋나면 막는다', () => {
  assert.equal(plausible({ ...ok, n: undefined }), false) // 개수가 없다
  assert.equal(plausible({ ...ok, n: [300, 0, 0, 0, 0] }), false) // 칸 수가 틀리다
  assert.equal(plausible({ ...ok, n: [300, 0, 0, 0, 0, -1] }), false)
  assert.equal(plausible({ ...ok, mc: 301 }), false) // 최대 콤보가 노트 수보다 크다
  assert.equal(plausible({ ...ok, acc: 90 }), false) // 정확도가 개수와 다르다
  assert.equal(plausible({ ...ok, score: 1_000_001 }), false)
  assert.equal(plausible({ score: 990000, acc: 70, mc: 100, badge: '', n: [0, 300, 0, 0, 0, 0] }), false) // 정확도 70%인데 99만점
  assert.equal(plausible({ score: 10, acc: 100, mc: 300, badge: 'ALL PERFECT', n: [300, 0, 0, 0, 0, 0] }), false) // 전부 PERFECT인데 점수가 너무 낮다
  assert.equal(plausible({ ...ok, badge: 'FULL COMBO', n: [290, 10, 0, 0, 0, 0] }), false) // 개수는 GREAT가 있는데 정확도를 100으로 보냈다
  assert.equal(plausible({ score: 980000, acc: 99.0, mc: 290, badge: 'ALL PERFECT', n: [290, 10, 0, 0, 0, 0] }), false) // GREAT가 있는데 올 퍼펙트
  assert.equal(plausible({ score: 500000, acc: 50, mc: 10, badge: 'FULL COMBO', n: [0, 0, 0, 0, 0, 20] }), false) // MISS가 있는데 풀콤보
  assert.equal(plausible({ ...ok, badge: '' }), false) // MISS가 없는데 배지가 없다
  assert.equal(plausible(ok, 299), true) // 1% 안쪽 차이는 허용 (채보가 조금 달라도 정상 기록을 막지 않는다)
  assert.equal(plausible(ok, 400), false) // 채보는 400개인데 300개만 쳤다고 올린 만점: 노트 수와 많이 다르다
  assert.equal(plausible(ok, 100), false)
})

test('총수는 [지금, 옛 앱] 둘 중 하나와 맞으면 된다 (롱노트 틱 도입 전 앱도 받는다)', () => {
  const ok = { score: 1_000_000, acc: 100, mc: 300, badge: 'ALL PERFECT', n: [300, 0, 0, 0, 0, 0] }
  assert.equal(plausible(ok, [420, 300]), true)
  assert.equal(plausible({ ...ok, n: [420, 0, 0, 0, 0, 0], mc: 420 }, [420, 300]), true)
  assert.equal(plausible(ok, [600, 450]), false)
})

import { cleanOpts } from './verify.mjs'
test('순위 옵션: 범위 안의 정수만 받고, 없거나 틀리면 undefined', () => {
  assert.deepEqual(cleanOpts({ j: 2, r: 1, m: 0, f: 2 }), { j: 2, r: 1, m: 0, f: 2 })
  assert.deepEqual(cleanOpts({ j: 0, r: 0, m: 0, f: 0, x: 1 }), { j: 0, r: 0, m: 0, f: 0 }) // 모르는 칸은 버린다
  assert.deepEqual(cleanOpts({ j: 0, r: 0, m: 0, f: 0, p: 1 }), { j: 0, r: 0, m: 0, f: 0, p: 1 }) // 일시정지 표시
  assert.equal(cleanOpts({ j: 0, r: 0, m: 0, f: 0, p: 2 }), undefined)
  for (const bad of [undefined, null, 5, 'x', {}, { j: 3, r: 0, m: 0, f: 0 }, { j: 0, r: 2, m: 0, f: 0 }, { j: 0, r: 0, m: 0, f: -1 }, { j: 0.5, r: 0, m: 0, f: 0 }, { j: '1', r: 0, m: 0, f: 0 }]) assert.equal(cleanOpts(bad), undefined, JSON.stringify(bad))
})
