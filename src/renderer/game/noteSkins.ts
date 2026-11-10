// 노트 스킨: 디맥의 노트 스킨처럼 같은 노트를 여러 모양으로 그린다. 그림은 92x44 칸에 그린다 (기본 스킨은 x 11~81, y 15~29의 막대, 나머지는 모양이 자유롭다). 풀어 주는 조건은 내 프로필 기록으로 앱이 직접 판단한다
import type { Profile } from '../data/Profile'
import { lighten, starPath } from '../render/theme'

type Ctx = CanvasRenderingContext2D
export interface NoteSkin { id: string; name: string; need: string; ok: (p: Profile) => boolean; draw: (x: Ctx, outer: boolean, c: string) => void }

// 노트마다 모양이 자유롭다 (기본만 얇은 막대). 세로 중심은 y=22 (판정이 이 높이에 닿는다), 가로는 x 11~81 안
const mix = (a: string, b: string, t: number) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('')
// 색 세트: 바깥 레인은 모양 고유의 색, 안쪽 레인은 은백색
const pal = (o: boolean, nat: string) => ({ col: o ? nat : '#f4f8ff', hi: o ? lighten(nat, 0.6) : '#ffffff', lo: o ? mix(nat, '#000000', 0.4) : '#8aa2c4' })
const vg = (x: Ctx, y0: number, y1: number, ...s: string[]) => { const g = x.createLinearGradient(0, y0, 0, y1); s.forEach((c, i) => g.addColorStop(i / (s.length - 1), c)); return g }
const outline = (x: Ctx, lo: string, glow: string) => { x.shadowColor = glow; x.shadowBlur = 7; x.strokeStyle = lo; x.lineWidth = 1.6; x.lineJoin = 'round' }
const blossom = (x: Ctx, cx: number, cy: number, r: number, p: ReturnType<typeof pal>) => {
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; x.save(); x.translate(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55); x.rotate(a); x.beginPath(); x.ellipse(0, 0, r * 0.52, r * 0.4, 0, 0, 7); x.fillStyle = p.col; x.fill(); x.stroke(); x.restore() }
  x.fillStyle = '#ffd04a'; x.beginPath(); x.arc(cx, cy, r * 0.26, 0, 7); x.fill()
}
const heartPath = (x: Ctx, cx: number, cy: number, s: number) => { x.beginPath(); x.moveTo(cx, cy + s); x.bezierCurveTo(cx - s * 1.7, cy - s * 0.1, cx - s * 0.8, cy - s * 1.35, cx, cy - s * 0.45); x.bezierCurveTo(cx + s * 0.8, cy - s * 1.35, cx + s * 1.7, cy - s * 0.1, cx, cy + s) }
const INVADER = ['..#.....#..', '...#...#...', '..#######..', '.##.###.##.', '###########', '#.#######.#', '#.#.....#.#', '...##.##...']

