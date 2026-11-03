import type { Chart, Note } from '../../shared/types'
import { layout, type Hit } from './patterns.ts'

const HOP = 512
const DEC = 4 // 음높이 분석용으로 샘플 수를 1/4로 줄인다
const round3 = (x: number) => Math.round(x * 1000) / 1000

// 음원에서 타격 지점(onset)을 찾아 채보 초안을 만든다.
// 멜로디 중심: 목소리 대역(300~3400Hz)에서 음높이를 추적해 음이 바뀌는 곳마다 노트를 놓고, 길게 끄는 음은 롱노트로 만든다.
// 박자 타격(하이햇·킥 등)은 멜로디가 비는 곳을 메우는 보조다.
// shortcut: 목소리만 따로 떼지 못하고 한 번에 한 음만 추적해서, 악기가 시끄럽거나 화음이 많은 곡은 정확도가 떨어진다, 그럴 땐 에디터에서 다듬는다.
// 난이도별 [임계 배율, 최소 간격(초)]: 값이 낮을수록 노트가 많다
// 후보를 목표 밀도의 몇 배까지 뽑아 두는지 (고른 뒤 난이도별 최소 간격으로 줄어든다). 실측으로 최종 밀도가 목표에 맞게 정했다
const OVER: Record<string, number> = { easy: 2.2, normal: 1.6, hard: 1.25, stella: 1.25 }
const CONTRAST: Record<string, number> = { easy: 2.4, normal: 2.2, hard: 1.6, stella: 1.5 } // 하이라이트 안 노트 밀도 / 밖 노트 밀도 (어려운 난이도는 안쪽이 동타로도 늘어서 비를 작게 잡는다)
const TIERS: Record<string, [number, number]> = { easy: [2.6, 0.32], normal: [1.8, 0.2], hard: [1.3, 0.11], stella: [1.0, 0.075] }
// 난이도와 상관없는 분석(주파수 대역별 변화량, 하이라이트, 음높이)은 곡 하나에 한 번만 하고 난이도 네 개가 나눠 쓴다 (분석이 시간의 대부분이라 4배 빨라진다)
interface Analysis { n: number; hopT: number; em: Float32Array; zc: Float32Array; hl: Uint8Array; hlAt: (t: number) => boolean; flux: Float32Array; pitchAt: (t: number) => number | undefined }
let memo: { x: Float32Array; sr: number; hk: string; an: Analysis } | undefined // 마지막 곡만 기억한다
function analyze(x: Float32Array, sr: number, highlights?: [number, number][]): Analysis {
  const hk = JSON.stringify(highlights ?? null)
  if (memo && memo.x === x && memo.sr === sr && memo.hk === hk) return memo.an
  const n = Math.floor(x.length / HOP)
  const hopT = HOP / sr
  // 보컬(300~3400Hz) + 고역(1차 차분: 하이햇·자음) + 저역(킥·베이스). 롱노트 길이는 보컬 대역 크기(em)로 잰다
  const dm = new Float32Array(Math.floor((n * HOP) / DEC)) // 보컬 대역을 1/4로 줄인 신호
  const env = new Float32Array(n), lo = new Float32Array(n), em = new Float32Array(n), zc = new Float32Array(n), pw = new Float32Array(n)
  const lp = (f: number) => 1 - Math.exp((-2 * Math.PI * f) / sr)
  const a = lp(180), aLow = lp(300), aHigh = lp(3400)
  let y = 0, yLow = 0, yHigh = 0, pm = 0, acc = 0
  for (let i = 0; i < n; i++) {
    let s = 0, l = 0, e = 0, z = 0, p = 0
    for (let j = i * HOP; j < (i + 1) * HOP; j++) {
      p += x[j] * x[j]
      y += a * (x[j] - y); yLow += aLow * (x[j] - yLow); yHigh += aHigh * (x[j] - yHigh)
      const m = yHigh - yLow // 보컬 대역
      l += Math.abs(y); e += Math.abs(m); if (m * pm < 0) z++; pm = m // 영점 교차 수 = 대략적인 음높이
      acc += m; if ((j + 1) % DEC === 0) { dm[(j + 1) / DEC - 1] = acc / DEC; acc = 0 }
      if (j > i * HOP) { const d = x[j] - x[j - 1]; s += d * d }
    }
    env[i] = Math.sqrt(s / HOP); lo[i] = l / HOP; em[i] = e / HOP; zc[i] = z; pw[i] = p / HOP
  }
  // 하이라이트(후렴) 구간이 없을 때만: 앞뒤 3초 평균 음량이 곡 중앙값보다 15% 넘게 큰 구간이 6초 이상 이어지는 곳
  // shortcut: 음량만 보므로 조용한 후렴이나 시끄러운 간주는 틀릴 수 있다, 에디터에서 다듬는다.
  const hl = new Uint8Array(n)
  if (highlights?.length) for (const [a, b] of highlights) hl.fill(1, Math.max(0, Math.round(a / hopT)), Math.min(n, Math.round(b / hopT) + 1))
  else {
    const P = new Float64Array(n + 1), r = Math.round(3 / hopT), sm = new Float32Array(n), runs: [number, number][] = []
    for (let i = 0; i < n; i++) P[i + 1] = P[i] + pw[i]
    for (let i = 0; i < n; i++) { const a = Math.max(0, i - r), b = Math.min(n, i + r + 1); sm[i] = (P[b] - P[a]) / (b - a) }
    const thr = 1.15 * (sm.slice().sort()[n >> 1] ?? 0)
    for (let i = 0; i < n; i++) {
      if (sm[i] <= thr) continue
      const last = runs[runs.length - 1]
      if (last && i - last[1] < 4 / hopT) last[1] = i; else runs.push([i, i])
    }
    for (const [a, b] of runs) if ((b - a) * hopT >= 6) hl.fill(1, a, b + 1)
  }
  const hlAt = (t: number) => hl[Math.min(n - 1, Math.max(0, Math.round(t / hopT)))] === 1
  const fh = new Float32Array(n), fl = new Float32Array(n), fm = new Float32Array(n)
  let mh = 0, ml = 0, mm = 0
  for (let i = 1; i < n; i++) {
    fh[i] = Math.max(0, env[i] - env[i - 1]); fl[i] = Math.max(0, lo[i] - lo[i - 1]); fm[i] = Math.max(0, em[i] - em[i - 1])
    mh += fh[i]; ml += fl[i]; mm += fm[i]
  }
  mh = mh / Math.max(n, 1) + 1e-9; ml = ml / Math.max(n, 1) + 1e-9; mm = mm / Math.max(n, 1) + 1e-9
  const flux = new Float32Array(n) // 대역마다 자기 평균으로 맞춰 합친다 (보컬 1, 고역 0.45, 저역 0.35)
  for (let i = 1; i < n; i++) flux[i] = fm[i] / mm + 0.45 * (fh[i] / mh) + 0.35 * (fl[i] / ml)

  // 음높이 추적: 프레임마다 자기상관으로 기본 주파수(90~800Hz)를 구하고, 음이 반 음 넘게 바뀌면 새 노트로 본다
  const fs = sr / DEC, W = 640, H = 320, minLag = Math.max(2, Math.floor(fs / 800)), maxLag = Math.ceil(fs / 90)
  const nf = Math.max(Math.floor((dm.length - W) / H), 0), pit = new Float32Array(nf).fill(NaN), fe = new Float32Array(nf)
  const ps = new Float64Array(dm.length + 1)
  for (let q = 0; q < dm.length; q++) ps[q + 1] = ps[q] + dm[q] * dm[q]
  let gE = 0
  for (let f = 0; f < nf; f++) { fe[f] = (ps[f * H + W] - ps[f * H]) / W; gE += fe[f] }
  gE /= Math.max(nf, 1)
  const rr = new Float32Array(maxLag + 2)
  for (let f = 0; f < nf; f++) {
    if (fe[f] < gE * 0.15) continue // 조용한 곳은 건너뛴다
    const s0 = f * H, L = W - maxLag, e1 = ps[s0 + L] - ps[s0]
    let best = 0
    for (let lag = minLag; lag <= maxLag; lag++) {
      let r = 0
      for (let q = 0; q < L; q++) r += dm[s0 + q] * dm[s0 + q + lag]
      rr[lag] = r / Math.sqrt(e1 * (ps[s0 + lag + L] - ps[s0 + lag]) + 1e-12)
      if (rr[lag] > best) best = rr[lag]
    }
    if (best < 0.7) continue // 음이 뚜렷하지 않다 (타악기·잡음)
    for (let lag = minLag + 1; lag < maxLag; lag++) { // 옥타브 오류를 줄이려고 충분히 높은 가장 짧은 주기를 쓴다
      if (rr[lag] >= 0.9 * best && rr[lag] >= rr[lag - 1] && rr[lag] >= rr[lag + 1]) { pit[f] = 12 * Math.log2(fs / lag / 55); break }
    }
  }
  const pitchAt = (t: number) => { const p = pit[Math.round((t * fs - W / 2) / H)]; return p === p ? p : undefined }
  const an: Analysis = { n, hopT, em, zc, hl, hlAt, flux, pitchAt }
  memo = { x, sr, hk, an }
  return an
}

