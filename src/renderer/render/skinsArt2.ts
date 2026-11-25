// 새로 그린 스킨 넷: 코스모스(우주) · 태엽 공방(황동 톱니) · 캔디(사탕 가게) · 단청(한옥 기둥과 마루)
// 틀·콘솔·건반을 전부 스킨이 직접 그린다 (색만 바꾼 변형이 아니다). skinsArt.ts의 Art 모양과 같고, gear.ts가 ART에 합친다
import { FONT } from './theme'
import { mix, type GearSkin, type Lit } from './gear'
import type { Art, PathFn } from './skinsArt'

type G = CanvasRenderingContext2D
export const rnd = (i: number) => ((i * 7919 + 13) % 97) / 97
export const poly = (g: G, pts: number[][]) => { g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath() }
export const vg = (g: G, y0: number, y1: number, ...c: string[]) => { const k = g.createLinearGradient(0, y0, 0, y1); c.forEach((s, i) => k.addColorStop(i / (c.length - 1), s)); return k }
export const hg = (g: G, x0: number, x1: number, ...c: string[]) => { const k = g.createLinearGradient(x0, 0, x1, 0); c.forEach((s, i) => k.addColorStop(i / (c.length - 1), s)); return k }
export const lab = (g: G, x: number, y: number, w: number, h: number, t: string, color: string) => { g.font = `900 ${t.length > 2 ? 15 : 26}px ${FONT}`; g.textAlign = 'center'; g.fillStyle = color; g.fillText(t, x + w / 2, y + h / 2 + (t.length > 2 ? 5 : 9)); g.textAlign = 'left' }
const pill: PathFn = (g, x, y, w, h) => { g.beginPath(); g.roundRect(x, y, w, h, h / 2) }
export const rr = (r: number): PathFn => (g, x, y, w, h) => { g.beginPath(); g.roundRect(x, y, w, h, r) }
export const fieldFill = (g: G, x: number, fw: number, pa: number, k0: GearSkin) => { g.fillStyle = `rgba(${k0.field},${pa})`; g.fillRect(x - 4, 0, fw + 8, 720) }
export const grooves = (g: G, x: number, fw: number, jy: number, k0: GearSkin) => { g.fillStyle = mix(k0.dark, '#000000', 0.6); g.fillRect(x - 22, 90, 10, jy - 90); g.fillRect(x + fw + 12, 90, 10, jy - 90) } // 체력 게이지 홈 (게이지는 Play가 그린다)
export const sides = (x: number, fw: number) => [[-1, x - 30], [1, x + fw + 4]] as const
export const body = (g: G, k0: GearSkin, top: number, edge: string, lw = 1.5) => { g.fillStyle = vg(g, top, 720, mix(k0.mid, k0.dark, 0.35), mix(k0.dark, k0.mid, 0.2), mix(k0.dark, '#000000', 0.4)); g.fill(); g.strokeStyle = edge; g.lineWidth = lw; g.stroke() }
export const dot = (g: G, x: number, y: number, r: number) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill() }
// 톱니바퀴 윤곽: teeth개의 이빨이 있는 바퀴 (r 바깥 반지름, 이빨 높이 r*0.22)
export const cogPath = (g: G, cx: number, cy: number, r: number, teeth: number, rot: number) => {
  g.beginPath(); const ri = r * 0.78
  for (let i = 0; i < teeth; i++) {
    const a = rot + (i / teeth) * Math.PI * 2, s = Math.PI / teeth, p = (u: number, rad: number) => [cx + Math.cos(a + u * s) * rad, cy + Math.sin(a + u * s) * rad]
    const pts = [p(-0.9, ri), p(-0.45, r), p(0.45, r), p(0.9, ri)]
    pts.forEach(([px, py], j) => (i === 0 && j === 0 ? g.moveTo(px, py) : g.lineTo(px, py)))
  }
  g.closePath()
}

