import test from 'node:test'
import assert from 'node:assert/strict'
import { randomize } from './randomize.ts'
import type { Note } from '../../shared/types'

const notes: Note[] = [{ time: 1, lane: 0 }, { time: 1, lane: 3 }, { time: 2, lane: 1, duration: 1 }, { time: 2.5, lane: 2 }, { time: 4, lane: 0 }]
const seq = (xs: number[]) => { let i = 0; return () => xs[i++ % xs.length] }

test('RANDOM: 레인 대응이 일대일이고 시각·길이는 그대로', () => {
  const r = randomize(notes, 4, 1, seq([0.3, 0.7, 0.1])), map = new Map(notes.map((n, i) => [n.lane, r[i].lane]))
  assert.equal(new Set(map.values()).size, map.size)
  assert.deepEqual(r.map(n => [n.time, n.duration]), notes.map(n => [n.time, n.duration]))
})
test('HALF RANDOM: 왼쪽 절반 노트는 왼쪽에, 오른쪽 절반은 오른쪽에 남는다', () => {
  for (let s = 1; s < 20; s++) { const r = randomize(notes, 4, 2, seq([s / 20, (s * 7 % 20) / 20])); r.forEach((n, i) => assert.equal(n.lane < 2, notes[i].lane < 2)) }
})
test('MAX RANDOM: 동타는 서로 다른 레인, 롱노트 중에는 그 레인에 다른 노트가 오지 않는다', () => {
  for (let s = 1; s < 30; s++) {
    const r = randomize(notes, 4, 3, seq([(s * 13 % 29) / 29, (s * 7 % 23) / 23, 0.5])), at1 = r.filter(n => n.time === 1).map(n => n.lane)
    assert.equal(new Set(at1).size, 2)
    const long = r.find(n => n.duration)!, other = r.find(n => n.time === 2.5)!
    assert.notEqual(long.lane, other.lane)
    assert.equal(r.length, notes.length)
  }
})
test('모드 0이나 모르는 값은 그대로', () => { assert.equal(randomize(notes, 4, 0), notes) })