// highlights: 곡의 하이라이트(후렴) 구간 [시작, 끝] 초. 주면 그대로 쓰고, 없으면 음량으로 어림잡는다
export function autoChart(x: Float32Array, sr: number, diff: string, highlights?: [number, number][], keys = 4): { notes: Note[]; bpm: number } {
  const { n, hopT, em, zc, hl, hlAt, flux, pitchAt } = analyze(x, sr, highlights)
  const minGap = (TIERS[diff] ?? TIERS.normal)[1]
  // 앞뒤 0.5초 평균보다 충분히 큰 지역 최대값을 타격으로 본다
  const pre = new Float64Array(n + 1)
  for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + flux[i]
  const w = Math.round(0.5 / hopT), global = pre[n] / Math.max(n, 1)
  const k = (TIERS[diff] ?? TIERS.normal)[0]
  type Pick = { t: number; v: number; i: number; b: number } // b: 음높이(반음)
  const fp: Pick[] = []
  for (let i = 1; i < n - 1; i++) {
    const lo = Math.max(0, i - w), hi = Math.min(n, i + w + 1)
    const thr = Math.max(((pre[hi] - pre[lo]) / (hi - lo)) * k, global * 0.8)
    if (flux[i] <= thr || flux[i] < flux[i - 1] || flux[i] < flux[i + 1]) continue
    const t = (i + 0.5) * hopT, last = fp[fp.length - 1]
    // 음높이: 멜로디가 잡힌 곳은 그 음, 아니면 영점 교차 수로 어림잡은 값
    const zcf = (zc[i] + zc[Math.min(i + 1, n - 1)] + zc[Math.min(i + 2, n - 1)] + zc[Math.min(i + 3, n - 1)]) / 4 / 2 / hopT
    const b = pitchAt(t) ?? 12 * Math.log2(Math.max(zcf, 55) / 55)
    if (last && t - last.t < 0.09) { if (flux[i] > last.v) fp[fp.length - 1] = { t, v: flux[i], i, b } } // 후보는 넉넉히(0.09초), 난이도별 간격은 고른 뒤에 지킨다
    else fp.push({ t, v: flux[i], i, b })
  }

  // 타격(onset) 시각 그대로 노트로 쓴다. 박자 격자에 억지로 맞추면 실제 소리와 어긋나서(실측: 정밀도 0.49→0.60) 맞추지 않는다.
  // 하이라이트 안은 초당 노트가 밖의 CONTRAST배가 되게 따로 뽑는다. 안과 밖을 각각 센 타격부터 고른다.
  // (예전엔 곡 전체에서 한 번에 뽑았는데, 하드·스텔라는 후보가 모자라 전부 쓰이는 바람에 안팎 밀도가 똑같아졌다)
  const nps = ({ easy: 2.1, normal: 3.8, hard: 6.4, stella: 10 } as Record<string, number>)[diff] ?? 2.3
  const durS = n * hopT
  let hlSec = 0; for (let i = 0; i < n; i++) if (hl[i] === 1) hlSec += hopT
  const inFp = fp.filter(p => hlAt(p.t)), outFp = fp.filter(p => !hlAt(p.t)), outSec = Math.max(durS - hlSec, 1)
  const contrast = hlSec >= 5 && hlSec < durS - 5 ? CONTRAST[diff] ?? 1.8 : 1
  const total = nps * OVER[diff] * durS // 후보로 뽑을 전체 개수
  const xr = total / (contrast * hlSec + outSec) // 밖의 초당 후보 수
  const candIn = Math.min(inFp.length, contrast * xr * hlSec)
  const candOut = Math.min(outFp.length, (candIn / Math.max(hlSec, 1) / contrast) * outSec) // 안이 모자라면 밖도 같은 비율로 줄인다
  const thrOf = (arr: Pick[], k: number) => k <= 0 ? Infinity : k >= arr.length ? 0 : arr.map(p => p.v).sort((u, w) => w - u)[Math.floor(k)]
  const fvs = fp.map(p => p.v).sort((u, w) => u - w), floorV = 0.35 * (fvs[fvs.length >> 1] ?? 0) // 너무 약한 타격(잡음)은 후보가 남아돌아도 쓰지 않는다
  const thIn = Math.max(floorV, contrast === 1 ? thrOf(fp, total) : thrOf(inFp, candIn)), thOut = Math.max(floorV, contrast === 1 ? thIn : thrOf(outFp, candOut)) // 하이라이트 구분이 없으면 곡 전체에서 한 번에
  const picks: Pick[] = []
  for (const p of fp) {
    if (p.v < (hlAt(p.t) ? thIn : thOut)) continue
    const l = picks[picks.length - 1]
    if (l && p.t - l.t < minGap) { if (p.v > l.v) picks[picks.length - 1] = p } else picks.push(p) // 난이도별 최소 간격: 가까우면 센 쪽만
  }
  const bpm = refineBpm(fp.map(p => p.t), estimateBpm(flux, hopT)) // 에디터·박자 표시용

  // 배치: 멜로디 높낮이를 기본으로 계단·지그재그·연타·동타·롱노트 중 다른 레인 치기를 섞는다 (patterns.ts)
  const sorted = picks.map(p => p.v).sort((a, b) => a - b), med = sorted[sorted.length >> 1] ?? 0
  // 레인은 멜로디가 정한다: 낮은 음은 왼쪽, 높은 음은 오른쪽 (곡 안에서의 순위로 레인 수만큼 나눠 모든 곡이 모든 레인을 쓴다)
  const byB = picks.map((p, k) => k).sort((a, b) => picks[a].b - picks[b].b), quad: number[] = []
  byB.forEach((k, r) => { quad[k] = Math.min(keys - 1, Math.floor((keys * r) / picks.length)) })
  const hits: Hit[] = picks.map(({ t, v, i }, idx) => {
    // 롱노트 후보: 목소리가 타격 뒤에도 길게 이어질 때 (늘여 부르는 음)
    const pk = Math.max(em[i], em[Math.min(i + 1, n - 1)], em[Math.min(i + 2, n - 1)])
    let j = i + 2
    while (j < n && em[j] > 0.5 * pk && (j - i) * hopT < 2.5) j++
    const held = (j - i) * hopT
    return { t, v, q: quad[idx], want: pk > 0 && held >= 0.45 ? held : 0, hl: hlAt(t) }
  })
  const notes = layout(hits, diff, med, keys)
  return { notes, bpm }
}

