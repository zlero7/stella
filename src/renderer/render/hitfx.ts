// 타격 이펙트: 노트 스킨(기어 스킨)마다 모양이 다르다. 판정선에서 칠 때 한 번 터지고 0.4초 안에 사라진다. 호출하는 쪽이 'lighter' 합성을 켜 둔다
import { starPath } from './theme'

type G = CanvasRenderingContext2D
export type FxStyle = 'burst' | 'diamond' | 'rays' | 'petals' | 'leaves' | 'slash' | 'bubbles' | 'bolt' | 'snow' | 'sun' | 'minimal' | 'pixel'
export const FX_OF: Record<string, FxStyle> = { steel: 'burst', neon: 'diamond', gold: 'rays', sakura: 'petals', forest: 'leaves', crimson: 'slash', ocean: 'bubbles', violet: 'bolt', ice: 'snow', sunset: 'sun', mono: 'minimal', arcade: 'pixel' }
const rnd = (i: number) => ((i * 7919 + 13) % 97) / 97 // 이펙트마다 같은 값이 나오는 고정 난수 (깜빡이지 않게)

// k: 0→1 진행 · big: 크기 배율 · rgb: 판정 색 · ar: 스킨 포인트 색 · lv: 이펙트 세기(1 약, 2 보통)
export function drawHit(g: G, style: FxStyle, cx: number, cy: number, k: number, big: number, rgb: string, ar: string, lv: number) {
  const ease = 1 - (1 - k) * (1 - k), a = 1 - k
  const c = (al: number, col = rgb) => `rgba(${col},${al})`
  switch (style) {
    case 'diamond': { // 마름모 테두리 두 겹이 퍼지고 가로 선이 번쩍인다
      for (const [s, w, col] of [[1, 2.6, rgb], [0.62, 1.6, ar]] as const) {
        const r = (10 + 48 * ease) * big * s
        g.strokeStyle = c(a * 0.9, col); g.lineWidth = w; g.beginPath(); g.moveTo(cx, cy - r); g.lineTo(cx + r, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r, cy); g.closePath(); g.stroke()
      }
      g.fillStyle = c(a * 0.85, ar); const hw = 52 * big * ease + 6; g.fillRect(cx - hw, cy - 1, hw * 2, 2)
      break
    }
    case 'rays': { // 가는 빛줄기가 방사형으로 뻗는다 (골드)
      const n = lv === 2 ? 12 : 8
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 + 0.2, len = (22 + 64 * ease) * big * (i % 2 ? 0.65 : 1), r0 = 8 * big
        const lg = g.createLinearGradient(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0, cx + Math.cos(ang) * len, cy + Math.sin(ang) * len)
        lg.addColorStop(0, c(a)); lg.addColorStop(1, c(0))
        g.strokeStyle = lg; g.lineWidth = i % 2 ? 1.5 : 2.5; g.beginPath(); g.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0); g.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len); g.stroke()
      }
      g.fillStyle = c(a, ar); starPath(g, cx, cy, 24 * big * (1 - 0.5 * k)); g.fill()
      break
    }
    case 'petals': case 'leaves': { // 꽃잎(분홍)·나뭇잎(초록)이 흩날리며 떨어진다
      const n = lv === 2 ? 12 : 6, leaf = style === 'leaves'
      for (let i = 0; i < n; i++) {
        const ang = -Math.PI + ((i + rnd(i)) / n) * Math.PI, d = (14 + 70 * ease) * big * (0.6 + 0.6 * rnd(i + 3))
        const px = cx + Math.cos(ang) * d + Math.sin(k * 6 + i) * 4, py = cy + Math.sin(ang) * d * 0.9 + k * k * 46 * big
        g.save(); g.translate(px, py); g.rotate(ang + k * (3 + rnd(i) * 4)); g.fillStyle = c(a * 0.95, i % 3 ? rgb : ar)
        g.beginPath(); if (leaf) { g.moveTo(-7, 0); g.quadraticCurveTo(0, -6, 7, 0); g.quadraticCurveTo(0, 6, -7, 0) } else g.ellipse(0, 0, 6 * big + 1, 3.4 * big + 1, 0, 0, 7)
        g.fill(); g.restore()
      }
      g.strokeStyle = c(a * 0.6, ar); g.lineWidth = 1.5; g.beginPath(); g.ellipse(cx, cy, (10 + 36 * ease) * big, (4 + 12 * ease) * big, 0, 0, 7); g.stroke()
      break
    }
    case 'slash': { // 빨간 X 자 베기 두 줄
      const t = Math.min(1, k * 4), L = 46 * big
      for (const d of [-1, 1]) {
        const x0 = cx - d * L, y0 = cy - L * 0.8, x1 = x0 + (cx + d * L - x0) * t, y1 = y0 + (cy + L * 0.8 - y0) * t
        g.strokeStyle = c(a, d < 0 ? rgb : ar); g.lineWidth = 5 * (1 - k) + 1; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.lineCap = 'butt'
      }
      break
    }
    case 'bubbles': { // 거품이 떠오르고 넓은 물결이 퍼진다
      const n = lv === 2 ? 9 : 5
      for (let i = 0; i < n; i++) {
        const px = cx + (rnd(i) - 0.5) * 64 * big, py = cy - ease * (20 + 56 * rnd(i + 5)) * big, r = (2.5 + 6 * rnd(i + 9)) * big + 1
        g.strokeStyle = c(a * 0.9, i % 2 ? rgb : ar); g.lineWidth = 1.5; g.beginPath(); g.arc(px, py, r, 0, 7); g.stroke()
        g.fillStyle = c(a * 0.5, '255,255,255'); g.beginPath(); g.arc(px - r * 0.3, py - r * 0.3, r * 0.25, 0, 7); g.fill()
      }
      g.strokeStyle = c(a * 0.8); g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy, (12 + 56 * ease) * big, (4 + 14 * ease) * big, 0, 0, 7); g.stroke()
      break
    }
    case 'bolt': { // 위에서 내리꽂히는 번개와 고리
      const top = cy - 86 * big, segs = 6
      g.strokeStyle = c(a, ar); g.lineWidth = 4 * (1 - k) + 1; g.lineJoin = 'miter'; g.beginPath(); g.moveTo(cx + 6, top)
      for (let i = 1; i < segs; i++) g.lineTo(cx + (rnd(i + Math.floor(k * 5)) - 0.5) * 30 * big, top + ((cy - top) * i) / segs)
      g.lineTo(cx, cy); g.stroke()
      g.strokeStyle = c(a * 0.9); g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy, (10 + 42 * ease) * big, (4 + 14 * ease) * big, 0, 0, 7); g.stroke()
      break
    }
    case 'snow': { // 눈꽃 결정이 돌며 커진다
      const L = (12 + 40 * ease) * big
      g.save(); g.translate(cx, cy); g.rotate(k * 1.2); g.strokeStyle = c(a, rgb); g.lineWidth = 2.2
      for (let i = 0; i < 6; i++) {
        g.rotate(Math.PI / 3); g.beginPath(); g.moveTo(0, 0); g.lineTo(L, 0); g.moveTo(L * 0.55, 0); g.lineTo(L * 0.8, -L * 0.22); g.moveTo(L * 0.55, 0); g.lineTo(L * 0.8, L * 0.22); g.stroke()
      }
      g.restore(); g.fillStyle = c(a, ar); g.beginPath(); g.arc(cx, cy, 5 * big * (1 - k * 0.5), 0, 7); g.fill()
      break
    }
    case 'sun': { // 위쪽 반원으로 퍼지는 햇살과 떠오르는 불씨
      const n = 11
      for (let i = 0; i < n; i++) {
        const ang = -Math.PI + (i / (n - 1)) * Math.PI, r0 = (14 + 16 * ease) * big, r1 = r0 + (14 + 26 * (1 - k)) * big
        g.strokeStyle = c(a, i % 2 ? rgb : ar); g.lineWidth = 3; g.beginPath(); g.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0); g.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1); g.stroke()
      }
      g.fillStyle = c(a, ar); for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(cx + (rnd(i) - 0.5) * 50 * big, cy - ease * (14 + 50 * rnd(i + 2)) * big, 2, 0, 7); g.fill() }
      break
    }
    case 'minimal': { // 가늘게 퍼지는 사각 테두리 한 겹과 짧은 번쩍임
      const r = (8 + 40 * ease) * big
      g.strokeStyle = c(a * 0.9, '255,255,255'); g.lineWidth = 1.5; g.strokeRect(cx - r, cy - r * 0.45, r * 2, r * 0.9)
      g.fillStyle = c(Math.max(0, 1 - k * 3) * 0.8, '255,255,255'); g.fillRect(cx - 20 * big, cy - 1, 40 * big, 2)
      break
    }
    case 'pixel': { // 네모 알갱이가 4px 격자에 맞춰 튄다
      const n = lv === 2 ? 14 : 7
      for (let i = 0; i < n; i++) {
        const ang = -Math.PI + (i / (n - 1)) * Math.PI, d = (10 + 64 * ease) * big * (0.5 + 0.6 * rnd(i + 1))
        const px = Math.round((cx + Math.cos(ang) * d) / 4) * 4, py = Math.round((cy + Math.sin(ang) * d * 0.9 + k * 12) / 4) * 4, s = i % 3 ? 4 : 8
        g.fillStyle = c(a, i % 2 ? rgb : ar); g.fillRect(px, py, s, s)
      }
      break
    }
    default: { // 기본: 고리 + 별 반짝임 + 불꽃 알갱이
      g.strokeStyle = c(a * 0.9); g.lineWidth = 1 + 3 * a
      g.beginPath(); g.ellipse(cx, cy, (14 + 48 * ease) * big, (6 + 20 * ease) * big, 0, 0, Math.PI * 2); g.stroke()
      g.fillStyle = `rgba(255,255,255,${a})`; starPath(g, cx, cy, 28 * big * (1 - 0.6 * k)); g.fill()
      g.fillStyle = c(a)
      for (let i = 0; lv === 2 && i < 8; i++) {
        const ang = -Math.PI + (i / 7) * Math.PI, d = (18 + 72 * ease) * big
        g.beginPath(); g.arc(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d * 0.9, 0.6 + 2.6 * a, 0, Math.PI * 2); g.fill()
      }
    }
  }
}