// 필드 안을 흐르는 별들 (번쩍임)
export const stars = (g: G, x0: number, w: number, h: number, n: number, seed: number, a: number) => {
  const now = performance.now()
  for (let i = 0; i < n; i++) {
    const tw = 0.5 + 0.5 * Math.sin(now / 700 + i * 1.7)
    g.globalAlpha = a * (0.3 + 0.7 * tw); g.fillStyle = i % 5 === 0 ? '#ffd9a8' : '#dfe8ff'
    dot(g, x0 + rnd(i + seed) * w, rnd(i * 3 + seed + 5) * h, 0.6 + 1.5 * rnd(i + seed + 9))
  }
  g.globalAlpha = 1
}

// 한옥 단청 띠: 초록 바탕에 파란 선과 마름모 무늬가 이어진다 (x~x+w, 높이 h)
const dancheongBand = (g: G, x: number, y: number, w: number, h: number) => {
  g.fillStyle = '#1f8a70'; g.fillRect(x, y, w, h)
  g.fillStyle = '#2a5fb0'; g.fillRect(x, y, w, h * 0.2); g.fillRect(x, y + h * 0.8, w, h * 0.2)
  g.fillStyle = '#f4ecd2'; g.fillRect(x, y + h * 0.2, w, 1); g.fillRect(x, y + h * 0.8 - 1, w, 1)
  const cell = h * 1.1
  for (let px = x + cell / 2; px < x + w; px += cell) {
    g.fillStyle = '#e8b63a'; poly(g, [[px, y + h * 0.28], [px + cell * 0.34, y + h / 2], [px, y + h * 0.72], [px - cell * 0.34, y + h / 2]]); g.fill()
    g.fillStyle = '#c8352f'; poly(g, [[px, y + h * 0.4], [px + cell * 0.15, y + h / 2], [px, y + h * 0.6], [px - cell * 0.15, y + h / 2]]); g.fill()
  }
}