// 대략 BPM 주변에서 타격 시각들이 한 주기에 가장 가지런히 겹치는 값을 찾는다 (프레임 해상도보다 정밀)
function refineBpm(times: number[], b0: number) {
  if (times.length < 4) return b0
  let best = b0, bestScore = -1
  for (let b = b0 - 4; b <= b0 + 4; b += 0.05) {
    const w = (2 * Math.PI * b) / 60
    let c = 0, s = 0
    for (const t of times) { c += Math.cos(w * t); s += Math.sin(w * t) }
    const score = c * c + s * s
    if (score > bestScore) { bestScore = score; best = b }
  }
  return Math.round(best * 10) / 10
}

// 타격 강도의 자기상관이 가장 큰 BPM (70~180)
function estimateBpm(raw: Float32Array, hopT: number) {
  // 타격이 프레임 단위로 쪼개져 자기상관이 계단식이 되므로, 살짝 뭉갠 뒤 계산한다
  let flux = raw
  for (let r = 0; r < 3; r++) {
    const o = new Float32Array(flux.length)
    for (let i = 1; i < flux.length - 1; i++) o[i] = (flux[i - 1] + 2 * flux[i] + flux[i + 1]) / 4
    flux = o
  }
  // 한 박 간격의 자기상관에 흔한 템포(130 BPM 근처)를 우대하는 가중을 곱한다. 곡을 정답 BPM과 대조해 보니 박자를 3분의 2로 잘못 잡는 일이 잦아서,
  // 1.5배 템포의 점수가 80% 이상이면 그쪽을 택한다. 2배/반 템포는 격자가 겹쳐서 문제 없다.
  const ac = (b: number) => {
    const lag = 60 / b / hopT, l0 = Math.floor(lag), f = lag - l0
    let s = 0
    for (let i = 0; i + l0 + 1 < flux.length; i++) s += flux[i] * ((1 - f) * flux[i + l0] + f * flux[i + l0 + 1])
    return (s / Math.max(flux.length - l0, 1)) * Math.exp(-0.5 * Math.log2(b / 130) ** 2)
  }
  let best = 120, bestScore = -1
  for (let b = 70; b <= 180; b += 0.5) {
    const s = ac(b)
    if (s > bestScore) { bestScore = s; best = b }
  }
  if (best * 1.5 <= 200 && ac(best * 1.5) >= 0.8 * bestScore) best *= 1.5
  return best
}

