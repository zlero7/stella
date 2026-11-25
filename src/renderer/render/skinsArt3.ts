// 다시 그린 스킨: 오션(심해 잠수정) · 선셋(해질녘 야자수 해변) · 레트로 아케이드(오락실 기계)
// 물결선·격자 같은 밋밋한 배경 대신, 소품과 분위기가 있는 장면으로 틀·콘솔·건반을 전부 새로 그렸다
import { FONT } from './theme'
import { mix, type GearSkin } from './gear'
import type { Art } from './skinsArt'
import { body, dot, fieldFill, grooves, hg, lab, lamps2, poly, rnd, rr, sides, vg } from './skinsArt2'

type G = CanvasRenderingContext2D

// 해파리: 종 모양 몸이 숨 쉬듯 부풀고, 촉수가 흔들린다
const jelly = (g: G, cx: number, cy: number, s: number, rgb: string, ph: number, now: number) => {
  const t = now / 900 + ph, pulse = 1 + 0.09 * Math.sin(t * 2)
  g.save(); g.translate(cx, cy); g.scale(s * pulse, s * (2 - pulse))
  const rg = g.createRadialGradient(0, -6, 2, 0, 0, 24); rg.addColorStop(0, 'rgba(255,255,255,.4)'); rg.addColorStop(1, `rgba(${rgb},.22)`)
  g.fillStyle = rg; g.beginPath(); g.moveTo(-20, 0); g.bezierCurveTo(-20, -30, 20, -30, 20, 0); g.quadraticCurveTo(10, 6, 0, 2); g.quadraticCurveTo(-10, 6, -20, 0); g.fill()
  g.strokeStyle = `rgba(${rgb},.7)`; g.lineWidth = 1.3; g.stroke()
  g.strokeStyle = `rgba(${rgb},.45)`; g.lineWidth = 1.5
  for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * 7, 3); for (let j = 1; j <= 7; j++) g.lineTo(k * 7 + Math.sin(t * 1.5 + j * 0.9 + k) * 4, 3 + j * 8); g.stroke() }
  g.fillStyle = `rgba(${rgb},.5)`; for (const [px, py] of [[-8, -12], [4, -16], [10, -7]]) dot(g, px, py, 1.6)
  g.restore()
}
// 야자나무 잎: 줄기 끝에서 휘어져 내려오는 어두운 잎 하나 (d: 안쪽/바깥쪽 방향)
const frond = (g: G, x: number, y: number, ang: number, len: number) => {
  g.save(); g.translate(x, y); g.rotate(ang)
  g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(len * 0.35, -len * 0.3, len * 0.8, -len * 0.18, len, len * 0.22); g.bezierCurveTo(len * 0.8, len * 0.02, len * 0.35, len * 0.08, 0, 0)
  g.fillStyle = vg(g, -len * 0.3, len * 0.2, '#1c4a2a', '#06160c'); g.fill()
  g.strokeStyle = 'rgba(120,200,120,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(len * 0.35, -len * 0.28, len * 0.8, -len * 0.14, len, len * 0.22); g.stroke()
  g.fillStyle = '#06160c'; for (let i = 1; i < 7; i++) { const t = i / 7, px = len * t, py = -len * 0.2 * Math.sin(t * 2.4) + len * 0.1 * t; g.beginPath(); g.moveTo(px - 4, py); g.lineTo(px, py + 13 * (1 - t * 0.5)); g.lineTo(px + 4, py); g.fill() }
  g.restore()
}
const gauge = (g: G, cx: number, cy: number, r: number, ang: number, ring: string, glow: string) => {
  g.fillStyle = '#020c10'; dot(g, cx, cy, r); g.strokeStyle = ring; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke()
  g.strokeStyle = glow; g.lineWidth = 1.2; g.globalAlpha = 0.7; g.beginPath(); for (let i = 0; i < 9; i++) { const a = Math.PI * 0.8 + (i / 8) * Math.PI * 1.4; g.moveTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6)); g.lineTo(cx + Math.cos(a) * (r - 2.5), cy + Math.sin(a) * (r - 2.5)) } g.stroke(); g.globalAlpha = 1
  g.strokeStyle = '#ff6f7a'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ang) * (r - 6), cy + Math.sin(ang) * (r - 6)); g.stroke(); g.fillStyle = ring; dot(g, cx, cy, 2.4)
}

