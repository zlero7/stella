// 노트 스킨마다 기어의 "생김새" 자체가 다르다: 틀(기둥·날개·장식)·콘솔 모양·건반 모양·점수창/칩 모양을 스킨이 따로 그린다 (색만 바꾼 같은 기어가 아니다)
// steel(기본)은 gear.ts의 원래 그림을 쓰고, 나머지 열한 개가 여기 있다
import { FONT } from './theme'
import { chibis, fieldDecor, lamps, mix, type GearSkin, type Lit } from './gear'

type G = CanvasRenderingContext2D
export type PathFn = (g: G, x: number, y: number, w: number, h: number) => void
export interface Art {
  back(g: G, x: number, fw: number, jy: number, pa: number, lit: Lit, k0: GearSkin): void // 필드·틀·램프 (노트 아래)
  consoleBack(g: G, x: number, fw: number, jy: number, diffCol: string, chibi: boolean, k0: GearSkin): void // 콘솔 몸통·캐릭터 (건반 아래)
  key(g: G, x: number, y: number, w: number, h: number, on: boolean, blue: boolean, label: string, k0: GearSkin, nc: string): void // 건반 하나
  lcd?: PathFn; chip?: PathFn // 점수창·칩의 윤곽 (없으면 둥근 네모)
}

const fieldFill = (g: G, x: number, fw: number, pa: number, k0: GearSkin) => { g.fillStyle = `rgba(${k0.field},${pa})`; g.fillRect(x - 4, 0, fw + 8, 720) }
const grooves = (g: G, x: number, fw: number, jy: number, k0: GearSkin) => { g.fillStyle = mix(k0.dark, '#000000', 0.6); g.fillRect(x - 22, 90, 10, jy - 90); g.fillRect(x + fw + 12, 90, 10, jy - 90) } // 체력 게이지 홈 (게이지는 Play가 그린다)
const poly = (g: G, pts: number[][]) => { g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath() }
const vg = (g: G, y0: number, y1: number, ...c: string[]) => { const k = g.createLinearGradient(0, y0, 0, y1); c.forEach((s, i) => k.addColorStop(i / (c.length - 1), s)); return k }
const lab = (g: G, x: number, y: number, w: number, h: number, t: string, color: string) => { g.font = `900 ${t.length > 2 ? 15 : 26}px ${FONT}`; g.textAlign = 'center'; g.fillStyle = color; g.fillText(t, x + w / 2, y + h / 2 + (t.length > 2 ? 5 : 9)); g.textAlign = 'left' }
const skew = (s: number): PathFn => (g, x, y, w, h) => poly(g, [[x + s, y], [x + w, y], [x + w - s, y + h], [x, y + h]])
const cut = (c: number): PathFn => (g, x, y, w, h) => poly(g, [[x + c, y], [x + w - c, y], [x + w, y + c], [x + w, y + h - c], [x + w - c, y + h], [x + c, y + h], [x, y + h - c], [x, y + c]])
const pill: PathFn = (g, x, y, w, h) => { g.beginPath(); g.roundRect(x, y, w, h, h / 2) }
const sq: PathFn = (g, x, y, w, h) => { g.beginPath(); g.rect(x, y, w, h) }
const hexPts = (x: number, y: number, w: number, h: number) => [[x + w * 0.25, y], [x + w * 0.75, y], [x + w, y + h / 2], [x + w * 0.75, y + h], [x + w * 0.25, y + h], [x, y + h / 2]]
const hex: PathFn = (g, x, y, w, h) => poly(g, hexPts(x, y, w, h))
// 콘솔 몸통 공통 칠: 윤곽을 만든 뒤 위→아래로 짙어지게 칠하고 테두리를 두른다
const body = (g: G, k0: GearSkin, top: number, edge: string, lw = 1.5) => { g.fillStyle = vg(g, top, 720, mix(k0.mid, k0.dark, 0.35), mix(k0.dark, k0.mid, 0.2), mix(k0.dark, '#000000', 0.4)); g.fill(); g.strokeStyle = edge; g.lineWidth = lw; g.stroke() }
const sides = (x: number, fw: number) => [[-1, x - 30], [1, x + fw + 4]] as const