export const ART2: Record<string, Art> = {
  cosmos: { // 은하수 속 유리 기둥에 궤도 구슬이 흐르고, 별자리 선이 이어진다 · 아래는 천문대 돔 · 건반은 고리 두른 행성
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0)
      g.save(); g.beginPath(); g.rect(x - 4, 0, fw + 8, jy); g.clip()
      for (const [px, py, r, col, al] of [[x + fw * 0.3, 190, 240, k0.accent, 0.10], [x + fw * 0.85, 400, 200, k0.warn, 0.08]] as const) { const rg = g.createRadialGradient(px, py, 0, px, py, r); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = al; g.fillStyle = rg; g.fillRect(x - 4, 0, fw + 8, jy); g.globalAlpha = 1 }
      stars(g, x - 4, fw + 8, jy, 46, 3, 0.8); g.restore()
      const now = performance.now()
      for (const [d, rx] of sides(x, fw)) {
        g.fillStyle = vg(g, 0, 720, 'rgba(70,80,190,.55)', 'rgba(20,24,90,.75)'); g.beginPath(); g.roundRect(rx, 0, 26, 720, 13); g.fill()
        g.strokeStyle = 'rgba(159,232,255,.55)'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(rx + 4, 8, 2.5, 704)
        g.fillStyle = k0.accent // 궤도를 도는 구슬
        for (let i = 0; i < 7; i++) { const by = ((i * 104 + now / 22) % 720), sway = Math.sin(by / 40 + now / 500) * 3; g.globalAlpha = 0.9; dot(g, rx + 13 + sway, by, 1.8 + (i % 3)) } g.globalAlpha = 1
        const py = jy - 200, pcx = rx + 13 // 기둥에 꿰인 고리 행성
        g.fillStyle = vg(g, py - 15, py + 15, '#cdd6ff', '#4f5fd8'); dot(g, pcx, py, 14); g.strokeStyle = k0.accent; g.lineWidth = 2; g.beginPath(); g.ellipse(pcx, py, 24, 6, -0.35, 0, 7); g.stroke()
        const ox = rx + d * 34 // 바깥으로 이어지는 별자리 선
        g.strokeStyle = 'rgba(159,232,255,.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(rx + 13, jy - 90); for (const [dx, dy] of [[34, -150], [16, -230], [40, -300], [20, -380]]) g.lineTo(rx + 13 + d * dx, jy + dy); g.stroke()
        g.fillStyle = '#e8f0ff'; for (const [dx, dy] of [[34, -150], [16, -230], [40, -300], [20, -380]]) dot(g, rx + 13 + d * dx, jy + dy, 2.4); void ox
      }
      grooves(g, x, fw, jy, k0); lamps2(g, x, fw, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, _chibi, k0) {
      const top = jy + 26; g.beginPath(); g.moveTo(x - 74, 720); g.lineTo(x - 74, top + 70); g.quadraticCurveTo(x - 74, top - 2, x - 24, top - 2); g.lineTo(x + fw + 24, top - 2); g.quadraticCurveTo(x + fw + 74, top - 2, x + fw + 74, top + 70); g.lineTo(x + fw + 74, 720); g.closePath()
      body(g, k0, top, 'rgba(159,232,255,.7)', 2)
      g.save(); g.clip(); g.translate(0, top); stars(g, x - 74, fw + 148, 720 - top, 26, 11, 0.7); g.restore() // clip 안이라 별은 콘솔 안쪽에만
      g.save(); g.beginPath(); g.moveTo(x - 74, 720); g.lineTo(x - 74, top + 70); g.quadraticCurveTo(x - 74, top - 2, x - 24, top - 2); g.lineTo(x + fw + 24, top - 2); g.quadraticCurveTo(x + fw + 74, top - 2, x + fw + 74, top + 70); g.lineTo(x + fw + 74, 720); g.closePath(); g.clip()
      g.strokeStyle = 'rgba(159,232,255,.22)'; g.lineWidth = 1.2; for (const k of [1, 1.7, 2.5]) { g.beginPath(); g.ellipse(x + fw / 2, top + 40, 90 * k, 26 * k, 0, 0, 7); g.stroke() }
      g.restore()
      g.fillStyle = k0.accent; g.globalAlpha = 0.8; g.fillRect(x - 24, top + 3, fw + 48, 2); g.globalAlpha = 1
    },
    key(g, x, y, w, h, on, blue, label, k0) {
      const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2 - 2
      if (on) { g.save(); g.shadowColor = k0.accent; g.shadowBlur = 22 }
      const pg = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r)
      if (on) { pg.addColorStop(0, '#ffffff'); pg.addColorStop(1, k0.accent) } else if (blue) { pg.addColorStop(0, '#8fa6ff'); pg.addColorStop(1, '#1b1f5c') } else { pg.addColorStop(0, '#dfe5ff'); pg.addColorStop(1, '#4a5190') }
      g.fillStyle = pg; dot(g, cx, cy, r); if (on) g.restore()
      g.strokeStyle = on ? '#ffffff' : 'rgba(159,232,255,.85)'; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy + 1, r * 1.12, r * 0.3, -0.3, 0, 7); g.stroke()
      lab(g, x, y, w, h, label, on ? '#0a1033' : '#ffffff')
    },
    lcd: pill, chip: pill
  },

  clockwork: { // 황동 파이프 기둥에 리벳 띠와 압력계, 바깥에서 도는 톱니바퀴 · 아래는 리벳 박힌 황동판 · 건반은 톱니 단추
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0)
      const now = performance.now()
      g.save(); g.beginPath(); g.rect(x - 4, 0, fw + 8, jy); g.clip()
      g.strokeStyle = k0.accent; g.globalAlpha = 0.05; g.lineWidth = 1; g.beginPath(); for (let px = x - 4; px < x + fw + 8; px += 20) { g.moveTo(px, 0); g.lineTo(px, jy) } for (let py = 0; py < jy; py += 20) { g.moveTo(x - 4, py); g.lineTo(x + fw + 4, py) } g.stroke()
      g.globalAlpha = 0.07; g.fillStyle = k0.light; cogPath(g, x + fw * 0.22, 250, 96, 16, now / 5000); g.fill(); cogPath(g, x + fw * 0.82, 120, 62, 12, -now / 3400); g.fill(); g.globalAlpha = 1; g.restore()
      for (const [d, rx] of sides(x, fw)) {
        g.fillStyle = hg(g, rx, rx + 26, '#3a2410', '#e6b266', '#8a5a26', '#3a2410'); g.fillRect(rx, 0, 26, 720)
        g.fillStyle = 'rgba(255,240,200,.35)'; g.fillRect(rx + 6, 0, 2.5, 720)
        for (let by = 40; by < jy; by += 112) { // 이음 띠와 리벳
          g.fillStyle = hg(g, rx - 3, rx + 29, '#4a2e14', '#f0c27a', '#7a4a1c'); g.fillRect(rx - 3, by, 32, 14); g.fillStyle = '#2a190a'; g.fillRect(rx - 3, by + 14, 32, 2)
          g.fillStyle = '#ffe1a8'; dot(g, rx + 3, by + 7, 2); dot(g, rx + 23, by + 7, 2)
        }
        const gy = jy - 330, gcx = rx + 13 // 압력계: 바늘이 콤보 따라 떤다
        g.fillStyle = '#6a4218'; dot(g, gcx, gy, 15); g.fillStyle = '#f6ecd0'; dot(g, gcx, gy, 11.5)
        g.strokeStyle = '#b33a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(gcx, gy); const an = -2.2 + 1.4 * (0.5 + 0.5 * Math.sin(now / 900 + d)); g.lineTo(gcx + Math.cos(an) * 9, gy + Math.sin(an) * 9); g.stroke()
        g.fillStyle = '#1a0e06'; dot(g, gcx, gy, 1.8)
        g.fillStyle = k0.mid; cogPath(g, rx + (d < 0 ? -14 : 40), jy - 150, 34, 12, d * now / 2600); g.fill(); g.strokeStyle = k0.light; g.lineWidth = 2; g.stroke(); g.fillStyle = '#1a0e06'; dot(g, rx + (d < 0 ? -14 : 40), jy - 150, 9)
        g.fillStyle = mix(k0.mid, k0.light, 0.3); cogPath(g, rx + (d < 0 ? -34 : 60), jy - 96, 21, 9, -d * now / 1900); g.fill(); g.strokeStyle = k0.light; g.lineWidth = 1.6; g.stroke()
      }
      grooves(g, x, fw, jy, k0); lamps2(g, x, fw, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, _chibi, k0) {
      const top = jy + 24; poly(g, [[x - 74, top + 26], [x - 48, top], [x + fw + 48, top], [x + fw + 74, top + 26], [x + fw + 74, 720], [x - 74, 720]])
      body(g, k0, top, k0.light, 2.2)
      g.fillStyle = 'rgba(255,230,170,.25)'; g.fillRect(x - 46, top + 3, fw + 92, 2)
      g.fillStyle = '#ffe1a8'; for (let px = x - 56; px <= x + fw + 56; px += 28) { dot(g, px, top + 14, 2.2) } // 리벳 줄
      g.strokeStyle = 'rgba(255,225,170,.28)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 60, top + 108); g.lineTo(x + fw + 60, top + 108); g.stroke()
      g.fillStyle = mix(k0.mid, k0.dark, 0.4); cogPath(g, x - 50, top + 150, 30, 12, 0.2); g.fill(); g.strokeStyle = k0.light; g.lineWidth = 1.5; g.stroke(); cogPath(g, x + fw + 50, top + 150, 30, 12, 0.5); g.fill(); g.stroke()
    },
    key(g, x, y, w, h, on, blue, label, k0) {
      const cx = x + w / 2, cy = y + h / 2 + (on ? 1 : 0), r = Math.min(w, h) / 2
      if (on) { g.save(); g.shadowColor = k0.warn; g.shadowBlur = 18 }
      cogPath(g, cx, cy, r, 12, on ? 0.13 : 0); g.fillStyle = on ? vg(g, cy - r, cy + r, '#fff3d0', k0.accent) : vg(g, cy - r, cy + r, blue ? '#f0c27a' : '#e8e0d0', blue ? '#6a4218' : '#8a8478'); g.fill(); if (on) g.restore()
      g.strokeStyle = '#2a190a'; g.lineWidth = 2; cogPath(g, cx, cy, r, 12, on ? 0.13 : 0); g.stroke()
      g.fillStyle = on ? 'rgba(111,224,208,.9)' : 'rgba(30,16,6,.55)'; dot(g, cx, cy, r * 0.58); g.strokeStyle = 'rgba(255,225,170,.7)'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, r * 0.58, 0, 7); g.stroke()
      lab(g, x, y + (on ? 1 : 0), w, h, label, on ? '#10201c' : '#fff1d0')
    },
    lcd: rr(4), chip: rr(4)
  },

  candy: { // 젤리 기둥 바깥에 알록달록한 구미 캔디가 쌓이고, 막대사탕이 서 있다 · 아래는 흰 크림이 흘러내린 케이크 · 건반은 마카롱
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0)
      g.save(); g.beginPath(); g.rect(x - 4, 0, fw + 8, jy); g.clip(); g.fillStyle = k0.accent; g.globalAlpha = 0.07
      for (let py = 0, r = 0; py < jy; py += 34, r++) for (let px = x - 4 + (r % 2) * 20; px < x + fw + 8; px += 40) dot(g, px, py, 5)
      g.globalAlpha = 1; g.restore()
      const gum = ['#ff8ad8', '#7dffe0', '#ffd45e', '#b48cff']
      for (const [d, rx] of sides(x, fw)) {
        g.fillStyle = hg(g, rx, rx + 26, d < 0 ? '#ffb8e6' : '#ff8ad8', d < 0 ? '#ff8ad8' : '#ffb8e6'); g.beginPath(); g.roundRect(rx, 0, 26, 720, 13); g.fill()
        g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(rx + 4, 6, 3, 708); g.strokeStyle = 'rgba(120,40,100,.5)'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(rx, 0, 26, 720, 13); g.stroke()
        const ox = rx + (d < 0 ? -1 : 27) // 바깥으로 불룩 나온 구미
        for (let by = 30, i = 0; by < jy + 10; by += 44, i++) {
          g.fillStyle = gum[(i + (d < 0 ? 0 : 2)) % 4]; g.beginPath(); g.ellipse(ox, by, 10, 14, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(80,20,70,.45)'; g.lineWidth = 1.4; g.stroke()
          g.fillStyle = 'rgba(255,255,255,.65)'; g.beginPath(); g.ellipse(ox - 3, by - 5, 3, 5, 0, 0, 7); g.fill()
        }
        const lx = rx + (d < 0 ? -40 : 66), ly = jy - 130 // 막대사탕
        g.fillStyle = '#fff6fb'; g.fillRect(lx - 3, ly, 6, 190); g.strokeStyle = 'rgba(120,40,100,.5)'; g.lineWidth = 1.2; g.strokeRect(lx - 3, ly, 6, 190)
        g.fillStyle = '#ff6aa0'; dot(g, lx, ly, 30); g.strokeStyle = '#fff6fb'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath()
        for (let t = 0; t < 4.6 * Math.PI; t += 0.2) { const rad = 2 + t * 2.1; g.lineTo(lx + Math.cos(t) * rad, ly + Math.sin(t) * rad) } g.stroke(); g.lineCap = 'butt'
        g.strokeStyle = 'rgba(120,40,100,.55)'; g.lineWidth = 1.6; g.beginPath(); g.arc(lx, ly, 30, 0, 7); g.stroke()
      }
      grooves(g, x, fw, jy, k0); lamps2(g, x, fw, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, _chibi, k0) {
      const top = jy + 30; g.beginPath(); g.roundRect(x - 74, top, fw + 148, 720 - top + 30, 26); body(g, k0, top, '#ffe6f6', 2)
      g.save(); g.beginPath(); g.roundRect(x - 74, top, fw + 148, 720 - top + 30, 26); g.clip()
      g.fillStyle = '#fff6fb'; g.beginPath(); g.moveTo(x - 74, top - 2); g.lineTo(x + fw + 74, top - 2); g.lineTo(x + fw + 74, top + 12) // 흘러내린 크림
      const n = Math.round((fw + 148) / 30); for (let i = n; i >= 0; i--) { const px = x - 74 + (i / n) * (fw + 148), dr = 10 + 16 * rnd(i * 5 + 2); g.quadraticCurveTo(px + 8, top + 12 + dr + 6, px, top + 12 + dr); g.quadraticCurveTo(px - 8, top + 12, px - (fw + 148) / n / 2, top + 12) }
      g.closePath(); g.fill()
      const sp = ['#ff6aa0', '#7dffe0', '#ffd45e', '#b48cff']
      for (let i = 0; i < 34; i++) { g.save(); g.translate(x - 70 + rnd(i) * (fw + 140), top + 60 + rnd(i + 9) * (720 - top - 70)); g.rotate(rnd(i + 3) * 3.14); g.fillStyle = sp[i % 4]; g.beginPath(); g.roundRect(-5, -1.8, 10, 3.6, 1.8); g.fill(); g.restore() }
      g.restore()
    },
    key(g, x, y, w, h, on, blue, label, k0) {
      const cx = x + w / 2, sh = blue ? ['#7dffe0', '#2fb89a'] : ['#ffb8e6', '#ff6aa0']
      const top = y + (on ? 3 : 0)
      if (on) { g.save(); g.shadowColor = k0.accent; g.shadowBlur = 18 }
      g.fillStyle = on ? vg(g, top + 24, top + h, '#ffffff', sh[0]) : vg(g, top + 24, top + h, sh[0], sh[1]); g.beginPath(); g.ellipse(cx, top + h * 0.7, w / 2, h * 0.28, 0, 0, 7); g.fill() // 아래 껍질
      g.fillStyle = '#fffaf0'; g.fillRect(x + 3, top + h * 0.42, w - 6, h * 0.22) // 크림
      g.fillStyle = on ? vg(g, top, top + h * 0.5, '#ffffff', sh[0]) : vg(g, top, top + h * 0.5, sh[0], sh[1]); g.beginPath(); g.ellipse(cx, top + h * 0.34, w / 2, h * 0.3, 0, 0, 7); g.fill(); if (on) g.restore() // 위 껍질
      g.strokeStyle = 'rgba(100,30,80,.5)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(cx, top + h * 0.34, w / 2, h * 0.3, 0, 0, 7); g.stroke()
      g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(cx - w * 0.16, top + h * 0.22, w * 0.18, h * 0.07, -0.2, 0, 7); g.fill()
      lab(g, x, top - h * 0.08, w, h, label, '#5a1f4a')
    },
    lcd: pill, chip: pill
  },

  dancheong: { // 단청 띠를 두른 붉은 기둥, 위에서 드리운 처마 · 아래는 단청 띠가 올려진 나무 마루 · 건반은 북 모양 단추
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0)
      g.save(); g.beginPath(); g.rect(x - 4, 0, fw + 8, jy); g.clip(); g.strokeStyle = k0.accent; g.globalAlpha = 0.07; g.lineWidth = 1.2 // 구름 무늬 (물결 두 줄)
      for (let k = 0; k < 5; k++) { const py = 60 + k * 100, ox = (k % 2) * 40; g.beginPath(); for (let px = x - 4; px < x + fw + 8; px += 80) { g.moveTo(px + ox, py + 14); g.bezierCurveTo(px + ox, py - 4, px + ox + 30, py - 4, px + ox + 30, py + 12); g.bezierCurveTo(px + ox + 30, py, px + ox + 44, py, px + ox + 44, py + 10) } g.stroke() }
      g.globalAlpha = 1; g.restore()
      for (const [, rx] of sides(x, fw)) {
        g.fillStyle = hg(g, rx, rx + 26, '#5a1512', '#d0402f', '#8a1f1a', '#4a100e'); g.fillRect(rx, 0, 26, 720)
        g.fillStyle = 'rgba(255,220,180,.25)'; g.fillRect(rx + 5, 0, 2.5, 720)
        for (let by = 46; by < jy - 20; by += 120) { dancheongBand(g, rx - 2, by, 30, 26); g.strokeStyle = '#f4ecd2'; g.lineWidth = 1; g.strokeRect(rx - 1.5, by + 0.5, 29, 25) }
        g.fillStyle = '#2a1a12'; g.fillRect(rx - 4, jy - 12, 34, 30); g.fillStyle = '#e8b63a'; g.fillRect(rx - 4, jy - 12, 34, 3) // 주춧돌
      }
      g.fillStyle = vg(g, 0, 26, '#2a1a12', '#4a2a1a') // 위쪽 처마 받침
      g.fillRect(x - 40, 0, fw + 80, 12); dancheongBand(g, x - 40, 12, fw + 80, 16)
      g.fillStyle = '#f4ecd2'; g.fillRect(x - 40, 28, fw + 80, 1.5)
      grooves(g, x, fw, jy, k0); lamps2(g, x, fw, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, _chibi, k0) {
      const top = jy + 22; poly(g, [[x - 80, top + 4], [x + fw + 80, top + 4], [x + fw + 74, 720], [x - 74, 720]])
      g.fillStyle = vg(g, top, 720, '#4a2a1a', '#2a170e', '#140a06'); g.fill(); g.strokeStyle = k0.light; g.lineWidth = 2; g.stroke()
      g.save(); poly(g, [[x - 80, top + 4], [x + fw + 80, top + 4], [x + fw + 74, 720], [x - 74, 720]]); g.clip()
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.beginPath(); for (let py = top + 40; py < 720; py += 9) { g.moveTo(x - 80, py + rnd(py) * 3); g.lineTo(x + fw + 80, py + rnd(py + 4) * 3) } g.stroke() // 나뭇결
      g.restore()
      dancheongBand(g, x - 80, top - 12, fw + 160, 22); g.fillStyle = '#f4ecd2'; g.fillRect(x - 80, top - 12, fw + 160, 1.5); g.fillRect(x - 80, top + 9, fw + 160, 1.5)
      g.fillStyle = k0.light; for (const px of [x - 60, x + fw + 60]) { dot(g, px, top + 150, 7); g.fillStyle = '#2a170e'; dot(g, px, top + 150, 3); g.fillStyle = k0.light } // 장식 못
    },
    key(g, x, y, w, h, on, blue, label, k0) {
      const cx = x + w / 2, cy = y + h / 2 + (on ? 1 : 0), r = Math.min(w, h) / 2
      if (on) { g.save(); g.shadowColor = k0.accent; g.shadowBlur = 20 }
      g.fillStyle = blue ? '#2a5fb0' : '#c8352f'; dot(g, cx, cy, r); if (on) g.restore()
      g.strokeStyle = '#e8b63a'; g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cy, r - 1.5, 0, 7); g.stroke()
      g.fillStyle = on ? vg(g, cy - r, cy + r, '#fffbe0', '#ffcf5a') : vg(g, cy - r, cy + r, '#f6ebc6', '#c9b27a'); dot(g, cx, cy, r - 7)
      g.fillStyle = '#e8b63a'; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; dot(g, cx + Math.cos(a) * (r - 3.4), cy + Math.sin(a) * (r - 3.4), 1) } // 북 징
      lab(g, x, y + (on ? 1 : 0), w, h, label, '#3a140e')
    },
    lcd: rr(3), chip: rr(3)
  }
}

// 기둥 바깥 램프 자리: gear.ts의 lamps와 같다 (순환 참조를 피해 gear.ts가 넘겨 주는 함수를 쓴다)
let lampFn: ((g: G, cx: number, lit: Lit, k0: GearSkin) => void) | undefined
export const setLamps = (f: typeof lampFn) => { lampFn = f }
export function lamps2(g: G, x: number, fw: number, lit: Lit, k0: GearSkin) { lampFn?.(g, x - 66, lit, k0); lampFn?.(g, x + fw + 66, lit, k0) }
