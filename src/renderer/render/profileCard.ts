import { PLATE_COLOR, TIER_COLOR, type Profile } from '../data/Profile'
import { avatarImg } from '../data/Avatar'
import { AMBER, FONT, fit, glow, lighten, slant } from './theme'

// 프로필 카드: 디맥 곡 선택 화면 오른쪽 위의 작은 카드(아이콘 · 닉네임 · Lv · 경험치 막대)를 본떴다. 플레이트가 카드 색이 된다. 로그인 전이면 GUEST
// 래더 계급장(디맥 랭크 엠블럼 모양): 금속 테두리의 방패 + 가운데 별 + 양옆 날개(티어가 높을수록 깃이 많다) + 아래 디비전 점(IV 한 개 → I 네 개). MASTER는 왕관이 얹힌다.
// label은 서버의 tierLabel ('GOLD II' · 'MASTER' · 'UNRANKED'). 래더 티어·프로필 카드·결과 화면이 같이 쓴다. 작게(r<20) 그릴 때는 날개·점을 뺀다
const RANKS = ['UNRANKED', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MASTER'], FEATHERS = [0, 0, 1, 2, 3, 3, 4, 5]
export function gem(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, label: string) {
  const [name, roman] = label.split(' '), color = TIER_COLOR[name] ?? '#fff', rank = Math.max(0, RANKS.indexOf(name))
  const div = ['', 'I', 'II', 'III', 'IV'].indexOf(roman ?? ''), big = r >= 20, unranked = rank === 0
  const shield = (k: number) => {
    g.beginPath(); g.moveTo(cx, cy - r * k); g.lineTo(cx + 0.86 * r * k, cy - 0.55 * r * k); g.lineTo(cx + 0.86 * r * k, cy + 0.2 * r * k)
    g.quadraticCurveTo(cx + 0.7 * r * k, cy + 0.72 * r * k, cx, cy + 1.05 * r * k); g.quadraticCurveTo(cx - 0.7 * r * k, cy + 0.72 * r * k, cx - 0.86 * r * k, cy + 0.2 * r * k)
    g.lineTo(cx - 0.86 * r * k, cy - 0.55 * r * k); g.closePath()
  }
  const metal = (x0: number, y0: number, x1: number, y1: number) => { const m = g.createLinearGradient(x0, y0, x1, y1); m.addColorStop(0, lighten(color, 0.75)); m.addColorStop(0.45, color); m.addColorStop(1, 'rgba(12,22,60,.85)'); return m }
  g.save(); g.lineJoin = 'round'
  if (big) { // 날개: 깃이 위에서부터 짧아진다
    for (const side of [-1, 1]) for (let i = 0; i < FEATHERS[rank]; i++) {
      const bx = cx + side * 0.8 * r, y0 = cy + r * (-0.5 + 0.22 * i)
      g.beginPath(); g.moveTo(bx, y0); g.lineTo(cx + side * r * (1.5 - 0.1 * i), cy + r * (-1.05 + 0.34 * i)); g.lineTo(bx, y0 + 0.26 * r); g.closePath()
      g.fillStyle = metal(bx, y0, cx + side * 1.5 * r, y0 - r); g.fill(); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = Math.max(1, r / 28); g.stroke()
    }
  }
  if (rank === 7) { // 왕관
    g.beginPath(); g.moveTo(cx - 0.6 * r, cy - 0.6 * r); g.lineTo(cx - 0.6 * r, cy - 1.25 * r); g.lineTo(cx - 0.3 * r, cy - 0.95 * r); g.lineTo(cx, cy - 1.45 * r); g.lineTo(cx + 0.3 * r, cy - 0.95 * r); g.lineTo(cx + 0.6 * r, cy - 1.25 * r); g.lineTo(cx + 0.6 * r, cy - 0.6 * r); g.closePath()
    g.fillStyle = metal(cx, cy - 1.45 * r, cx, cy - 0.6 * r); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = Math.max(1, r / 22); g.stroke()
  }
  glow(g, color, unranked ? 0 : r * 0.6, () => { shield(1); g.fillStyle = metal(cx - r, cy - r, cx + r * 0.6, cy + r); g.fill() }) // 테두리(금속)
  g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = Math.max(1.5, r / 14); shield(1); g.stroke()
  shield(0.78); const face = g.createLinearGradient(cx, cy - r, cx, cy + r); face.addColorStop(0, lighten(color, 0.45)); face.addColorStop(0.5, color); face.addColorStop(1, 'rgba(10,20,60,.8)'); g.fillStyle = face; g.fill()
  g.save(); shield(0.78); g.clip(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(cx - r, cy - r); g.lineTo(cx + r, cy - r); g.lineTo(cx + r, cy - 0.15 * r); g.lineTo(cx - r, cy + 0.3 * r); g.closePath(); g.fill(); g.restore() // 위쪽 유리 반사
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1; shield(0.78); g.stroke()
  if (unranked) { g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = Math.max(2, r / 9); g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - 0.3 * r, cy); g.lineTo(cx + 0.3 * r, cy); g.stroke() } // 아직 배치 전: 별 대신 줄 하나
  else glow(g, '#fff', r * 0.4, () => { // 가운데 별
    g.beginPath(); for (let i = 0; i < 10; i++) { const t = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? 0.2 * r : 0.44 * r; (i ? g.lineTo : g.moveTo).call(g, cx + Math.cos(t) * q, cy + 0.02 * r + Math.sin(t) * q) }
    g.closePath(); g.fillStyle = '#fff'; g.fill()
  })
  if (big && div > 0) for (let i = 0; i < 4; i++) { // 디비전 점: IV 한 개 … I 네 개
    const px = cx + (i - 1.5) * 0.3 * r, py = cy + 1.36 * r, q = 0.1 * r
    g.beginPath(); g.moveTo(px, py - q); g.lineTo(px + q, py); g.lineTo(px, py + q); g.lineTo(px - q, py); g.closePath()
    if (i < 5 - div) { g.fillStyle = lighten(color, 0.5); g.fill() }
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1; g.stroke()
  }
  g.restore()
}

// 프로필 아이콘: 올린 이미지가 있으면 그것, 없거나 아직 받는 중이면 닉네임 첫 글자 (플레이트 색 바탕)
export function avatarCircle(g: CanvasRenderingContext2D, x: number, y: number, r: number, nick: string | undefined, key: string | undefined, c1: string, c2: string) {
  const im = avatarImg(key)
  g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2)
  if (im) { g.clip(); g.drawImage(im, x - r, y - r, r * 2, r * 2) } else {
    const ig = g.createLinearGradient(x - r, y - r, x + r, y + r); ig.addColorStop(0, c2); ig.addColorStop(1, c1); g.fillStyle = ig; g.fill()
    g.textAlign = 'center'; g.fillStyle = '#fff'; g.font = `900 ${Math.round(r * 0.95)}px ${FONT}`; g.fillText(nick ? [...nick][0].toUpperCase() : '?', x, y + r * 0.33)
  }
  g.restore(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke()
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
  // 아이콘(프로필 이미지, 없으면 닉네임 첫 글자)
  const ix = x + (big ? 66 : 44), iy = y + h / 2, ir = big ? 40 : 24
  avatarCircle(g, ix, iy, ir, p?.nick, p?.avatar, c1, c2)
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
      gem(g, x + w - 38, y + 116, 11, p.tierLabel)
      g.textAlign = 'right'; g.fillStyle = TIER_COLOR[p.tier] ?? '#fff'; g.fillText(p.tierLabel, x + w - 56, y + 119)
    }
  }
  g.restore()
}
