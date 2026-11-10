// 디맥 리스펙트 V 스타일 기어: 어두운 강철 틀·옆 램프·아래 콘솔(건반·점수 LCD·칩)·양옆 치비 캐릭터. 플레이 화면에서만 쓴다
import { FONT, glow, lighten, starPath } from './theme'
import type { Profile } from '../data/Profile'

const img = (src: string) => { const i = new Image(); i.src = src; return i }
// 스킨마다 치비 한 쌍: assets/chibi/<스킨 id>-l.png, -r.png (없으면 steel의 것). 그림을 더하려면 tools/split-chibi.ps1
const arts = import.meta.glob('../assets/chibi/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const urlOf = (id: string, side: 'l' | 'r') => arts[`../assets/chibi/${id}-${side}.png`]
const pairs: Record<string, [HTMLImageElement, HTMLImageElement]> = {}
const pairOf = (id: string): [HTMLImageElement, HTMLImageElement] => pairs[id] ??= (urlOf(id, 'l') && urlOf(id, 'r') ? [img(urlOf(id, 'l')), img(urlOf(id, 'r'))] : pairOf('steel'))
const ready = (i: HTMLImageElement) => i.complete && i.naturalWidth > 0

// 기어 스킨: 같은 기어를 색과 재질만 바꿔 열두 가지로 그린다. dark·mid·light는 틀의 어두운 쪽·중간·밝은 쪽, accent는 맞출 때 켜지는 램프, warn은 놓칠 때 켜지는 램프
export interface GearSkin { id: string; name: string; need: string; ok: (p: Profile) => boolean; dark: string; mid: string; light: string; accent: string; warn: string; lcd: string; field: string; chips: [string, string, string] }
const sk = (id: string, name: string, need: string, ok: GearSkin['ok'], dark: string, mid: string, light: string, accent: string, warn: string, lcd: string, field: string, chips: GearSkin['chips']): GearSkin => ({ id, name, need, ok, dark, mid, light, accent, warn, lcd, field, chips })
export const GEAR_SKINS: GearSkin[] = [
  sk('steel', '스틸', '처음부터', () => true, '#12151b', '#3d4450', '#6a7280', '#50f0dc', '#ff4654', '#e9f1fb', '4,7,14', ['#e0405f', '#b9782f', '#2ea3a3']),
  sk('neon', '네온 시티', '플레이 10번', p => p.plays >= 10, '#07060f', '#241a4a', '#6a4fd0', '#ff3ddb', '#37e8ff', '#ffd6fb', '6,3,16', ['#ff3ddb', '#37a8c8', '#8f5bff']),
  sk('gold', '골드 팰리스', '레벨 8', p => p.level >= 8, '#17120a', '#5a4520', '#c9a24a', '#ffd45e', '#ff6a3d', '#fff1c4', '12,8,4', ['#c2452a', '#c99a2e', '#8a6d1f']),
  sk('sakura', '사쿠라', '대결 1승', p => p.wins >= 1, '#2a1e26', '#8a5a72', '#f2bfd3', '#ff8fb8', '#ff4f7a', '#fff0f6', '40,20,32', ['#ff4f7a', '#ffa14f', '#e0709a']),
  sk('forest', '포레스트', '플레이 50번', p => p.plays >= 50, '#0e1a12', '#2d5238', '#6fae7a', '#9cff6a', '#ff7a3d', '#eaffe0', '3,12,6', ['#d8553a', '#b8a238', '#4bb36a']),
  sk('crimson', '크림슨', '풀 콤보 10번', p => p.fcs >= 10, '#160a0c', '#4a1a22', '#a8434f', '#ff3b52', '#ffb13b', '#ffe3e6', '14,3,6', ['#ff3b52', '#c9781f', '#a8434f']),
  sk('ocean', '오션', '레벨 12', p => p.level >= 12, '#07141c', '#1d4b5e', '#55a8c2', '#5ee8ff', '#ff6f7a', '#e0fbff', '2,10,18', ['#e0506a', '#2f9fb8', '#27b3a1']),
  sk('violet', '사이버 바이올렛', '올 퍼펙트 3번', p => p.aps >= 3, '#0d0a18', '#34286a', '#8a74e8', '#b58cff', '#ff5a9a', '#efe6ff', '8,4,20', ['#ff5a9a', '#8a74e8', '#5a8cff']),
  sk('ice', '아이스', '레벨 16', p => p.level >= 16, '#1e2a38', '#7d93ad', '#dbe8f5', '#7ad8ff', '#ff6a88', '#f4fbff', '14,26,44', ['#e0506a', '#4f9bd6', '#3ab3c9']),
  sk('sunset', '선셋', '대결 10승', p => p.wins >= 10, '#1a0d14', '#6a2a44', '#f08a5d', '#ffb13b', '#ff4f7a', '#fff0d8', '20,6,18', ['#ff4f7a', '#e8872f', '#b45aa8']),
  sk('mono', '모노', '플레이 100번', p => p.plays >= 100, '#0e0e10', '#3a3a3e', '#9a9aa2', '#ffffff', '#bbbbbb', '#f2f2f2', '0,0,0', ['#6a6a70', '#55555a', '#808088']),
  sk('arcade', '레트로 아케이드', '레벨 25', p => p.level >= 25, '#0b0f08', '#2a3a1a', '#a7c23a', '#c8ff3a', '#ff9a1f', '#b8ff5a', '2,8,2', ['#e8601f', '#c9a21f', '#5fa82f'])
]
// 지금 쓸 기어: 고른 번호가 아직 안 풀렸으면 스틸 (프로필이 없으면 스틸만 쓴다)
export const gearOf = (i: number, p: Profile | undefined) => { const g = GEAR_SKINS[i] ?? GEAR_SKINS[0]; return p && g.ok(p) || g === GEAR_SKINS[0] ? g : GEAR_SKINS[0] }
// 두 색을 섞는다 (t=0이면 a, 1이면 b)
const mix = (a: string, b: string, t: number) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('')
export interface Lit { hit: number; miss: number; combo: number } // hit·miss: 0~1 (방금 쳤을 때 1에서 줄어든다) · combo: 켜질 원판 수 0~3

// 기어 한 칸 바깥 틀: 세로 강철 기둥 (가운데 홈에 체력 게이지가 들어간다)
function rail(g: CanvasRenderingContext2D, rx: number, jy: number, k0: GearSkin) {
  const k = g.createLinearGradient(rx, 0, rx + 26, 0)
  k.addColorStop(0, k0.dark); k.addColorStop(0.3, k0.mid); k.addColorStop(0.65, mix(k0.mid, k0.dark, 0.55)); k.addColorStop(1, mix(k0.dark, '#000000', 0.3))
  g.fillStyle = k; g.fillRect(rx, 0, 26, 720)
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(rx + 1, 0, 1, 720); g.fillStyle = k0.light; g.globalAlpha = 0.35; g.fillRect(rx + 24, 0, 1, 720); g.globalAlpha = 1
  g.fillStyle = mix(k0.dark, '#000000', 0.6); g.fillRect(rx + 8, 90, 10, jy - 90) // 체력 홈
  g.fillStyle = mix(k0.dark, '#000000', 0.5)
  for (let y = 40; y < 720; y += 64) { g.beginPath(); g.arc(rx + 13, y, 2.6, 0, 7); g.fill() } // 리벳
}

// 기둥 바깥 램프: 맞히면 시안 별이 빛나고, 놓치면 빨간 X가 켜지고, 콤보가 쌓이면 원판이 하나씩 켜진다
function lamps(g: CanvasRenderingContext2D, cx: number, lit: Lit, k0: GearSkin) {
  if (cx - 30 < 2 || cx + 30 > 1278) return // 화면 밖이면 그리지 않는다 (필드를 한쪽으로 붙였을 때)
  const plate = mix(k0.dark, '#000000', 0.15), line = mix(k0.mid, k0.dark, 0.35)
  g.fillStyle = plate; g.beginPath(); g.roundRect(cx - 27, 14, 54, 54, 8); g.fill(); g.strokeStyle = line; g.lineWidth = 2; g.stroke()
  g.globalAlpha = 0.55 + 0.45 * lit.hit; glow(g, k0.accent, 16, () => { starPath(g, cx, 41, 19); g.fillStyle = lighten(k0.accent, 0.35); g.fill() }); g.globalAlpha = 1
  g.fillStyle = plate; g.beginPath(); g.roundRect(cx - 20, 78, 40, 40, 7); g.fill(); g.strokeStyle = line; g.stroke()
  g.strokeStyle = k0.warn; g.globalAlpha = 0.3 + 0.7 * lit.miss; g.lineWidth = 5; g.lineCap = 'round'
  g.beginPath(); g.moveTo(cx - 9, 89); g.lineTo(cx + 9, 107); g.moveTo(cx + 9, 89); g.lineTo(cx - 9, 107); g.stroke(); g.lineCap = 'butt'; g.globalAlpha = 1
  for (let i = 0; i < 3; i++) {
    const cy = 150 + i * 46, on = lit.combo > i
    g.fillStyle = plate; g.beginPath(); g.roundRect(cx - 22, cy - 18, 44, 36, 8); g.fill(); g.strokeStyle = line; g.lineWidth = 2; g.stroke()
    g.strokeStyle = on ? k0.accent : mix(k0.mid, k0.light, 0.3); g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 12, 0, 7); g.stroke()
    g.fillStyle = on ? lighten(k0.accent, 0.6) : mix(k0.dark, '#000000', 0.5); g.beginPath(); g.arc(cx, cy, 5, 0, 7); g.fill()
  }
}

