// 노트 스킨: 디맥의 노트 스킨처럼 같은 노트를 여러 모양으로 그린다. 그림은 92x44 칸에 그린다 (막대는 x 11~81, y 15~29). 풀어 주는 조건은 내 프로필 기록으로 앱이 직접 판단한다
import type { Profile } from '../data/Profile'
import { lighten, rgbOf, starPath } from '../render/theme'

type Ctx = CanvasRenderingContext2D
export interface NoteSkin { id: string; name: string; need: string; ok: (p: Profile) => boolean; draw: (x: Ctx, outer: boolean, c: string) => void }

const BX = 11, BY = 15, BW = 70, BH = 14
const vert = (x: Ctx, y0: number, y1: number, ...s: string[]) => { const g = x.createLinearGradient(0, y0, 0, y1); s.forEach((c, i) => g.addColorStop(i / (s.length - 1), c)); return g }
const horz = (x: Ctx, ...s: string[]) => { const g = x.createLinearGradient(BX, 0, BX + BW, 0); s.forEach((c, i) => g.addColorStop(i / (s.length - 1), c)); return g }
const frame = (x: Ctx, color: string, w = 1.5) => { x.strokeStyle = color; x.lineWidth = w; x.strokeRect(BX + 0.5, BY + 0.5, BW - 1, BH - 1) }
const body = (x: Ctx, fill: string | CanvasGradient) => { x.fillStyle = fill; x.fillRect(BX, BY, BW, BH) }
const shine = (x: Ctx, a = 0.9) => { x.fillStyle = `rgba(255,255,255,${a})`; x.fillRect(BX, BY, BW, 2) }
const heart = (x: Ctx, cx: number, cy: number, s: number) => {
  x.beginPath(); x.moveTo(cx, cy + s * 0.9)
  x.bezierCurveTo(cx - s * 1.6, cy - s * 0.1, cx - s * 0.7, cy - s * 1.3, cx, cy - s * 0.4)
  x.bezierCurveTo(cx + s * 0.7, cy - s * 1.3, cx + s * 1.6, cy - s * 0.1, cx, cy + s * 0.9); x.fill()
}

