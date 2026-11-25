// 노트 모양: 노트 스킨(기어 스킨, render/gear.ts)마다 노트 모양이 하나씩 정해져 있다. 그림은 92x44 칸에 그린다
// 세로 중심은 y=22 (판정이 이 높이에 닿는다), 가로는 x 11~81 안. 기본(steel)만 얇은 막대이고 나머지는 모양이 자유롭다
import { lighten } from '../render/theme'
import { NOTES12 } from './noteShapes'

type Ctx = CanvasRenderingContext2D
type Draw = (x: Ctx, outer: boolean, c: string) => void

const mix = (a: string, b: string, t: number) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('')
// 색 세트: 바깥 레인은 모양 고유의 색, 안쪽 레인은 은백색
const pal = (o: boolean, nat: string) => ({ col: o ? nat : '#f4f8ff', hi: o ? lighten(nat, 0.6) : '#ffffff', lo: o ? mix(nat, '#000000', 0.4) : '#8aa2c4' })
const vg = (x: Ctx, y0: number, y1: number, ...s: string[]) => { const g = x.createLinearGradient(0, y0, 0, y1); s.forEach((c, i) => g.addColorStop(i / (s.length - 1), c)); return g }
const outline = (x: Ctx, lo: string, glow: string) => { x.shadowColor = glow; x.shadowBlur = 7; x.strokeStyle = lo; x.lineWidth = 1.6; x.lineJoin = 'round' }
export const NOTE_SHAPES: Record<string, Draw> = {
  ...NOTES12,
  cosmos(x, o) { // 가로로 길게 꼬리를 끄는 네 갈래 별
    const p = pal(o, '#9fe8ff'); x.shadowColor = '#9fe8ff'; x.shadowBlur = 9
    x.beginPath(); x.moveTo(8, 22); x.quadraticCurveTo(38, 19.5, 46, 3); x.quadraticCurveTo(54, 19.5, 84, 22); x.quadraticCurveTo(54, 24.5, 46, 41); x.quadraticCurveTo(38, 24.5, 8, 22); x.closePath()
    x.fillStyle = vg(x, 3, 41, p.hi, p.col, p.lo); x.fill(); x.strokeStyle = p.lo; x.lineWidth = 1.2; x.stroke(); x.shadowBlur = 0
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(46, 22, 5.5, 0, 7); x.fill(); x.fillStyle = p.col; x.beginPath(); x.arc(46, 22, 2.6, 0, 7); x.fill()
    x.fillStyle = p.hi; for (const px of [21, 71]) { x.beginPath(); x.arc(px, 22, 1.7, 0, 7); x.fill() }
  },
  clockwork(x, o) { // 굴대에 낀 황동 톱니
    const p = pal(o, '#ffc46a'); x.fillStyle = vg(x, 18, 26, p.hi, p.lo); x.fillRect(11, 19, 70, 6); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(11, 24, 70, 1.5)
    x.shadowColor = p.col; x.shadowBlur = 7; x.beginPath()
    const T = 10, R = 20, Ri = 15.6
    for (let i = 0; i < T; i++) { const a = (i / T) * Math.PI * 2, s = Math.PI / T; for (const [u, r] of [[-0.9, Ri], [-0.45, R], [0.45, R], [0.9, Ri]] as const) { const px = 46 + Math.cos(a + u * s) * r, py = 22 + Math.sin(a + u * s) * r; (i === 0 && u === -0.9) ? x.moveTo(px, py) : x.lineTo(px, py) } }
    x.closePath(); x.fillStyle = vg(x, 2, 42, p.hi, p.col, p.lo); x.fill(); x.strokeStyle = p.lo; x.lineWidth = 1.5; x.stroke(); x.shadowBlur = 0
    x.fillStyle = '#1a0e06'; x.beginPath(); x.arc(46, 22, 7, 0, 7); x.fill(); x.fillStyle = p.hi; x.beginPath(); x.arc(46, 22, 3, 0, 7); x.fill()
  },
  candy(x, o) { // 양끝을 꼬아 묶은 사탕
    const p = pal(o, '#ff8ad8'); x.shadowColor = p.col; x.shadowBlur = 7
    for (const d of [-1, 1]) { x.beginPath(); x.moveTo(46 + d * 17, 22); x.lineTo(46 + d * 34, 8); x.lineTo(46 + d * 30, 22); x.lineTo(46 + d * 34, 36); x.closePath(); x.fillStyle = o ? '#ffd45e' : '#dfe8f7'; x.fill(); x.strokeStyle = p.lo; x.lineWidth = 1.2; x.stroke() }
    x.shadowBlur = 0; x.save(); x.beginPath(); x.ellipse(46, 22, 20, 14, 0, 0, 7); x.clip(); x.fillStyle = vg(x, 8, 36, p.hi, p.col, p.lo); x.fillRect(20, 6, 52, 32)
    x.strokeStyle = o ? 'rgba(255,255,255,.75)' : 'rgba(120,150,200,.55)'; x.lineWidth = 4; for (let k = -2; k < 5; k++) { x.beginPath(); x.moveTo(26 + k * 11, 40); x.lineTo(38 + k * 11, 4); x.stroke() }
    x.restore(); x.strokeStyle = p.lo; x.lineWidth = 1.6; x.beginPath(); x.ellipse(46, 22, 20, 14, 0, 0, 7); x.stroke()
    x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.ellipse(38, 14, 6, 2.6, -0.4, 0, 7); x.fill()
  },
  dancheong(x, o) { // 태극 문양에 구름 날개
    const R = 17, red = o ? '#e8453c' : '#f4f8ff', blue = o ? '#2f68c8' : '#8aa2c4'; x.shadowColor = o ? '#ffcf5a' : '#ffffff'; x.shadowBlur = 8
    for (const d of [-1, 1]) { x.strokeStyle = o ? '#ffcf5a' : '#cfd8e8'; x.lineWidth = 2.4; x.lineCap = 'round'; x.beginPath(); x.moveTo(46 + d * 22, 24); x.bezierCurveTo(46 + d * 28, 10, 46 + d * 38, 14, 46 + d * 34, 22); x.bezierCurveTo(46 + d * 40, 20, 46 + d * 44, 30, 46 + d * 34, 32); x.stroke(); x.lineCap = 'butt' }
    x.shadowBlur = 0; x.beginPath(); x.arc(46, 22, R, 0, 7); x.fillStyle = blue; x.fill()
    x.beginPath(); x.arc(46, 22, R, Math.PI, 0); x.arc(46 + R / 2, 22, R / 2, 0, Math.PI, true); x.arc(46 - R / 2, 22, R / 2, 0, Math.PI, false); x.closePath(); x.fillStyle = red; x.fill()
    x.fillStyle = blue; x.beginPath(); x.arc(46 + R / 2, 22, 3, 0, 7); x.fill(); x.fillStyle = red; x.beginPath(); x.arc(46 - R / 2, 22, 3, 0, 7); x.fill()
    x.strokeStyle = o ? '#ffcf5a' : '#cfd8e8'; x.lineWidth = 2; x.beginPath(); x.arc(46, 22, R, 0, 7); x.stroke()
  }
}

// 노트 그림 한 장: 화면에 찍히는 크기(scale)로 만들어 둔다 (확대해 찍으면 큰 화면에서 가장자리가 계단져 보인다)
const cache: Record<string, HTMLCanvasElement> = {}
export function skinSprite(id: string, outer: boolean, color: string, scale: number) {
  const k = Math.max(1, Math.round(scale * 4) / 4), key = `${id}|${outer ? color : 'i'}|${k}`
  let c = cache[key]
  if (!c) {
    c = cache[key] = document.createElement('canvas'); c.width = Math.ceil(92 * k); c.height = Math.ceil(44 * k)
    const x = c.getContext('2d')!; x.scale(c.width / 92, c.height / 44); (NOTE_SHAPES[id] ?? NOTE_SHAPES.steel)(x, outer, color)
  }
  return c
}