// 레벨(1~15): 곡이 가장 바쁜 구간의 초당 노트 수로 매긴다(동타는 각각 센다). 평균으로 매기면 하이라이트만 빽빽한 곡이 쉬워 보이고,
// 실제로 어려운 건 그 빽빽한 부분이다. 5초 구간(2.5초씩 이동)의 초당 노트 수를 모아 상위 15% 지점 값을 쓴다.
// 우리 채보의 중앙값(이지·노말·하드·스텔라)이 3, 6, 10, 14가 되도록 점들 사이를 직선으로 잇는다 (디맥 In My Heart 4B: Normal 3, Hard 7, Maximum 10처럼 난이도 간격이 벌어진다)
const LEVEL_AT: [number, number][] = [[0.5, 1], [2.0, 3], [3.0, 6], [6.8, 10], [10.0, 14], [12.5, 15]]
export function peakNps(notes: Note[]) {
  if (!notes.length) return 0
  const t0 = notes[0].time, t1 = notes[notes.length - 1].time, W = 5
  const rates: number[] = []
  for (let a = t0; a + W <= Math.max(t1, t0 + W) + 1e-9; a += W / 2) rates.push(notes.filter(n => n.time >= a && n.time < a + W).length / W)
  rates.sort((x, y) => x - y)
  return rates[Math.min(rates.length - 1, Math.floor(rates.length * 0.85))]
}
export function levelOf(notes: Note[]) {
  if (!notes.length) return 1
  const nps = peakNps(notes)
  const k = LEVEL_AT.findIndex(([x]) => x >= nps)
  if (k < 0) return 15
  if (k === 0) return 1
  const [x0, y0] = LEVEL_AT[k - 1], [x1, y1] = LEVEL_AT[k]
  return Math.min(Math.max(Math.round(y0 + ((nps - x0) / (x1 - x0)) * (y1 - y0)), 1), 15)
}

export const buildChart = (buf: AudioBuffer, diff: string, highlights?: [number, number][], keys = 4) => chartOf(buf.getChannelData(0), buf.sampleRate, diff, highlights, keys)

// 자동 채보 알고리즘 번호. 채보를 만드는 방식을 바꿀 때마다 올리면, 이전 번호로 만든 채보는 곡 선택 화면에서 새로 만들어진다
export const CHART_GEN = 6
// 에디터로 고친(hand) 채보는 건드리지 않고, 자동 채보는 번호가 낮으면 다시 만든다
export const needsRegen = (c: { gen?: number; hand?: boolean }) => !c.hand && (c.gen ?? 0) < CHART_GEN

export function chartOf(x: Float32Array, sr: number, diff: string, highlights?: [number, number][], keys = 4): Chart {
  const { notes, bpm } = autoChart(x, sr, diff, highlights, keys)
  return {
    version: 1, keys, difficulty: diff[0].toUpperCase() + diff.slice(1), gen: CHART_GEN,
    level: levelOf(notes),
    offset: 0, timing: [{ time: 0, bpm }], notes
  }
}