export const ART3: Record<string, Art> = {
  ocean: { // 심해 잠수정: 위에서 내려오는 빛줄기, 떠다니는 해파리와 바다눈 · 리벳 박힌 선체 기둥에 둥근 창 · 계기판과 소나가 달린 조종대 · 건반은 둥근 창
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0)
      const now = performance.now()
      g.save(); g.beginPath(); g.rect(x - 4, 0, fw + 8, jy); g.clip()
      const dg = g.createLinearGradient(0, 0, 0, jy); dg.addColorStop(0, 'rgba(20,110,140,.30)'); dg.addColorStop(0.6, 'rgba(4,30,50,.18)'); dg.addColorStop(1, 'rgba(0,8,20,.4)'); g.fillStyle = dg; g.fillRect(x - 4, 0, fw + 8, jy)
      for (const [o, w2] of [[0.12, 52], [0.5, 84], [0.84, 42]] as const) { const sw = Math.sin(now / 4200 + o * 7) * 16, lg = g.createLinearGradient(0, 0, 0, jy * 0.9); lg.addColorStop(0, 'rgba(170,244,255,.20)'); lg.addColorStop(1, 'rgba(170,244,255,0)'); g.fillStyle = lg; poly(g, [[x + fw * o + sw, 0], [x + fw * o + w2 + sw, 0], [x + fw * o + w2 * 2.2 + sw - 40, jy * 0.9], [x + fw * o - 30 + sw, jy * 0.9]]); g.fill() }
      jelly(g, x + fw * 0.24 + Math.sin(now / 3300) * 14, 150 + Math.sin(now / 2500) * 18, 1.1, '120,235,255', 0, now)
      jelly(g, x + fw * 0.8 + Math.sin(now / 2900 + 2) * 12, 330 + Math.sin(now / 2100 + 1) * 16, 0.8, '190,160,255', 2, now)
      g.fillStyle = '#d8fbff'; for (let i = 0; i < 26; i++) { g.globalAlpha = 0.18 + 0.3 * rnd(i + 8); dot(g, x - 4 + (rnd(i) * (fw + 8) + Math.sin(now / 1300 + i) * 8 + fw + 8) % (fw + 8), (rnd(i + 30) * jy + now / (28 + 40 * rnd(i + 1))) % jy, 0.8 + 1.2 * rnd(i + 5)) } g.globalAlpha = 1
      g.restore()
      for (const [d, rx] of sides(x, fw)) {
        g.fillStyle = hg(g, rx, rx + 26, '#06222c', '#2c8398', '#0c3846', '#041a22'); g.fillRect(rx, 0, 26, 720)
        g.fillStyle = 'rgba(190,250,255,.3)'; g.fillRect(rx + 5, 0, 2.5, 720)
        g.fillStyle = 'rgba(0,0,0,.4)'; for (let by = 60; by < jy; by += 100) { g.fillRect(rx, by, 26, 2); g.fillStyle = '#9fe8f8'; dot(g, rx + 4, by + 8, 1.5); dot(g, rx + 22, by + 8, 1.5); g.fillStyle = 'rgba(0,0,0,.4)' }
        for (const py of [340, 460]) { // 기둥 바깥으로 달린 둥근 창
          const px = rx + (d < 0 ? -12 : 38); g.fillStyle = vg(g, py - 15, py + 15, '#9fd8e4', '#0e4658'); dot(g, px, py, 14.5)
          const gl = g.createRadialGradient(px - 3, py - 4, 1, px, py, 10); gl.addColorStop(0, '#d8ffff'); gl.addColorStop(0.5, '#3ec8e0'); gl.addColorStop(1, '#06303e'); g.fillStyle = gl; dot(g, px, py, 10.5)
          g.fillStyle = '#04141a'; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; dot(g, px + Math.cos(a) * 12.4, py + Math.sin(a) * 12.4, 1) }
          g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(px - 3.5, py - 4, 3.5, 1.8, -0.6, 0, 7); g.fill()
        }
        g.fillStyle = 'rgba(220,255,255,.55)'; for (let i = 0; i < 7; i++) { const k = ((now / (2200 + 500 * i) + rnd(i)) % 1); dot(g, rx + (d < 0 ? -10 : 36) + Math.sin(k * 9 + i) * 6, jy - 20 - k * 220, 1.4 + 2.4 * rnd(i + 4) * (1 - k * 0.4)) }
      }
      grooves(g, x, fw, jy, k0); lamps2(g, x, fw, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, _chibi, k0) {
      const top = jy + 28, now = performance.now(); g.beginPath(); g.roundRect(x - 74, top, fw + 148, 720 - top + 30, 20); body(g, k0, top, '#9fe8f8', 2)
      g.fillStyle = k0.accent; g.globalAlpha = 0.7; g.fillRect(x - 56, top + 4, fw + 112, 2); g.globalAlpha = 1
      g.fillStyle = '#9fe8f8'; for (let px = x - 60; px <= x + fw + 60; px += 24) dot(g, px, top + 12, 1.8)
      gauge(g, x - 44, jy + 100, 21, -1.9 + Math.sin(now / 800) * 0.5, '#9fe8f8', '#5ee8ff'); gauge(g, x + fw + 44, jy + 100, 21, -1.2 + Math.sin(now / 950 + 1) * 0.5, '#9fe8f8', '#5ee8ff')
      const sx = x + fw / 2, sy = jy + 150 // 소나 화면: 돌아가는 선과 점
      g.fillStyle = '#021418'; g.beginPath(); g.roundRect(sx - 62, top + 100, 124, 22, 11); g.fill(); g.strokeStyle = '#9fe8f8'; g.lineWidth = 1.5; g.stroke()
      g.save(); g.beginPath(); g.roundRect(sx - 60, top + 102, 120, 18, 9); g.clip(); const sw = ((now / 1800) % 1) * 140 - 10; const sg = g.createLinearGradient(sx - 60 + sw - 24, 0, sx - 60 + sw, 0); sg.addColorStop(0, 'rgba(94,232,255,0)'); sg.addColorStop(1, 'rgba(94,232,255,.8)'); g.fillStyle = sg; g.fillRect(sx - 60 + sw - 24, top + 102, 24, 18)
      g.fillStyle = '#ff6f7a'; for (const [dx, dy] of [[-30, 6], [14, 12], [40, 7]]) dot(g, sx + dx, top + 102 + dy, 1.6); g.restore(); void sy
    },
    key(g, x, y, w, h, on, blue, label, k0) {
      const cx = x + w / 2, cy = y + h / 2 + (on ? 1 : 0), r = Math.min(w, h) / 2
      if (on) { g.save(); g.shadowColor = k0.accent; g.shadowBlur = 22 }
      g.fillStyle = vg(g, cy - r, cy + r, '#b8e4ee', '#1a5a70'); dot(g, cx, cy, r); if (on) g.restore()
      g.strokeStyle = '#04141a'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke()
      const gl = g.createRadialGradient(cx - r * 0.25, cy - r * 0.3, 1, cx, cy, r - 5); if (on) { gl.addColorStop(0, '#ffffff'); gl.addColorStop(1, '#5ee8ff') } else { gl.addColorStop(0, blue ? '#4ab8d0' : '#7ad4e4'); gl.addColorStop(1, blue ? '#062a38' : '#0c4a5c') } g.fillStyle = gl; dot(g, cx, cy, r - 5)
      g.fillStyle = '#04141a'; for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; dot(g, cx + Math.cos(a) * (r - 2.6), cy + Math.sin(a) * (r - 2.6), 0.9) }
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(cx - r * 0.3, cy - r * 0.38, r * 0.3, r * 0.14, -0.6, 0, 7); g.fill()
      lab(g, x, y + (on ? 1 : 0), w, h, label, on ? '#04303c' : '#e8ffff')
    },
    lcd: rr(8), chip: rr(8)
  },

  sunset: { // 해질녘 야자수 해변: 노을 하늘과 지는 해, 야자 줄기와 잎, 줄 전구 · 아래는 나무 갑판과 횃불 · 건반은 해 모양 단추
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0)
      const now = performance.now()
      g.save(); g.beginPath(); g.rect(x - 4, 0, fw + 8, jy); g.clip()
      const sky = g.createLinearGradient(0, 0, 0, jy); sky.addColorStop(0, 'rgba(60,24,110,.55)'); sky.addColorStop(0.5, 'rgba(210,70,110,.32)'); sky.addColorStop(1, 'rgba(255,170,70,.42)'); g.fillStyle = sky; g.fillRect(x - 4, 0, fw + 8, jy)
      const sx = x + fw / 2, sy = jy - 62, R = 58
      const halo = g.createRadialGradient(sx, sy, R * 0.6, sx, sy, R * 4); halo.addColorStop(0, 'rgba(255,200,110,.5)'); halo.addColorStop(1, 'rgba(255,120,80,0)'); g.fillStyle = halo; g.fillRect(x - 4, 0, fw + 8, jy)
      g.fillStyle = vg(g, sy - R, sy + R, '#fff0a0', '#ff9a4a', '#ff4f8a'); dot(g, sx, sy, R)
      g.fillStyle = 'rgba(255,160,110,.3)'; for (let i = 0; i < 4; i++) { const cy = 90 + i * 70, off = ((now / (90 + i * 30) + i * 60) % (fw + 160)) - 80; g.beginPath(); g.ellipse(x + off, cy, 60 + i * 8, 4 + i, 0, 0, 7); g.fill() }
      g.strokeStyle = '#2a0e24'; g.lineWidth = 1.8; g.lineCap = 'round'; for (let i = 0; i < 4; i++) { const bx = x + ((now / (48 + i * 10) + i * 90) % (fw + 120)) - 60, by = 70 + i * 36 + Math.sin(now / 400 + i) * 3, f = Math.sin(now / 180 + i * 2) * 3; g.beginPath(); g.moveTo(bx - 7, by - 2 + f); g.quadraticCurveTo(bx - 3, by - 5, bx, by); g.quadraticCurveTo(bx + 3, by - 5, bx + 7, by - 2 + f); g.stroke() } g.lineCap = 'butt'
      g.restore()
      for (const [d, rx] of sides(x, fw)) {
        g.fillStyle = hg(g, rx, rx + 26, '#24120a', '#80502a', '#3c2010', '#1a0c06'); g.fillRect(rx, 0, 26, 720)
        g.fillStyle = 'rgba(0,0,0,.4)'; for (let by = 18; by < jy; by += 26) { g.beginPath(); g.moveTo(rx, by); g.quadraticCurveTo(rx + 13, by + 5, rx + 26, by); g.lineTo(rx + 26, by + 2.4); g.quadraticCurveTo(rx + 13, by + 7.4, rx, by + 2.4); g.fill() }
        g.fillStyle = 'rgba(255,220,170,.22)'; g.fillRect(rx + 5, 0, 2.5, 720)
        for (const [a, l] of [[-0.35, 78], [0.15, 92], [0.65, 70], [1.3, 60], [-0.85, 66]] as const) frond(g, rx + 13, 14, d < 0 ? Math.PI - a : a, l)
        g.fillStyle = '#5a3a1a'; dot(g, rx + 8, 20, 4); dot(g, rx + 18, 22, 3.6) // 코코넛
      }
      const bulbs = 12; g.strokeStyle = '#2a1408'; g.lineWidth = 1.5; g.beginPath() // 줄 전구
      for (let i = 0; i <= bulbs; i++) { const t = i / bulbs, px = x - 4 + t * (fw + 8), py = 8 + Math.sin(t * Math.PI) * 24; i ? g.lineTo(px, py) : g.moveTo(px, py) } g.stroke()
      for (let i = 1; i < bulbs; i++) { const t = i / bulbs, px = x - 4 + t * (fw + 8), py = 8 + Math.sin(t * Math.PI) * 24 + 5, tw = 0.65 + 0.35 * Math.sin(now / 500 + i * 1.7); const gl = g.createRadialGradient(px, py, 0, px, py, 14); gl.addColorStop(0, `rgba(255,220,130,${0.7 * tw})`); gl.addColorStop(1, 'rgba(255,200,100,0)'); g.fillStyle = gl; g.fillRect(px - 14, py - 14, 28, 28); g.fillStyle = '#fff0b0'; dot(g, px, py, 2.6) }
      grooves(g, x, fw, jy, k0); lamps2(g, x, fw, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, _chibi, k0) {
      const top = jy + 24, now = performance.now(); poly(g, [[x - 80, top + 6], [x + fw + 80, top + 6], [x + fw + 74, 720], [x - 74, 720]])
      g.fillStyle = vg(g, top, 720, '#5a3420', '#34190e', '#150a05'); g.fill(); g.strokeStyle = '#d08a4a'; g.lineWidth = 2; g.stroke()
      g.save(); poly(g, [[x - 80, top + 6], [x + fw + 80, top + 6], [x + fw + 74, 720], [x - 74, 720]]); g.clip()
      g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1.4; for (let py = top + 34; py < 720; py += 26) { g.beginPath(); g.moveTo(x - 80, py); g.lineTo(x + fw + 80, py); g.stroke(); for (let px = x - 80 + ((py / 26) % 2) * 60; px < x + fw + 80; px += 120) { g.beginPath(); g.moveTo(px, py); g.lineTo(px, py + 26); g.stroke() } }
      g.restore()
      g.fillStyle = vg(g, top - 8, top + 12, '#ffcf8a', '#a8642c'); g.fillRect(x - 84, top - 8, fw + 168, 18); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x - 84, top + 10, fw + 168, 2)
      for (const px of [x - 64, x + fw + 64]) { // 횃불
        g.fillStyle = '#3a2010'; g.fillRect(px - 3, top - 30, 6, 50); const fl = Math.sin(now / 90 + px) * 2, gl = g.createRadialGradient(px, top - 40, 0, px, top - 40, 34); gl.addColorStop(0, 'rgba(255,190,90,.6)'); gl.addColorStop(1, 'rgba(255,120,50,0)'); g.fillStyle = gl; g.fillRect(px - 34, top - 74, 68, 68)
        g.fillStyle = '#ff7a2a'; g.beginPath(); g.moveTo(px - 6, top - 32); g.quadraticCurveTo(px - 7 + fl, top - 46, px + fl, top - 58); g.quadraticCurveTo(px + 7 + fl, top - 46, px + 6, top - 32); g.closePath(); g.fill(); g.fillStyle = '#ffe27a'; g.beginPath(); g.moveTo(px - 3, top - 32); g.quadraticCurveTo(px + fl * 0.5, top - 44, px + 3, top - 32); g.fill()
      }
    },
    key(g, x, y, w, h, on, blue, label, k0) {
      const cx = x + w / 2, cy = y + h / 2 + (on ? 1 : 0), r = Math.min(w, h) / 2 - 1
      if (on) { g.save(); g.shadowColor = k0.accent; g.shadowBlur = 22 }
      g.fillStyle = on ? '#fff0a0' : blue ? '#b07cff' : '#ffb13b'; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; poly(g, [[cx + Math.cos(a - 0.12) * (r - 2), cy + Math.sin(a - 0.12) * (r - 2)], [cx + Math.cos(a) * (r + 3), cy + Math.sin(a) * (r + 3)], [cx + Math.cos(a + 0.12) * (r - 2), cy + Math.sin(a + 0.12) * (r - 2)]]); g.fill() }
      g.fillStyle = on ? vg(g, cy - r, cy + r, '#ffffff', '#ffb13b') : blue ? vg(g, cy - r, cy + r, '#d8b8ff', '#5a2a9a') : vg(g, cy - r, cy + r, '#ffe27a', '#ff4f7a'); dot(g, cx, cy, r - 4); if (on) g.restore()
      g.strokeStyle = '#4a1a2a'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, r - 4, 0, 7); g.stroke()
      g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(cx - r * 0.28, cy - r * 0.4, r * 0.3, r * 0.13, -0.5, 0, 7); g.fill()
      lab(g, x, y + (on ? 1 : 0), w, h, label, '#3a1018')
    },
    lcd: rr(6), chip: rr(6)
  },

  arcade: { // 오락실 기계: 옆판에 알록달록한 사이드 아트, 위에 불 켜진 마키, CRT 화면 · 아래는 조이스틱과 동전 투입구가 있는 조작판 · 건반은 큼직한 버튼
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0)
      const now = performance.now()
      g.save(); g.beginPath(); g.rect(x - 4, 0, fw + 8, jy); g.clip()
      const ph = g.createRadialGradient(x + fw / 2, jy * 0.45, 10, x + fw / 2, jy * 0.45, fw); ph.addColorStop(0, 'rgba(70,90,255,.20)'); ph.addColorStop(1, 'rgba(0,0,30,0)'); g.fillStyle = ph; g.fillRect(x - 4, 0, fw + 8, jy)
      g.fillStyle = 'rgba(0,0,0,.22)'; for (let py = 0; py < jy; py += 3) g.fillRect(x - 4, py, fw + 8, 1)
      g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x - 4, ((now / 14) % (jy + 60)) - 60, fw + 8, 40) // 화면을 훑는 띠
      g.restore()
      for (const [d, rx] of sides(x, fw)) {
        g.fillStyle = '#0c0a22'; g.fillRect(rx - 4, 0, 34, 720)
        g.save(); g.beginPath(); g.rect(rx, 0, 26, 720); g.clip()
        const cols = ['#ff3b8a', '#37e8ff', '#ffd22e']; for (let k = 0; k < 3; k++) { g.fillStyle = cols[k]; g.beginPath(); for (let yy = -60; yy < 780; yy += 120) { g.moveTo(rx - 10, yy + k * 18); g.lineTo(rx + 36, yy - 48 + k * 18); g.lineTo(rx + 36, yy - 30 + k * 18); g.lineTo(rx - 10, yy + 18 + k * 18) } g.fill() }
        g.fillStyle = hg(g, rx, rx + 26, 'rgba(0,0,0,.5)', 'rgba(255,255,255,.12)', 'rgba(0,0,0,.45)'); g.fillRect(rx, 0, 26, 720); g.restore()
        g.fillStyle = '#04030f'; g.fillRect(rx + (d < 0 ? 26 : -4), 0, 4, 720); g.fillRect(rx + (d < 0 ? -4 : 26), 0, 4, 720)
        g.fillStyle = '#c8c8e8'; for (let by = 40; by < jy; by += 110) { dot(g, rx + 3, by, 1.6); dot(g, rx + 23, by, 1.6) }
      }
      const mw = fw + 60, mx = x - 26; g.fillStyle = '#0c0a22'; g.beginPath(); g.roundRect(mx - 2, -4, mw + 4, 30, 5); g.fill() // 마키
      g.fillStyle = vg(g, 0, 24, '#ffe27a', '#ff9a1f'); g.beginPath(); g.roundRect(mx + 3, 1, mw - 6, 20, 4); g.fill()
      g.font = `900 14px ${FONT}`; g.textAlign = 'center'; g.fillStyle = '#7a1a2a'; g.fillText('S T E L L A', x + fw / 2, 17)
      for (let i = 0; i < 14; i++) { g.fillStyle = (Math.floor(now / 240) + i) % 2 ? '#fff6c8' : '#ff3b8a'; dot(g, mx + 8 + i * ((mw - 16) / 13), 25, 1.8) }
      g.textAlign = 'left'
      grooves(g, x, fw, jy, k0); lamps2(g, x, fw, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, _chibi, k0) {
      const top = jy + 22, now = performance.now(); poly(g, [[x - 64, top], [x + fw + 64, top], [x + fw + 82, top + 36], [x + fw + 82, 720], [x - 82, 720], [x - 82, top + 36]])
      g.fillStyle = vg(g, top, 720, '#3a2c8a', '#1a1250', '#0a0624'); g.fill(); g.strokeStyle = '#ffd22e'; g.lineWidth = 2; g.stroke()
      g.save(); poly(g, [[x - 64, top], [x + fw + 64, top], [x + fw + 82, top + 36], [x + fw + 82, 720], [x - 82, 720], [x - 82, top + 36]]); g.clip()
      const cols = ['#ff3b8a', '#37e8ff', '#ffd22e']; for (let k = 0; k < 3; k++) { g.fillStyle = cols[k]; g.globalAlpha = 0.75; g.beginPath(); for (let px = x - 120 + k * 12; px < x + fw + 120; px += 110) { g.moveTo(px, 720); g.lineTo(px + 40, top + 100); g.lineTo(px + 52, top + 100); g.lineTo(px + 12, 720) } g.fill() } g.globalAlpha = 1
      g.restore()
      const jx = x - 52, jyy = top + 66 // 조이스틱
      g.fillStyle = '#0a0624'; dot(g, jx, jyy + 8, 18); g.strokeStyle = '#c8c8e8'; g.lineWidth = 1.5; g.beginPath(); g.arc(jx, jyy + 8, 18, 0, 7); g.stroke()
      g.fillStyle = '#c8c8e8'; g.fillRect(jx - 3, jyy - 16, 6, 26); g.fillStyle = vg(g, jyy - 34, jyy - 8, '#ff9a9a', '#c01818'); dot(g, jx, jyy - 22, 12); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(jx - 4, jyy - 27, 4, 2.4, -0.5, 0, 7); g.fill()
      const cx = x + fw + 52, cy = top + 70; g.fillStyle = '#0a0624'; g.beginPath(); g.roundRect(cx - 20, cy - 24, 40, 52, 5); g.fill(); g.strokeStyle = '#c8c8e8'; g.lineWidth = 1.2; g.stroke() // 동전 투입구
      const bl = Math.floor(now / 500) % 2; for (const dy of [-10, 6]) { g.fillStyle = bl ? '#ff3b3b' : '#7a1a1a'; g.fillRect(cx - 4, cy + dy - 8, 8, 16); g.fillStyle = '#000'; g.fillRect(cx - 1, cy + dy - 6, 2, 12) }
      g.font = `800 9px ${FONT}`; g.textAlign = 'center'; g.fillStyle = '#ffd22e'; g.fillText('COIN', cx, cy + 25); g.textAlign = 'left'
    },
    key(g, x, y, w, h, on, blue, label, k0) {
      const cx = x + w / 2, cy = y + h / 2 + (on ? 2 : 0), r = Math.min(w, h) / 2, base = blue ? ['#ff9a9a', '#e01a1a', '#6a0808'] : ['#fff3a0', '#f0b81a', '#7a5a08']
      g.fillStyle = '#04030f'; dot(g, cx, y + h / 2 + 3, r + 1)
      if (on) { g.save(); g.shadowColor = blue ? '#ff3b3b' : '#ffd22e'; g.shadowBlur = 20 }
      g.fillStyle = on ? vg(g, cy - r, cy + r, '#ffffff', base[1]) : vg(g, cy - r, cy + r, base[0], base[1], base[2]); dot(g, cx, cy, r - 2); if (on) g.restore()
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.4; g.beginPath(); g.arc(cx, cy, r - 2, 0, 7); g.stroke()
      g.fillStyle = 'rgba(255,255,255,.65)'; g.beginPath(); g.ellipse(cx - r * 0.2, cy - r * 0.42, r * 0.5, r * 0.2, -0.3, 0, 7); g.fill()
      lab(g, x, y + (on ? 2 : 0), w, h, label, '#2a0a10'); void mix; void k0
    },
    lcd: rr(3), chip: rr(3)
  }
}
export type { GearSkin }
