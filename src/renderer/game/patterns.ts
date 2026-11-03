import type { Note } from '../../shared/types'

// 타격(onset)마다 어느 레인에 어떤 모양으로 놓을지 정한다. 계단·지그재그·연타·동타(2~3개)·롱노트 중 다른 레인 치기를 섞고,
// 두 레인만 왔다갔다하는 트릴(dfdfdf)은 만들지 않는다.
export interface Hit {
  t: number // 시각(초)
  v: number // 타격 세기
  q: number // 멜로디 높낮이로 정한 레인(0~3)
  want: number // 롱노트로 늘이고 싶은 길이(초), 없으면 0
  hl: boolean // 하이라이트(후렴) 안인가: 안에서는 동타·3중동타·연타를 세게, 밖에서는 약하게
}

const round3 = (x: number) => Math.round(x * 1000) / 1000
// 같은 곡·난이도는 늘 같은 채보가 되도록 하는 난수
function rng(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Mode = 'melody' | 'stair' | 'zig' | 'jack'
// 난이도별 설정: chord2/chord3 = [기준(중앙값 배율), 확률], jack = 빠른 구간에서 연타를 고를 가중치
const CFG: Record<string, { chord2: [number, number]; chord3: [number, number]; jack: number; zig: number; holdChord: boolean }> = {
  easy: { chord2: [99, 0], chord3: [99, 0], jack: 0, zig: 0, holdChord: false },
  normal: { chord2: [1.6, 0.3], chord3: [99, 0], jack: 0, zig: 0.14, holdChord: false },
  hard: { chord2: [1.1, 0.78], chord3: [2.0, 0.4], jack: 0.16, zig: 0.27, holdChord: false },
  stella: { chord2: [0.8, 0.92], chord3: [1.3, 0.78], jack: 0.3, zig: 0.3, holdChord: true }
}
const ZIGS: Record<number, number[][]> = {
  4: [[0, 2, 1, 3], [3, 1, 2, 0], [0, 1, 3, 2], [3, 2, 0, 1], [1, 0, 2, 3], [2, 3, 1, 0]],
  6: [[0, 3, 1, 4, 2, 5], [5, 2, 4, 1, 3, 0], [0, 2, 4, 1, 3, 5], [5, 3, 1, 4, 2, 0], [1, 0, 3, 2, 5, 4], [4, 5, 2, 3, 0, 1]]
}

export function layout(hits: Hit[], diff: string, med: number, lanes = 4): Note[] {
  const cfg = CFG[diff] ?? CFG.normal
  const rnd = rng(hits.length * 977 + diff.length * 31 + Math.round((hits[0]?.t ?? 0) * 1000))
  const notes: Note[] = []
  const hist: number[] = [] // 지금까지 놓은 레인(동타는 대표 하나)
  const holds: { lane: number; end: number }[] = []
  let mode: Mode = 'melody', left = 0, dir = 1, zigs = ZIGS[lanes] ?? ZIGS[4], zig = zigs[0], zi = 0

  hits.forEach((h, idx) => {
    for (let i = holds.length - 1; i >= 0; i--) if (holds[i].end <= h.t) holds.splice(i, 1)
    const busy = new Set(holds.map(x => x.lane))
    const free = Array.from({ length: lanes }, (_, i) => i).filter(l => !busy.has(l))
    const gap = idx ? h.t - hits[idx - 1].t : 9
    const last = hist[hist.length - 1]

    if (left <= 0) { // 다음 한 묶음(몇 개 노트)의 모양을 고른다
      const fast = gap < 0.2, r = rnd()
      const wJack = (fast ? cfg.jack : cfg.jack * 0.15) * (h.hl ? 1.6 : 0.4), wZig = cfg.zig, wStair = fast ? 0.4 : 0.3
      const tot = wJack + wZig + wStair + (fast ? 0.1 : 0.5)
      const x = r * tot
      if (x < wJack) { mode = 'jack'; left = 2 + Math.floor(rnd() * 3) }
      else if (x < wJack + wZig) { mode = 'zig'; left = 4 + Math.floor(rnd() * 5); zig = zigs[Math.floor(rnd() * zigs.length)]; zi = 0 }
      else if (x < wJack + wZig + wStair) { mode = 'stair'; left = 4 + Math.floor(rnd() * 4); dir = rnd() < 0.5 ? 1 : -1 }
      else { mode = 'melody'; left = 2 + Math.floor(rnd() * 4) }
    }
    left--

    let lane = h.q
    if (mode === 'stair') { lane = (last ?? h.q) + dir; if (lane < 0 || lane > lanes - 1) { dir = -dir; lane = (last ?? h.q) + dir } }
    else if (mode === 'zig') lane = zig[zi++ % zig.length]
    else if (mode === 'jack' && last !== undefined) lane = last

    const near = (want: number, avoid: number[] = []) => // 비어 있는 레인 중 want에 가장 가까운 것 (동률이면 진행 방향 쪽)
      free.filter(l => !avoid.includes(l)).sort((a, b) => Math.abs(a - want) - Math.abs(b - want) || (b - a) * dir)[0]
    if (!free.includes(lane)) lane = near(lane) ?? free[0] ?? lane
    // 같은 레인이 바로 이어지면(연타 모드 제외) 한 칸 옮긴다
    if (mode !== 'jack' && lane === last && gap > 0.12) lane = near(lane + dir, [lane]) ?? lane
    // 두 레인만 오가는 트릴 금지: 최근 4개가 두 레인뿐이면 그 밖의 레인으로
    const recent = [...hist.slice(-3), lane]
    if (mode !== 'jack' && recent.length === 4 && new Set(recent).size <= 2) lane = near(h.q, [recent[2], recent[3]]) ?? lane

    const note: Note = { time: round3(h.t), lane }
    const placed = [note]
    // 롱노트: 이미 잡고 있는 게 없을 때만. 잡는 동안 같은 레인은 비워 둬서 다른 레인 노트를 칠 수 있다
    let startedHold = false
    if (h.want >= 0.45 && holds.length === 0) {
      const dur = round3(Math.min(h.want, 2.5))
      note.duration = dur; holds.push({ lane, end: h.t + dur + 0.12 }); startedHold = true // 끝난 뒤 0.12초는 같은 레인을 비워 둔다
    }
    // 동타(2개)·3중동타: 센 타격에서. 잡고 있는 레인은 쓰지 못한다
    if (!startedHold || cfg.holdChord) {
      const others = free.filter(l => l !== lane)
      const c2: [number, number] = h.hl ? [cfg.chord2[0] * 0.8, Math.min(1, cfg.chord2[1] * 1.25)] : [cfg.chord2[0] * 1.4, cfg.chord2[1] * 0.5]
      const c3: [number, number] = h.hl ? [cfg.chord3[0] * 0.85, Math.min(1, cfg.chord3[1] * 1.3)] : [99, 0] // 3중동타는 하이라이트에서만
      const hold = holds.length > 0 // 이미 한 손이 묶여 있으면 동타는 2개까지
      if (!hold && others.length >= 2 && h.v > med * c3[0] && rnd() < c3[1]) {
        // 세 개: 한 덩어리로만 붙지 않게 두 번째는 멀리 둔다
        const far = others.filter(l => Math.abs(l - lane) >= 2)
        const a = (far.length ? far : others)[Math.floor(rnd() * (far.length ? far.length : others.length))]
        const b = others.filter(l => l !== a)[Math.floor(rnd() * (others.length - 1))]
        placed.push({ time: note.time, lane: a }, { time: note.time, lane: b })
      } else if (others.length >= 1 && h.v > med * c2[0] && rnd() < c2[1] && !(startedHold && h.want < 0.8)) {
        const wide = others.filter(l => Math.abs(l - lane) >= 2), adj = others.filter(l => Math.abs(l - lane) === 1)
        const pool = rnd() < 0.5 && wide.length ? wide : adj.length ? adj : others
        placed.push({ time: note.time, lane: pool[Math.floor(rnd() * pool.length)] })
      }
    }
    notes.push(...placed)
    hist.push(lane)
  })
  return notes
}
