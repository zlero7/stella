import test from 'node:test'
import assert from 'node:assert/strict'
import { autoChart } from './AutoChart.ts'

// 120BPM(0.5초 간격) 클릭 트랙 20초
const sr = 22050
const clicks = new Float32Array(sr * 20)
for (let t = 0.5; t < 19.5; t += 0.5) {
  const s = Math.round(t * sr)
  for (let i = 0; i < 300; i++) clicks[s + i] = Math.sin(i * 0.4) * Math.exp(-i / 60)
}

for (const hard of [false, true]) {
  test(`클릭 트랙 채보 (${hard ? 'hard' : 'normal'})`, () => {
    const { notes, bpm } = autoChart(clicks, sr, hard ? 'hard' : 'normal')
    assert.ok(Math.abs(notes.length - 38) <= 2, `노트 수 ${notes.length}`)
    for (const n of notes) {
      const off = Math.abs(n.time / 0.5 - Math.round(n.time / 0.5)) * 0.5
      assert.ok(off < 0.03, `박자에서 ${off}s 어긋남`)
    }
    assert.ok(Math.abs(bpm - 120) <= 1.5, `bpm ${bpm}`)
    notes.forEach((n, i) => i && assert.notEqual(n.lane, notes[i - 1].lane))
  })
}

test('무음이면 노트 없음', () => {
  assert.equal(autoChart(new Float32Array(sr * 5), sr, 'hard').notes.length, 0)
})

test('멜로디: 음이 바뀔 때마다 노트, 길게 끄는 음은 롱노트', () => {
  const m = new Float32Array(sr * 12), hz = [220, 294, 392, 294, 220, 330], starts = hz.map((_, i) => 1 + i * 1.8)
  hz.forEach((f, i) => { // 0.9초짜리 사인파 음, 앞뒤로 짧게 키우고 줄인다
    for (let k = 0; k < sr * 0.9; k++) m[Math.round(starts[i] * sr) + k] = 0.5 * Math.sin((2 * Math.PI * f * k) / sr) * Math.min(1, k / 400, (sr * 0.9 - k) / 400)
  })
  const { notes } = autoChart(m, sr, 'hard')
  const events = new Set(notes.map(n => n.time)).size // 동타는 한 번으로 센다
  assert.ok(Math.abs(events - 6) <= 2, `타격 수 ${events}`)
  for (const t of starts) assert.ok(notes.some(n => Math.abs(n.time - t) < 0.15), `${t}초 근처에 노트가 없다`)
  assert.ok(notes.some(n => n.duration && n.duration > 0.4), '롱노트가 없다')
})

test('하이라이트 구간은 약한 타격까지 넣어 더 촘촘하고, 그 밖은 센 타격만 남긴다', () => {
  const x = new Float32Array(sr * 30) // 0.25초마다 세기가 제각각인 클릭
  for (let k = 2; k < 116; k++) for (let i = 0; i < 300; i++) x[Math.round(k * 0.25 * sr) + i] += (0.15 + 0.85 * ((k * 7) % 10) / 9) * Math.sin(i * 0.4) * Math.exp(-i / 60)
  const { notes } = autoChart(x, sr, 'normal', [[10, 22]])
  const inside = notes.filter(n => n.time >= 11 && n.time < 21).length / 10, outside = notes.filter(n => n.time < 9 || n.time > 23).length / 15
  assert.ok(inside > outside * 1.05, `하이라이트 ${inside}/s, 그 밖 ${outside}/s`)
})

test('노트는 박자 격자가 아니라 실제 타격 시각에 놓인다', () => {
  const x = new Float32Array(sr * 20), hits = [1.003, 1.521, 2.047, 2.488, 3.011, 3.55, 4.02, 4.49, 5.07, 5.52] // 격자와 상관없이 흩어진 타격
  for (const t of hits) for (let i = 0; i < 300; i++) x[Math.round(t * sr) + i] += Math.sin(i * 0.4) * Math.exp(-i / 60)
  const { notes } = autoChart(x, sr, 'hard')
  for (const t of hits) assert.ok(notes.some(n => Math.abs(n.time - t) < 0.02), `${t}초 타격에 노트가 없다`)
})

test('레벨: 가장 바쁜 구간의 밀도로 3·6·10·14, 아주 빽빽하면 15, 빈 채보는 1', async () => {
  const { levelOf } = await import('./AutoChart.ts')
  const at = (nps: number) => Array.from({ length: Math.round(nps * 100) }, (_, i) => ({ time: i / nps, lane: i % 4 }))
  assert.equal(levelOf(at(2)), 3)
  assert.equal(levelOf(at(3)), 6)
  assert.equal(levelOf(at(6.8)), 10)
  assert.equal(levelOf(at(10)), 14)
  assert.equal(levelOf(at(20)), 15)
  assert.equal(levelOf([]), 1)
  // 같은 노트 수라도 한곳에 몰린 곡이 더 어렵다
  const flat = at(4), burst = Array.from({ length: 400 }, (_, i) => ({ time: (i < 200 ? i / 10 : 80 + (i - 200) / 5), lane: i % 4 }))
  assert.ok(levelOf(burst) > levelOf(flat))
})

test('옛 알고리즘 번호의 자동 채보만 다시 만들고, 직접 고친 채보는 그대로 둔다', async () => {
  const { needsRegen, CHART_GEN } = await import('./AutoChart.ts')
  assert.equal(needsRegen({}), true) // 번호가 없는 옛 채보
  assert.equal(needsRegen({ gen: CHART_GEN - 1 }), true)
  assert.equal(needsRegen({ gen: CHART_GEN }), false)
  assert.equal(needsRegen({ hand: true }), false)
  assert.equal(needsRegen({ gen: 0, hand: true }), false)
})
