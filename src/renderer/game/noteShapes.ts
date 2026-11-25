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

export const NOTES12: Record<string, Draw> = {
  steel(x, o, c) { // 유리 상판 패드: 어두운 강철 몸통에 색 LED 줄, 양끝 볼트
    const p = pal(o, c), top = o ? '#4a5468' : '#ffffff', bot = o ? '#12151b' : '#a9b6c8'; glow(x, o ? p.col : '#ffffff', 11)
    rr(x, 11, 9, 70, 26, 6); x.fillStyle = vg(x, 9, 35, top, bot); x.fill(); noGlow(x); x.strokeStyle = o ? p.col : '#8aa2c4'; x.lineWidth = 2; x.stroke(); shine(x, 9, 22, 0.4)
    glow(x, p.col, 6); rr(x, 19, 27, 54, 3.4, 1.7); x.fillStyle = o ? p.hi : p.col; x.fill(); noGlow(x)
    x.fillStyle = o ? '#c8d2e0' : '#6f86a8'; dot(x, 17, 22, 2.4); dot(x, 75, 22, 2.4); x.fillStyle = o ? '#10141c' : '#ffffff'; dot(x, 17, 22, 1); dot(x, 75, 22, 1)
    poly(x, [[46, 12.5], [55, 19], [46, 25.5], [37, 19]]); x.fillStyle = o ? p.col : '#8aa2c4'; x.globalAlpha = 0.85; x.fill(); x.globalAlpha = 1; x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 1; x.stroke()
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
  ocean(x, o) { // 해파리: 숨 쉬는 종 모양 몸, 안쪽 발광점, 늘어진 촉수
    const p = pal(o, '#5ee8ff'); glow(x, p.col, 12)
    x.beginPath(); x.moveTo(13, 24); x.bezierCurveTo(13, -4, 79, -4, 79, 24); x.quadraticCurveTo(71, 31, 63, 25); x.quadraticCurveTo(55, 32, 46, 25); x.quadraticCurveTo(37, 32, 29, 25); x.quadraticCurveTo(21, 31, 13, 24); x.closePath()
    const rg = x.createRadialGradient(46, 12, 2, 46, 18, 38); rg.addColorStop(0, 'rgba(255,255,255,.85)'); rg.addColorStop(0.5, o ? 'rgba(94,232,255,.55)' : 'rgba(220,235,255,.6)'); rg.addColorStop(1, o ? 'rgba(10,110,160,.75)' : 'rgba(120,150,200,.7)'); x.fillStyle = rg; x.fill(); noGlow(x)
    x.strokeStyle = p.hi; x.lineWidth = 1.6; x.stroke(); x.lineCap = 'round'; x.strokeStyle = o ? 'rgba(160,245,255,.85)' : 'rgba(210,225,250,.9)'; x.lineWidth = 2
    for (let k = 0; k < 5; k++) { const bx = 22 + k * 12; x.beginPath(); x.moveTo(bx, 28); x.bezierCurveTo(bx + (k % 2 ? 5 : -5), 33, bx + (k % 2 ? -4 : 4), 37, bx + (k % 2 ? 3 : -3), 41); x.stroke() } x.lineCap = 'butt'
    x.fillStyle = 'rgba(255,255,255,.9)'; for (const [dx, dy, r] of [[34, 14, 2.2], [46, 9, 2.6], [58, 14, 2.2], [46, 18, 1.6]]) dot(x, dx, dy, r); x.beginPath(); x.ellipse(30, 9, 8, 3, -0.5, 0, 7); x.fillStyle = 'rgba(255,255,255,.55)'; x.fill()
  },
  violet(x, o) { // 마이크로칩: 핀이 달린 몸통, 빛나는 다이와 회로선
    const p = pal(o, '#b58cff'), pin = o ? '#d8d0f0' : '#aab6d0'; glow(x, p.col, 11)
    x.fillStyle = pin; for (let k = 0; k < 6; k++) { x.fillRect(19 + k * 10, 5, 4, 7); x.fillRect(19 + k * 10, 32, 4, 7) } for (const d of [-1, 1]) for (let k = 0; k < 2; k++) x.fillRect(d < 0 ? 8 : 80, 16 + k * 8, 4, 4)
    rr(x, 12, 10, 68, 24, 3); x.fillStyle = vg(x, 10, 34, o ? '#2a1a5a' : '#f2f5fc', o ? '#0c0620' : '#aab6d0'); x.fill(); noGlow(x); x.strokeStyle = p.col; x.lineWidth = 2; x.stroke()
    x.strokeStyle = o ? 'rgba(181,140,255,.6)' : 'rgba(110,130,170,.7)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(36, 22); x.lineTo(24, 22); x.lineTo(24, 14); x.moveTo(56, 22); x.lineTo(68, 22); x.lineTo(68, 30); x.moveTo(46, 30); x.lineTo(46, 31); x.stroke()
    glow(x, p.col, 8); rr(x, 35, 14, 22, 16, 2); x.fillStyle = vg(x, 14, 30, p.hi, p.col); x.fill(); noGlow(x); x.strokeStyle = o ? '#2a1458' : '#6f86a8'; x.lineWidth = 1; x.stroke()
    x.fillStyle = o ? '#ff5a9a' : '#ffffff'; dot(x, 20, 15, 1.8); x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(39, 17, 14, 2)
  },
  ice(x, o) { // 얼음 보석: 면이 나뉜 육각, 위 면은 밝고 아래 면은 짙다
    const p = pal(o, '#8fd8ff'); glow(x, p.col, 12)
    poly(x, [[10, 22], [25, 7], [67, 7], [82, 22], [67, 37], [25, 37]]); x.fillStyle = vg(x, 7, 37, '#ffffff', p.col, p.lo); x.fill(); noGlow(x); x.lineJoin = 'round'; x.strokeStyle = o ? '#1a4a72' : '#6f86a8'; x.lineWidth = 1.6; x.stroke()
    poly(x, [[25, 7], [67, 7], [57, 22], [35, 22]]); x.fillStyle = 'rgba(255,255,255,.5)'; x.fill(); poly(x, [[10, 22], [25, 7], [35, 22]]); x.fillStyle = 'rgba(255,255,255,.22)'; x.fill()
    poly(x, [[35, 22], [57, 22], [67, 37], [25, 37]]); x.fillStyle = o ? 'rgba(10,60,120,.28)' : 'rgba(80,110,160,.25)'; x.fill()
    x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 1; x.beginPath(); x.moveTo(25, 7); x.lineTo(35, 22); x.lineTo(25, 37); x.moveTo(67, 7); x.lineTo(57, 22); x.lineTo(67, 37); x.moveTo(35, 22); x.lineTo(57, 22); x.stroke()
    x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(30, 13); x.lineTo(32, 10); x.lineTo(34, 13); x.lineTo(32, 16); x.closePath(); x.fill(); dot(x, 60, 30, 1.4)
  },
  sunset(x, o) { // 호박빛 해 원반: 노랑에서 분홍으로 번지고 아래쪽에 가로 틈이 난다
    const p = pal(o, '#ffb13b'); glow(x, p.col, 13)
    x.beginPath(); x.ellipse(46, 22, 37, 17, 0, 0, 7); x.fillStyle = vg(x, 5, 39, o ? '#fff2a0' : '#ffffff', o ? '#ff8a3a' : '#cfe0f5', o ? '#ff3d8a' : '#8aa2c4'); x.fill(); noGlow(x); x.strokeStyle = o ? '#7a2a1a' : '#6f86a8'; x.lineWidth = 1.6; x.stroke()
    x.save(); x.beginPath(); x.ellipse(46, 22, 37, 17, 0, 0, 7); x.clip(); x.fillStyle = o ? 'rgba(50,10,40,.6)' : 'rgba(80,100,140,.55)'; for (let i = 0; i < 5; i++) x.fillRect(8, 22 + i * 3.6, 76, 0.8 + i * 0.55); x.restore()
    x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(36, 12, 14, 3.4, -0.3, 0, 7); x.fill()
    x.fillStyle = p.col; for (const d of [-1, 1]) for (const k of [0, 1]) { poly(x, [[46 + d * (40 + k * 4), 22], [46 + d * (44 + k * 4), 19], [46 + d * (44 + k * 4), 25]]); x.fill() }
  },
  mono(x, o) { // 피아노 건반 판: 검은 래커(바깥)·상아색(안쪽) 위에 음표
    const k = o ? '#d8dce8' : '#6a6e7a'; glow(x, o ? '#ffffff' : '#9aa3b2', 5)
    rr(x, 11, 9, 70, 26, 5); x.fillStyle = o ? vg(x, 9, 35, '#4a4c56', '#000000') : vg(x, 9, 35, '#ffffff', '#d4d8e2'); x.fill(); noGlow(x); x.strokeStyle = k; x.lineWidth = 2; x.stroke(); shine(x, 9, 20, o ? 0.28 : 0.6)
    x.fillStyle = o ? '#f0f2f8' : '#1a1c22'; x.strokeStyle = x.fillStyle; x.lineWidth = 2; x.beginPath(); x.ellipse(40, 27, 5.4, 3.8, -0.4, 0, 7); x.fill(); x.beginPath(); x.moveTo(44.6, 25.6); x.lineTo(44.6, 11); x.stroke(); x.beginPath(); x.moveTo(44.6, 11); x.bezierCurveTo(51, 13, 54, 18, 51, 23); x.lineWidth = 2.6; x.stroke()
    x.fillStyle = o ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.3)'; for (const dx of [20, 28, 64, 72]) x.fillRect(dx, 12, 1.5, 4)
  },
  arcade(x, o) { // 픽셀 동전: 둥글게 깎은 도트, 위 왼쪽이 밝고 아래 오른쪽이 어둡다. 옆에 반짝이 두 개
    const p = pal(o, '#ffd22e'); glow(x, p.col, 8)
    for (let ry = 0; ry < 10; ry++) for (let rx = 0; rx < 10; rx++) {
      const dx = rx - 4.5, dy = ry - 4.5, r = Math.hypot(dx, dy); if (r > 4.9) continue
      const lit = (-dx - dy) / 9, edge = r > 4.0, slot = Math.abs(dx) < 0.8 && Math.abs(dy) < 2.6
      x.fillStyle = edge ? p.lo : slot ? p.hi : lit > 0.18 ? p.hi : lit < -0.25 ? mix(p.col, p.lo, 0.5) : p.col; x.fillRect(26 + rx * 4, 2 + ry * 4, 4, 4)
    }
    noGlow(x); x.fillStyle = 'rgba(255,255,255,.95)'; for (const [sx, sy] of [[12, 14], [74, 24]]) { x.fillRect(sx - 1, sy - 5, 3, 11); x.fillRect(sx - 5, sy - 1, 11, 3) }
    x.fillStyle = p.hi; x.fillRect(30, 8, 4, 2); x.fillRect(30, 8, 2, 4)
  }
}
