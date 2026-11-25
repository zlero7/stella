// 다시 그린 스킨: 네온 시티(비 오는 밤의 도시) · 크림슨(붉은 달 아래 고딕 철탑)
import { FONT } from './theme'
import type { Art } from './skinsArt'
import { body, dot, fieldFill, grooves, hg, lab, lamps2, poly, rnd, rr, sides, vg } from './skinsArt2'

type G = CanvasRenderingContext2D

const tube = (g: G, x: number, y0: number, y1: number, col: string, w = 3, blur = 12) => { g.save(); g.shadowColor = col; g.shadowBlur = blur; g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); g.strokeStyle = '#ffffff'; g.globalAlpha = 0.55; g.lineWidth = w * 0.35; g.stroke(); g.restore() }
const bat = (g: G, cx: number, cy: number, s: number, flap: number) => {
  g.save(); g.translate(cx, cy); g.scale(s, s); g.fillStyle = '#12020a'
  for (const d of [-1, 1]) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(d * 10, -10 - flap * 8, d * 22, -3 - flap * 12); g.quadraticCurveTo(d * 17, 0, d * 15, 4); g.quadraticCurveTo(d * 10, 1, d * 7, 6); g.quadraticCurveTo(d * 4, 1, 0, 5); g.fill() }
  g.beginPath(); g.ellipse(0, 1, 3, 5, 0, 0, 7); g.fill(); g.restore()
}

