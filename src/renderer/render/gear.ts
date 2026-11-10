// 디맥 리스펙트 V 스타일 기어: 어두운 강철 틀·옆 램프·아래 콘솔(건반·점수 LCD·칩)·양옆 치비 캐릭터. 플레이 화면에서만 쓴다
import { FONT, glow, starPath } from './theme'
import chibiL from '../assets/chibi-l.png'
import chibiR from '../assets/chibi-r.png'

const img = (src: string) => { const i = new Image(); i.src = src; return i }
const CL = img(chibiL), CR = img(chibiR)
const ready = (i: HTMLImageElement) => i.complete && i.naturalWidth > 0

export interface Lit { hit: number; miss: number; combo: number } // hit·miss: 0~1 (방금 쳤을 때 1에서 줄어든다) · combo: 켜질 원판 수 0~3

// 기어 한 칸 바깥 틀: 세로 강철 기둥 (가운데 홈에 체력 게이지가 들어간다)
function rail(g: CanvasRenderingContext2D, rx: number, jy: number) {
  const k = g.createLinearGradient(rx, 0, rx + 26, 0)
  k.addColorStop(0, '#12151b'); k.addColorStop(0.3, '#3d4450'); k.addColorStop(0.65, '#262b34'); k.addColorStop(1, '#0f1217')
  g.fillStyle = k; g.fillRect(rx, 0, 26, 720)
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(rx + 1, 0, 1, 720)
  g.fillStyle = '#080a0d'; g.fillRect(rx + 8, 90, 10, jy - 90) // 체력 홈
  g.fillStyle = '#0a0c10'
  for (let y = 40; y < 720; y += 64) { g.beginPath(); g.arc(rx + 13, y, 2.6, 0, 7); g.fill() } // 리벳
}

// 기둥 바깥 램프: 맞히면 시안 별이 빛나고, 놓치면 빨간 X가 켜지고, 콤보가 쌓이면 원판이 하나씩 켜진다
function lamps(g: CanvasRenderingContext2D, cx: number, lit: Lit) {
  if (cx - 30 < 2 || cx + 30 > 1278) return // 화면 밖이면 그리지 않는다 (필드를 한쪽으로 붙였을 때)
  g.fillStyle = '#12151b'; g.beginPath(); g.roundRect(cx - 27, 14, 54, 54, 8); g.fill(); g.strokeStyle = '#2f3541'; g.lineWidth = 2; g.stroke()
  glow(g, `rgba(80,240,220,${0.5 + 0.5 * lit.hit})`, 16, () => { starPath(g, cx, 41, 19); g.fillStyle = `rgba(150,255,240,${0.65 + 0.35 * lit.hit})`; g.fill() })
  g.fillStyle = '#14171d'; g.beginPath(); g.roundRect(cx - 20, 78, 40, 40, 7); g.fill(); g.strokeStyle = '#2f3541'; g.stroke()
  g.strokeStyle = `rgba(255,70,84,${0.3 + 0.7 * lit.miss})`; g.lineWidth = 5; g.lineCap = 'round'
  g.beginPath(); g.moveTo(cx - 9, 89); g.lineTo(cx + 9, 107); g.moveTo(cx + 9, 89); g.lineTo(cx - 9, 107); g.stroke(); g.lineCap = 'butt'
  for (let i = 0; i < 3; i++) {
    const cy = 150 + i * 46, on = lit.combo > i
    g.fillStyle = '#1a1e25'; g.beginPath(); g.roundRect(cx - 22, cy - 18, 44, 36, 8); g.fill(); g.strokeStyle = '#2f3541'; g.lineWidth = 2; g.stroke()
    g.strokeStyle = on ? '#7ae8ff' : '#4a5260'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 12, 0, 7); g.stroke()
    g.fillStyle = on ? '#bff6ff' : '#0a0c10'; g.beginPath(); g.arc(cx, cy, 5, 0, 7); g.fill()
  }
}

function speaker(g: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  g.fillStyle = '#0b0d11'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.strokeStyle = '#59616f'; g.lineWidth = 2; g.stroke()
  g.strokeStyle = '#2a2f38'; g.lineWidth = 1.5
  for (const k of [0.68, 0.38]) { g.beginPath(); g.arc(cx, cy, r * k, 0, 7); g.stroke() }
  g.fillStyle = '#3a404b'; g.beginPath(); g.arc(cx, cy, r * 0.14, 0, 7); g.fill()
}

// 필드 판과 양옆 기둥·램프 (노트 아래에 깔린다)
export function drawGearBack(g: CanvasRenderingContext2D, x: number, fw: number, jy: number, pa: number, lit: Lit) {
  g.fillStyle = `rgba(4,7,14,${pa})`; g.fillRect(x - 4, 0, fw + 8, 720)
  rail(g, x - 30, jy); rail(g, x + fw + 4, jy)
  lamps(g, x - 66, lit); lamps(g, x + fw + 66, lit)
}

