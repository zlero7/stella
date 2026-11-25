// 필드 안 분위기 층: 레인 바탕 위, 노트 아래에 깔린다. 스킨마다 다른 움직이는 배경 (별가루·반딧불·불씨·오로라…)과 공통 마감(가장자리 어둡힘·판정선 쪽 번짐)
// gear.ts의 drawGearBack이 틀을 그린 뒤 부른다. 새로 그린 코스모스·태엽·캔디·단청은 틀 안에서 직접 그려서 여기 없다
import type { GearSkin } from './gear'

type G = CanvasRenderingContext2D
const rnd = (i: number) => ((i * 7919 + 13) % 97) / 97
const dot = (g: G, x: number, y: number, r: number) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill() }
const glowDot = (g: G, x: number, y: number, r: number, col: string, a: number) => { const k = g.createRadialGradient(x, y, 0, x, y, r); k.addColorStop(0, col); k.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = a; g.fillStyle = k; g.fillRect(x - r, y - r, r * 2, r * 2); g.globalAlpha = 1 }
const sparkle = (g: G, x: number, y: number, r: number) => { g.beginPath(); g.moveTo(x - r, y); g.lineTo(x, y - r * 0.28); g.lineTo(x + r, y); g.lineTo(x, y + r * 0.28); g.closePath(); g.moveTo(x, y - r); g.lineTo(x + r * 0.28, y); g.lineTo(x, y + r); g.lineTo(x - r * 0.28, y); g.closePath(); g.fill() }

type Layer = (g: G, x0: number, w: number, jy: number, k0: GearSkin, now: number) => void
const LAYERS: Record<string, Layer> = {
  crimson(g, x0, w, jy, k0, now) { // 바닥에서 달아오르는 붉은 열기와 솟는 불씨
    const hg = g.createLinearGradient(0, jy, 0, jy * 0.45); hg.addColorStop(0, 'rgba(255,60,50,.28)'); hg.addColorStop(1, 'rgba(255,60,50,0)'); g.fillStyle = hg; g.fillRect(x0, jy * 0.45, w, jy * 0.55)
    g.fillStyle = '#ffb13b'; for (let i = 0; i < 22; i++) { const k = ((now / (3000 + 2200 * rnd(i)) + rnd(i + 7)) % 1), px = x0 + rnd(i) * w + Math.sin(k * 9 + i) * 10, py = jy - k * jy * 0.95; g.globalAlpha = (1 - k) * 0.8; dot(g, px, py, 1 + 1.8 * rnd(i + 3) * (1 - k)) } g.globalAlpha = 1
  },
}

// 공통 마감: 좌우 가장자리를 살짝 어둡게 해 깊이를 주고, 판정선 쪽으로 포인트 색을 번지게 한다
const finish = (g: G, x0: number, w: number, jy: number, k0: GearSkin) => {
  const eg = g.createLinearGradient(x0, 0, x0 + w, 0); eg.addColorStop(0, 'rgba(0,0,0,.30)'); eg.addColorStop(0.14, 'rgba(0,0,0,0)'); eg.addColorStop(0.86, 'rgba(0,0,0,0)'); eg.addColorStop(1, 'rgba(0,0,0,.30)'); g.fillStyle = eg; g.fillRect(x0, 0, w, jy)
  const bg = g.createLinearGradient(0, jy - 130, 0, jy); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, k0.accent); g.globalAlpha = 0.14; g.fillStyle = bg; g.fillRect(x0, jy - 130, w, 130); g.globalAlpha = 1
}

export function drawAmbient(g: G, k0: GearSkin, x: number, fw: number, jy: number) {
  const layer = LAYERS[k0.id]; if (!layer) return
  g.save(); g.beginPath(); g.rect(x - 4, 0, fw + 8, jy); g.clip()
  layer(g, x - 4, fw + 8, jy, k0, performance.now()); finish(g, x - 4, fw + 8, jy, k0)
  g.restore()
}