export const ART4: Record<string, Art> = {
  neon: { // 비 오는 밤의 도시: 불 켜진 빌딩과 네온 간판, 쏟아지는 비 · 네온관 두 줄이 흐르는 기둥에 간판 팔 · 아래는 홀로그램 데크 · 건반은 비스듬한 유리판
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0)
      const now = performance.now()
      g.save(); g.beginPath(); g.rect(x - 4, 0, fw + 8, jy); g.clip()
      const base = jy - 10
      for (let i = 0; i < 9; i++) {
        const bw = 32 + rnd(i) * 26, bx = x - 14 + i * ((fw + 28) / 8.2), bh = 130 + rnd(i + 3) * 200
        g.fillStyle = vg(g, base - bh, base, 'rgba(34,16,70,.9)', 'rgba(14,6,34,.95)'); g.fillRect(bx, base - bh, bw, bh)
        g.fillStyle = 'rgba(255,61,219,.35)'; g.fillRect(bx, base - bh, bw, 1.5)
        for (let wy = base - bh + 10; wy < base - 8; wy += 14) for (let wx = bx + 5; wx < bx + bw - 6; wx += 9) { const k = (i * 37 + wy * 3 + wx) | 0, r = rnd(k % 97); if (r > 0.55) { g.fillStyle = r > 0.82 ? '#6ad8ff' : '#ffd9a0'; g.globalAlpha = 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(now / (600 + r * 900) + k)); g.fillRect(wx, wy, 4, 6) } }
        g.globalAlpha = 1
        if (i % 3 === 1) { const sc = i % 2 ? '#37e8ff' : '#ff3ddb'; g.save(); g.shadowColor = sc; g.shadowBlur = 10; g.fillStyle = sc; g.globalAlpha = 0.8 + 0.2 * Math.sin(now / 300 + i); g.fillRect(bx + bw - 7, base - bh + 24, 3, 46); g.fillRect(bx + 3, base - bh + 24, 3, 20); g.restore() }
      }
      const fg = g.createLinearGradient(0, jy - 180, 0, jy); fg.addColorStop(0, 'rgba(255,61,219,0)'); fg.addColorStop(1, 'rgba(255,61,219,.22)'); g.fillStyle = fg; g.fillRect(x - 4, jy - 180, fw + 8, 180)
      g.strokeStyle = 'rgba(200,235,255,.35)'; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < 42; i++) { const px = x - 30 + ((rnd(i) * (fw + 80) + now / 40 * 0.1) % (fw + 80)), py = ((rnd(i + 20) * jy + now / (3 + 3 * rnd(i + 5))) % (jy + 30)) - 15; g.moveTo(px, py); g.lineTo(px - 3, py + 14) } g.stroke()
      g.restore()
      for (const [d, rx] of sides(x, fw)) {
        g.fillStyle = '#0a0818'; g.fillRect(rx, 0, 26, 720); g.fillStyle = hg(g, rx, rx + 26, 'rgba(255,255,255,.0)', 'rgba(150,120,255,.2)', 'rgba(255,255,255,.0)'); g.fillRect(rx, 0, 26, 720)
        tube(g, rx + 3, 0, jy + 20, '#ff3ddb'); tube(g, rx + 23, 0, jy + 20, '#37e8ff')
        for (let by = 60; by < jy - 40; by += 140) { // 간판 팔
          g.strokeStyle = '#2a2050'; g.lineWidth = 3; g.beginPath(); g.moveTo(rx + 13, by); g.lineTo(rx + 13 + d * 30, by); g.stroke()
          const sx = rx + 13 + d * 30, sc = by % 280 ? '#37e8ff' : '#ff3ddb'; g.save(); g.shadowColor = sc; g.shadowBlur = 10; g.strokeStyle = sc; g.lineWidth = 2; g.strokeRect(sx - (d > 0 ? 0 : 14), by - 10, 14, 26); g.fillStyle = sc; g.globalAlpha = 0.5 + 0.3 * Math.sin(now / 400 + by); g.fillRect(sx - (d > 0 ? -3 : 11), by - 6, 8, 3); g.fillRect(sx - (d > 0 ? -3 : 11), by + 1, 8, 3); g.fillRect(sx - (d > 0 ? -3 : 11), by + 8, 8, 3); g.restore()
        }
        g.fillStyle = '#1a1438'; g.fillRect(rx - 3, jy - 6, 32, 24); g.fillStyle = Math.floor(now / 400) % 2 ? '#ff3ddb' : '#5a1050'; dot(g, rx + 6, jy + 6, 2.4); g.fillStyle = '#37e8ff'; dot(g, rx + 20, jy + 6, 2.4)
      }
      grooves(g, x, fw, jy, k0); lamps2(g, x, fw, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, _chibi, k0) {
      const top = jy + 22; poly(g, [[x - 44, top], [x + fw + 44, top], [x + fw + 88, 720], [x - 88, 720]])
      g.fillStyle = vg(g, top, 720, '#1c0c36', '#0a0418', '#04010a'); g.fill()
      g.save(); g.clip(); g.strokeStyle = '#37e8ff'; g.globalAlpha = 0.22; g.lineWidth = 1; g.beginPath(); for (let i = -8; i <= 8; i++) { g.moveTo(x + fw / 2 + i * 16, top); g.lineTo(x + fw / 2 + i * 38, 720) } for (let k = 1; k < 8; k++) { const yy = top + (720 - top) * (k / 8) ** 1.6; g.moveTo(x - 100, yy); g.lineTo(x + fw + 100, yy) } g.stroke(); g.globalAlpha = 1; g.restore()
      g.save(); g.shadowColor = '#ff3ddb'; g.shadowBlur = 14; g.strokeStyle = '#ff3ddb'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - 44, top); g.lineTo(x + fw + 44, top); g.moveTo(x - 44, top); g.lineTo(x - 88, 720); g.moveTo(x + fw + 44, top); g.lineTo(x + fw + 88, 720); g.stroke(); g.restore()
      g.fillStyle = 'rgba(255,61,219,.5)'; for (const d of [-1, 1]) for (let i = 0; i < 4; i++) g.fillRect(x + fw / 2 + d * (fw / 2 + 52) - 14, top + 110 + i * 9, 28, 3) // 환기구 틈
    },
    key(g, x, y, w, h, on, blue, label) {
      const sk = 9, col = blue ? '#ff3ddb' : '#37e8ff'; const path = () => poly(g, [[x + sk, y], [x + w, y], [x + w - sk, y + h], [x, y + h]])
      if (on) { g.save(); g.shadowColor = col; g.shadowBlur = 22 }
      path(); g.fillStyle = on ? vg(g, y, y + h, '#ffffff', col) : vg(g, y, y + h, '#2a1456', '#0c0620'); g.fill(); if (on) g.restore()
      g.save(); g.shadowColor = col; g.shadowBlur = on ? 0 : 8; g.strokeStyle = on ? '#ffffff' : col; g.lineWidth = 2.2; path(); g.stroke(); g.restore()
      if (!on) { g.fillStyle = 'rgba(255,255,255,.12)'; poly(g, [[x + sk + 3, y + 3], [x + w - 3, y + 3], [x + w - sk - 1, y + h * 0.4], [x + sk - 2, y + h * 0.4]]); g.fill() }
      lab(g, x, y, w, h, label, on ? '#2a0a3a' : col)
    },
    lcd: rr(3), chip: rr(3)
  },

  crimson: { // 붉은 달 아래 고딕 성당: 박쥐 떼와 핏빛 안개 · 가시 돋친 검은 철탑에 붉은 보석, 늘어진 사슬 · 아래는 이빨 달린 철제 제단 · 건반은 붉은 수정
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0)
      const now = performance.now()
      g.save(); g.beginPath(); g.rect(x - 4, 0, fw + 8, jy); g.clip()
      const mx = x + fw * 0.64, my = 215, mr = 82
      const halo = g.createRadialGradient(mx, my, mr * 0.7, mx, my, mr * 2.6); halo.addColorStop(0, 'rgba(255,60,70,.35)'); halo.addColorStop(1, 'rgba(255,30,50,0)'); g.fillStyle = halo; g.fillRect(x - 4, 0, fw + 8, jy)
      g.fillStyle = vg(g, my - mr, my + mr, '#ffb0a0', '#e02a3c', '#6a0a1c'); g.globalAlpha = 0.62; dot(g, mx, my, mr); g.fillStyle = 'rgba(80,0,20,.45)'; for (const [dx, dy, r] of [[-26, -18, 14], [20, 14, 20], [-8, 34, 9], [30, -30, 8]]) dot(g, mx + dx, my + dy, r); g.globalAlpha = 1
      for (let k = 0; k < 3; k++) { const fx = ((now / (70 + k * 30) + k * 140) % (fw + 220)) - 110; const fg = g.createLinearGradient(x + fx - 100, 0, x + fx + 100, 0); fg.addColorStop(0, 'rgba(120,10,30,0)'); fg.addColorStop(0.5, 'rgba(160,20,40,.14)'); fg.addColorStop(1, 'rgba(120,10,30,0)'); g.fillStyle = fg; g.fillRect(x + fx - 100, 120 + k * 150, 200, 70) }
      for (let i = 0; i < 4; i++) bat(g, x + ((now / (26 + i * 9) + i * 110) % (fw + 120)) - 40, 70 + i * 52 + Math.sin(now / 500 + i) * 8, 0.9 + 0.2 * (i % 2), 0.5 + 0.5 * Math.sin(now / 130 + i * 2))
      g.restore()
      for (const [d, rx] of sides(x, fw)) {
        g.fillStyle = hg(g, rx, rx + 26, '#0a0204', '#3a0a14', '#12040a'); g.fillRect(rx, 0, 26, 720)
        g.fillStyle = 'rgba(255,90,100,.18)'; g.fillRect(rx + 6, 0, 2, 720); g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(rx + 17, 0, 2, 720)
        g.fillStyle = '#1a0408'; for (let by = 40; by < jy + 10; by += 64) { poly(g, [[rx + (d < 0 ? 0 : 26), by], [rx + (d < 0 ? -16 : 42), by + 5], [rx + (d < 0 ? 0 : 26), by + 14]]); g.fill() }
        for (let by = 120; by < jy - 30; by += 150) { const pulse = 0.6 + 0.4 * Math.sin(now / 600 + by); g.save(); g.shadowColor = '#ff3b52'; g.shadowBlur = 10 * pulse; g.fillStyle = vg(g, by - 11, by + 11, '#ff9aa6', '#a00a24'); poly(g, [[rx + 13, by - 12], [rx + 22, by], [rx + 13, by + 12], [rx + 4, by]]); g.fill(); g.restore(); g.strokeStyle = '#1a0408'; g.lineWidth = 1.4; poly(g, [[rx + 13, by - 12], [rx + 22, by], [rx + 13, by + 12], [rx + 4, by]]); g.stroke() }
        g.strokeStyle = '#4a4850'; g.lineWidth = 2; for (let k = 0; k < 7; k++) { const cy = 26 + k * 13; g.beginPath(); if (k % 2) g.ellipse(rx + (d < 0 ? -10 : 36), cy, 3, 7, 0, 0, 7); else g.ellipse(rx + (d < 0 ? -10 : 36), cy, 7, 3, 0, 0, 7); g.stroke() }
      }
      grooves(g, x, fw, jy, k0); lamps2(g, x, fw, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, _chibi, k0) {
      const top = jy + 26, now = performance.now(), n = 14, W = fw + 164
      g.beginPath(); g.moveTo(x - 82, 720); g.lineTo(x - 82, top + 20); for (let i = 0; i < n; i++) { const px = x - 82 + (i / n) * W; g.lineTo(px + W / n / 2, top - 8); g.lineTo(px + W / n, top + 20 - (i === n - 1 ? 20 : 0)) } g.lineTo(x + fw + 82, 720); g.closePath()
      g.fillStyle = vg(g, top, 720, '#3a0a14', '#1a0408', '#080102'); g.fill(); g.strokeStyle = '#ff3b52'; g.lineWidth = 2; g.stroke()
      for (const cx of [x - 46, x + fw + 46]) { const cy = jy + 100, pu = 0.5 + 0.5 * Math.sin(now / 700 + cx); g.save(); g.shadowColor = '#ff3b52'; g.shadowBlur = 8 + 8 * pu; g.strokeStyle = `rgba(255,59,82,${0.55 + 0.4 * pu})`; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, 20, 0, 7); g.stroke(); g.beginPath(); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k * 2 * Math.PI * 2) / 5; k ? g.lineTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20) : g.moveTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20) } g.closePath(); g.stroke(); g.restore() }
      g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x - 70, top + 24, fw + 140, 1.5); g.font = `800 11px ${FONT}`; void k0
    },
    key(g, x, y, w, h, on, blue, label) {
      const cx = x + w / 2, cy = y + h / 2, rx = w / 2 - 1, ry = h / 2 - 1, c = 11
      const pts = [[x + c, y], [x + w - c, y], [x + w, y + c], [x + w, y + h - c], [x + w - c, y + h], [x + c, y + h], [x, y + h - c], [x, y + c]]
      if (on) { g.save(); g.shadowColor = '#ff3b52'; g.shadowBlur = 22 }
      poly(g, pts); g.fillStyle = on ? vg(g, y, y + h, '#ffffff', '#ff3b52') : vg(g, y, y + h, blue ? '#d8304a' : '#7a1a28', blue ? '#5a0814' : '#2a050c'); g.fill(); if (on) g.restore()
      g.strokeStyle = on ? '#ffffff' : '#ff6a7a'; g.lineWidth = 2; poly(g, pts); g.stroke()
      g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, y); g.lineTo(cx, y + h); g.moveTo(x, cy); g.lineTo(x + w, cy); g.moveTo(x + c, y); g.lineTo(cx - rx * 0.1, cy); g.moveTo(x + w - c, y + h); g.lineTo(cx + rx * 0.1, cy + ry * 0.1); g.stroke()
      lab(g, x, y, w, h, label, on ? '#4a0614' : '#ffe0e4')
    },
    lcd: rr(2), chip: rr(2)
  }
}
