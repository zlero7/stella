// 노트 스킨: 디맥의 노트 스킨처럼 같은 노트를 여러 모양으로 그린다. 그림은 92x44 칸에 그린다 (기본 스킨은 x 11~81, y 15~29의 막대, 나머지는 모양이 자유롭다). 풀어 주는 조건은 내 프로필 기록으로 앱이 직접 판단한다
import type { Profile } from '../data/Profile'
import { lighten, starPath } from '../render/theme'

type Ctx = CanvasRenderingContext2D
export interface NoteSkin { id: string; name: string; need: string; ok: (p: Profile) => boolean; draw: (x: Ctx, outer: boolean, c: string) => void }

// 노트마다 모양이 완전히 다르다 (기본만 얇은 막대). 세로 중심은 y=22 (판정이 이 높이에 닿는다), 가로는 x 11~81 안
const mix = (a: string, b: string, t: number) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('')
// 색 세트: 바깥 레인은 고른 색, 안쪽 레인은 은백색
const pal = (o: boolean, c: string) => ({ hi: o ? lighten(c, 0.65) : '#ffffff', mid: o ? c : '#b7cde8', lo: o ? mix(c, '#000000', 0.45) : '#6f86a6', edge: o ? '#ffffff' : '#eef5ff' })
const poly = (x: Ctx, pts: number[][]) => { x.beginPath(); pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.closePath() }
const vg = (x: Ctx, y0: number, y1: number, ...s: string[]) => { const g = x.createLinearGradient(0, y0, 0, y1); s.forEach((c, i) => g.addColorStop(i / (s.length - 1), c)); return g }
const hg = (x: Ctx, ...s: string[]) => { const g = x.createLinearGradient(11, 0, 81, 0); s.forEach((c, i) => g.addColorStop(i / (s.length - 1), c)); return g }