export const ART: Record<string, Art> = {
  neon: { // 단단한 기둥 없이 빛나는 선과 모서리 괄호, 아래는 비스듬한 홀로그램 판
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0); fieldDecor(g, x, fw, jy, k0, 'grid')
      g.save(); g.shadowColor = k0.accent; g.lineCap = 'round'
      for (const [d, edge] of [[-1, x - 6], [1, x + fw + 6]] as const) {
        g.shadowBlur = 12; g.strokeStyle = k0.accent; g.lineWidth = 3; g.beginPath(); g.moveTo(edge, 0); g.lineTo(edge, jy + 12); g.stroke()
        g.shadowColor = k0.warn; g.strokeStyle = k0.warn; g.lineWidth = 1.5; g.beginPath(); g.moveTo(edge + d * 14, 50); g.lineTo(edge + d * 14, jy - 40); g.stroke()
        for (const y of [40, jy - 6]) { g.beginPath(); g.moveTo(edge + d * 4, y); g.lineTo(edge + d * 36, y); g.lineTo(edge + d * 36, y + (y < 100 ? 30 : -30)); g.stroke() }
        g.shadowBlur = 8; g.shadowColor = k0.accent; g.lineWidth = 1.5; g.strokeStyle = k0.accent
        for (let y = 150; y < jy - 60; y += 110) { g.save(); g.translate(edge + d * 30, y); g.rotate(Math.PI / 4); g.strokeRect(-6, -6, 12, 12); g.restore() }
      }
      g.restore(); grooves(g, x, fw, jy, k0); lamps(g, x - 66, lit, k0); lamps(g, x + fw + 66, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, chibi, k0) {
      const top = jy + 22; poly(g, [[x - 34, top], [x + fw + 34, top], [x + fw + 74, 720], [x - 74, 720]])
      g.fillStyle = vg(g, top, 720, 'rgba(20,10,50,.92)', 'rgba(4,2,12,.98)'); g.fill()
      g.save(); g.shadowColor = k0.accent; g.shadowBlur = 12; g.strokeStyle = k0.accent; g.lineWidth = 2.2; g.stroke(); g.restore()
      g.strokeStyle = k0.warn; g.globalAlpha = 0.5; g.lineWidth = 1; poly(g, [[x - 26, top + 8], [x + fw + 26, top + 8], [x + fw + 62, 712], [x - 62, 712]]); g.stroke()
      g.strokeStyle = k0.accent; g.globalAlpha = 0.08; g.beginPath(); for (let yy = top + 16; yy < 720; yy += 9) { g.moveTo(x - 70, yy); g.lineTo(x + fw + 70, yy) } g.stroke(); g.globalAlpha = 1
      if (chibi) chibis(g, x, fw, k0, 70)
    },
    key(g, x, y, w, h, on, blue, label, k0) {
      skew(9)(g, x, y, w, h); g.fillStyle = on ? mix(blue ? k0.accent : '#ffffff', '#000000', 0.25) : 'rgba(8,4,24,.9)'; g.fill()
      g.save(); g.shadowColor = blue ? k0.accent : '#ffffff'; g.shadowBlur = on ? 18 : 6; g.strokeStyle = blue ? k0.accent : '#e6dcff'; g.lineWidth = 2.2; g.stroke(); g.restore()
      lab(g, x, y, w, h, label, on ? '#0a0a1e' : blue ? k0.accent : '#e6dcff')
    },
    lcd: skew(8), chip: skew(5)
  },
  gold: { // 홈이 파인 굵은 금 기둥, 기둥머리와 소용돌이 장식, 물결 가장자리의 아치형 콘솔
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0); fieldDecor(g, x, fw, jy, k0, 'lattice')
      for (const [d, rx] of [[-1, x - 38], [1, x + fw + 4]] as const) {
        const f = g.createLinearGradient(rx, 0, rx + 34, 0); f.addColorStop(0, '#6a4a14'); f.addColorStop(0.3, '#f3d27a'); f.addColorStop(0.55, '#b88a2a'); f.addColorStop(1, '#4a3008')
        g.fillStyle = f; g.fillRect(rx, 0, 34, 720)
        g.strokeStyle = 'rgba(60,35,0,.55)'; g.lineWidth = 2; g.beginPath(); for (const o of [8, 17, 26]) { g.moveTo(rx + o, 70); g.lineTo(rx + o, jy + 16) } g.stroke()
        for (const y of [0, 70, jy + 10]) { g.fillStyle = vg(g, y, y + 18, '#fff1b0', '#c9961f'); g.fillRect(rx - 5, y, 44, 18); g.fillStyle = '#7a540c'; g.fillRect(rx - 5, y + 16, 44, 3) }
        g.strokeStyle = '#ffe9a0'; g.lineWidth = 3; g.beginPath(); const cx = rx + (d < 0 ? -10 : 44); g.arc(cx, 270, 16, d < 0 ? -1.2 : Math.PI + 1.2 - Math.PI * 2, d < 0 ? 3.6 : 4.8); g.stroke()
        g.beginPath(); g.arc(cx, 270, 7, 0, 7); g.stroke()
      }
      grooves(g, x, fw, jy, k0); lamps(g, x - 74, lit, k0); lamps(g, x + fw + 74, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, chibi, k0) {
      const top = jy + 26, l = x - 60, r = x + fw + 60, n = Math.round((r - l) / 28)
      g.beginPath(); g.moveTo(l, 720); g.lineTo(l, top + 24); for (let i = 0; i < n; i++) g.arc(l + (i + 0.5) * ((r - l) / n), top + 24, (r - l) / n / 2, Math.PI, 0)
      g.lineTo(r, 720); g.closePath(); g.fillStyle = vg(g, top, 720, '#f3d27a', '#b88a2a', '#4a3008'); g.fill(); g.strokeStyle = '#fff1b0'; g.lineWidth = 1.5; g.stroke()
      for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? '#ff3d5a' : '#5ac8ff'; g.beginPath(); g.arc(l + (i + 0.5) * ((r - l) / n), top + 14, 3, 0, 7); g.fill() }
      if (chibi) chibis(g, x, fw, k0, 60)
    },
    key(g, x, y, w, h, on, _b, label) {
      g.beginPath(); g.roundRect(x, y, w, h, 9); g.fillStyle = on ? vg(g, y, y + h, '#fff8d0', '#f0b82a') : vg(g, y, y + h, '#d9b04a', '#6a4a14'); g.fill()
      g.strokeStyle = on ? '#ffffff' : '#fff1b0'; g.lineWidth = 2; g.stroke(); g.strokeStyle = 'rgba(90,55,0,.6)'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(x + 5, y + 5, w - 10, h - 10, 6); g.stroke()
      g.fillStyle = '#ff3d5a'; g.beginPath(); g.arc(x + w / 2, y + 5, 3.4, 0, 7); g.fill(); lab(g, x, y + 2, w, h, label, on ? '#5a3a00' : '#fff6d0')
    }
  },
  sakura: { // 가지처럼 휜 가는 기둥에 벚꽃이 피고, 아래는 둥글게 부푼 분홍 콘솔 · 건반은 동그란 꽃
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0); fieldDecor(g, x, fw, jy, k0, 'petals')
      for (const [d, cx] of [[-1, x - 17], [1, x + fw + 17]] as const) {
        g.strokeStyle = '#7a4a4a'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); for (let y = 0; y <= jy + 20; y += 8) { const px = cx + Math.sin(y / 60) * 5 * d; y ? g.lineTo(px, y) : g.moveTo(px, y) } g.stroke()
        g.strokeStyle = '#b86f6f'; g.lineWidth = 2; g.stroke()
        for (let y = 36; y < jy; y += 74) { const px = cx + Math.sin(y / 60) * 5 * d + d * 11; g.fillStyle = k0.accent; for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; g.beginPath(); g.arc(px + Math.cos(a) * 5, y + Math.sin(a) * 5, 4.4, 0, 7); g.fill() } g.fillStyle = '#ffe27a'; g.beginPath(); g.arc(px, y, 2.4, 0, 7); g.fill() }
        g.fillStyle = vg(g, 250, jy, 'rgba(255,200,225,.9)', 'rgba(210,120,160,.9)'); g.beginPath(); g.ellipse(cx + d * 22, jy - 90, 20, 100, d * 0.25, 0, 7); g.fill() // 꽃잎 모양 날개
      }
      grooves(g, x, fw, jy, k0); lamps(g, x - 66, lit, k0); lamps(g, x + fw + 66, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, chibi, k0) {
      const top = jy + 24; g.beginPath(); g.roundRect(x - 66, top, fw + 132, 720 - top + 40, 44); body(g, k0, top, '#fff0f6', 2.5)
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.roundRect(x - 40, top + 6, fw + 80, 8, 4); g.fill()
      if (chibi) chibis(g, x, fw, k0, 66)
    },
    key(g, x, y, w, h, on, _b, label, k0) {
      const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2
      g.fillStyle = on ? vg(g, y, y + h, '#ffffff', k0.accent) : vg(g, y, y + h, '#ffe0ee', '#d77aa4'); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill()
      g.strokeStyle = '#ffffff'; g.lineWidth = 2.4; g.stroke(); g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(cx - r * 0.2, cy - r * 0.45, r * 0.5, r * 0.22, -0.3, 0, 7); g.fill()
      lab(g, x, y, w, h, label, on ? '#b0305f' : '#8a3a5f')
    },
    lcd: pill, chip: pill
  },
  forest: { // 껍질 무늬 통나무 기둥, 이끼와 덩굴, 큰 나뭇잎 날개, 풀이 자란 나무판 콘솔 · 건반은 룬 새긴 나무토막
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0); fieldDecor(g, x, fw, jy, k0, 'leaves')
      for (const [d, rx] of [[-1, x - 32], [1, x + fw + 4]] as const) {
        const f = g.createLinearGradient(rx, 0, rx + 28, 0); f.addColorStop(0, '#2a1a0c'); f.addColorStop(0.4, '#7a5530'); f.addColorStop(1, '#3a2410'); g.fillStyle = f; g.fillRect(rx, 0, 28, 720)
        g.strokeStyle = 'rgba(20,10,0,.55)'; g.lineWidth = 1.6; g.beginPath(); for (let y = 12; y < 720; y += 26) { g.moveTo(rx + 2, y); g.quadraticCurveTo(rx + 14, y + 7, rx + 26, y) } g.stroke()
        g.fillStyle = '#2f7a3a'; g.fillRect(rx, 0, 28, 14); g.fillStyle = '#4cc46a'; for (let i = 0; i < 4; i++) g.fillRect(rx + i * 8, 0, 5, 20)
        g.strokeStyle = k0.accent; g.lineWidth = 2.4; g.beginPath(); for (let y = 0; y <= 720; y += 6) { const px = rx + 14 + Math.sin(y / 18) * 9; y ? g.lineTo(px, y) : g.moveTo(px, y) } g.stroke()
        g.fillStyle = '#3aa356'; g.beginPath(); g.moveTo(rx + (d < 0 ? 0 : 28), 300); g.bezierCurveTo(rx + d * 70, 330, rx + d * 74, 440, rx + (d < 0 ? 0 : 28), jy + 20); g.bezierCurveTo(rx + d * 24, 420, rx + d * 22, 340, rx + (d < 0 ? 0 : 28), 300); g.fill()
        g.strokeStyle = '#1f6a34'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(rx + (d < 0 ? 0 : 28), 310); g.quadraticCurveTo(rx + d * 40, 400, rx + (d < 0 ? 0 : 28), jy + 14); g.stroke()
      }
      grooves(g, x, fw, jy, k0); lamps(g, x - 70, lit, k0); lamps(g, x + fw + 70, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, chibi, k0) {
      const top = jy + 22; g.beginPath(); g.rect(x - 64, top, fw + 128, 720 - top + 20); g.fillStyle = vg(g, top, 720, '#7a5530', '#4a3018', '#2a1a0c'); g.fill()
      g.strokeStyle = 'rgba(20,10,0,.6)'; g.lineWidth = 2; g.beginPath(); for (let y = top + 40; y < 720; y += 40) { g.moveTo(x - 64, y); g.lineTo(x + fw + 64, y) } g.stroke()
      g.fillStyle = '#3aa356'; for (let px = x - 64; px < x + fw + 64; px += 12) { g.beginPath(); g.moveTo(px, top + 2); g.lineTo(px + 6, top - 12 - ((px * 7) % 9)); g.lineTo(px + 12, top + 2); g.fill() }
      g.fillStyle = k0.accent; g.fillRect(x - 64, top + 2, fw + 128, 3)
      if (chibi) chibis(g, x, fw, k0, 64)
    },
    key(g, x, y, w, h, on, _b, label, k0) {
      g.beginPath(); g.roundRect(x, y, w, h, 7); g.fillStyle = vg(g, y, y + h, on ? '#b4e08a' : '#9a7144', on ? '#4cc46a' : '#4a3018'); g.fill()
      g.strokeStyle = on ? k0.accent : '#2a1a0c'; g.lineWidth = 2.4; g.stroke(); g.strokeStyle = 'rgba(20,10,0,.4)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + 6, y + h * 0.3); g.lineTo(x + w - 6, y + h * 0.3); g.moveTo(x + 6, y + h * 0.7); g.lineTo(x + w - 6, y + h * 0.7); g.stroke()
      lab(g, x, y, w, h, label, on ? '#1f4a24' : '#f3e2b8')
    }
  },
  crimson: { // 톱니 달린 검은 칼날 기둥, 갈고리 모양 날개, 칼날 코등이처럼 뾰족한 콘솔 · 건반은 모서리 깎인 칼날
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0); fieldDecor(g, x, fw, jy, k0, 'slashes')
      for (const [d, rx] of [[-1, x - 30], [1, x + fw + 4]] as const) {
        const e = d < 0 ? rx : rx + 26, i = d < 0 ? rx + 26 : rx
        g.beginPath(); g.moveTo(i, 0); for (let y = 0, k = 0; y <= 720; y += 24, k++) g.lineTo(e - d * (k % 2 ? 2 : 12), y); g.lineTo(i, 720); g.closePath()
        g.fillStyle = vg(g, 0, 720, '#1a1014', '#0a0608'); g.fill(); g.strokeStyle = k0.accent; g.lineWidth = 2; g.stroke()
        g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(rx + 13, 0); g.lineTo(rx + 13, 720); g.stroke()
        g.fillStyle = k0.accent; g.beginPath(); g.moveTo(e, 230); g.quadraticCurveTo(e + d * 70, 280, e + d * 46, 400); g.quadraticCurveTo(e + d * 52, 330, e, 330); g.closePath(); g.fill()
        g.fillStyle = k0.light; g.beginPath(); g.moveTo(e, 380); g.lineTo(e + d * 56, jy - 10); g.lineTo(e, jy + 22); g.closePath(); g.fill()
      }
      grooves(g, x, fw, jy, k0); lamps(g, x - 70, lit, k0); lamps(g, x + fw + 70, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, chibi, k0) {
      const top = jy + 20; poly(g, [[x - 86, top + 6], [x - 60, top - 8], [x - 34, top + 18], [x + fw + 34, top + 18], [x + fw + 60, top - 8], [x + fw + 86, top + 6], [x + fw + 70, 720], [x - 70, 720]])
      body(g, k0, top, k0.accent, 2); g.fillStyle = k0.accent; g.globalAlpha = 0.3; poly(g, [[x - 34, top + 18], [x + fw + 34, top + 18], [x + fw + 14, top + 34], [x - 14, top + 34]]); g.fill(); g.globalAlpha = 1
      if (chibi) chibis(g, x, fw, k0, 74)
    },
    key(g, x, y, w, h, on, _b, label, k0) {
      cut(13)(g, x, y, w, h); g.fillStyle = on ? vg(g, y, y + h, '#ffb0b8', k0.accent) : vg(g, y, y + h, '#3a1a20', '#12080a'); g.fill(); g.strokeStyle = k0.accent; g.lineWidth = 2.4; g.stroke()
      lab(g, x, y, w, h, label, on ? '#2a0508' : '#ffd0d6')
    },
    lcd: cut(8), chip: cut(5)
  },
  ocean: { // 유리관 기둥에 거품이 오르고, 조개 부채 날개, 돔처럼 둥근 콘솔 · 건반은 윤기 나는 물방울
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0); fieldDecor(g, x, fw, jy, k0, 'waves')
      const now = performance.now()
      for (const [d, rx] of sides(x, fw)) {
        g.fillStyle = vg(g, 0, 720, 'rgba(120,230,255,.28)', 'rgba(20,120,160,.5)'); g.beginPath(); g.roundRect(rx, 0, 26, 720, 13); g.fill(); g.strokeStyle = 'rgba(200,250,255,.6)'; g.lineWidth = 1.6; g.stroke()
        g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(rx + 5, 10, 3, 700)
        g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 9; i++) { const by = ((rnd(i) * 720 - now / (14 + 8 * rnd(i + 2))) % 720 + 720) % 720; g.beginPath(); g.arc(rx + 9 + rnd(i + 7) * 9, by, 1.6 + 2.2 * rnd(i + 4), 0, 7); g.fill() }
        const e = d < 0 ? rx : rx + 26; g.fillStyle = vg(g, 300, jy, 'rgba(255,200,170,.95)', 'rgba(220,120,110,.95)'); g.beginPath(); g.moveTo(e, jy + 24); g.arc(e, jy + 24, 70, d < 0 ? Math.PI : -Math.PI / 2 - 0.0, d < 0 ? 1.5 * Math.PI : 0); g.closePath(); g.fill()
        g.strokeStyle = 'rgba(150,60,60,.5)'; g.lineWidth = 1.4; g.beginPath(); for (let a = 0; a <= 4; a++) { const ang = (d < 0 ? Math.PI : 1.5 * Math.PI) + (a / 4) * (Math.PI / 2); g.moveTo(e, jy + 24); g.lineTo(e + Math.cos(ang) * 70, jy + 24 + Math.sin(ang) * 70) } g.stroke()
      }
      grooves(g, x, fw, jy, k0); lamps(g, x - 66, lit, k0); lamps(g, x + fw + 66, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, chibi, k0) {
      const top = jy + 26; g.beginPath(); g.moveTo(x - 74, 720); g.lineTo(x - 74, top + 60); g.quadraticCurveTo(x - 74, top - 4, x + fw / 2, top - 4); g.quadraticCurveTo(x + fw + 74, top - 4, x + fw + 74, top + 60); g.lineTo(x + fw + 74, 720); g.closePath()
      body(g, k0, top, 'rgba(200,250,255,.8)', 2.2); g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(x + fw / 2, top + 16, fw / 2 + 20, 12, 0, 0, 7); g.fill()
      if (chibi) chibis(g, x, fw, k0, 74)
    },
    key(g, x, y, w, h, on, _b, label, k0) {
      const cx = x + w / 2, cy = y + h / 2
      g.beginPath(); g.ellipse(cx, cy, w / 2, h / 2, 0, 0, 7); g.fillStyle = on ? vg(g, y, y + h, '#ffffff', k0.accent) : vg(g, y, y + h, 'rgba(150,235,255,.9)', 'rgba(30,130,170,.95)'); g.fill()
      g.strokeStyle = '#e8fcff'; g.lineWidth = 2.2; g.stroke(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(cx - w * 0.14, cy - h * 0.26, w * 0.24, h * 0.12, -0.2, 0, 7); g.fill()
      lab(g, x, y, w, h, label, on ? '#0a4a60' : '#e8fcff')
    },
    lcd: pill, chip: pill
  },
  violet: { // 틈을 두고 떠 있는 육각 기둥 마디와 회로선, 육각으로 깎은 콘솔 · 건반은 육각 칩
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0); fieldDecor(g, x, fw, jy, k0, 'hex')
      for (const [d, rx] of sides(x, fw)) {
        for (let y = -10; y < 720; y += 96) { poly(g, [[rx, y + 12], [rx + 13, y], [rx + 26, y + 12], [rx + 26, y + 76], [rx + 13, y + 88], [rx, y + 76]]); g.fillStyle = vg(g, y, y + 88, k0.mid, k0.dark); g.fill(); g.strokeStyle = k0.accent; g.lineWidth = 1.6; g.stroke() }
        g.strokeStyle = k0.accent; g.globalAlpha = 0.6; g.lineWidth = 1.4; g.beginPath(); const e = d < 0 ? rx : rx + 26; for (let y = 100; y < jy; y += 96) { g.moveTo(e, y); g.lineTo(e + d * 26, y); g.lineTo(e + d * 40, y + 14) } g.stroke(); g.globalAlpha = 1
        g.fillStyle = k0.accent; for (let y = 114; y < jy; y += 96) { g.beginPath(); g.arc(e + d * 40, y, 3, 0, 7); g.fill() }
        g.fillStyle = k0.light; g.globalAlpha = 0.5; poly(g, [[e, 260], [e + d * 58, 330], [e + d * 46, jy - 20], [e, jy + 24]]); g.fill(); g.globalAlpha = 1
      }
      grooves(g, x, fw, jy, k0); lamps(g, x - 70, lit, k0); lamps(g, x + fw + 70, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, chibi, k0) {
      const top = jy + 22; poly(g, [[x - 40, top], [x + fw + 40, top], [x + fw + 76, top + 50], [x + fw + 76, 720], [x - 76, 720], [x - 76, top + 50]])
      body(g, k0, top, k0.accent, 2); g.strokeStyle = k0.accent; g.globalAlpha = 0.25; g.lineWidth = 1; g.beginPath(); for (let px = x - 70; px < x + fw + 70; px += 44) { g.moveTo(px, top + 20); g.lineTo(px + 22, top + 40); g.lineTo(px + 44, top + 20) } g.stroke(); g.globalAlpha = 1
      if (chibi) chibis(g, x, fw, k0, 76)
    },
    key(g, x, y, w, h, on, _b, label, k0) {
      hex(g, x, y, w, h); g.fillStyle = on ? vg(g, y, y + h, '#f0e6ff', k0.accent) : vg(g, y, y + h, k0.mid, k0.dark); g.fill(); g.strokeStyle = k0.accent; g.lineWidth = 2.2; g.stroke()
      lab(g, x, y, w, h, label, on ? '#2a1a60' : '#efe6ff')
    },
    lcd: hex, chip: cut(5)
  },
  ice: { // 서리 낀 결정 기둥, 위에서 늘어진 고드름, 뾰족한 얼음 날개, 결정이 솟은 콘솔 · 건반은 마름모 결정
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0); fieldDecor(g, x, fw, jy, k0, 'snow')
      for (const [d, rx] of sides(x, fw)) {
        const e = d < 0 ? rx : rx + 26, i = d < 0 ? rx + 26 : rx
        g.beginPath(); g.moveTo(i, 0); for (let y = 0, k = 0; y <= 720; y += 30, k++) g.lineTo(e - d * (k % 2 ? 0 : 12), y); g.lineTo(i, 720); g.closePath()
        g.fillStyle = vg(g, 0, 720, 'rgba(210,240,255,.9)', 'rgba(90,150,200,.9)'); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 1.6; g.stroke()
        g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(rx + 10, 0, 3, 720)
        g.fillStyle = '#eaf8ff'; for (let k = 0; k < 3; k++) { const px = rx + 3 + k * 9, hh = 34 + ((k * 23) % 26); g.beginPath(); g.moveTo(px, 0); g.lineTo(px + 8, 0); g.lineTo(px + 4, hh); g.fill() }
        g.fillStyle = 'rgba(230,248,255,.85)'; poly(g, [[e, 250], [e + d * 24, 290], [e + d * 54, 420], [e + d * 26, 470], [e + d * 34, jy - 10], [e, jy + 24]]); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; g.stroke()
      }
      grooves(g, x, fw, jy, k0); lamps(g, x - 66, lit, k0); lamps(g, x + fw + 66, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, chibi, k0) {
      const top = jy + 24; g.beginPath(); g.moveTo(x - 70, 720); g.lineTo(x - 70, top + 20); for (let px = x - 70, k = 0; px < x + fw + 70; px += 24, k++) g.lineTo(px + 12, top + (k % 2 ? 22 : -12 - ((k * 11) % 14))); g.lineTo(x + fw + 70, top + 20); g.lineTo(x + fw + 70, 720); g.closePath()
      g.fillStyle = vg(g, top - 20, 720, '#eaf8ff', '#7fb2d8', '#2c4a6a'); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 1.6; g.stroke()
      if (chibi) chibis(g, x, fw, k0, 70)
    },
    key(g, x, y, w, h, on, _b, label, k0) {
      poly(g, [[x + w / 2, y - 2], [x + w + 4, y + h / 2], [x + w / 2, y + h + 2], [x - 4, y + h / 2]]); g.fillStyle = on ? vg(g, y, y + h, '#ffffff', k0.accent) : vg(g, y, y + h, '#dff2ff', '#5a8ab8'); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 2.2; g.stroke()
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2); g.stroke()
      lab(g, x, y, w, h, label, on ? '#0a3a5a' : '#13395a')
    },
    lcd: cut(10), chip: cut(6)
  },
  sunset: { // 사탕 줄무늬 기둥, 필드 뒤로 뜨는 큰 해, 원근 격자가 깔린 레트로 콘솔 · 건반은 줄무늬 알약
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0); fieldDecor(g, x, fw, jy, k0, 'rays')
      g.save(); g.beginPath(); g.rect(x - 4, 0, fw + 8, jy); g.clip(); g.fillStyle = vg(g, jy - 190, jy, 'rgba(255,177,59,0)', 'rgba(255,100,90,.55)'); g.beginPath(); g.arc(x + fw / 2, jy, 170, Math.PI, 0); g.fill()
      g.fillStyle = 'rgba(30,8,30,.5)'; for (let k = 0; k < 6; k++) g.fillRect(x - 4, jy - 150 + k * 22, fw + 8, 3 + k); g.restore()
      for (const [, rx] of sides(x, fw)) {
        g.save(); g.beginPath(); g.rect(rx, 0, 26, 720); g.clip(); g.fillStyle = k0.dark; g.fillRect(rx, 0, 26, 720)
        for (let y = -30; y < 750; y += 36) { g.fillStyle = y % 72 ? k0.accent : '#b45aa8'; g.beginPath(); g.moveTo(rx, y + 26); g.lineTo(rx + 26, y); g.lineTo(rx + 26, y + 18); g.lineTo(rx, y + 44); g.fill() }
        g.restore(); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.4; g.strokeRect(rx + 0.5, 0, 25, 720)
      }
      grooves(g, x, fw, jy, k0); lamps(g, x - 66, lit, k0); lamps(g, x + fw + 66, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, chibi, k0) {
      const top = jy + 22; poly(g, [[x - 60, top], [x + fw + 60, top], [x + fw + 90, 720], [x - 90, 720]]); g.fillStyle = vg(g, top, 720, '#3a1038', '#1a0818'); g.fill(); g.strokeStyle = k0.accent; g.lineWidth = 2.2; g.stroke()
      g.save(); poly(g, [[x - 60, top], [x + fw + 60, top], [x + fw + 90, 720], [x - 90, 720]]); g.clip(); g.strokeStyle = '#ff4f7a'; g.globalAlpha = 0.55; g.lineWidth = 1.2; g.beginPath()
      for (let k = -6; k <= 6; k++) { g.moveTo(x + fw / 2 + k * 14, top + 4); g.lineTo(x + fw / 2 + k * 70, 720) } for (let k = 1; k < 7; k++) { const yy = top + 6 + (k * k) * 5; g.moveTo(x - 90, yy); g.lineTo(x + fw + 90, yy) } g.stroke(); g.restore()
      if (chibi) chibis(g, x, fw, k0, 90)
    },
    key(g, x, y, w, h, on, _b, label, k0) {
      g.beginPath(); g.roundRect(x, y, w, h, h / 2.6); g.fillStyle = on ? vg(g, y, y + h, '#fff0d0', k0.accent) : vg(g, y, y + h, '#ff7a59', '#7a2a6a'); g.fill()
      g.save(); g.clip(); g.fillStyle = 'rgba(255,255,255,.18)'; for (let k = 0; k < 5; k++) g.fillRect(x, y + 8 + k * 10, w, 3); g.restore()
      g.strokeStyle = '#fff0d8'; g.lineWidth = 2.2; g.beginPath(); g.roundRect(x, y, w, h, h / 2.6); g.stroke(); lab(g, x, y, w, h, label, on ? '#7a2a4a' : '#fff0d8')
    },
    lcd: pill, chip: pill
  },
  mono: { // 장식 없이 가는 선만: 양옆 한 줄, 아래는 윤곽만 있는 네모 · 건반은 속 빈 사각
    back(g, x, fw, jy, pa, _lit, k0) {
      fieldFill(g, x, fw, pa, k0); g.fillStyle = '#ffffff'
      for (const e of [x - 6, x + fw + 4]) { g.fillRect(e, 0, 2, jy + 22); g.globalAlpha = 0.35; g.fillRect(e + (e < x ? -9 : 9), 0, 1, jy + 22); g.globalAlpha = 1 }
      grooves(g, x, fw, jy, k0)
    },
    consoleBack(g, x, fw, jy, _d, chibi, k0) {
      const top = jy + 24; g.fillStyle = '#08080a'; g.fillRect(x - 40, top, fw + 80, 720 - top); g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.strokeRect(x - 40, top, fw + 80, 720 - top + 4)
      g.globalAlpha = 0.35; g.lineWidth = 1; g.strokeRect(x - 30, top + 10, fw + 60, 720 - top); g.globalAlpha = 1
      if (chibi) chibis(g, x, fw, k0, 40)
    },
    key(g, x, y, w, h, on, _b, label) {
      g.beginPath(); g.rect(x, y, w, h); g.fillStyle = on ? '#ffffff' : '#101012'; g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.stroke(); lab(g, x, y, w, h, label, on ? '#000000' : '#ffffff')
    },
    lcd: sq, chip: sq
  },
  arcade: { // 픽셀 블록으로 쌓은 오락실 기계 옆판, 아래는 경사진 조작판 · 건반은 커다란 동그란 버튼, 조이스틱도 달렸다
    back(g, x, fw, jy, pa, lit, k0) {
      fieldFill(g, x, fw, pa, k0); fieldDecor(g, x, fw, jy, k0, 'pixels')
      for (const [d, rx] of [[-1, x - 36], [1, x + fw + 4]] as const) {
        g.fillStyle = '#10180a'; g.fillRect(rx, 0, 32, 720); g.fillStyle = k0.mid
        for (let y = 0; y < 720; y += 24) { g.fillRect(rx + (y % 48 ? 4 : 0), y, 24, 12); g.fillRect(rx + (y % 48 ? 0 : 8), y + 12, 24, 12) }
        g.fillStyle = k0.accent; for (let y = 6; y < 720; y += 48) g.fillRect(rx + 14, y, 4, 4)
        g.fillStyle = k0.warn; g.fillRect(rx + (d < 0 ? 0 : 28), 0, 4, 720)
        g.fillStyle = k0.light; g.fillRect(rx + (d < 0 ? 32 : -8), 250, 8, jy - 230); g.fillRect(rx + (d < 0 ? 40 : -16), 300, 8, jy - 280)
      }
      grooves(g, x, fw, jy, k0); lamps(g, x - 74, lit, k0); lamps(g, x + fw + 74, lit, k0)
    },
    consoleBack(g, x, fw, jy, _d, chibi, k0) {
      const top = jy + 22; poly(g, [[x - 56, top], [x + fw + 56, top], [x + fw + 80, top + 30], [x + fw + 80, 720], [x - 80, 720], [x - 80, top + 30]]); body(g, k0, top, k0.accent, 2)
      g.fillStyle = 'rgba(0,0,0,.35)'; for (let yy = top + 3; yy < 720; yy += 4) g.fillRect(x - 80, yy, fw + 160, 1) // 스캔선
      g.fillStyle = '#2a2a2a'; g.beginPath(); g.arc(x - 52, top + 62, 13, 0, 7); g.fill(); g.fillStyle = '#d02a2a'; g.beginPath(); g.arc(x - 52, top + 56, 10, 0, 7); g.fill() // 조이스틱
      g.fillStyle = '#2a2a2a'; g.fillRect(x - 55, top + 66, 6, 22)
      if (chibi) chibis(g, x, fw, k0, 80)
    },
    key(g, x, y, w, h, on, blue, label, k0) {
      const cx = x + w / 2, cy = y + h / 2 + (on ? 2 : 0), r = Math.min(w, h) / 2
      g.fillStyle = '#0a0a0a'; g.beginPath(); g.arc(cx, y + h / 2 + 3, r + 1, 0, 7); g.fill()
      g.fillStyle = on ? vg(g, cy - r, cy + r, '#ffffff', k0.accent) : vg(g, cy - r, cy + r, blue ? k0.accent : '#f0f0f0', blue ? mix(k0.accent, '#000000', 0.45) : '#8a8a8a'); g.beginPath(); g.arc(cx, cy, r - 2, 0, 7); g.fill()
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(cx - r * 0.2, cy - r * 0.4, r * 0.45, r * 0.2, -0.3, 0, 7); g.fill(); lab(g, x, y + (on ? 2 : 0), w, h, label, '#101010')
    },
    lcd: sq, chip: sq
  }
}
const rnd = (i: number) => ((i * 7919 + 13) % 97) / 97
