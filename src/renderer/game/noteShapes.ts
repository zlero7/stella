// 노트 모양 (92x44 칸, 세로 중심 y=22, 가로 x 11~81 안): 열두 스킨의 노트를 다시 그린 것.
// 어느 모양이든 같은 순서로 쌓는다: 번지는 빛 → 그라데이션 몸통 → 테두리 → 윗면 광택 → 안쪽 무늬 → 반짝이는 점. 안쪽 레인(o=false)은 같은 모양의 은백색
import { lighten } from '../render/theme'

type Ctx = CanvasRenderingContext2D
export type Draw = (x: Ctx, outer: boolean, c: string) => void

const mix = (a: string, b: string, t: number) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('')
const pal = (o: boolean, nat: string) => ({ col: o ? nat : '#f4f8ff', hi: o ? lighten(nat, 0.62) : '#ffffff', lo: o ? mix(nat, '#000000', 0.45) : '#8aa2c4' })
const vg = (x: Ctx, y0: number, y1: number, ...s: string[]) => { const g = x.createLinearGradient(0, y0, 0, y1); s.forEach((c, i) => g.addColorStop(i / (s.length - 1), c)); return g }
const glow = (x: Ctx, col: string, b = 9) => { x.shadowColor = col; x.shadowBlur = b }
const noGlow = (x: Ctx) => { x.shadowBlur = 0 }
const dot = (x: Ctx, cx: number, cy: number, r: number) => { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill() }
const rr = (x: Ctx, a: number, b: number, w: number, h: number, r: number) => { x.beginPath(); x.roundRect(a, b, w, h, r) }
const poly = (x: Ctx, pts: number[][]) => { x.beginPath(); pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.closePath() }
// 지금 그려 둔 윤곽 위쪽 절반에 하얀 광택을 얹는다 (윤곽은 clip으로 쓰이고 지워진다)
const shine = (x: Ctx, y0: number, y1: number, a = 0.55) => { x.save(); x.clip(); x.fillStyle = vg(x, y0, y1, `rgba(255,255,255,${a})`, 'rgba(255,255,255,0)'); x.fillRect(0, y0, 92, y1 - y0); x.restore() }
const INVADER = ['..#.....#..', '...#...#...', '..#######..', '.##.###.##.', '###########', '#.#######.#', '#.#.....#.#', '...##.##...']

