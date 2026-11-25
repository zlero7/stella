// 다시 그린 스킨: 골드 팰리스(궁정 무도회장) · 사쿠라(달밤의 벚나무와 등롱) · 포레스트(이끼 낀 마법의 숲) · 아이스(얼어붙은 동굴)
import type { Art } from './skinsArt'
import { body, dot, fieldFill, grooves, hg, lab, lamps2, poly, rnd, rr, sides, vg } from './skinsArt2'

type G = CanvasRenderingContext2D
const glowAt = (g: G, x: number, y: number, r: number, rgb: string, a: number) => { const k = g.createRadialGradient(x, y, 0, x, y, r); k.addColorStop(0, `rgba(${rgb},${a})`); k.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = k; g.fillRect(x - r, y - r, r * 2, r * 2) }

export const ART5: Record<string, Art> = {
  gold: { // 궁정 무도회장: 샹들리에 빛과 금가루, 위에서 드리운 붉은 벨벳 휘장 · 홈이 파인 금 기둥에 소용돌이 기둥머리 · 아래는 아치 장식의 대리석 무대 · 건반은 보석 박힌 금판
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0)
      const now = performance.now()
      g.save(); g.beginPath(); g.rect(x - 4, 0, fw + 8, jy); g.clip()
      g.strokeStyle = 'rgba(255,212,94,.07)'; g.lineWidth = 1; g.beginPath(); for (let o = -jy; o < fw + 8; o += 36) { g.moveTo(x - 4 + o, 0); g.lineTo(x - 4 + o + jy, jy); g.moveTo(x - 4 + o + jy, 0); g.lineTo(x - 4 + o, jy) } g.stroke()
      glowAt(g, x + fw / 2, 0, fw, '255,220,130', 0.32)
      for (const [o, w2] of [[0.2, 30], [0.5, 46], [0.78, 30]] as const) { const lg = g.createLinearGradient(0, 0, 0, jy * 0.8); lg.addColorStop(0, 'rgba(255,230,160,.16)'); lg.addColorStop(1, 'rgba(255,230,160,0)'); g.fillStyle = lg; poly(g, [[x + fw * o, 0], [x + fw * o + w2, 0], [x + fw * o + w2 * 2.6 - 40, jy * 0.8], [x + fw * o - 40, jy * 0.8]]); g.fill() }
      g.fillStyle = '#ffe9a8'; for (let i = 0; i < 20; i++) { const py = ((rnd(i + 9) * jy - now / (34 + 30 * rnd(i)) % jy) + jy) % jy, tw = 0.5 + 0.5 * Math.sin(now / 380 + i * 2.1), px = x - 4 + rnd(i) * (fw + 8), r = 2 + 3.4 * rnd(i + 4); g.globalAlpha = 0.6 * tw; g.beginPath(); g.moveTo(px - r, py); g.lineTo(px, py - r * 0.26); g.lineTo(px + r, py); g.lineTo(px, py + r * 0.26); g.closePath(); g.moveTo(px, py - r); g.lineTo(px + r * 0.26, py); g.lineTo(px, py + r); g.lineTo(px - r * 0.26, py); g.closePath(); g.fill() } g.globalAlpha = 1
      g.restore()
      for (const [d, rx] of sides(x, fw)) { // 홈 파인 금 기둥
        g.fillStyle = hg(g, rx, rx + 26, '#5a3a10', '#fff0b0', '#d9a83a', '#7a5214'); g.fillRect(rx, 0, 26, 720)
        g.strokeStyle = 'rgba(80,48,8,.55)'; g.lineWidth = 1.3; for (const o of [5, 10, 16, 21]) { g.beginPath(); g.moveTo(rx + o, 70); g.lineTo(rx + o, jy - 24); g.stroke() }
        g.fillStyle = vg(g, 28, 70, '#fff0b0', '#b9852a'); g.beginPath(); g.roundRect(rx - 7, 28, 40, 14, 4); g.fill(); g.strokeStyle = '#6a4512'; g.lineWidth = 1.4; g.stroke() // 기둥머리
        g.strokeStyle = '#8a5a14'; g.lineWidth = 2.4; for (const dx of [-1, 1]) { g.beginPath(); g.arc(rx + 13 + dx * 14, 52, 7, dx < 0 ? 0.4 : Math.PI - 0.4, dx < 0 ? Math.PI * 1.6 : Math.PI * 2.6 - Math.PI * 2 + Math.PI, dx > 0); g.stroke(); g.fillStyle = '#ffe68a'; dot(g, rx + 13 + dx * 14, 52, 2.4) }
        g.fillStyle = vg(g, 40, 70, '#d9a83a', '#7a5214'); g.fillRect(rx + 2, 42, 22, 24)
        g.fillStyle = vg(g, jy - 30, jy + 12, '#fff0b0', '#7a5214'); g.beginPath(); g.roundRect(rx - 7, jy - 22, 40, 34, 4); g.fill(); g.strokeStyle = '#6a4512'; g.stroke(); g.fillStyle = '#ff4a5a'; dot(g, rx + 13, jy - 5, 4.4); g.fillStyle = 'rgba(255,255,255,.8)'; dot(g, rx + 11.6, jy - 6.6, 1.4)
      }
      g.fillStyle = vg(g, 0, 30, '#7a0a1c', '#3a0510'); g.beginPath(); g.moveTo(x - 36, 0); g.lineTo(x + fw + 36, 0); const n = 8 // 벨벳 휘장
      for (let i = n; i >= 0; i--) { const px = x - 36 + (i / n) * (fw + 72); g.quadraticCurveTo(px + (fw + 72) / n / 2, 36, px - (fw + 72) / n / 2 * 0, 20 + (i % 2 ? 4 : 0)) } g.closePath(); g.fill()
      g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1; for (let i = 1; i < 24; i++) { const px = x - 36 + (i / 24) * (fw + 72); g.beginPath(); g.moveTo(px, 0); g.lineTo(px, 14); g.stroke() }
      g.fillStyle = '#ffd45e'; for (let i = 0; i <= 16; i++) { const px = x - 36 + (i / 16) * (fw + 72); dot(g, px, 22 + 3 * Math.sin(i * 1.7), 2.2) }
      grooves(g, x, fw, jy, k0); lamps2(g, x, fw, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, _chibi, k0) {
      const top = jy + 26, W = fw + 150, n = 8; g.beginPath(); g.moveTo(x - 75, 720); g.lineTo(x - 75, top + 14)
      for (let i = 0; i < n; i++) { const px = x - 75 + (i / n) * W, w2 = W / n; g.lineTo(px, top + 12); g.quadraticCurveTo(px + w2 / 2, top - 22, px + w2, top + 12) } g.lineTo(x + fw + 75, 720); g.closePath()
      g.fillStyle = vg(g, top - 18, 720, '#ffe68a', '#c9a24a', '#5a3e12'); g.fill(); g.strokeStyle = '#6a4512'; g.lineWidth = 2; g.stroke()
      g.fillStyle = vg(g, top + 22, 720, '#2a1c10', '#120a04'); g.beginPath(); g.roundRect(x - 62, top + 22, fw + 124, 720 - top, 8); g.fill(); g.strokeStyle = '#ffd45e'; g.lineWidth = 1.5; g.stroke()
      g.strokeStyle = 'rgba(255,212,94,.35)'; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < 6; i++) { g.moveTo(x - 50 + i * 52, top + 30); g.quadraticCurveTo(x - 24 + i * 52, top + 52, x + 2 + i * 52, top + 30) } g.stroke(); void k0
    },
    key(g, x, y, w, h, on, blue, label, k0) {
      if (on) { g.save(); g.shadowColor = '#ffd45e'; g.shadowBlur = 20 }
      g.beginPath(); g.roundRect(x, y, w, h, 7); g.fillStyle = on ? vg(g, y, y + h, '#ffffff', '#ffd45e') : vg(g, y, y + h, '#fff0b0', '#d9a83a', '#8a5a14'); g.fill(); if (on) g.restore()
      g.strokeStyle = '#5a3a10'; g.lineWidth = 1.8; g.beginPath(); g.roundRect(x, y, w, h, 7); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1; g.beginPath(); g.roundRect(x + 3, y + 3, w - 6, h - 6, 5); g.stroke()
      g.fillStyle = on ? '#ffffff' : blue ? '#ff4a5a' : '#4aa8ff'; dot(g, x + w / 2, y + 9, 4); g.fillStyle = 'rgba(255,255,255,.85)'; dot(g, x + w / 2 - 1.4, y + 7.6, 1.3)
      lab(g, x, y + 6, w, h, label, '#3a2408'); void k0
    },
    lcd: rr(5), chip: rr(5)
  },

  sakura: { // 달밤의 벚나무: 보름달과 흩날리는 꽃잎, 바람에 흔들리는 등롱 · 꽃 핀 벚나무 기둥 · 아래는 등롱이 선 나무 툇마루 · 건반은 꽃무늬 모찌
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0)
      const now = performance.now()
      g.save(); g.beginPath(); g.rect(x - 4, 0, fw + 8, jy); g.clip()
      const mx = x + fw * 0.72, my = 130; glowAt(g, mx, my, 190, '255,200,225', 0.34); g.fillStyle = vg(g, my - 52, my + 52, '#fff6e8', '#ffd8e6'); dot(g, mx, my, 52); g.fillStyle = 'rgba(210,150,175,.3)'; for (const [dx, dy, r] of [[-14, -10, 12], [16, 12, 9], [-2, 24, 6]]) dot(g, mx + dx, my + dy, r)
      g.strokeStyle = 'rgba(255,200,225,.12)'; g.lineWidth = 6; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { const cy = 60 + i * 90 + Math.sin(now / 3000 + i) * 6; g.beginPath(); g.moveTo(x + 10 + ((now / (80 + i * 30)) % 80), cy); g.lineTo(x + 140 + ((now / (80 + i * 30)) % 80), cy); g.stroke() } g.lineCap = 'butt'
      for (let i = 0; i < 18; i++) { const k = ((now / (5200 + 3000 * rnd(i)) + rnd(i + 7)) % 1), px = x - 4 + ((rnd(i) * (fw + 8) + Math.sin(k * 8 + i) * 22 + k * 40) % (fw + 8)), py = k * (jy + 20) - 10; g.save(); g.translate(px, py); g.rotate(k * 9 + i); g.fillStyle = i % 3 ? '#ffc0d8' : '#ffffff'; g.globalAlpha = 0.8; g.beginPath(); g.ellipse(0, 0, 5.5, 3, 0, 0, 7); g.fill(); g.restore() } g.globalAlpha = 1
      for (const [o, ph] of [[0.14, 0], [0.5, 2], [0.86, 4]] as const) { // 등롱
        const sw = Math.sin(now / 1500 + ph) * 5, lx = x + fw * o + sw, ly = 58 + ph * 8
        g.strokeStyle = '#3a1a22'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x + fw * o, 0); g.lineTo(lx, ly - 18); g.stroke(); glowAt(g, lx, ly, 46, '255,140,150', 0.45)
        g.fillStyle = vg(g, ly - 18, ly + 18, '#ff9aa8', '#d04a68'); g.beginPath(); g.ellipse(lx, ly, 13, 18, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(100,20,40,.6)'; g.lineWidth = 1; for (const k of [-6, 0, 6]) { g.beginPath(); g.ellipse(lx, ly, Math.abs(13 - Math.abs(k) * 0.4), 18, 0, 0, 7); g.stroke() } g.fillStyle = '#3a1a22'; g.fillRect(lx - 7, ly - 20, 14, 4); g.fillRect(lx - 7, ly + 16, 14, 4)
      }
      g.restore()
      for (const [d, rx] of sides(x, fw)) {
        g.fillStyle = hg(g, rx, rx + 26, '#1a0c12', '#5a3038', '#2a1218'); g.fillRect(rx, 0, 26, 720)
        g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1.2; for (let by = 14; by < jy; by += 22) { g.beginPath(); g.moveTo(rx + 2, by); g.lineTo(rx + 9 + rnd(by) * 6, by + 5); g.moveTo(rx + 18, by + 9); g.lineTo(rx + 24, by + 14 + rnd(by + 1) * 4); g.stroke() }
        for (let by = 80; by < jy - 40; by += 130) { const bx = rx + (d < 0 ? -2 : 28); g.strokeStyle = '#3a1a22'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(rx + 13, by + 20); g.quadraticCurveTo(bx + d * 18, by + 6, bx + d * 30, by - 10); g.stroke(); g.lineCap = 'butt'
          for (const [dx, dy, r] of [[30, -10, 11], [22, -2, 9], [34, 0, 8], [12, 6, 8], [26, -20, 7]]) { const px = bx + d * dx, py = by + dy; g.fillStyle = '#ffb8d0'; dot(g, px, py, r); g.fillStyle = '#ffe6f0'; dot(g, px - r * 0.25, py - r * 0.3, r * 0.55); g.fillStyle = '#ff7aa6'; dot(g, px + r * 0.3, py + r * 0.2, r * 0.18) } }
      }
      grooves(g, x, fw, jy, k0); lamps2(g, x, fw, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, _chibi, k0) {
      const top = jy + 28, now = performance.now(); g.beginPath(); g.roundRect(x - 78, top, fw + 156, 720 - top + 30, 10); g.fillStyle = vg(g, top, 720, '#a8704a', '#6a3a28', '#2a1410'); g.fill()
      g.save(); g.beginPath(); g.roundRect(x - 78, top, fw + 156, 720 - top + 30, 10); g.clip(); g.strokeStyle = 'rgba(40,16,12,.5)'; g.lineWidth = 1.5; for (let py = top + 30; py < 720; py += 22) { g.beginPath(); g.moveTo(x - 80, py); g.lineTo(x + fw + 80, py); g.stroke() } g.strokeStyle = 'rgba(255,200,170,.12)'; for (let py = top + 32; py < 720; py += 22) { g.beginPath(); g.moveTo(x - 80, py); g.lineTo(x + fw + 80, py); g.stroke() } g.restore()
      g.fillStyle = vg(g, top - 6, top + 14, '#e8b890', '#7a4a30'); g.beginPath(); g.roundRect(x - 84, top - 6, fw + 168, 20, 10); g.fill(); g.strokeStyle = '#3a1a14'; g.lineWidth = 1.5; g.stroke()
      for (const lx of [x - 60, x + fw + 60]) { const sw = Math.sin(now / 1300 + lx) * 0.05; g.save(); g.translate(lx, top - 8); g.rotate(sw); glowAt(g, 0, -24, 40, '255,150,160', 0.4); g.fillStyle = '#2a1414'; g.fillRect(-2, -10, 4, 14); g.fillStyle = vg(g, -44, -10, '#ff9aa8', '#d04a68'); g.beginPath(); g.ellipse(0, -26, 12, 17, 0, 0, 7); g.fill(); g.fillStyle = '#2a1414'; g.fillRect(-6, -45, 12, 4); g.restore() }
    },
    key(g, x, y, w, h, on, blue, label, k0) {
      const cx = x + w / 2, cy = y + h / 2 + (on ? 1 : 0)
      if (on) { g.save(); g.shadowColor = k0.accent; g.shadowBlur = 20 }
      g.beginPath(); g.roundRect(x + 2, cy - h / 2 + 2, w - 4, h - 4, 18); g.fillStyle = on ? vg(g, y, y + h, '#ffffff', '#ff8fb8') : vg(g, y, y + h, blue ? '#ffc0d8' : '#fff0f6', blue ? '#e8709a' : '#f0b8cc'); g.fill(); if (on) g.restore()
      g.strokeStyle = 'rgba(160,50,90,.6)'; g.lineWidth = 1.6; g.beginPath(); g.roundRect(x + 2, cy - h / 2 + 2, w - 4, h - 4, 18); g.stroke()
      g.fillStyle = 'rgba(255,120,160,.28)'; for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; g.beginPath(); g.ellipse(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11, 8, 4, a, 0, 7); g.fill() }
      g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(cx - w * 0.2, cy - h * 0.32, w * 0.2, h * 0.07, -0.2, 0, 7); g.fill()
      lab(g, x, y + (on ? 1 : 0), w, h, label, '#6a1a3a')
    },
    lcd: rr(12), chip: rr(12)
  },

  forest: { // 이끼 낀 마법의 숲: 멀리 선 나무 둥치와 안개, 쏟아지는 빛줄기와 반딧불 · 이끼와 덩굴이 감긴 껍질 기둥 · 아래는 버섯 자라는 이끼 돌판 · 건반은 룬 새긴 돌
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0)
      const now = performance.now()
      g.save(); g.beginPath(); g.rect(x - 4, 0, fw + 8, jy); g.clip()
      for (let i = 0; i < 6; i++) { const bw = 20 + rnd(i) * 26, bx = x - 10 + i * ((fw + 20) / 5.2); g.fillStyle = `rgba(4,${22 + i * 3},12,.85)`; g.fillRect(bx, 0, bw, jy); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(bx + bw * 0.7, 0, bw * 0.3, jy) }
      for (let k = 0; k < 3; k++) { const fg = g.createLinearGradient(0, jy * 0.5 + k * 40, 0, jy * 0.5 + k * 40 + 100); fg.addColorStop(0, 'rgba(160,220,170,0)'); fg.addColorStop(0.5, 'rgba(160,220,170,.10)'); fg.addColorStop(1, 'rgba(160,220,170,0)'); g.fillStyle = fg; g.fillRect(x - 4, jy * 0.5 + k * 40, fw + 8, 100) }
      for (const [o, ww, al] of [[0.1, 40, 0.10], [0.45, 66, 0.08], [0.8, 34, 0.10]] as const) { const sway = Math.sin(now / 3000 + o * 9) * 14, lg = g.createLinearGradient(0, 0, 0, jy * 0.9); lg.addColorStop(0, 'rgba(216,255,176,.9)'); lg.addColorStop(1, 'rgba(216,255,176,0)'); g.globalAlpha = al; g.fillStyle = lg; poly(g, [[x + fw * o + sway, 0], [x + fw * o + ww + sway, 0], [x + fw * o + ww * 2 - 60 + sway, jy * 0.9], [x + fw * o - 50 + sway, jy * 0.9]]); g.fill() } g.globalAlpha = 1
      for (let i = 0; i < 12; i++) { const tw = 0.5 + 0.5 * Math.sin(now / 520 + i * 2.3), px = x - 4 + (rnd(i) * (fw + 8) + Math.sin(now / 1800 + i) * 14 + fw + 8) % (fw + 8), py = (rnd(i + 12) * jy + Math.cos(now / 2100 + i) * 18 + jy) % jy; glowAt(g, px, py, 10, '216,255,106', 0.6 * tw); g.fillStyle = '#f4ffc0'; g.globalAlpha = 0.9 * tw; dot(g, px, py, 1.6) } g.globalAlpha = 1
      g.restore()
      for (const [d, rx] of sides(x, fw)) {
        g.fillStyle = hg(g, rx, rx + 26, '#1a0e06', '#6a4a26', '#3a2410', '#120a04'); g.fillRect(rx, 0, 26, 720)
        g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1.2; for (let by = 8; by < jy; by += 16) { g.beginPath(); g.moveTo(rx + 1, by + rnd(by) * 6); g.lineTo(rx + 10 + rnd(by + 2) * 8, by + 3 + rnd(by + 4) * 5); g.stroke() }
        g.fillStyle = '#3a8a4a'; for (let by = 30; by < jy; by += 90) { g.beginPath(); g.ellipse(rx + (d < 0 ? 4 : 22), by, 8, 22, 0, 0, 7); g.fill(); g.fillStyle = '#5ac86a'; dot(g, rx + (d < 0 ? 3 : 23), by - 8, 3); g.fillStyle = '#3a8a4a' }
        g.strokeStyle = '#2f8a3f'; g.lineWidth = 2.4; g.beginPath(); for (let by = 0; by <= jy; by += 6) { const px = rx + 13 + Math.sin(by / 34 + d) * 11; by ? g.lineTo(px, by) : g.moveTo(px, by) } g.stroke()
        g.fillStyle = '#58d070'; for (let by = 20; by < jy; by += 52) { const px = rx + 13 + Math.sin(by / 34 + d) * 11; g.save(); g.translate(px, by); g.rotate(by); g.beginPath(); g.ellipse(6, 0, 7, 3.2, 0, 0, 7); g.fill(); g.restore() }
        const mx = rx + (d < 0 ? -6 : 32), pu = 0.6 + 0.4 * Math.sin(now / 700 + d); glowAt(g, mx, jy - 4, 26, '90,255,210', 0.5 * pu); g.fillStyle = '#d8fff0'; g.fillRect(mx - 2, jy - 14, 4, 14); g.fillStyle = vg(g, jy - 28, jy - 12, '#9dffe0', '#2fb89a'); g.beginPath(); g.ellipse(mx, jy - 16, 10, 7, 0, Math.PI, 0); g.fill(); g.fillStyle = 'rgba(255,255,255,.8)'; dot(g, mx - 4, jy - 20, 1.5); dot(g, mx + 3, jy - 22, 1.2)
      }
      grooves(g, x, fw, jy, k0); lamps2(g, x, fw, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, _chibi, k0) {
      const top = jy + 26; g.beginPath(); g.moveTo(x - 76, 720); g.lineTo(x - 76, top + 24); g.quadraticCurveTo(x - 76, top, x - 52, top); g.lineTo(x + fw + 52, top); g.quadraticCurveTo(x + fw + 76, top, x + fw + 76, top + 24); g.lineTo(x + fw + 76, 720); g.closePath()
      g.fillStyle = vg(g, top, 720, '#4a5a48', '#2a3428', '#10140e'); g.fill(); g.strokeStyle = '#1a2418'; g.lineWidth = 2; g.stroke()
      g.save(); g.clip(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 40, top + 30); g.lineTo(x - 28, top + 80); g.lineTo(x - 44, top + 120); g.moveTo(x + fw + 30, top + 60); g.lineTo(x + fw + 44, top + 110); g.stroke(); g.restore()
      g.fillStyle = '#3a8a4a'; for (let px = x - 70; px <= x + fw + 70; px += 18) { g.beginPath(); g.ellipse(px, top + 2 + 4 * Math.sin(px), 11, 8, 0, Math.PI, 0); g.fill() } g.fillStyle = '#5ac86a'; for (let px = x - 62; px <= x + fw + 70; px += 36) { g.beginPath(); g.ellipse(px, top, 6, 4, 0, Math.PI, 0); g.fill() }
      for (const [mx, c] of [[x - 56, '#ff6a5a'], [x + fw + 58, '#ff9a4a']] as const) { g.fillStyle = '#f0e8d0'; g.fillRect(mx - 2, top + 70, 4, 16); g.fillStyle = c; g.beginPath(); g.ellipse(mx, top + 70, 11, 8, 0, Math.PI, 0); g.fill(); g.fillStyle = 'rgba(255,255,255,.8)'; dot(g, mx - 4, top + 66, 1.6); dot(g, mx + 4, top + 64, 1.3) } void k0
    },
    key(g, x, y, w, h, on, blue, label, k0) {
      const path = () => { g.beginPath(); g.moveTo(x + 8, y); g.lineTo(x + w - 6, y + 2); g.lineTo(x + w, y + h - 8); g.lineTo(x + w - 9, y + h); g.lineTo(x + 5, y + h - 2); g.lineTo(x, y + 10); g.closePath() }
      if (on) { g.save(); g.shadowColor = '#7dff9a'; g.shadowBlur = 22 }
      path(); g.fillStyle = on ? vg(g, y, y + h, '#eaffe0', '#5ac86a') : vg(g, y, y + h, blue ? '#7a8c78' : '#9aa898', '#3a4a3a'); g.fill(); if (on) g.restore()
      g.strokeStyle = '#141c12'; g.lineWidth = 1.8; path(); g.stroke(); g.fillStyle = '#3a8a4a'; if (!on) { g.beginPath(); g.ellipse(x + 14, y + 4, 12, 5, 0, Math.PI, 0); g.fill() }
      g.save(); g.shadowColor = '#7dff9a'; g.shadowBlur = on ? 0 : 6; lab(g, x, y, w, h, label, on ? '#14380f' : '#9dffb0'); g.restore(); void k0
    },
    lcd: rr(8), chip: rr(8)
  },

  ice: { // 얼어붙은 동굴: 천장의 고드름과 일렁이는 오로라, 쌓인 눈 · 면이 살아 있는 얼음 기둥에 서리 결정 · 아래는 눈 쌓인 얼음 덩어리 · 건반은 얼음 조각
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0)
      const now = performance.now()
      g.save(); g.beginPath(); g.rect(x - 4, 0, fw + 8, jy); g.clip()
      for (const [col, yy, al] of [['#7affd8', 90, 0.14], ['#7ad8ff', 135, 0.12], ['#b08cff', 180, 0.09]] as const) { g.fillStyle = col; g.globalAlpha = al; g.beginPath(); g.moveTo(x - 4, 0); for (let px = 0; px <= fw + 8; px += 8) g.lineTo(x - 4 + px, yy + Math.sin(px / 52 + now / 1500 + yy) * 28); g.lineTo(x + fw + 4, 0); g.closePath(); g.fill() } g.globalAlpha = 1
      for (let i = 0; i < 12; i++) { const px = x - 4 + (i + 0.5) * ((fw + 8) / 12), len = 22 + rnd(i) * 50, w2 = 6 + rnd(i + 3) * 8; g.fillStyle = vg(g, 0, len, 'rgba(210,240,255,.55)', 'rgba(150,210,255,.1)'); poly(g, [[px - w2, 0], [px + w2, 0], [px, len]]); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; poly(g, [[px - w2 * 0.5, 0], [px - w2 * 0.1, 0], [px - w2 * 0.2, len * 0.6]]); g.fill() }
      g.fillStyle = '#ffffff'; for (let i = 0; i < 32; i++) { g.globalAlpha = 0.25 + 0.3 * rnd(i + 8); dot(g, x - 4 + (rnd(i) * (fw + 8) + Math.sin(now / 1100 + i) * 9 + fw + 8) % (fw + 8), (rnd(i + 30) * jy + now / (26 + 34 * rnd(i + 1))) % jy, 0.9 + 1.5 * rnd(i + 5)) } g.globalAlpha = 1
      g.restore()
      for (const [d, rx] of sides(x, fw)) {
        g.fillStyle = hg(g, rx, rx + 26, '#1c3a56', '#cfeeff', '#5a90b8', '#1a3450'); g.fillRect(rx, 0, 26, 720)
        g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.2; g.beginPath(); for (let by = 0; by < jy; by += 70) { g.moveTo(rx, by + 40); g.lineTo(rx + 26, by); g.moveTo(rx + 26, by + 70); g.lineTo(rx, by + 40 + 30) } g.stroke()
        g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(rx + 5, 0, 2.5, 720)
        for (let by = 70; by < jy - 30; by += 120) { const bx = rx + (d < 0 ? -2 : 28); g.save(); g.translate(bx, by); g.rotate(d * 0.5); g.fillStyle = vg(g, -14, 14, '#ffffff', '#7ac4ee'); poly(g, [[0, -14], [6, -4], [6, 8], [0, 16], [-6, 8], [-6, -4]]); g.fill(); g.strokeStyle = '#2a5a82'; g.lineWidth = 1; g.stroke(); g.restore() }
        g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(rx + 13, jy + 2, 24, 14, 0, Math.PI, 0); g.fill(); g.fillStyle = 'rgba(160,210,240,.6)'; g.beginPath(); g.ellipse(rx + 13, jy + 6, 20, 6, 0, 0, Math.PI); g.fill()
      }
      grooves(g, x, fw, jy, k0); lamps2(g, x, fw, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, _chibi, k0) {
      const top = jy + 28; poly(g, [[x - 76, 720], [x - 76, top + 30], [x - 56, top + 4], [x + fw + 56, top + 4], [x + fw + 76, top + 30], [x + fw + 76, 720]])
      g.fillStyle = vg(g, top, 720, '#a8d8f4', '#4a88b8', '#163450'); g.fill(); g.strokeStyle = '#e8f8ff'; g.lineWidth = 2; g.stroke()
      g.save(); g.clip(); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.2; g.beginPath(); for (const [a, b, c2, d2] of [[-60, 30, -20, 90], [fw + 30, 60, fw + 70, 120], [10, 120, 60, 160]]) { g.moveTo(x + a, top + b); g.lineTo(x + c2, top + d2) } g.stroke(); g.fillStyle = 'rgba(255,255,255,.16)'; poly(g, [[x - 76, top + 30], [x - 20, top + 4], [x + 40, top + 4], [x - 40, top + 140], [x - 76, top + 140]]); g.fill(); g.restore()
      g.fillStyle = '#ffffff'; for (let px = x - 72; px < x + fw + 72; px += 22) { g.beginPath(); g.ellipse(px, top + 8 + 3 * Math.sin(px), 14, 9, 0, Math.PI, 0); g.fill() } void k0
    },
    key(g, x, y, w, h, on, blue, label, k0) {
      const path = () => poly(g, [[x + 6, y], [x + w - 4, y + 2], [x + w, y + h * 0.5], [x + w - 6, y + h], [x + 4, y + h - 2], [x, y + h * 0.45]])
      if (on) { g.save(); g.shadowColor = '#7ad8ff'; g.shadowBlur = 22 }
      path(); g.fillStyle = on ? vg(g, y, y + h, '#ffffff', '#7ad8ff') : vg(g, y, y + h, blue ? '#a8dcf8' : '#e8f6ff', blue ? '#3a78ac' : '#7ab0d8'); g.fill(); if (on) g.restore()
      g.strokeStyle = '#1a4a72'; g.lineWidth = 1.8; path(); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 6, y + 2); g.lineTo(x + w * 0.45, y + h * 0.5); g.lineTo(x + w - 6, y + h - 2); g.moveTo(x + w * 0.45, y + h * 0.5); g.lineTo(x + 4, y + h - 4); g.stroke()
      lab(g, x, y, w, h, label, on ? '#0a3a5a' : '#12456a'); void k0
    },
    lcd: rr(7), chip: rr(7)
  }
}