export const NOTE_SKINS: NoteSkin[] = [
  { id: 'basic', name: '기본', need: '처음부터', ok: () => true, draw(x, o, c) {
    x.shadowColor = o ? lighten(c, 0.3) : '#ffffff'; x.shadowBlur = 10
    x.fillStyle = vg(x, 15, 29, o ? lighten(c, 0.7) : '#ffffff', o ? c : '#b7d3ff'); x.fillRect(11, 15, 70, 14)
    x.shadowBlur = 0; x.fillStyle = 'rgba(255,255,255,.95)'; x.fillRect(11, 15, 70, 2)
    x.strokeStyle = o ? '#ffffff' : 'rgba(80,140,230,.95)'; x.lineWidth = 1.5; x.strokeRect(11.5, 15.5, 69, 13)
  } },
  { id: 'flower', name: '벚꽃', need: '플레이 5번', ok: p => p.plays >= 5, draw(x, o) {
    const p = pal(o, '#ff9ec4'); outline(x, p.lo, '#ff9ec4'); blossom(x, 22, 24, 11, p); blossom(x, 70, 21, 10, p); blossom(x, 46, 20, 17, p); x.shadowBlur = 0
  } },
  { id: 'leaf', name: '나뭇잎', need: '레벨 3', ok: p => p.level >= 3, draw(x, o) {
    const p = pal(o, '#4cc46a'); outline(x, p.lo, '#4cc46a')
    x.beginPath(); x.moveTo(12, 28); x.bezierCurveTo(22, 4, 58, 3, 80, 17); x.bezierCurveTo(66, 36, 30, 40, 12, 28); x.closePath()
    x.fillStyle = vg(x, 6, 38, p.hi, p.col); x.fill(); x.stroke(); x.shadowBlur = 0
    x.strokeStyle = p.lo; x.lineWidth = 1.5; x.beginPath(); x.moveTo(13, 28); x.quadraticCurveTo(46, 18, 76, 18); x.stroke()
    x.beginPath(); for (const px of [30, 44, 58]) { x.moveTo(px, 21); x.lineTo(px + 5, 12); x.moveTo(px, 22); x.lineTo(px + 4, 31) } x.stroke()
  } },
  { id: 'claw', name: '발톱', need: '풀 콤보 3번', ok: p => p.fcs >= 3, draw(x, o) {
    const p = pal(o, '#ff3b52'); outline(x, p.lo, '#ff3b52')
    for (const [dx, dy, s] of [[0, 0, 1], [6, 5, 0.8], [-4, 8, 0.6]] as const) {
      x.beginPath(); x.moveTo(12 + dx, 30 + dy * 0.2); x.quadraticCurveTo(46 + dx, -8 + dy, 82 + dx * 0.4, 28 + dy * 0.2); x.quadraticCurveTo(46 + dx, 12 + dy, 12 + dx, 30 + dy * 0.2)
      x.globalAlpha = s; x.fillStyle = vg(x, 4, 32, p.hi, p.col); x.fill(); x.globalAlpha = 1; if (s === 1) x.stroke()
    }
    x.shadowBlur = 0
  } },
  { id: 'bubbles', name: '거품', need: '레벨 6', ok: p => p.level >= 6, draw(x, o) {
    const p = pal(o, '#4fd0e0'); outline(x, p.lo, '#4fd0e0')
    for (const [cx, cy, r] of [[22, 25, 9], [44, 18, 13], [63, 27, 10], [75, 15, 6]] as const) {
      x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fillStyle = vg(x, cy - r, cy + r, p.hi, p.col); x.fill(); x.stroke()
      x.shadowBlur = 0; x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.arc(cx - r * 0.35, cy - r * 0.35, r * 0.26, 0, 7); x.fill(); x.shadowBlur = 7
    }
    x.shadowBlur = 0
  } },
  { id: 'bolt', name: '번개', need: '플레이 30번', ok: p => p.plays >= 30, draw(x, o) {
    const p = pal(o, '#ffd43a'); outline(x, p.lo, '#ffd43a')
    x.beginPath(); x.moveTo(30, 4); x.lineTo(58, 4); x.lineTo(46, 17); x.lineTo(68, 17); x.lineTo(34, 40); x.lineTo(42, 24); x.lineTo(24, 24); x.closePath()
    x.fillStyle = vg(x, 4, 40, p.hi, p.col); x.fill(); x.stroke(); x.shadowBlur = 0
    x.strokeStyle = p.col; x.lineWidth = 2; x.beginPath(); x.moveTo(12, 14); x.lineTo(22, 18); x.moveTo(14, 28); x.lineTo(24, 26); x.moveTo(78, 12); x.lineTo(68, 20); x.moveTo(76, 30); x.lineTo(66, 27); x.stroke()
  } },
  { id: 'snow', name: '눈꽃', need: '올 퍼펙트 1번', ok: p => p.aps >= 1, draw(x, o) {
    const p = pal(o, '#8fd8ff'); x.shadowColor = '#8fd8ff'; x.shadowBlur = 7; x.strokeStyle = o ? p.col : '#cfe6ff'; x.lineWidth = 3; x.lineCap = 'round'
    x.save(); x.translate(46, 22)
    for (let i = 0; i < 6; i++) { x.rotate(Math.PI / 3); x.beginPath(); x.moveTo(0, 0); x.lineTo(19, 0); x.moveTo(11, 0); x.lineTo(16, -5); x.moveTo(11, 0); x.lineTo(16, 5); x.stroke() }
    x.restore(); x.fillStyle = p.hi; for (const px of [20, 72]) { x.beginPath(); x.arc(px, 22, 4, 0, 7); x.fill() } x.beginPath(); x.arc(46, 22, 4.5, 0, 7); x.fill(); x.lineCap = 'butt'; x.shadowBlur = 0
  } },
  { id: 'sun', name: '태양', need: '대결 3승', ok: p => p.wins >= 3, draw(x, o) {
    const p = pal(o, '#ffb13b'); x.shadowColor = '#ffb13b'; x.shadowBlur = 9
    x.fillStyle = p.col; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; x.beginPath(); x.moveTo(46 + Math.cos(a - 0.14) * 13, 22 + Math.sin(a - 0.14) * 13); x.lineTo(46 + Math.cos(a) * 20, 22 + Math.sin(a) * 20); x.lineTo(46 + Math.cos(a + 0.14) * 13, 22 + Math.sin(a + 0.14) * 13); x.fill() }
    x.beginPath(); x.arc(46, 22, 12, 0, 7); x.fillStyle = vg(x, 10, 34, p.hi, p.col); x.fill(); x.strokeStyle = p.lo; x.lineWidth = 1.5; x.stroke(); x.shadowBlur = 0
    x.fillStyle = p.col; for (const d of [-1, 1]) { x.beginPath(); x.moveTo(46 + d * 26, 22); x.lineTo(46 + d * 36, 18); x.lineTo(46 + d * 36, 26); x.fill(); x.beginPath(); x.moveTo(46 + d * 40, 22); x.lineTo(46 + d * 35, 22 + 0.1); x.stroke() }
  } },
  { id: 'invader', name: '인베이더', need: '레벨 10', ok: p => p.level >= 10, draw(x, o) {
    const p = pal(o, '#7dff7a'); x.shadowColor = '#7dff7a'; x.shadowBlur = 6; x.fillStyle = p.col
    INVADER.forEach((row, ry) => [...row].forEach((ch, rx) => { if (ch === '#') x.fillRect(24 + rx * 4, 6 + ry * 4, 4, 4) })); x.shadowBlur = 0
    x.fillStyle = p.lo; x.fillRect(32, 14, 4, 4); x.fillRect(56, 14, 4, 4)
  } },
  { id: 'crown', name: '왕관', need: '레벨 20', ok: p => p.level >= 20, draw(x) {
    x.shadowColor = '#ffcf4a'; x.shadowBlur = 9
    x.beginPath(); x.moveTo(14, 36); x.lineTo(11, 12); x.lineTo(30, 24); x.lineTo(46, 6); x.lineTo(62, 24); x.lineTo(81, 12); x.lineTo(78, 36); x.closePath()
    x.fillStyle = vg(x, 6, 36, '#fff2b0', '#e0a800', '#8a5a00'); x.fill(); x.strokeStyle = '#fff4c8'; x.lineWidth = 1.6; x.lineJoin = 'round'; x.stroke(); x.shadowBlur = 0
    x.fillStyle = 'rgba(120,70,0,.5)'; x.fillRect(14, 30, 64, 3)
    for (const [cx, cy, col] of [[11, 11, '#ff3d5a'], [46, 5, '#5ac8ff'], [81, 11, '#ff3d5a'], [46, 24, '#ff3d5a']] as const) { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, 3.2, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.arc(cx - 1, cy - 1, 1, 0, 7); x.fill() }
  } },
  { id: 'heart', name: '하트', need: '레벨 15', ok: p => p.level >= 15, draw(x, o) {
    const p = pal(o, '#ff5f9a'); outline(x, p.lo, '#ff2f78'); x.lineWidth = 2
    for (const [cx, cy, s] of [[19, 26, 6], [73, 18, 6], [46, 21, 14]] as const) { heartPath(x, cx, cy, s); x.fillStyle = vg(x, cy - s, cy + s, p.hi, p.col); x.fill(); x.stroke() }
    x.shadowBlur = 0
  } },
  { id: 'paw', name: '고양이 발바닥', need: '풀 콤보 25번', ok: p => p.fcs >= 25, draw(x, o) {
    const p = pal(o, '#ff8fb0'); outline(x, p.lo, '#ff8fb0')
    for (const [cx, cy, rx, ry, rot] of [[46, 29, 16, 10, 0], [26, 17, 5.5, 8, -0.5], [38, 9, 5.5, 8, -0.15], [54, 9, 5.5, 8, 0.15], [66, 17, 5.5, 8, 0.5]] as const) {
      x.beginPath(); x.ellipse(cx, cy, rx, ry, rot, 0, 7); x.fillStyle = vg(x, cy - ry, cy + ry, p.hi, p.col); x.fill(); x.stroke()
    }
    x.shadowBlur = 0
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
