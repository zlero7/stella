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
  steel(g, x0, w, jy, k0, now) { // 위에서 내려오는 옅은 빛줄기와 떠다니는 먼지
    g.fillStyle = k0.accent; for (const [o, ww, al] of [[0.18, 46, 0.045], [0.62, 70, 0.035], [0.86, 30, 0.04]] as const) { const lg = g.createLinearGradient(0, 0, 0, jy); lg.addColorStop(0, k0.accent); lg.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = al; g.fillStyle = lg; g.beginPath(); g.moveTo(x0 + w * o, 0); g.lineTo(x0 + w * o + ww, 0); g.lineTo(x0 + w * o + ww * 2.2 - 30, jy); g.lineTo(x0 + w * o - 20, jy); g.fill() }
    g.globalAlpha = 0.35; g.fillStyle = '#bff8ff'; for (let i = 0; i < 18; i++) dot(g, x0 + ((rnd(i) * w + Math.sin(now / 1400 + i) * 8 + w) % w), (rnd(i + 30) * jy - now / (50 + 40 * rnd(i + 2)) % jy + jy) % jy, 0.8 + rnd(i + 6)); g.globalAlpha = 1
  },
  gold(g, x0, w, jy, k0, now) { // 위쪽에서 번지는 금빛과 반짝이며 오르는 금가루
    glowDot(g, x0 + w / 2, 0, w * 0.9, k0.accent, 0.16)
    g.fillStyle = k0.accent; for (let i = 0; i < 16; i++) { const py = ((rnd(i + 9) * jy - now / (38 + 30 * rnd(i)) % jy) + jy) % jy, tw = 0.5 + 0.5 * Math.sin(now / 400 + i * 2); g.globalAlpha = 0.5 * tw; sparkle(g, x0 + rnd(i) * w, py, 2.5 + 3 * rnd(i + 4)) } g.globalAlpha = 1
  },
  sakura(g, x0, w, jy, k0, now) { // 달빛처럼 번지는 분홍 빛 두 덩이와 천천히 떠다니는 보케
    glowDot(g, x0 + w * 0.2, 90, 200, '#ffb8d8', 0.14); glowDot(g, x0 + w * 0.85, 330, 170, '#ff8fb8', 0.10)
    for (let i = 0; i < 9; i++) { const px = x0 + ((rnd(i) * w + Math.sin(now / 2200 + i * 1.3) * 16 + w) % w), py = ((rnd(i + 20) * jy + now / (40 + 30 * rnd(i + 3))) % jy); glowDot(g, px, py, 10 + 14 * rnd(i + 5), '#ffd0e4', 0.16) }
  },
  forest(g, x0, w, jy, k0, now) { // 나뭇잎 사이로 쏟아지는 빛줄기와 깜빡이는 반딧불
    for (const [o, ww, al] of [[0.1, 40, 0.06], [0.45, 64, 0.05], [0.8, 34, 0.06]] as const) { const sway = Math.sin(now / 3000 + o * 9) * 14; const lg = g.createLinearGradient(0, 0, 0, jy * 0.9); lg.addColorStop(0, '#d8ffb0'); lg.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = al; g.fillStyle = lg; g.beginPath(); g.moveTo(x0 + w * o + sway, 0); g.lineTo(x0 + w * o + ww + sway, 0); g.lineTo(x0 + w * o + ww * 2 - 60 + sway, jy * 0.9); g.lineTo(x0 + w * o - 50 + sway, jy * 0.9); g.fill() }
    for (let i = 0; i < 11; i++) { const tw = 0.5 + 0.5 * Math.sin(now / 520 + i * 2.3), px = x0 + (rnd(i) * w + Math.sin(now / 1800 + i) * 14 + w) % w, py = (rnd(i + 12) * jy + Math.cos(now / 2100 + i) * 18 + jy) % jy; glowDot(g, px, py, 9, '#d8ff6a', 0.55 * tw); g.fillStyle = '#f4ffc0'; g.globalAlpha = 0.9 * tw; dot(g, px, py, 1.6) } g.globalAlpha = 1
  },
  crimson(g, x0, w, jy, k0, now) { // 바닥에서 달아오르는 붉은 열기와 솟는 불씨
    const hg = g.createLinearGradient(0, jy, 0, jy * 0.45); hg.addColorStop(0, 'rgba(255,60,50,.28)'); hg.addColorStop(1, 'rgba(255,60,50,0)'); g.fillStyle = hg; g.fillRect(x0, jy * 0.45, w, jy * 0.55)
    g.fillStyle = '#ffb13b'; for (let i = 0; i < 22; i++) { const k = ((now / (3000 + 2200 * rnd(i)) + rnd(i + 7)) % 1), px = x0 + rnd(i) * w + Math.sin(k * 9 + i) * 10, py = jy - k * jy * 0.95; g.globalAlpha = (1 - k) * 0.8; dot(g, px, py, 1 + 1.8 * rnd(i + 3) * (1 - k)) } g.globalAlpha = 1
  },
  violet(g, x0, w, jy, k0, now) { // 위에서 떨어지는 데이터 줄기(짧은 막대가 이어진 열)와 깜빡이는 노드
    for (let c = 0; c < 9; c++) { const px = x0 + 14 + c * (w - 28) / 8, sp = 90 + 70 * rnd(c), off = (now / sp + rnd(c + 3) * 60) % 30; g.fillStyle = k0.accent; for (let j = 0; j < 8; j++) { const py = ((j * 30 + off + rnd(c) * 200) % (jy + 40)) - 10; g.globalAlpha = 0.05 + 0.2 * (py / jy) * (1 - j / 10); g.fillRect(px - 1, py, 2, 12 + 8 * rnd(c + j)) } }
    g.fillStyle = k0.warn; for (let i = 0; i < 5; i++) { g.globalAlpha = 0.25 * (0.5 + 0.5 * Math.sin(now / 700 + i * 2)); dot(g, x0 + rnd(i + 40) * w, rnd(i + 50) * jy * 0.8, 2.2) } g.globalAlpha = 1
  },
  ice(g, x0, w, jy, k0, now) { // 위쪽에 일렁이는 오로라 띠와 촘촘한 눈
    for (const [col, yy, al] of [['#7affd8', 70, 0.12], ['#7ad8ff', 110, 0.10], ['#b08cff', 150, 0.08]] as const) { g.fillStyle = col; g.globalAlpha = al; g.beginPath(); g.moveTo(x0, 0); for (let px = 0; px <= w; px += 8) g.lineTo(x0 + px, yy + Math.sin(px / 52 + now / 1500 + yy) * 26); g.lineTo(x0 + w, 0); g.closePath(); g.fill() }
    g.fillStyle = '#ffffff'; for (let i = 0; i < 30; i++) { g.globalAlpha = 0.25 + 0.25 * rnd(i + 8); dot(g, x0 + (rnd(i) * w + Math.sin(now / 1100 + i) * 9 + w) % w, (rnd(i + 30) * jy + now / (26 + 34 * rnd(i + 1))) % jy, 0.9 + 1.4 * rnd(i + 5)) } g.globalAlpha = 1
  },
  mono(g, x0, w, jy, k0, now) { // 아주 옅은 세로 안내선과 위아래로 번지는 흰 안개
    g.fillStyle = '#ffffff'; g.globalAlpha = 0.035; for (let l = 1; l < 4; l++) g.fillRect(x0 + l * (w - 8) / 4 + 4, 0, 1, jy)
    const fg = g.createLinearGradient(0, 0, 0, jy); fg.addColorStop(0, 'rgba(255,255,255,.07)'); fg.addColorStop(0.3, 'rgba(255,255,255,0)'); fg.addColorStop(1, 'rgba(255,255,255,.08)'); g.globalAlpha = 1; g.fillStyle = fg; g.fillRect(x0, 0, w, jy)
    g.fillStyle = '#ffffff'; g.globalAlpha = 0.2; for (let i = 0; i < 12; i++) dot(g, x0 + rnd(i) * w, (rnd(i + 20) * jy + now / (60 + 50 * rnd(i))) % jy, 0.8); g.globalAlpha = 1
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
