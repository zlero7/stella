import type { Note } from '../../shared/types'

const round3 = (x: number) => Math.round(x * 1000) / 1000

// 채보를 검사하고 고친다 (편집기 저장, 플레이 로드에서 쓴다).
// 지우는 것: 시각·레인이 잘못된 노트, 같은 레인 같은 시각의 중복. 고치는 것: 길이가 0 이하인 롱노트(짧은 노트로), 같은 레인 다음 노트와 겹치는 롱노트(앞에서 잘라냄)
export function cleanChart(notes: Note[], lanes = 4): { notes: Note[]; fixed: string[] } {
  const fixed: string[] = []
  const valid = notes.filter(n => Number.isFinite(n.time) && n.time >= 0 && Number.isInteger(n.lane) && n.lane >= 0 && n.lane < lanes)
  if (valid.length < notes.length) fixed.push(`잘못된 노트 ${notes.length - valid.length}개 삭제`)
  const sorted = valid.map(n => ({ ...n })).sort((a, b) => a.time - b.time || a.lane - b.lane)
  const res: Note[] = [], last = new Map<number, Note>()
  let dup = 0, flat = 0, cut = 0
  for (const n of sorted) {
    if (n.duration !== undefined && !(n.duration > 0)) { delete n.duration; flat++ }
    const p = last.get(n.lane)
    if (p) {
      if (n.time - p.time < 0.001) { dup++; if ((n.duration ?? 0) > (p.duration ?? 0)) p.duration = n.duration; continue }
      if (p.duration && p.time + p.duration > n.time - 0.05) { // 롱노트가 같은 레인의 다음 노트를 덮는다
        const d = n.time - 0.05 - p.time
        if (d >= 0.1) p.duration = round3(d); else delete p.duration
        cut++
      }
    }
    last.set(n.lane, n); res.push(n)
  }
  if (dup) fixed.push(`겹친 노트 ${dup}개 삭제`)
  if (flat) fixed.push(`길이 없는 롱노트 ${flat}개를 일반 노트로`)
  if (cut) fixed.push(`다음 노트와 겹친 롱노트 ${cut}개를 줄임`)
  return { notes: res, fixed }
}

// 변속 표: 노트의 화면 위치는 "속도를 시간에 대해 쌓은 거리"로 정한다 (판정은 시간 그대로라 변속해도 안 흔들린다). 배율은 0.25~4로 제한
export type SpeedTable = { t: number; pos: number; m: number }[]
export function speedTable(speeds: { time: number; mult: number }[] = []): SpeedTable {
  const tbl: SpeedTable = [{ t: 0, pos: 0, m: 1 }]
  for (const e of [...speeds].sort((a, b) => a.time - b.time)) {
    const l = tbl[tbl.length - 1]
    if (e.time > l.t) tbl.push({ t: e.time, pos: l.pos + (e.time - l.t) * l.m, m: Math.min(Math.max(e.mult, 0.25), 4) })
  }
  return tbl
}
export function posAt(tbl: SpeedTable, time: number) {
  let i = tbl.length - 1
  while (i > 0 && tbl[i].t > time) i--
  return tbl[i].pos + (time - tbl[i].t) * tbl[i].m
}

// 하이라이트 구간 목록을 시작순으로 정렬하고 겹치거나 맞닿은 구간은 하나로 합친다
export function mergeSpans(spans: [number, number][]): [number, number][] {
  const out: [number, number][] = []
  for (const [a, b] of [...spans].sort((x, y) => x[0] - y[0])) {
    const l = out[out.length - 1]
    if (l && a <= l[1]) l[1] = Math.max(l[1], b); else out.push([a, b])
  }
  return out
}