export const NOTE_SKINS: NoteSkin[] = [
  { id: 'basic', name: '기본', need: '처음부터', ok: () => true, draw(x, o, c) {
    x.shadowColor = o ? lighten(c, 0.3) : '#ffffff'; x.shadowBlur = 10
    x.fillStyle = vg(x, 15, 29, o ? lighten(c, 0.7) : '#ffffff', o ? c : '#b7d3ff'); x.fillRect(11, 15, 70, 14)
    x.shadowBlur = 0; x.fillStyle = 'rgba(255,255,255,.95)'; x.fillRect(11, 15, 70, 2)
    x.strokeStyle = o ? '#ffffff' : 'rgba(80,140,230,.95)'; x.lineWidth = 1.5; x.strokeRect(11.5, 15.5, 69, 13)
  } },
  { id: 'neon', name: '네온 프레임', need: '플레이 5번', ok: p => p.plays >= 5, draw(x, o, c) {
    const k = pal(o, c); x.fillStyle = '#0a1022'; x.beginPath(); x.roundRect(11, 9, 70, 26, 9); x.fill()
    x.shadowColor = k.hi; x.shadowBlur = 10; x.strokeStyle = k.hi; x.lineWidth = 2.5; x.beginPath(); x.roundRect(12, 10, 68, 24, 8); x.stroke()
    x.fillStyle = k.hi; poly(x, [[46, 15], [53, 22], [46, 29], [39, 22]]); x.fill(); x.shadowBlur = 0
    x.fillRect(19, 21, 14, 2); x.fillRect(59, 21, 14, 2)
  } },
  { id: 'jelly', name: '젤리', need: '레벨 3', ok: p => p.level >= 3, draw(x, o, c) {
    const k = pal(o, c); x.shadowColor = k.mid; x.shadowBlur = 8
    x.fillStyle = vg(x, 9, 35, k.hi, k.mid, k.lo); x.beginPath(); x.roundRect(11, 9, 70, 26, 13); x.fill(); x.shadowBlur = 0
    x.fillStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.roundRect(19, 11.5, 54, 7, 3.5); x.fill()
    x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(70, 28, 2.5, 0, 7); x.fill()
  } },
  { id: 'crystal', name: '크리스탈', need: '레벨 6', ok: p => p.level >= 6, draw(x, o, c) {
    const k = pal(o, c), pts = [[11, 22], [27, 9], [65, 9], [81, 22], [65, 35], [27, 35]]
    x.shadowColor = k.mid; x.shadowBlur = 8; poly(x, pts); x.fillStyle = vg(x, 9, 35, k.hi, k.mid); x.fill(); x.shadowBlur = 0
    poly(x, [[11, 22], [27, 35], [65, 35], [81, 22], [46, 22]]); x.fillStyle = k.lo; x.globalAlpha = 0.55; x.fill(); x.globalAlpha = 1
    x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(27, 9); x.lineTo(46, 22); x.lineTo(65, 9); x.moveTo(46, 22); x.lineTo(46, 35); x.stroke()
    poly(x, pts); x.strokeStyle = k.edge; x.lineWidth = 1.8; x.stroke()
  } },
  { id: 'stripe', name: '주의 테이프', need: '플레이 30번', ok: p => p.plays >= 30, draw(x, o, c) {
    const k = pal(o, c), pts = [[20, 10], [81, 10], [72, 34], [11, 34]]
    x.save(); poly(x, pts); x.clip(); x.fillStyle = k.mid; x.fillRect(0, 0, 92, 44); x.fillStyle = o ? '#10162a' : '#2a3550'
    for (let px = -10; px < 92; px += 16) poly(x, [[px, 44], [px + 8, 44], [px + 28, 0], [px + 20, 0]]), x.fill()
    x.restore(); poly(x, pts); x.strokeStyle = k.edge; x.lineWidth = 2; x.stroke()
  } },
  { id: 'heart', name: '하트', need: '풀 콤보 3번', ok: p => p.fcs >= 3, draw(x, o, c) {
    x.fillStyle = vg(x, 16, 28, o ? '#ffd0e6' : '#ffffff', o ? '#ff6fa8' : '#f5b8d4'); x.beginPath(); x.roundRect(11, 16, 70, 12, 6); x.fill()
    x.strokeStyle = '#ffffff'; x.lineWidth = 1.5; x.beginPath(); x.roundRect(11.5, 16.5, 69, 11, 5.5); x.stroke()
    x.shadowColor = '#ff2f78'; x.shadowBlur = 9; x.fillStyle = '#ff2f78'; x.strokeStyle = '#ffffff'; x.lineWidth = 2.2
    x.beginPath(); x.moveTo(46, 33); x.bezierCurveTo(30, 24, 36, 8, 46, 15); x.bezierCurveTo(56, 8, 62, 24, 46, 33); x.fill(); x.stroke(); x.shadowBlur = 0; void c
  } },
  { id: 'star', name: '별똥별', need: '올 퍼펙트 1번', ok: p => p.aps >= 1, draw(x, o, c) {
    const k = pal(o, c); x.fillStyle = '#16224d'; x.beginPath(); x.roundRect(11, 17, 70, 10, 5); x.fill()
    x.strokeStyle = k.hi; x.lineWidth = 1.5; x.beginPath(); x.roundRect(11.5, 17.5, 69, 9, 4.5); x.stroke()
    x.fillStyle = k.hi; x.fillRect(16, 21, 18, 2); x.fillRect(58, 21, 18, 2)
    x.shadowColor = '#ffb13b'; x.shadowBlur = 10; starPath(x, 46, 22, 19); x.fillStyle = vg(x, 4, 40, '#fff6c2', '#ffd04a', '#e09a1a'); x.fill(); x.shadowBlur = 0
  } },
  { id: 'emblem', name: '방패', need: '대결 3승', ok: p => p.wins >= 3, draw(x, o, c) {
    const k = pal(o, c), pts = [[11, 10], [81, 10], [81, 23], [46, 36], [11, 23]]
    x.shadowColor = k.mid; x.shadowBlur = 7; poly(x, pts); x.fillStyle = vg(x, 10, 36, k.hi, k.mid); x.fill(); x.shadowBlur = 0
    poly(x, pts); x.strokeStyle = k.edge; x.lineWidth = 2; x.stroke()
    x.strokeStyle = k.lo; x.lineWidth = 2.6; x.lineJoin = 'miter'
    for (const px of [30, 46, 62]) { x.beginPath(); x.moveTo(px - 4, 14); x.lineTo(px + 3, 19); x.lineTo(px - 4, 24); x.stroke() }
  } },
  { id: 'retro', name: '8비트 블록', need: '레벨 10', ok: p => p.level >= 10, draw(x, o, c) {
    const k = pal(o, c); x.fillStyle = k.mid; x.fillRect(17, 10, 58, 24); x.fillRect(14, 13, 64, 18); x.fillRect(11, 17, 70, 10)
    x.fillStyle = k.lo; x.fillRect(17, 30, 58, 4); x.fillRect(14, 28, 64, 3); x.fillRect(11, 24, 70, 3)
    x.fillStyle = k.hi; x.fillRect(17, 10, 58, 4); x.fillRect(14, 13, 64, 2); x.fillRect(11, 17, 70, 2)
    x.fillStyle = 'rgba(0,0,0,.45)'; for (let px = 22; px < 70; px += 10) x.fillRect(px, 20, 5, 5)
  } },
  { id: 'holo', name: '홀로그램 다이아', need: '레벨 15', ok: p => p.level >= 15, draw(x) {
    const pts = [[11, 22], [30, 9], [62, 9], [81, 22], [62, 35], [30, 35]]
    x.shadowColor = '#c7a6ff'; x.shadowBlur = 10; poly(x, pts); x.fillStyle = hg(x, '#ff7ad9', '#7ad9ff', '#a0ffb0', '#ffe27a', '#ff7ad9'); x.fill(); x.shadowBlur = 0
    poly(x, [[30, 9], [62, 9], [81, 22], [11, 22]]); x.fillStyle = 'rgba(255,255,255,.35)'; x.fill()
    poly(x, pts); x.strokeStyle = '#ffffff'; x.lineWidth = 2; x.stroke()
  } },
  { id: 'gold', name: '골드 보석', need: '레벨 20', ok: p => p.level >= 20, draw(x) {
    const pts = [[11, 22], [24, 11], [68, 11], [81, 22], [68, 33], [24, 33]]
    x.shadowColor = '#ffcf4a'; x.shadowBlur = 10; poly(x, pts); x.fillStyle = vg(x, 11, 33, '#fff2b0', '#e0a800', '#8a5a00'); x.fill(); x.shadowBlur = 0
    poly(x, pts); x.strokeStyle = '#fff4c8'; x.lineWidth = 1.8; x.stroke()
    x.strokeStyle = 'rgba(255,240,180,.8)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(27, 22); x.lineTo(34, 22); x.moveTo(58, 22); x.lineTo(65, 22); x.stroke()
    x.shadowColor = '#ff3d5a'; x.shadowBlur = 8; x.fillStyle = vg(x, 15, 29, '#ff8a9a', '#d4102f'); x.beginPath(); x.arc(46, 22, 7, 0, 7); x.fill(); x.shadowBlur = 0
    x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.arc(43.5, 19.5, 2, 0, 7); x.fill()
  } },
  { id: 'carbon', name: '카본 블레이드', need: '풀 콤보 25번', ok: p => p.fcs >= 25, draw(x, o, c) {
    const k = pal(o, c), pts = [[11, 17], [19, 10], [73, 10], [81, 17], [81, 27], [73, 34], [19, 34], [11, 27]], edge = o ? lighten(c, 0.1) : '#ff3d5a'
    poly(x, pts); x.fillStyle = '#14161b'; x.fill(); x.save(); poly(x, pts); x.clip(); x.fillStyle = 'rgba(255,255,255,.07)'
    for (let px = 11; px < 81; px += 4) for (let py = 10; py < 34; py += 4) if (((px - 11 + py - 10) / 4) % 2 === 0) x.fillRect(px, py, 4, 4)
    x.fillStyle = edge; x.fillRect(11, 10, 70, 3); x.fillRect(11, 31, 70, 3); x.restore()
    x.shadowColor = edge; x.shadowBlur = 8; poly(x, [[30, 22], [38, 17], [54, 17], [62, 22], [54, 27], [38, 27]]); x.fillStyle = k.hi; x.fill(); x.shadowBlur = 0
    poly(x, pts); x.strokeStyle = edge; x.lineWidth = 1.5; x.stroke()
  } }
]

// 지금 쓸 스킨: 고른 번호가 아직 안 풀렸으면 기본으로 (프로필이 없으면 기본만 쓴다)
export const skinOf = (i: number, p: Profile | undefined) => { const s = NOTE_SKINS[i] ?? NOTE_SKINS[0]; return p && s.ok(p) || s === NOTE_SKINS[0] ? s : NOTE_SKINS[0] }

// 스킨 그림 한 장: 화면에 찍히는 크기(scale)로 만들어 둔다 (확대해 찍으면 큰 화면에서 가장자리가 계단져 보인다)
const cache: Record<string, HTMLCanvasElement> = {}
export function skinSprite(s: NoteSkin, outer: boolean, color: string, scale: number) {
  const k = Math.max(1, Math.round(scale * 4) / 4), key = `${s.id}|${outer ? color : 'i'}|${k}`
  let c = cache[key]
  if (!c) {
    c = cache[key] = document.createElement('canvas'); c.width = Math.ceil(92 * k); c.height = Math.ceil(44 * k)
    const x = c.getContext('2d')!; x.scale(c.width / 92, c.height / 44); s.draw(x, outer, color)
  }
  return c
}
