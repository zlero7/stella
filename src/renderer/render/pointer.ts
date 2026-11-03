import { glow, hitCount, starPath } from './theme'

// 게임 전용 마우스 포인터: 반짝이는 별. 위에 올린 곳이 눌러지는 곳이면 금색으로 커지고, 누르면 고리가 퍼진다.
// 시스템 포인터는 캔버스 위에서 숨기고(main.ts) 이걸 맨 위에 그린다. 눌러지는 곳이 없는 화면(플레이 중)에서는 마우스를 안 움직이면 사라진다
const SHOW_MS = 2500, FADE_MS = 500
const P = { x: 0, y: 0, seen: 0, down: -1e9, trail: [] as { x: number; y: number; t: number }[] }

export function pointerMove(x: number, y: number) {
  P.x = x; P.y = y; P.seen = performance.now()
  P.trail.push({ x, y, t: P.seen }); if (P.trail.length > 16) P.trail.shift()
}
export const pointerDown = () => { P.down = performance.now() }
export const pointerLeave = () => { P.seen = 0 }

export function drawPointer(g: CanvasRenderingContext2D, over: boolean) {
  const now = performance.now()
  if (!P.seen) return
  const idle = now - P.seen, a = hitCount() > 0 ? 1 : idle < SHOW_MS ? 1 : Math.max(0, 1 - (idle - SHOW_MS) / FADE_MS)
  if (a <= 0) return
  g.save(); g.globalAlpha = a
  // 꼬리: 지나간 자리에 작은 별가루
  for (const p of P.trail) {
    const k = 1 - (now - p.t) / 380
    if (k <= 0) continue
    g.fillStyle = `rgba(190,235,255,${0.55 * k})`; g.beginPath(); g.arc(p.x, p.y, 3.2 * k, 0, Math.PI * 2); g.fill()
  }
  // 누른 순간: 고리가 퍼진다
  const dk = (now - P.down) / 420
  if (dk >= 0 && dk < 1) { g.strokeStyle = `rgba(255,255,255,${0.9 * (1 - dk)})`; g.lineWidth = 2.5 * (1 - dk) + 0.5; g.beginPath(); g.arc(P.x, P.y, 8 + 34 * dk, 0, Math.PI * 2); g.stroke() }
  // 별 본체: 숨 쉬듯 살짝 커졌다 작아진다. 눌러지는 곳 위에서는 금색
  const r = (over ? 17 : 12) * (1 + 0.08 * Math.sin(now / 160)), core = over ? '#fff1b8' : '#ffffff', halo = over ? '#ffb13b' : '#7ad8ff'
  glow(g, halo, over ? 22 : 16, () => { starPath(g, P.x, P.y, r); g.fillStyle = core; g.fill() })
  g.fillStyle = core; g.beginPath(); g.arc(P.x, P.y, over ? 3 : 2.4, 0, Math.PI * 2); g.fill()
  g.restore()
}