function speaker(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, k0: GearSkin) {
  g.fillStyle = mix(k0.dark, '#000000', 0.5); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.strokeStyle = k0.light; g.lineWidth = 2; g.stroke()
  g.strokeStyle = mix(k0.mid, k0.dark, 0.4); g.lineWidth = 1.5
  for (const k of [0.68, 0.38]) { g.beginPath(); g.arc(cx, cy, r * k, 0, 7); g.stroke() }
  g.fillStyle = k0.mid; g.beginPath(); g.arc(cx, cy, r * 0.14, 0, 7); g.fill()
}

// 기둥 아래쪽에 붙는 바깥쪽 날개: 위로 뾰족하게 올라가고 끝에 포인트 색 줄이 간다. d = -1 왼쪽, 1 오른쪽
function wing(g: CanvasRenderingContext2D, rx: number, d: number, jy: number, k0: GearSkin) {
  const x0 = rx + (d < 0 ? 0 : 26), tip = 250, bot = jy + 26
  g.beginPath(); g.moveTo(x0, tip); g.quadraticCurveTo(x0 + d * 62, tip + 120, x0 + d * 30, bot); g.lineTo(x0, bot); g.closePath()
  const f = g.createLinearGradient(0, tip, 0, bot); f.addColorStop(0, k0.light); f.addColorStop(0.55, k0.mid); f.addColorStop(1, k0.dark)
  g.fillStyle = f; g.fill(); g.strokeStyle = k0.accent; g.lineWidth = 2; g.stroke()
  g.beginPath(); g.moveTo(x0, tip + 30); g.quadraticCurveTo(x0 + d * 38, tip + 130, x0 + d * 18, bot - 4); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5; g.stroke()
}