export const NOTES12: Record<string, Draw> = {
  steel(x, o, c) { // 모서리가 깎인 강철 판: 양끝 마개, 가운데 마름모 홈
    const p = pal(o, c); glow(x, o ? p.col : '#ffffff', 11)
    rr(x, 11, 12, 70, 20, 5); x.fillStyle = vg(x, 12, 32, p.hi, p.col, p.lo); x.fill(); noGlow(x)
    x.strokeStyle = o ? p.lo : '#6f86a8'; x.lineWidth = 1.4; x.stroke(); shine(x, 12, 22, 0.7)
    x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(11, 12, 7, 20); x.fillRect(74, 12, 7, 20)
    x.fillStyle = 'rgba(255,255,255,.55)'; for (const d of [21, 25]) { x.fillRect(d, 15, 1, 14); x.fillRect(92 - d - 1, 15, 1, 14) }
    poly(x, [[46, 14.5], [56, 22], [46, 29.5], [36, 22]]); x.fillStyle = 'rgba(8,16,30,.55)'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 1.2; x.stroke()
  },
  neon(x, o) { // 아래로 꺾이는 겹 화살: 바깥은 분홍 네온, 안쪽은 하늘색 가는 선
    const p = pal(o, '#ff3ddb'), path = (k: number) => poly(x, [[9 + k, 8 + k * 0.4], [31, 8 + k * 0.4], [46, 29 - k], [61, 8 + k * 0.4], [83 - k, 8 + k * 0.4], [46, 41 - k * 1.6]])
    glow(x, p.col, 13); path(0); x.fillStyle = vg(x, 8, 41, '#241040', '#0a0418'); x.fill(); x.lineJoin = 'round'; x.strokeStyle = o ? p.col : '#ffffff'; x.lineWidth = 3; x.stroke(); noGlow(x)
    x.strokeStyle = o ? p.hi : '#cfe6ff'; x.lineWidth = 1; path(0); x.stroke()
    path(7); x.strokeStyle = o ? '#37e8ff' : '#9fd0ff'; x.lineWidth = 1.4; x.stroke()
    x.fillStyle = o ? '#37e8ff' : '#cfe6ff'; for (const d of [-1, 1]) x.fillRect(46 + d * 31 - (d < 0 ? 0 : 6), 10, 6, 2); dot(x, 46, 22, 2)
  },
  gold(x, o) { // 보석 박힌 금관: 봉우리 셋, 끝마다 구슬
    const p = pal(o, '#ffd45e'); glow(x, p.col, 10)
    poly(x, [[13, 33], [11, 11], [28, 23], [46, 5], [64, 23], [81, 11], [79, 33]]); x.fillStyle = vg(x, 5, 34, o ? '#fff2b0' : '#ffffff', p.col, o ? '#a9741e' : '#8aa2c4'); x.fill(); noGlow(x)
    x.lineJoin = 'round'; x.strokeStyle = o ? '#6a4512' : '#6f86a8'; x.lineWidth = 1.6; x.stroke(); shine(x, 5, 22, 0.5)
    rr(x, 12, 30, 68, 9, 3); x.fillStyle = vg(x, 30, 39, o ? '#ffe68a' : '#ffffff', o ? '#a9741e' : '#8aa2c4'); x.fill(); x.stroke()
    for (const [bx, by] of [[11, 10], [46, 4], [81, 10]]) { x.fillStyle = o ? '#fff6c8' : '#ffffff'; dot(x, bx, by, 3); x.strokeStyle = o ? '#6a4512' : '#6f86a8'; x.lineWidth = 1; x.beginPath(); x.arc(bx, by, 3, 0, 7); x.stroke() }
    for (const [gx, gy, gr, gc] of [[46, 21, 4.6, '#ff4a5a'], [29, 33.5, 2.6, '#4aa8ff'], [63, 33.5, 2.6, '#4aa8ff'], [46, 34.5, 2.2, '#7dffb0']] as const) { x.fillStyle = o ? gc : '#cfe0f5'; dot(x, gx, gy, gr); x.fillStyle = 'rgba(255,255,255,.85)'; dot(x, gx - gr * 0.3, gy - gr * 0.35, gr * 0.32) }
  },
  sakura(x, o) { // 활짝 핀 벚꽃 한 송이와 양옆 작은 꽃
    const p = pal(o, '#ff8fb8')
    const flower = (cx: number, cy: number, r: number) => {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2; x.save(); x.translate(cx, cy); x.rotate(a)
        x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(r * 0.5, -r * 0.55, r * 1.12, -r * 0.4, r * 1.04, -r * 0.08); x.lineTo(r * 1.0, 0); x.lineTo(r * 1.04, r * 0.08); x.bezierCurveTo(r * 1.12, r * 0.4, r * 0.5, r * 0.55, 0, 0)
        const rg = x.createRadialGradient(r * 0.2, 0, 0, r * 0.7, 0, r); rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.35, p.hi); rg.addColorStop(1, p.col); x.fillStyle = rg; x.fill(); x.strokeStyle = o ? 'rgba(180,60,100,.55)' : 'rgba(120,150,200,.6)'; x.lineWidth = 0.9; x.stroke(); x.restore()
      }
      x.strokeStyle = '#d8487a'; x.lineWidth = 0.8; x.fillStyle = '#ffd04a'
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.3; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5); x.stroke(); dot(x, cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5, r * 0.1) }
    }
    glow(x, p.col, 8); flower(46, 22, 19); noGlow(x); flower(18, 24, 8); flower(74, 20, 8)
  },
  forest(x, o) { // 이슬 맺힌 나뭇잎: 잎맥과 가는 줄기
    const p = pal(o, '#7bd88a'); glow(x, p.col, 8)
    x.beginPath(); x.moveTo(15, 27); x.bezierCurveTo(28, 2, 62, 3, 83, 15); x.bezierCurveTo(68, 41, 36, 42, 15, 27); x.closePath()
    x.fillStyle = vg(x, 4, 40, o ? '#d6ffb8' : '#ffffff', p.col, p.lo); x.fill(); noGlow(x); x.lineJoin = 'round'; x.strokeStyle = p.lo; x.lineWidth = 1.5; x.stroke(); shine(x, 4, 22, 0.45)
    x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(15, 27); x.quadraticCurveTo(48, 20, 81, 16); x.stroke()
    x.strokeStyle = o ? 'rgba(30,90,40,.5)' : 'rgba(90,120,160,.5)'; x.lineWidth = 1; x.beginPath()
    for (const t of [0.22, 0.4, 0.58, 0.76]) { const bx = 15 + t * 66, by = 27 - t * 11 - 3 * Math.sin(t * 3); x.moveTo(bx, by); x.lineTo(bx + 9, by - 9 - 2 * t); x.moveTo(bx, by); x.lineTo(bx + 9, by + 9 + 2 * t) } x.stroke()
    x.strokeStyle = o ? '#6a4a22' : '#8aa2c4'; x.lineWidth = 2; x.lineCap = 'round'; x.beginPath(); x.moveTo(8, 36); x.quadraticCurveTo(11, 30, 16, 27); x.stroke(); x.lineCap = 'butt'
    x.fillStyle = 'rgba(210,250,255,.9)'; dot(x, 60, 14, 3); x.fillStyle = '#ffffff'; dot(x, 59, 13, 1.1)
  },
  crimson(x, o) { // 안쪽이 얇은 초승달 칼날: 달궈진 하얀 날, 붉은 몸, 끝의 가시
    const p = pal(o, '#ff3b52'); glow(x, p.col, 11)
    x.beginPath(); x.moveTo(8, 30); x.quadraticCurveTo(46, -9, 84, 30); x.quadraticCurveTo(46, 14, 8, 30); x.closePath()
    x.fillStyle = vg(x, 4, 30, o ? '#ff9aa6' : '#ffffff', p.col, o ? '#3a0610' : '#7a90b0'); x.fill(); noGlow(x); x.lineJoin = 'round'; x.strokeStyle = o ? '#1a0308' : '#6f86a8'; x.lineWidth = 1.4; x.stroke()
    x.strokeStyle = '#ffffff'; x.lineWidth = 1.6; x.lineCap = 'round'; x.beginPath(); x.moveTo(13, 28); x.quadraticCurveTo(46, -4, 79, 28); x.stroke(); x.lineCap = 'butt'
    x.strokeStyle = o ? 'rgba(40,0,10,.7)' : 'rgba(80,100,140,.6)'; x.lineWidth = 1; x.beginPath(); x.moveTo(20, 28); x.quadraticCurveTo(46, 6, 72, 28); x.stroke()
    x.fillStyle = o ? '#2a060e' : '#8aa2c4'; for (const d of [-1, 1]) { poly(x, [[46 + d * 40, 30], [46 + d * 46, 36], [46 + d * 37, 33]]); x.fill() }
  },
  ocean(x, o) { // 윤기 나는 물방울 세 개와 잔거품
    const p = pal(o, '#5ee8ff'); glow(x, p.col, 9)
    for (const [bx, by, r] of [[27, 26, 10], [47, 19, 13], [68, 26, 10], [13, 14, 3.4], [81, 12, 3]] as const) {
      const rg = x.createRadialGradient(bx - r * 0.3, by - r * 0.35, r * 0.1, bx, by, r); rg.addColorStop(0, 'rgba(255,255,255,.55)'); rg.addColorStop(0.6, o ? 'rgba(94,232,255,.28)' : 'rgba(220,235,255,.3)'); rg.addColorStop(1, o ? 'rgba(20,150,190,.55)' : 'rgba(140,170,210,.5)')
      x.fillStyle = rg; dot(x, bx, by, r); x.strokeStyle = p.hi; x.lineWidth = 1.5; x.beginPath(); x.arc(bx, by, r, 0, 7); x.stroke()
    }
    noGlow(x); x.fillStyle = 'rgba(255,255,255,.9)'; for (const [bx, by, r] of [[27, 26, 10], [47, 19, 13], [68, 26, 10]] as const) { x.beginPath(); x.ellipse(bx - r * 0.35, by - r * 0.4, r * 0.3, r * 0.17, -0.6, 0, 7); x.fill(); dot(x, bx + r * 0.4, by + r * 0.45, r * 0.1) }
  },
  violet(x, o) { // 번개 한 줄기와 튀는 불꽃, 회로 점
    const p = pal(o, '#b58cff'); glow(x, p.col, 12)
    poly(x, [[34, 3], [63, 3], [51, 16.5], [72, 16.5], [35, 41], [43, 24.5], [24, 24.5]]); x.fillStyle = vg(x, 3, 41, p.hi, p.col, p.lo); x.fill(); noGlow(x)
    x.lineJoin = 'round'; x.strokeStyle = o ? '#2a1458' : '#6f86a8'; x.lineWidth = 1.6; x.stroke(); shine(x, 3, 22, 0.5)
    poly(x, [[38, 6.5], [55, 6.5], [45, 18], [60, 18], [41, 34], [46, 22], [31, 22]]); x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1; x.stroke()
    x.strokeStyle = o ? '#ff5a9a' : '#cfe0f5'; x.lineWidth = 1.8; x.lineCap = 'round'; x.beginPath(); x.moveTo(10, 15); x.lineTo(19, 19); x.lineTo(15, 23); x.lineTo(23, 26); x.moveTo(82, 13); x.lineTo(73, 18); x.lineTo(77, 22); x.lineTo(69, 26); x.stroke(); x.lineCap = 'butt'
    x.fillStyle = o ? '#ff5a9a' : '#ffffff'; for (const [dx, dy] of [[10, 15], [82, 13], [23, 26], [69, 26]]) dot(x, dx, dy, 1.8)
  },
  ice(x, o) { // 면이 살아 있는 눈꽃 결정: 여섯 갈래에 가지, 가운데 육각 심, 양옆 얼음 조각
    const p = pal(o, '#8fd8ff'); glow(x, p.col, 10); x.lineCap = 'round'
    x.save(); x.translate(46, 22)
    for (let i = 0; i < 6; i++) {
      x.rotate(Math.PI / 3); x.strokeStyle = o ? p.col : '#cfe6ff'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 0); x.lineTo(20, 0); x.stroke()
      x.lineWidth = 2; x.beginPath(); x.moveTo(11, 0); x.lineTo(17, -6); x.moveTo(11, 0); x.lineTo(17, 6); x.moveTo(17, 0); x.lineTo(21, -3); x.moveTo(17, 0); x.lineTo(21, 3); x.stroke()
      x.strokeStyle = '#ffffff'; x.lineWidth = 0.9; x.beginPath(); x.moveTo(3, 0); x.lineTo(19, 0); x.stroke()
    }
    x.restore(); noGlow(x); x.lineCap = 'butt'
    poly(x, Array.from({ length: 6 }, (_, k) => [46 + Math.cos(k * Math.PI / 3) * 7.5, 22 + Math.sin(k * Math.PI / 3) * 7.5])); x.fillStyle = vg(x, 14, 30, '#ffffff', p.col, p.lo); x.fill(); x.strokeStyle = p.lo; x.lineWidth = 1; x.stroke()
    for (const d of [-1, 1]) { poly(x, [[46 + d * 28, 22], [46 + d * 34, 17], [46 + d * 40, 22], [46 + d * 34, 27]]); x.fillStyle = o ? p.hi : '#ffffff'; x.fill(); x.strokeStyle = p.lo; x.stroke(); x.strokeStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.moveTo(46 + d * 40, 22); x.lineTo(46 + d * 44, 22); x.stroke() }
  },
  sunset(x, o) { // 가로 틈이 난 레트로 태양과 뻗는 햇살
    const p = pal(o, '#ffb13b'); glow(x, p.col, 11)
    x.fillStyle = p.col; for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, s = i % 2 ? 0.1 : 0.16, L = i % 2 ? 17 : 21; poly(x, [[46 + Math.cos(a - s) * 13, 22 + Math.sin(a - s) * 13], [46 + Math.cos(a) * L, 22 + Math.sin(a) * L], [46 + Math.cos(a + s) * 13, 22 + Math.sin(a + s) * 13]]); x.fill() }
    x.beginPath(); x.arc(46, 22, 12.5, 0, 7); x.fillStyle = vg(x, 9.5, 34.5, o ? '#fff2a0' : '#ffffff', o ? '#ff8a3a' : '#cfe0f5', o ? '#ff3d8a' : '#8aa2c4'); x.fill(); noGlow(x); x.strokeStyle = p.lo; x.lineWidth = 1.4; x.stroke()
    x.save(); x.beginPath(); x.arc(46, 22, 12.5, 0, 7); x.clip(); x.fillStyle = o ? 'rgba(60,10,40,.55)' : 'rgba(80,100,140,.5)'; for (let i = 0; i < 4; i++) x.fillRect(33, 23 + i * 3.4, 26, 1 + i * 0.5); x.restore()
    x.fillStyle = p.col; for (const d of [-1, 1]) for (const k of [0, 1]) { poly(x, [[46 + d * (26 + k * 7), 22], [46 + d * (32 + k * 7), 17], [46 + d * (32 + k * 7), 27]]); x.fill() }
  },
  mono(x, o) { // 윤곽과 줄만 있는 흑백 판: 가운데 흰 블록, 양끝 눈금
    const k = o ? '#ffffff' : '#9aa3b2'; glow(x, k, 5)
    x.fillStyle = '#0a0a0c'; x.fillRect(11, 11, 70, 22); x.strokeStyle = k; x.lineWidth = 2.4; x.strokeRect(11, 11, 70, 22); noGlow(x)
    x.fillStyle = k; x.fillRect(11, 16, 70, 2); x.fillRect(11, 26, 70, 2); x.fillRect(38, 11, 16, 22); x.fillStyle = '#0a0a0c'; x.fillRect(44, 15, 4, 14)
    x.fillStyle = k; for (const dx of [17, 23, 63, 69]) x.fillRect(dx, 8, 1.5, 3)
  },
  arcade(x, o) { // 그림자와 하이라이트가 있는 도트 인베이더
    const p = pal(o, '#7dff7a'); x.fillStyle = 'rgba(0,0,0,.5)'
    INVADER.forEach((row, ry) => [...row].forEach((ch, rx) => { if (ch === '#') x.fillRect(24 + rx * 4 + 2, 6 + ry * 4 + 2, 4, 4) }))
    glow(x, p.col, 7); INVADER.forEach((row, ry) => [...row].forEach((ch, rx) => { if (ch === '#') { x.fillStyle = ry < 3 ? p.hi : ry < 6 ? p.col : mix(p.col, p.lo, 0.5); x.fillRect(24 + rx * 4, 6 + ry * 4, 4, 4) } })); noGlow(x)
    x.fillStyle = '#041004'; x.fillRect(32, 14, 4, 4); x.fillRect(56, 14, 4, 4); x.fillStyle = 'rgba(255,255,255,.8)'; x.fillRect(32, 14, 2, 2); x.fillRect(56, 14, 2, 2)
  }
}
