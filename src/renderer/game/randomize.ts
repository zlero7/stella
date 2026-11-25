import type { Note } from '../../shared/types'

// 랜덤 변형: 1 RANDOM(레인 전체를 섞음) · 2 HALF RANDOM(왼쪽 절반과 오른쪽 절반 안에서만 섞음) · 3 MAX RANDOM(노트마다 무작위 레인)
// MAX는 한 레인의 롱노트가 끝나기 전에 다른 노트가 그 레인에 오지 않게 비어 있는 레인에서만 고른다 (cleanChart의 겹침 규칙과 같은 0.05초 간격)
const range = (n: number, from = 0) => Array.from({ length: n }, (_, i) => i + from)
export function randomize(notes: Note[], lanes: number, mode: number, rnd: () => number = Math.random): Note[] {
  const shuffle = (a: number[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
  if (mode === 1 || mode === 2) {
    const half = lanes >> 1, perm = mode === 1 ? shuffle(range(lanes)) : [...shuffle(range(half)), ...shuffle(range(lanes - half, half))]
    return notes.map(n => ({ ...n, lane: perm[n.lane] }))
  }
  if (mode !== 3) return notes
  const sorted = [...notes].sort((a, b) => a.time - b.time || a.lane - b.lane), busy = new Array<number>(lanes).fill(-1), out: Note[] = [] // busy: 그 레인 롱노트가 끝나는 시각
  for (let i = 0; i < sorted.length;) {
    let j = i; while (j < sorted.length && sorted[j].time - sorted[i].time < 0.001) j++ // 같은 시각의 동타는 서로 다른 레인으로
    const free = shuffle(range(lanes).filter(l => busy[l] < sorted[i].time - 0.05))
    for (let k = i; k < j; k++) { const lane = free.pop() ?? sorted[k].lane; out.push({ ...sorted[k], lane }); busy[lane] = sorted[k].time + (sorted[k].duration ?? 0) }
    i = j
  }
  return out
}