// 필드 판과 양옆 기둥·램프 (노트 아래에 깔린다)
export function drawGearBack(g: CanvasRenderingContext2D, x: number, fw: number, jy: number, pa: number, lit: Lit, k0: GearSkin) {
  g.fillStyle = `rgba(${k0.field},${pa})`; g.fillRect(x - 4, 0, fw + 8, 720)
  rail(g, x - 30, jy, k0); rail(g, x + fw + 4, jy, k0)
  wing(g, x - 30, -1, jy, k0); wing(g, x + fw + 4, 1, jy, k0)
  lamps(g, x - 66, lit, k0); lamps(g, x + fw + 66, lit, k0)
}

// 판정선 아래 콘솔의 몸통·스피커·선반·치비 캐릭터 (노트와 이펙트 위, 건반 아래)
export function drawConsoleBack(g: CanvasRenderingContext2D, x: number, fw: number, jy: number, diffCol: string, chibi: boolean, k0: GearSkin) {
  const top = jy + 22
  g.beginPath(); g.moveTo(x - 40, top); g.lineTo(x + fw + 40, top); g.lineTo(x + fw + 64, top + 38); g.lineTo(x + fw + 64, 720); g.lineTo(x - 64, 720); g.lineTo(x - 64, top + 38); g.closePath()
  const bg = g.createLinearGradient(0, top, 0, 720); bg.addColorStop(0, mix(k0.mid, k0.dark, 0.35)); bg.addColorStop(0.4, mix(k0.dark, k0.mid, 0.2)); bg.addColorStop(1, mix(k0.dark, '#000000', 0.4))
  g.fillStyle = bg; g.fill(); g.strokeStyle = mix(k0.mid, k0.light, 0.4); g.lineWidth = 1.5; g.stroke()
  speaker(g, x - 34, jy + 126, 21, k0); speaker(g, x + fw + 34, jy + 126, 21, k0)
  const sh = g.createLinearGradient(0, jy, 0, jy + 24); sh.addColorStop(0, k0.light); sh.addColorStop(0.35, k0.mid); sh.addColorStop(1, mix(k0.dark, k0.mid, 0.3))
  g.fillStyle = sh; g.beginPath(); g.roundRect(x - 38, jy + 2, fw + 76, 24, 5); g.fill()
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x - 36, jy + 3, fw + 72, 1.5)
  g.fillStyle = diffCol // 선반 가운데 쐐기 표시: 난이도 색
  const cx = x + fw / 2
  for (const d of [-1, 1]) for (const o of [10, 24]) { g.beginPath(); g.moveTo(cx + d * o, jy + 9); g.lineTo(cx + d * (o + 8), jy + 9); g.lineTo(cx + d * (o + 3), jy + 20); g.lineTo(cx + d * (o - 5), jy + 20); g.closePath(); g.globalAlpha = 0.9; g.fill(); g.globalAlpha = 1 }
  if (chibi) { // 콘솔 양끝에 걸쳐 선 캐릭터 (화면 밖으로 나가면 그리지 않는다)
    const ch = 176, [CL, CR] = pairOf(k0.id)
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
export function drawConsoleFront(g: CanvasRenderingContext2D, x: number, fw: number, jy: number, p: Panel, k0: GearSkin) {
  const lx = x + 10, lw = fw - 20, ly = jy + 104, lh = 44
  g.fillStyle = mix(k0.dark, '#000000', 0.6); g.beginPath(); g.roundRect(lx, ly, lw, lh, 6); g.fill()
  g.fillStyle = k0.lcd; g.textAlign = 'center'; g.font = `800 28px ${FONT}`
  glow(g, k0.lcd, 8, () => g.fillText(String(p.score).padStart(7, '0'), lx + lw / 2, ly + 35))
  g.font = `700 9px ${FONT}`; g.fillStyle = mix(k0.lcd, k0.dark, 0.5); g.textAlign = 'left'; g.fillText('S C O R E', lx + 8, ly + 12)
  g.fillStyle = dotPattern(g); g.beginPath(); g.roundRect(lx, ly, lw, lh, 6); g.fill()
  g.strokeStyle = mix(k0.mid, k0.light, 0.4); g.lineWidth = 1.5; g.beginPath(); g.roundRect(lx, ly, lw, lh, 6); g.stroke()
  const cw = (lw - 12) / 3, cy = jy + 156
  const chips: [string, string, string, string][] = [
    ['SPEED', p.scroll.toFixed(1), k0.chips[0], mix(k0.chips[0], '#000000', 0.4)],
    ['COMBO', `x${p.mult.toFixed(2)}`, k0.chips[1], mix(k0.chips[1], '#000000', 0.4)],
    ['HP', `${Math.round(p.hp)}%`, p.hpLow ? k0.warn : k0.chips[2], mix(p.hpLow ? k0.warn : k0.chips[2], '#000000', 0.4)]
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