export const NOTE_SKINS: NoteSkin[] = [
  { id: 'basic', name: '기본', need: '처음부터', ok: () => true, draw(x, o, c) {
    x.shadowColor = o ? lighten(c, 0.3) : '#ffffff'; x.shadowBlur = 10
    body(x, vert(x, 15, 29, o ? lighten(c, 0.7) : '#ffffff', o ? c : '#b7d3ff'))
    x.shadowBlur = 0; shine(x, 0.95); frame(x, o ? '#ffffff' : 'rgba(80,140,230,.95)')
  } },
  { id: 'neon', name: '네온 라인', need: '플레이 5번', ok: p => p.plays >= 5, draw(x, o, c) {
    const k = o ? lighten(c, 0.3) : '#ffffff'
    body(x, '#0a1022'); x.shadowColor = k; x.shadowBlur = 9; frame(x, k, 2)
    x.shadowBlur = 0; x.fillStyle = k; x.fillRect(BX + 8, BY + 6, BW - 16, 2)
  } },
  { id: 'jelly', name: '젤리', need: '레벨 3', ok: p => p.level >= 3, draw(x, o, c) {
    x.shadowColor = o ? c : '#9db6d0'; x.shadowBlur = 8
    x.fillStyle = vert(x, 13, 31, o ? lighten(c, 0.65) : '#ffffff', o ? c : '#a8c4ee'); x.beginPath(); x.roundRect(BX, 13, BW, 18, 9); x.fill()
    x.shadowBlur = 0; x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.roundRect(BX + 8, 15, BW - 16, 5, 3); x.fill()
  } },
  { id: 'crystal', name: '크리스탈', need: '레벨 6', ok: p => p.level >= 6, draw(x, o, c) {
    const a = o ? lighten(c, 0.6) : '#ffffff', b = o ? c : '#9db6d0'
    x.beginPath(); x.moveTo(BX + 8, BY); x.lineTo(BX + BW - 8, BY); x.lineTo(BX + BW, BY + 7); x.lineTo(BX + BW - 8, BY + BH); x.lineTo(BX + 8, BY + BH); x.lineTo(BX, BY + 7); x.closePath()
    x.fillStyle = horz(x, b, a, b, a, b); x.fill(); x.strokeStyle = '#ffffff'; x.lineWidth = 1.5; x.stroke()
    x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1; x.beginPath(); for (const px of [BX + 22, BX + 35, BX + 48]) { x.moveTo(px, BY + 1); x.lineTo(px - 5, BY + BH - 1) } x.stroke()
  } },
  { id: 'stripe', name: '스트라이프', need: '플레이 30번', ok: p => p.plays >= 30, draw(x, o, c) {
    const a = o ? c : '#dfe9f5', b = o ? lighten(c, 0.65) : '#8fa7c6'
    x.save(); x.beginPath(); x.rect(BX, BY, BW, BH); x.clip(); x.fillStyle = a; x.fillRect(BX, BY, BW, BH); x.fillStyle = b
    for (let px = BX - 14; px < BX + BW; px += 14) { x.beginPath(); x.moveTo(px + 7, BY); x.lineTo(px + 14, BY); x.lineTo(px + 7, BY + BH); x.lineTo(px, BY + BH); x.fill() }
    x.restore(); frame(x, '#ffffff')
  } },
  { id: 'heart', name: '하트', need: '풀 콤보 3번', ok: p => p.fcs >= 3, draw(x, o, c) {
    body(x, vert(x, 15, 29, o ? '#ffd0e6' : '#ffffff', o ? '#ff6fa8' : '#f5b8d4')); frame(x, '#ffffff')
    x.fillStyle = '#ff2f78'; heart(x, BX + BW / 2, BY + 7, 4.6); x.fillStyle = '#ffd0e6'; x.fillRect(BX + 4, BY + 6, 14, 2); x.fillRect(BX + BW - 18, BY + 6, 14, 2); void c
  } },
  { id: 'star', name: '별똥별', need: '올 퍼펙트 1번', ok: p => p.aps >= 1, draw(x, o, c) {
    body(x, vert(x, 15, 29, '#16224d', '#0a1233')); frame(x, o ? lighten(c, 0.4) : '#ffffff')
    x.shadowColor = '#ffb13b'; x.shadowBlur = 8; starPath(x, BX + BW / 2, BY + 7, 10); x.fillStyle = '#ffe27a'; x.fill(); x.shadowBlur = 0
    x.fillStyle = o ? lighten(c, 0.5) : '#ffffff'; x.fillRect(BX + 6, BY + 6, 16, 2); x.fillRect(BX + BW - 22, BY + 6, 16, 2)
  } },
  { id: 'emblem', name: '엠블럼', need: '대결 3승', ok: p => p.wins >= 3, draw(x, o, c) {
    body(x, vert(x, 15, 29, o ? lighten(c, 0.35) : '#e8eef7', o ? lighten(c, -0.0) : '#9db6d0')); frame(x, '#ffffff')
    x.strokeStyle = o ? '#0b2a6b' : '#27456f'; x.lineWidth = 2.4; x.lineJoin = 'miter'
    for (const px of [BX + BW / 2 - 14, BX + BW / 2, BX + BW / 2 + 14]) { x.beginPath(); x.moveTo(px - 4, BY + 2.5); x.lineTo(px + 3, BY + 7); x.lineTo(px - 4, BY + BH - 2.5); x.stroke() }
  } },
  { id: 'retro', name: '레트로 8비트', need: '레벨 10', ok: p => p.level >= 10, draw(x, o, c) {
    const a = o ? c : '#ffffff', d = o ? lighten(c, -0.0) : '#9db6d0'
    x.fillStyle = a; x.fillRect(BX + 4, BY, BW - 8, BH); x.fillRect(BX, BY + 4, BW, BH - 8)
    x.fillStyle = d; x.fillRect(BX + 4, BY + BH - 4, BW - 8, 4)
    x.fillStyle = '#ffffff'; x.fillRect(BX + 4, BY, BW - 8, 3)
    x.fillStyle = 'rgba(0,0,0,.35)'; for (let px = BX + 10; px < BX + BW - 8; px += 10) x.fillRect(px, BY + 5, 4, 4)
  } },
  { id: 'holo', name: '홀로그램', need: '레벨 15', ok: p => p.level >= 15, draw(x) {
    x.shadowColor = '#c7a6ff'; x.shadowBlur = 9
    body(x, horz(x, '#ff7ad9', '#7ad9ff', '#a0ffb0', '#ffe27a', '#ff7ad9')); x.shadowBlur = 0
    x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(BX, BY, BW, 5); frame(x, '#ffffff')
  } },
  { id: 'gold', name: '골드', need: '레벨 20', ok: p => p.level >= 20, draw(x) {
    x.shadowColor = '#ffcf4a'; x.shadowBlur = 10
    body(x, vert(x, 15, 29, '#fff2b0', '#e0a800', '#8a5a00')); x.shadowBlur = 0
    x.fillStyle = 'rgba(255,255,255,.8)'; x.fillRect(BX + 3, BY + 2, BW - 6, 2); frame(x, '#fff4c8')
  } },
  { id: 'carbon', name: '카본', need: '풀 콤보 25번', ok: p => p.fcs >= 25, draw(x, o, c) {
    body(x, '#14161b'); x.fillStyle = 'rgba(255,255,255,.07)'
    for (let px = BX; px < BX + BW; px += 4) for (let py = BY; py < BY + BH; py += 4) if (((px - BX + py - BY) / 4) % 2 === 0) x.fillRect(px, py, 4, 4)
    const k = o ? lighten(c, 0.1) : '#ff3d5a'; x.fillStyle = k; x.fillRect(BX, BY, BW, 2); x.fillRect(BX, BY + BH - 2, BW, 2)
    x.shadowColor = k; x.shadowBlur = 6; x.fillStyle = `rgba(${rgbOf(o ? lighten(c, 0.3) : '#ff7a8a')},.9)`; x.fillRect(BX + BW / 2 - 12, BY + 5, 24, 4)
  } }
]

// 지금 쓸 스킨: 고른 번호가 아직 안 풀렸으면 기본으로 (프로필이 없으면 기본만 쓴다)
export const skinOf = (i: number, p: Profile | undefined) => { const s = NOTE_SKINS[i] ?? NOTE_SKINS[0]; return p && s.ok(p) || s === NOTE_SKINS[0] ? s : NOTE_SKINS[0] }

// 스킨 그림 한 장: 화면에 찍히는 크기(scale)로 만들어 둔다 (확대해 찍으면 큰 화면에서 가장자리가 계단져 보인다)
const cache: Record<string, HTMLCanvasElement> = {}
export function skinSprite(s: NoteSkin, outer: boolean, color: string, scale: number) {
  const k = Math.max(1, Math.round(scale * 4) / 4), key = `${s.id}|${outer ? color : 'i'}|${k}`
  let c = cache[key]
  if (!c) {
    c = cache[key] = document.createElement('canvas'); c.width = Math.ceil(92 * k); c.height = Math.ceil(44 * k)
    const x = c.getContext('2d')!; x.scale(c.width / 92, c.height / 44); s.draw(x, outer, color)
  }
  return c
}
