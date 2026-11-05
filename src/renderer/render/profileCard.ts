import { PLATE_COLOR, TIER_COLOR, type Profile } from '../data/Profile'
import { AMBER, FONT, fit, glow, slant } from './theme'

// 프로필 카드: 디맥 곡 선택 화면 오른쪽 위의 작은 카드(아이콘 · 닉네임 · Lv · 경험치 막대)를 본떴다. 플레이트가 카드 색이 된다. 로그인 전이면 GUEST
// 티어 보석: 마름모 한 개 (래더 티어·DJ CLASS 표시에 같이 쓴다)
export function gem(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  const path = (k: number) => { g.beginPath(); g.moveTo(cx, cy - r * k); g.lineTo(cx + r * 0.78 * k, cy); g.lineTo(cx, cy + r * k); g.lineTo(cx - r * 0.78 * k, cy); g.closePath() }
  glow(g, color, r * 0.7, () => { path(1); const gr = g.createLinearGradient(cx, cy - r, cx, cy + r); gr.addColorStop(0, '#fff'); gr.addColorStop(0.45, color); gr.addColorStop(1, 'rgba(10,20,60,.55)'); g.fillStyle = gr; g.fill() })
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = Math.max(1.5, r / 14); path(1); g.stroke()
  g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1; path(0.55); g.stroke()
}

// 기본 크기 300x64 (big이면 420x132: 티어 보석·DJ CLASS·전적까지)
export function profileCard(g: CanvasRenderingContext2D, x: number, y: number, p: Profile | undefined, big = false) {
  const w = big ? 420 : 300, h = big ? 132 : 64, [c1, c2] = PLATE_COLOR[p?.plate ?? 'default'] ?? PLATE_COLOR.default
  g.save()
  slant(g, x, y, w, h, big ? 22 : 16); g.fillStyle = 'rgba(8,24,70,.84)'; g.fill()
  // 플레이트: 카드 왼쪽에서 번지는 색
  g.save(); slant(g, x, y, w, h, big ? 22 : 16); g.clip()
  const pl = g.createLinearGradient(x, 0, x + w, 0); pl.addColorStop(0, c1); pl.addColorStop(0.55, 'rgba(0,0,0,0)')
  g.globalAlpha = 0.55; g.fillStyle = pl; g.fillRect(x, y, w, h); g.restore()
  slant(g, x, y, w, h, big ? 22 : 16); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.5; g.stroke()
  // 아이콘(닉네임 첫 글자)
  const ix = x + (big ? 66 : 44), iy = y + h / 2, ir = big ? 40 : 24
  const ig = g.createLinearGradient(ix - ir, iy - ir, ix + ir, iy + ir); ig.addColorStop(0, c2); ig.addColorStop(1, c1)
  g.beginPath(); g.arc(ix, iy, ir, 0, Math.PI * 2); g.fillStyle = ig; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke()
  g.textAlign = 'center'; g.fillStyle = '#fff'; g.font = `900 ${big ? 38 : 22}px ${FONT}`
  g.fillText(p ? [...p.nick][0].toUpperCase() : '?', ix, iy + (big ? 13 : 8))
  // 이름·칭호·레벨
  const tx = ix + ir + 16, tw = x + w - tx - (big ? 20 : 26)
  g.textAlign = 'left'; g.font = `800 ${big ? 24 : 17}px ${FONT}`; g.fillStyle = '#fff'
  g.fillText(fit(g, p?.nick ?? 'GUEST', tw), tx, y + (big ? 40 : 25))
  g.font = `600 ${big ? 13 : 11}px ${FONT}`; g.fillStyle = p ? AMBER : 'rgba(255,255,255,.7)'
  g.fillText(fit(g, p ? p.titleName || 'STELLA' : '로그인하면 레벨이 올라갑니다', tw), tx, y + (big ? 60 : 41))
  if (p) {
    g.font = `800 ${big ? 15 : 12}px ${FONT}`; g.fillStyle = '#fff'; const lvText = `Lv ${p.level}`; g.fillText(lvText, tx, y + (big ? 86 : 57))
    const bx = tx + g.measureText(lvText).width + 10, bw = Math.max(20, x + w - bx - (big ? 20 : 26)), f = p.need ? p.cur / p.need : 1 // 레벨 글자 폭을 재서 막대를 그 뒤에 (Lv 999여도 겹치지 않게)
    g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.roundRect(bx, y + (big ? 76 : 50), bw, big ? 10 : 7, 5); g.fill()
    const eg = g.createLinearGradient(bx, 0, bx + bw, 0); eg.addColorStop(0, '#9b6bff'); eg.addColorStop(1, '#ff7ad8')
    g.fillStyle = eg; g.beginPath(); g.roundRect(bx, y + (big ? 76 : 50), Math.max(bw * f, 6), big ? 10 : 7, 5); g.fill()
    if (big) { // 아래 줄: DJ CLASS · 래더 티어
      g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(tx, y + 98, x + w - tx - 20, 1)
      g.font = `700 12px ${FONT}`; g.fillStyle = '#eaf6ff'; g.fillText(`DJ CLASS  ${p.cls.label}`, tx, y + 119)
      gem(g, x + w - 38, y + 116, 11, TIER_COLOR[p.tier] ?? '#fff')
      g.textAlign = 'right'; g.fillStyle = TIER_COLOR[p.tier] ?? '#fff'; g.fillText(p.tierLabel, x + w - 56, y + 119)
    }
  }
  g.restore()
}
