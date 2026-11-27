// 다시 그린 스킨: 스틸(DJ 부스) · 사이버 바이올렛(서버실) · 모노(그랜드 피아노) · 선셋(해질녘 호수)
import { FONT } from './theme'
import type { Art } from './skinsArt'
import { body, dot, fieldFill, grooves, hg, lab, lamps2, poly, rnd, rr, sides, vg } from './skinsArt2'

type G = CanvasRenderingContext2D
const glowAt = (g: G, x: number, y: number, r: number, rgb: string, a: number) => { const k = g.createRadialGradient(x, y, 0, x, y, r); k.addColorStop(0, `rgba(${rgb},${a})`); k.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = k; g.fillRect(x - r, y - r, r * 2, r * 2) }
const platter = (g: G, cx: number, cy: number, r: number, ang: number, lab2: string) => { // 턴테이블: 홈이 파인 레코드, 도는 표시선, 톤암
  g.fillStyle = '#2a3038'; dot(g, cx, cy, r + 4); g.fillStyle = '#06080c'; dot(g, cx, cy, r)
  g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1; for (let k = 8; k < r; k += 4) { g.beginPath(); g.arc(cx, cy, k, 0, 7); g.stroke() }
  g.fillStyle = lab2; dot(g, cx, cy, r * 0.36); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ang) * r * 0.9, cy + Math.sin(ang) * r * 0.9); g.stroke(); g.fillStyle = '#e8f6ff'; dot(g, cx, cy, 2.6)
  g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r, -0.9, -0.5); g.closePath(); g.fill()
}