// 판정선 아래 콘솔의 몸통·스피커·선반·치비 캐릭터 (노트와 이펙트 위, 건반 아래)
export function drawConsoleBack(g: CanvasRenderingContext2D, x: number, fw: number, jy: number, diffCol: string, chibi: boolean) {
  const top = jy + 22
  g.beginPath(); g.moveTo(x - 40, top); g.lineTo(x + fw + 40, top); g.lineTo(x + fw + 64, top + 38); g.lineTo(x + fw + 64, 720); g.lineTo(x - 64, 720); g.lineTo(x - 64, top + 38); g.closePath()
  const bg = g.createLinearGradient(0, top, 0, 720); bg.addColorStop(0, '#2b303a'); bg.addColorStop(0.4, '#1a1d24'); bg.addColorStop(1, '#0e1014')
  g.fillStyle = bg; g.fill(); g.strokeStyle = '#4a5260'; g.lineWidth = 1.5; g.stroke()
  speaker(g, x - 34, jy + 126, 21); speaker(g, x + fw + 34, jy + 126, 21)
  const sh = g.createLinearGradient(0, jy, 0, jy + 24); sh.addColorStop(0, '#6a7280'); sh.addColorStop(0.35, '#3a404b'); sh.addColorStop(1, '#1d2027')
  g.fillStyle = sh; g.beginPath(); g.roundRect(x - 38, jy + 2, fw + 76, 24, 5); g.fill()
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x - 36, jy + 3, fw + 72, 1.5)
  g.fillStyle = diffCol // 선반 가운데 쐐기 표시: 난이도 색
  const cx = x + fw / 2
  for (const d of [-1, 1]) for (const o of [10, 24]) { g.beginPath(); g.moveTo(cx + d * o, jy + 9); g.lineTo(cx + d * (o + 8), jy + 9); g.lineTo(cx + d * (o + 3), jy + 20); g.lineTo(cx + d * (o - 5), jy + 20); g.closePath(); g.globalAlpha = 0.9; g.fill(); g.globalAlpha = 1 }
  if (chibi) { // 콘솔 양끝에 걸쳐 선 캐릭터 (화면 밖으로 나가면 그리지 않는다)
    const ch = 176
    if (ready(CL)) { const w = ch * CL.naturalWidth / CL.naturalHeight, lx = x - 64 + 26 - w; if (lx >= -8) g.drawImage(CL, lx, 720 - ch, w, ch) }
    if (ready(CR)) { const w = ch * CR.naturalWidth / CR.naturalHeight, rx = x + fw + 64 - 26; if (rx + w <= 1288) g.drawImage(CR, rx, 720 - ch, w, ch) }
  }
}

let dots: CanvasPattern | undefined
const dotPattern = (g: CanvasRenderingContext2D) => {
  if (dots) return dots
  const c = document.createElement('canvas'); c.width = c.height = 3
  const k = c.getContext('2d')!; k.fillStyle = 'rgba(0,0,0,.55)'; k.fillRect(2, 0, 1, 3); k.fillRect(0, 2, 3, 1)
  return (dots = g.createPattern(c, 'repeat')!)
}

export interface Panel { score: number; scroll: number; mult: number; hp: number; hpLow: boolean }
// 건반 아래: 점수 LCD와 칩 세 개(속도·콤보 배율·체력). 건반은 Play가 그린다
export function drawConsoleFront(g: CanvasRenderingContext2D, x: number, fw: number, jy: number, p: Panel) {
  const lx = x + 10, lw = fw - 20, ly = jy + 104, lh = 44
  g.fillStyle = '#07090c'; g.beginPath(); g.roundRect(lx, ly, lw, lh, 6); g.fill()
  g.fillStyle = '#e9f1fb'; g.textAlign = 'center'; g.font = `800 28px ${FONT}`
  glow(g, 'rgba(180,210,255,.55)', 8, () => g.fillText(String(p.score).padStart(7, '0'), lx + lw / 2, ly + 35))
  g.font = `700 9px ${FONT}`; g.fillStyle = '#7d8798'; g.textAlign = 'left'; g.fillText('S C O R E', lx + 8, ly + 12)
  g.fillStyle = dotPattern(g); g.beginPath(); g.roundRect(lx, ly, lw, lh, 6); g.fill()
  g.strokeStyle = '#4a5260'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(lx, ly, lw, lh, 6); g.stroke()
  const cw = (lw - 12) / 3, cy = jy + 156
  const chips: [string, string, string, string][] = [
    ['SPEED', p.scroll.toFixed(1), '#e0405f', '#9c2a45'],
    ['COMBO', `x${p.mult.toFixed(2)}`, '#b9782f', '#7d5020'],
    ['HP', `${Math.round(p.hp)}%`, p.hpLow ? '#e0405f' : '#2ea3a3', p.hpLow ? '#9c2a45' : '#1f6f70']
  ]
  chips.forEach(([label, value, c1, c2], i) => {
    const cx = lx + i * (cw + 6), k = g.createLinearGradient(0, cy, 0, cy + 32); k.addColorStop(0, c1); k.addColorStop(1, c2)
    g.fillStyle = k; g.beginPath(); g.roundRect(cx, cy, cw, 32, 5); g.fill()
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.stroke()
    g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.8)'; g.font = `700 9px ${FONT}`; g.fillText(label.split('').join(' '), cx + cw / 2, cy + 11)
    g.fillStyle = '#fff'; g.font = `900 17px ${FONT}`; g.fillText(value, cx + cw / 2, cy + 27)
  })
  g.textAlign = 'left'
}