export const ART6: Record<string, Art> = {
  steel: { // DJ 부스: 솔질한 강철 기둥에 시안 빛줄기가 흐르고 육각 볼트 · 아래는 두 대의 턴테이블이 도는 데크 · 건반은 LED 패드
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0)
      const now = performance.now()
      g.save(); g.beginPath(); g.rect(x - 4, 0, fw + 8, jy); g.clip()
      g.strokeStyle = 'rgba(80,240,220,.045)'; g.lineWidth = 1; g.beginPath(); for (let o = -jy; o < fw + 8; o += 14) { g.moveTo(x - 4 + o, jy); g.lineTo(x - 4 + o + jy * 0.6, 0) } g.stroke()
      for (const [o, ww, al] of [[0.16, 44, 0.07], [0.6, 72, 0.055], [0.88, 30, 0.07]] as const) { const lg = g.createLinearGradient(0, 0, 0, jy); lg.addColorStop(0, 'rgba(80,240,220,.9)'); lg.addColorStop(1, 'rgba(80,240,220,0)'); g.globalAlpha = al; g.fillStyle = lg; poly(g, [[x + fw * o, 0], [x + fw * o + ww, 0], [x + fw * o + ww * 2.2 - 30, jy], [x + fw * o - 20, jy]]); g.fill() } g.globalAlpha = 1
      const pulse = ((now / 1600) % 1) * (jy + 160) - 80; const sg = g.createLinearGradient(0, pulse - 60, 0, pulse + 60); sg.addColorStop(0, 'rgba(80,240,220,0)'); sg.addColorStop(0.5, 'rgba(80,240,220,.10)'); sg.addColorStop(1, 'rgba(80,240,220,0)'); g.fillStyle = sg; g.fillRect(x - 4, pulse - 60, fw + 8, 120)
      g.fillStyle = '#bff8ff'; g.globalAlpha = 0.4; for (let i = 0; i < 16; i++) dot(g, x - 4 + (rnd(i) * (fw + 8) + Math.sin(now / 1400 + i) * 8 + fw + 8) % (fw + 8), ((rnd(i + 30) * jy - now / (50 + 40 * rnd(i + 2))) % jy + jy) % jy, 0.8 + rnd(i + 6)); g.globalAlpha = 1
      g.restore()
      for (const [d, rx] of sides(x, fw)) {
        g.fillStyle = hg(g, rx, rx + 26, '#1a1e26', '#6a7484', '#3a4252', '#12151b'); g.fillRect(rx, 0, 26, 720)
        g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 1; g.beginPath(); for (let k = 3; k < 26; k += 3) { g.moveTo(rx + k, 0); g.lineTo(rx + k, 720) } g.stroke()
        const ph = ((now / 12) % 720); const lg = g.createLinearGradient(0, ph - 120, 0, ph); lg.addColorStop(0, 'rgba(80,240,220,0)'); lg.addColorStop(1, 'rgba(80,240,220,.9)'); g.fillStyle = lg; g.fillRect(rx + (d < 0 ? 21 : 2), ph - 120, 3, 120)
        g.fillStyle = '#50f0dc'; g.globalAlpha = 0.45; g.fillRect(rx + (d < 0 ? 21 : 2), 0, 3, 720); g.globalAlpha = 1
        for (let by = 40; by < jy; by += 90) { g.fillStyle = '#10131a'; poly(g, Array.from({ length: 6 }, (_, k) => [rx + 12 + Math.cos(k * Math.PI / 3) * 5.4, by + Math.sin(k * Math.PI / 3) * 5.4])); g.fill(); g.strokeStyle = '#8a95a8'; g.lineWidth = 1; g.stroke() }
        g.fillStyle = vg(g, 250, jy + 26, '#6a7484', '#1a1e26'); poly(g, d < 0 ? [[rx, 250], [rx - 30, 330], [rx - 30, jy + 26], [rx, jy + 26]] : [[rx + 26, 250], [rx + 56, 330], [rx + 56, jy + 26], [rx + 26, jy + 26]]); g.fill(); g.strokeStyle = '#50f0dc'; g.lineWidth = 1.5; g.globalAlpha = 0.7; g.beginPath(); g.moveTo(rx + (d < 0 ? -30 : 56), 330); g.lineTo(rx + (d < 0 ? -30 : 56), jy + 26); g.stroke(); g.globalAlpha = 1
      }
      grooves(g, x, fw, jy, k0); lamps2(g, x, fw, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, _chibi, k0) {
      const top = jy + 24, now = performance.now(); poly(g, [[x - 80, top + 20], [x - 56, top], [x + fw + 56, top], [x + fw + 80, top + 20], [x + fw + 80, 720], [x - 80, 720]])
      g.fillStyle = vg(g, top, 720, '#5a6474', '#2a303a', '#0e1116'); g.fill(); g.strokeStyle = '#8a95a8'; g.lineWidth = 2; g.stroke()
      g.save(); g.clip(); g.strokeStyle = 'rgba(255,255,255,.06)'; g.beginPath(); for (let k = 0; k < 40; k++) { g.moveTo(x - 80, top + k * 6); g.lineTo(x + fw + 80, top + k * 6) } g.stroke(); g.restore()
      g.fillStyle = '#50f0dc'; g.globalAlpha = 0.8; g.fillRect(x - 54, top + 3, fw + 108, 2); g.globalAlpha = 1
      platter(g, x - 40, jy + 70, 31, now / 700, '#50f0dc'); platter(g, x + fw + 40, jy + 70, 31, -now / 900 + 1, '#ff4654')
      g.fillStyle = '#c8d2e0'; for (const px of [x - 70, x + fw + 70]) { dot(g, px, top + 12, 2) } void k0
    },
    key(g, x, y, w, h, on, blue, label) {
      const c = blue ? '#50f0dc' : '#9fb4cc'; if (on) { g.save(); g.shadowColor = c; g.shadowBlur = 20 }
      g.beginPath(); g.roundRect(x, y, w, h, 6); g.fillStyle = on ? vg(g, y, y + h, '#ffffff', c) : vg(g, y, y + h, '#3a4252', '#12151b'); g.fill(); if (on) g.restore()
      g.strokeStyle = on ? '#ffffff' : '#8a95a8'; g.lineWidth = 2; g.beginPath(); g.roundRect(x, y, w, h, 6); g.stroke()
      g.fillStyle = c; g.globalAlpha = on ? 1 : 0.85; g.fillRect(x + 8, y + h - 9, w - 16, 3); g.globalAlpha = 1; g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.roundRect(x + 3, y + 3, w - 6, h * 0.35, 4); g.fill()
      lab(g, x, y - 4, w, h, label, on ? '#06302c' : c)
    },
    lcd: rr(5), chip: rr(5)
  },

  violet: { // 서버실: 떨어지는 16진수 코드 비 · 랙 서버에 LED가 깜빡이고 케이블이 늘어진 기둥 · 아래는 해커의 키보드 데크 · 건반은 입체 키캡
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0)
      const now = performance.now()
      g.save(); g.beginPath(); g.rect(x - 4, 0, fw + 8, jy); g.clip()
      glowAt(g, x + fw / 2, jy * 0.35, fw * 0.9, '140,90,255', 0.16)
      g.font = `700 11px Consolas, monospace`; g.textAlign = 'center'
      for (let c = 0; c < 11; c++) {
        const px = x + 8 + c * ((fw - 8) / 10), sp = 60 + 50 * rnd(c), off = (now / sp + rnd(c + 3) * 90) % 22
        for (let j = 0; j < 22; j++) { const py = j * 22 - 22 + off, a = Math.max(0, 1 - (py / jy)) * 0.5 * (1 - j / 26); if (py < 0) continue; g.fillStyle = j === 0 ? '#e8d8ff' : k0.accent; g.globalAlpha = j === 0 ? 0.8 : 0.08 + a * 0.5; g.fillText('0123456789ABCDEF'[(Math.floor(now / 140) + c * 7 + j * 3 + ((c * j) % 5)) % 16], px, py) }
      }
      g.globalAlpha = 1; g.textAlign = 'left'
      g.strokeStyle = 'rgba(181,140,255,.1)'; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < 3; i++) { const cy = 90 + i * 130; g.moveTo(x - 4, cy); g.lineTo(x + fw + 4, cy) } g.stroke()
      g.restore()
      for (const [d, rx] of sides(x, fw)) {
        g.fillStyle = '#0a0814'; g.fillRect(rx, 0, 26, 720); g.fillStyle = hg(g, rx, rx + 26, 'rgba(0,0,0,.5)', 'rgba(140,100,255,.12)', 'rgba(0,0,0,.5)'); g.fillRect(rx, 0, 26, 720)
        for (let sy = 6; sy < jy + 10; sy += 16) { g.fillStyle = '#16122a'; g.fillRect(rx + 1, sy, 24, 12); g.strokeStyle = '#3a2a6a'; g.lineWidth = 1; g.strokeRect(rx + 1.5, sy + 0.5, 23, 11)
          const r1 = rnd(sy * 3 + d), blink = Math.floor(now / (300 + 400 * r1) + r1 * 9) % 3
          g.fillStyle = blink === 0 ? '#7dff9a' : blink === 1 ? k0.accent : '#ff5a9a'; dot(g, rx + (d < 0 ? 5 : 21), sy + 6, 1.6); g.fillStyle = '#2a2050'; for (let k = 0; k < 4; k++) g.fillRect(rx + 8 + k * 3, sy + 3, 1.4, 6) }
        g.lineCap = 'round'; for (let k = 0; k < 3; k++) { const cx = rx + (d < 0 ? -4 : 30), cy0 = 120 + k * 150; g.strokeStyle = ['#b58cff', '#ff5a9a', '#37e8ff'][k]; g.lineWidth = 2.6; g.beginPath(); g.moveTo(rx + 13, cy0); g.bezierCurveTo(cx + d * 28, cy0 + 20, cx + d * 30, cy0 + 70, cx + d * 8, cy0 + 100); g.stroke() } g.lineCap = 'butt'
      }
      grooves(g, x, fw, jy, k0); lamps2(g, x, fw, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, _chibi, k0) {
      const top = jy + 22, now = performance.now(); poly(g, [[x - 60, top], [x + fw + 60, top], [x + fw + 84, 720], [x - 84, 720]])
      g.fillStyle = vg(g, top, 720, '#1c1238', '#0c0820', '#040210'); g.fill(); g.strokeStyle = k0.accent; g.lineWidth = 2; g.stroke()
      g.save(); g.shadowColor = k0.accent; g.shadowBlur = 8; g.fillStyle = '#2a1a5a'
      for (const [d, off] of [[-1, 0], [1, 0]] as const) for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const px = d < 0 ? x - 62 + c * 15 : x + fw + 6 + c * 15, py = top + 44 + r * 15; g.fillStyle = '#241a4a'; g.beginPath(); g.roundRect(px, py, 12, 12, 2); g.fill(); g.fillStyle = 'rgba(181,140,255,.35)'; g.fillRect(px + 1, py + 1, 10, 2); void off }
      g.restore()
      g.fillStyle = k0.accent; for (let i = 0; i < 24; i++) { const hgt = 3 + 12 * (0.5 + 0.5 * Math.sin(now / 160 + i * 0.8)); g.globalAlpha = 0.55; g.fillRect(x + 16 + i * 12.4, top + 124 - hgt, 7, hgt) } g.globalAlpha = 1
    },
    key(g, x, y, w, h, on, blue, label, k0) {
      const c = blue ? '#ff5a9a' : k0.accent, sh = on ? 3 : 0, ty = y + sh, th = h - 12
      g.fillStyle = '#1a1038'; g.beginPath(); g.roundRect(x, y + 6, w, h - 6, 8); g.fill()
      if (on) { g.save(); g.shadowColor = c; g.shadowBlur = 22 }
      g.fillStyle = on ? vg(g, ty, ty + h, '#ffffff', c) : vg(g, ty, ty + th + 6, blue ? '#a87cf8' : '#c8a8ff', blue ? '#4a2a9a' : '#6a48c8'); g.beginPath(); g.roundRect(x + 2, ty, w - 4, th + 6, 9); g.fill(); if (on) g.restore()
      g.fillStyle = on ? '#ffffff' : '#2a1a5a'; g.beginPath(); g.roundRect(x + 8, ty + 6, w - 16, th - 8, 5); g.fill(); g.strokeStyle = on ? c : 'rgba(255,255,255,.5)'; g.lineWidth = 1.2; g.beginPath(); g.roundRect(x + 2.5, ty + 0.5, w - 5, th + 5, 9); g.stroke()
      lab(g, x, ty - 2, w, th + 6, label, on ? '#3a1a7a' : '#d8c4ff')
    },
    lcd: rr(3), chip: rr(3)
  },

  mono: { // 그랜드 피아노: 스포트라이트와 오선 · 검은 래커에 은빛 테두리가 비치는 기둥 · 아래는 폴보드와 흰 건반 줄 · 건반은 피아노 건반
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0)
      const now = performance.now()
      g.save(); g.beginPath(); g.rect(x - 4, 0, fw + 8, jy); g.clip()
      const sp = g.createLinearGradient(0, 0, 0, jy); sp.addColorStop(0, 'rgba(255,255,255,.16)'); sp.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sp; poly(g, [[x + fw * 0.4, 0], [x + fw * 0.6, 0], [x + fw + 30, jy], [x - 30, jy]]); g.fill()
      g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 1; for (const gy of [70, 210, 350]) { g.beginPath(); for (let k = 0; k < 5; k++) { g.moveTo(x - 4, gy + k * 9); g.lineTo(x + fw + 4, gy + k * 9) } g.stroke(); g.beginPath(); g.moveTo(x + 20, gy); g.lineTo(x + 20, gy + 36); g.moveTo(x + fw - 20, gy); g.lineTo(x + fw - 20, gy + 36); g.stroke() }
      g.fillStyle = 'rgba(255,255,255,.2)'; g.font = `700 44px ${FONT}`; g.fillText('𝄞', x + 28, 108 + 0); g.fillText('𝄞', x + 28, 248); g.fillText('𝄞', x + 28, 388)
      g.fillStyle = '#ffffff'; for (let i = 0; i < 14; i++) { g.globalAlpha = 0.14 + 0.2 * rnd(i + 8); dot(g, x - 4 + (rnd(i) * (fw + 8) + Math.sin(now / 1500 + i) * 10 + fw + 8) % (fw + 8), ((rnd(i + 30) * jy - now / (46 + 40 * rnd(i + 2))) % jy + jy) % jy, 0.9 + rnd(i + 6)) } g.globalAlpha = 1
      g.restore()
      for (const [d, rx] of sides(x, fw)) {
        g.fillStyle = hg(g, rx, rx + 26, '#000000', '#2a2c34', '#0a0b0e'); g.fillRect(rx, 0, 26, 720)
        g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(rx + 3, 0); g.lineTo(rx + 9, 0); g.lineTo(rx + 5, 720); g.lineTo(rx - 1, 720); g.closePath(); g.fill()
        g.fillStyle = '#d8dce8'; g.fillRect(rx + (d < 0 ? 24 : 0), 0, 2, 720); g.fillStyle = '#6a6e7a'; g.fillRect(rx + (d < 0 ? 22 : 2), 0, 1, 720)
        for (let by = 60; by < jy - 30; by += 110) { g.fillStyle = vg(g, by - 8, by + 8, '#f0f2f8', '#6a6e7a'); g.beginPath(); g.roundRect(rx + 4, by - 6, 18, 12, 3); g.fill(); g.fillStyle = '#0a0b0e'; dot(g, rx + 13, by, 2.6) }
        g.fillStyle = vg(g, jy - 6, jy + 24, '#e8c860', '#7a5a14'); g.beginPath(); g.roundRect(rx + (d < 0 ? -10 : 8), jy - 4, 28, 24, 5); g.fill(); g.strokeStyle = '#3a2a08'; g.lineWidth = 1.2; g.stroke()
      }
      grooves(g, x, fw, jy, k0); lamps2(g, x, fw, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, _chibi, k0) {
      const top = jy + 26; g.beginPath(); g.roundRect(x - 78, top, fw + 156, 720 - top + 30, 12); g.fillStyle = vg(g, top, 720, '#2a2c34', '#0a0b0e', '#000000'); g.fill(); g.strokeStyle = '#d8dce8'; g.lineWidth = 2; g.stroke()
      g.fillStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(x - 70, top + 6); g.lineTo(x + 60, top + 6); g.lineTo(x - 10, top + 120); g.lineTo(x - 70, top + 120); g.closePath(); g.fill()
      // 폴보드 글자는 건반에 가려져 뺐다
      for (const [kx0, n] of [[x - 74, 3], [x + fw + 8, 3]] as const) for (let i = 0; i < n; i++) { g.fillStyle = vg(g, jy + 34, jy + 92, '#ffffff', '#c8ccd6'); g.fillRect(kx0 + i * 22, jy + 34, 20, 58); g.strokeStyle = '#2a2c34'; g.lineWidth = 1; g.strokeRect(kx0 + i * 22 + 0.5, jy + 34.5, 19, 57) } void k0
    },
    key(g, x, y, w, h, on, blue, label) {
      const sh = on ? 4 : 0
      if (!blue) { g.fillStyle = '#a8acb8'; g.fillRect(x, y + h - 4, w, 6); g.fillStyle = on ? vg(g, y, y + h, '#d0d4de', '#eceef4') : vg(g, y, y + h, '#ffffff', '#e4e6ee'); g.beginPath(); g.roundRect(x, y + sh, w, h - 2 - sh, 4); g.fill(); g.strokeStyle = '#2a2c34'; g.lineWidth = 1.5; g.stroke() }
      else { g.fillStyle = '#d8dce8'; g.fillRect(x, y + h - 4, w, 6); g.fillStyle = on ? vg(g, y, y + h, '#6a6e7a', '#2a2c34') : vg(g, y, y + h, '#3a3c46', '#000000'); g.beginPath(); g.roundRect(x, y + sh, w, h - 2 - sh, 4); g.fill(); g.strokeStyle = '#d8dce8'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x + 6, y + sh + 4, w - 12, 5) }
      lab(g, x, y + sh, w, h, label, blue ? '#f0f2f8' : '#1a1c22')
    },
    lcd: rr(3), chip: rr(3)
  },

  sunset: { // 해질녘 호수: 겹겹이 선 산등성이와 큰 해, 호수에 길게 비친 햇빛, 날아가는 새 · 등롱이 걸린 검은 나무 기둥 · 아래는 호숫가 나무 부두 · 건반은 호박빛 유리
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0)
      const now = performance.now()
      g.save(); g.beginPath(); g.rect(x - 4, 0, fw + 8, jy); g.clip()
      const sky = g.createLinearGradient(0, 0, 0, jy); sky.addColorStop(0, 'rgba(34,18,84,.75)'); sky.addColorStop(0.45, 'rgba(150,50,120,.5)'); sky.addColorStop(0.72, 'rgba(255,120,80,.5)'); sky.addColorStop(1, 'rgba(255,190,90,.55)'); g.fillStyle = sky; g.fillRect(x - 4, 0, fw + 8, jy)
      g.fillStyle = '#fff6d8'; for (let i = 0; i < 16; i++) { g.globalAlpha = (0.2 + 0.4 * rnd(i)) * (0.5 + 0.5 * Math.sin(now / 900 + i)) * (1 - 0.0); dot(g, x - 4 + rnd(i + 3) * (fw + 8), rnd(i + 20) * 150, 0.8 + rnd(i + 9)) } g.globalAlpha = 1
      const hy = jy - 150, sx = x + fw * 0.5; glowAt(g, sx, hy, 260, '255,190,100', 0.5)
      g.fillStyle = vg(g, hy - 64, hy + 64, '#fff2a0', '#ff9a4a', '#ff4f8a'); dot(g, sx, hy, 64)
      for (const [col, base, amp, ph, al] of [['#6a2a6a', hy + 8, 38, 0.3, 0.75], ['#3e1a52', hy + 14, 30, 2.1, 0.88], ['#1c0c30', hy + 20, 22, 4.4, 1]] as const) { g.fillStyle = col; g.globalAlpha = al; g.beginPath(); g.moveTo(x - 4, hy + 40); for (let px = 0; px <= fw + 8; px += 6) g.lineTo(x - 4 + px, base - amp * (0.5 + 0.5 * Math.sin(px / 46 + ph) * Math.sin(px / 19 + ph * 2) * 0.6 + 0.4 * Math.sin(px / 90 + ph))); g.lineTo(x + fw + 4, hy + 40); g.closePath(); g.fill() } g.globalAlpha = 1
      const lk = g.createLinearGradient(0, hy + 22, 0, jy); lk.addColorStop(0, '#ff9a5a'); lk.addColorStop(0.4, '#a8406a'); lk.addColorStop(1, '#1c0c30'); g.fillStyle = lk; g.fillRect(x - 4, hy + 22, fw + 8, jy - hy - 22)
      for (let k = 0; k < 14; k++) { const t = k / 14, ly = hy + 26 + t * (jy - hy - 30), w2 = (50 - t * 28) * (0.6 + 0.4 * Math.sin(now / 500 + k * 1.7)); g.fillStyle = `rgba(255,${230 - t * 80 | 0},${150 - t * 80 | 0},${0.55 - t * 0.3})`; g.fillRect(sx - w2 / 2, ly, w2, 2.2) }
      g.strokeStyle = '#1c0c30'; g.lineWidth = 1.8; g.lineCap = 'round'; for (let i = 0; i < 4; i++) { const bx = x + ((now / (48 + i * 10) + i * 90) % (fw + 120)) - 60, by = 60 + i * 34 + Math.sin(now / 400 + i) * 3, f = Math.sin(now / 180 + i * 2) * 3; g.beginPath(); g.moveTo(bx - 7, by - 2 + f); g.quadraticCurveTo(bx - 3, by - 5, bx, by); g.quadraticCurveTo(bx + 3, by - 5, bx + 7, by - 2 + f); g.stroke() } g.lineCap = 'butt'
      g.restore()
      for (const [d, rx] of sides(x, fw)) {
        g.fillStyle = hg(g, rx, rx + 26, '#0c0610', '#3a2228', '#12080c'); g.fillRect(rx, 0, 26, 720)
        g.fillStyle = 'rgba(255,170,110,.18)'; g.fillRect(rx + 5, 0, 2.5, 720)
        for (let by = 70; by < jy - 40; by += 140) { const sw = Math.sin(now / 1700 + by) * 3, lx = rx + (d < 0 ? -12 : 38) + sw
          g.strokeStyle = '#12080c'; g.lineWidth = 3; g.beginPath(); g.moveTo(rx + 13, by); g.lineTo(lx - d * 6, by); g.stroke(); g.lineWidth = 1.2; g.beginPath(); g.moveTo(lx, by); g.lineTo(lx, by + 6); g.stroke()
          glowAt(g, lx, by + 24, 44, '255,170,80', 0.5); g.fillStyle = vg(g, by + 6, by + 42, '#ffe08a', '#ff7a3a'); g.beginPath(); g.ellipse(lx, by + 24, 10, 17, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(100,30,10,.55)'; g.lineWidth = 1; g.beginPath(); g.ellipse(lx, by + 24, 5, 17, 0, 0, 7); g.stroke(); g.fillStyle = '#12080c'; g.fillRect(lx - 6, by + 5, 12, 3); g.fillRect(lx - 6, by + 40, 12, 3) }
      }
      grooves(g, x, fw, jy, k0); lamps2(g, x, fw, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, _chibi, k0) {
      const top = jy + 24, now = performance.now(); poly(g, [[x - 80, top + 6], [x + fw + 80, top + 6], [x + fw + 74, 720], [x - 74, 720]])
      g.fillStyle = vg(g, top, 720, '#6a4228', '#3a2012', '#160a06'); g.fill(); g.strokeStyle = '#d08a4a'; g.lineWidth = 2; g.stroke()
      g.save(); poly(g, [[x - 80, top + 6], [x + fw + 80, top + 6], [x + fw + 74, 720], [x - 74, 720]]); g.clip(); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1.4
      for (let py = top + 34; py < 720; py += 26) { g.beginPath(); g.moveTo(x - 80, py); g.lineTo(x + fw + 80, py); g.stroke(); for (let px = x - 80 + ((py / 26) % 2) * 60; px < x + fw + 80; px += 120) { g.beginPath(); g.moveTo(px, py); g.lineTo(px, py + 26); g.stroke() } } g.restore()
      g.fillStyle = vg(g, top - 6, top + 12, '#e0a868', '#8a5428'); g.fillRect(x - 84, top - 6, fw + 168, 16); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x - 84, top + 10, fw + 168, 2)
      g.strokeStyle = '#4a2a14'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 12; i++) { const t = i / 12, px = x - 84 + t * (fw + 168); i ? g.lineTo(px, top - 10 + Math.sin(t * Math.PI * 6) * 3 + 8) : g.moveTo(px, top - 2) } g.stroke()
      for (let i = 1; i < 7; i++) { const px = x - 84 + (i / 7) * (fw + 168), tw = 0.7 + 0.3 * Math.sin(now / 520 + i * 1.9); glowAt(g, px, top - 4, 16, '255,200,110', 0.7 * tw); g.fillStyle = '#fff0b0'; dot(g, px, top - 4, 2.6) } void k0
    },
    key(g, x, y, w, h, on, blue, label, k0) {
      if (on) { g.save(); g.shadowColor = k0.accent; g.shadowBlur = 22 }
      g.beginPath(); g.roundRect(x, y, w, h, 12); g.fillStyle = on ? vg(g, y, y + h, '#ffffff', '#ffb13b') : blue ? vg(g, y, y + h, '#b88aff', '#3a1a7a') : vg(g, y, y + h, '#ffd27a', '#e0502a'); g.fill(); if (on) g.restore()
      g.strokeStyle = 'rgba(60,16,10,.7)'; g.lineWidth = 1.8; g.beginPath(); g.roundRect(x, y, w, h, 12); g.stroke()
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.roundRect(x + 4, y + 4, w - 8, h * 0.34, 8); g.fill(); g.fillStyle = on ? '#fff6c0' : 'rgba(255,240,170,.55)'; dot(g, x + w / 2, y + h - 12, 5)
      lab(g, x, y - 4, w, h, label, blue && !on ? '#f0e4ff' : '#4a1408')
    },
    lcd: rr(8), chip: rr(8)
  }
}
void body
