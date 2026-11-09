import type { Scene, SceneManager } from '../core/SceneManager'
import { account } from '../data/Storage'
import { PLATE_COLOR, TIER_COLOR, equip, prof, refreshProfile, type Item } from '../data/Profile'
import { FONT, AMBER, CYAN, ICE, accentFill, card, chip, drawBg, ease, fit, glow, header, hit, meter, pill, press, slant } from '../render/theme'
import { gem, profileCard } from '../render/profileCard'

// 컬렉션: 디맥의 COLLECTION처럼 내 프로필을 보고 꾸민다. 탭 — DJ CLASS(등급·전적) · PLATE(카드 색) · TITLE(칭호). 해금은 서버가 정한다
const TABS = ['DJ CLASS', 'PLATE', 'TITLE'] as const

export const Collection = (sm: SceneManager): Scene => {
  let tab = 0, sel = 0, msg = '', busy = false
  const items = (): Item[] => (tab === 1 ? prof.v?.plates : tab === 2 ? prof.v?.titles : undefined) ?? []
  const cols = () => (tab === 1 ? 4 : 1)
  const setTab = (n: number) => { tab = (n + TABS.length) % TABS.length; msg = ''; const p = prof.v, it = items(); sel = Math.max(0, it.findIndex(x => x.id === (tab === 1 ? p?.plate : p?.title))) }
  async function pick() {
    const it = items()[sel]; if (!it || busy) return
    if (!it.on) { msg = `아직 쓸 수 없습니다 — ${it.need}`; return }
    busy = true
    try { await equip(tab === 1 ? 'plate' : 'title', it.id); msg = `${it.name} 적용` } catch (e) { msg = (e as Error).message } finally { busy = false }
  }
  const stat = (g: CanvasRenderingContext2D, x: number, y: number, label: string, v: string | number) => {
    g.textAlign = 'left'; g.font = `600 13px ${FONT}`; g.fillStyle = ICE; g.fillText(label, x, y)
    g.textAlign = 'right'; g.font = `800 20px ${FONT}`; g.fillStyle = '#fff'; g.fillText(String(v), x + 340, y + 2); g.textAlign = 'left'
  }

  return {
    enter() { msg = ''; busy = false; if (account.token) void refreshProfile().then(() => setTab(0)); else setTab(0) },
    render(g) {
      drawBg(g)
      const p = prof.v
      header(g, 'COLLECTION')
      g.textAlign = 'center'; g.fillStyle = '#fff'
      if (!p) { // 로그인 전
        g.font = `800 26px ${FONT}`; g.fillText(account.token ? '프로필을 불러오는 중…' : '로그인하면 프로필과 꾸미기를 쓸 수 있습니다', 640, 330)
        g.font = `15px ${FONT}`; g.fillStyle = ICE; g.fillText(account.token ? '서버에 연결하지 못하면 잠시 후 다시 들어와 주세요' : 'Enter 로그인하러 가기', 640, 372)
        if (!account.token) hit(440, 290, 400, 110, () => press('Enter'))
        chip(g, 48, 692, 'Esc', '뒤로'); return
      }
      // 탭 (비스듬한 꼬리표)
      TABS.forEach((name, i) => {
        const on = i === tab, k = ease('coltab' + i, on), x = 300 + i * 170, w = 160
        hit(x, 30, w, 36, () => setTab(i))
        slant(g, x, 30, w, 36, 14); g.fillStyle = on ? '#ff9f1a' : 'rgba(8,24,70,.74)'; g.fill(); g.strokeStyle = `rgba(255,255,255,${0.35 * (1 - k)})`; g.lineWidth = 1; g.stroke()
        g.textAlign = 'center'; g.font = `${on ? 800 : 600} 16px ${FONT}`; g.fillStyle = '#fff'; g.fillText(name, x + w / 2, 54)
      })
      // 왼쪽: 프로필 카드 + 기록
      profileCard(g, 50, 110, p, true)
      card(g, 50, 262, 420, 330, 'PLAY INFO')
      stat(g, 76, 322, '총 플레이', p.plays); stat(g, 76, 358, '풀콤보', p.fcs); stat(g, 76, 394, '올퍼펙트', p.aps)
      stat(g, 76, 430, '경험치 합계', p.exp.toLocaleString())
      g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(76, 450, 340, 1)
      g.textAlign = 'left'; g.font = `700 13px ${FONT}`; g.fillStyle = CYAN; g.fillText('LADDER', 76, 480)
      gem(g, 120, 526, 26, p.tierLabel)
      g.font = `900 22px ${FONT}`; g.fillStyle = TIER_COLOR[p.tier] ?? '#fff'; g.fillText(p.tierLabel, 184, 524)
      g.font = `600 14px ${FONT}`; g.fillStyle = ICE; g.fillText(`${p.lp} LP   ·   ${p.wins}승 ${p.losses}패 ${p.draws}무`, 184, 550)

      // 오른쪽: 탭 내용
      card(g, 500, 110, 730, 482, TABS[tab])
      if (tab === 0) {
        const c = p.cls, lo = c.lo ?? 0, last = !c.hi, f = last ? 1 : (c.points - lo) / (c.hi - lo)
        g.textAlign = 'center'; g.font = `700 14px ${FONT}`; g.fillStyle = CYAN; g.fillText('DJ CLASS', 865, 190)
        g.font = `900 66px ${FONT}`; const gr = g.createLinearGradient(700, 0, 1030, 0); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#bfe6ff')
        glow(g, 'rgba(10,50,140,.65)', 26, () => { g.fillStyle = gr; g.fillText(c.label, 865, 262) })
        g.font = `700 18px ${FONT}`; g.fillStyle = AMBER; g.fillText(`${c.points} PT`, 865, 300)
        meter(g, 600, 330, 530, f)
        g.font = `600 13px ${FONT}`; g.fillStyle = ICE; g.textAlign = 'left'; g.fillText(`${lo}`, 600, 360); g.textAlign = 'right'
        g.fillText(last ? 'MAX' : `NEXT  ${c.hi} PT`, 1130, 360)
        g.textAlign = 'center'; g.font = `14px ${FONT}`; g.fillStyle = ICE
        g.fillText('곡마다 최고 점수에 난이도(쉬움 ×0.5 · 보통 ×0.75 · 어려움 ×1 · 스텔라 ×1.25)를 곱해', 865, 430)
        g.fillText('가장 높은 20곡을 더한 값입니다. 온라인 랭킹에 올린 기록이 쌓입니다.', 865, 456)
      } else {
        const it = items(), cs = cols(), cw = tab === 1 ? 160 : 690, ch = tab === 1 ? 150 : 40, gap = tab === 1 ? 16 : 6
        const per = tab === 2 ? 8 : it.length, first = tab === 2 ? Math.min(Math.max(0, sel - per + 1), Math.max(0, it.length - per)) : 0 // 칭호가 많으면 카드 안에서 스크롤
        g.textAlign = 'center'; g.font = `800 14px ${FONT}`; g.fillStyle = AMBER
        if (first > 0) g.fillText('▲', 865, 142)
        if (first + per < it.length) g.fillText('▼', 865, 150 + per * (ch + gap) + 6)
        it.forEach((x, i) => {
          if (i < first || i >= first + per) return
          const r = i - first, cx = 520 + (i % cs) * (cw + gap), cy = 150 + Math.floor(r / cs) * (ch + gap), cur = i === sel, k = ease(`colit${tab}-${i}`, cur)
          const worn = x.id === (tab === 1 ? p.plate : p.title)
          hit(cx, cy, cw, ch, () => { sel = i; void pick() }, () => { sel = i })
          if (tab === 1) {
            const [c1, c2] = PLATE_COLOR[x.id] ?? PLATE_COLOR.default
            g.save(); g.globalAlpha = x.on ? 1 : 0.45
            slant(g, cx, cy, cw, ch, 18); const gr = g.createLinearGradient(cx, cy, cx + cw, cy + ch); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fill(); g.restore()
            slant(g, cx, cy, cw, ch, 18); g.strokeStyle = cur ? '#fff' : 'rgba(255,255,255,.35)'; g.lineWidth = cur ? 3 : 1; g.stroke()
            g.textAlign = 'center'; g.font = `800 17px ${FONT}`; g.fillStyle = '#fff'; g.fillText(x.name, cx + cw / 2, cy + 82)
            g.font = `600 12px ${FONT}`; g.fillStyle = x.on ? 'rgba(255,255,255,.85)' : '#ffd0d0'; g.fillText(x.on ? (worn ? '사용 중' : '') : `🔒 ${x.need}`, cx + cw / 2, cy + 106)
          } else {
            slant(g, cx, cy, cw, ch, 14); g.fillStyle = 'rgba(8,24,70,.74)'; g.fill(); g.strokeStyle = `rgba(255,255,255,${0.3 * (1 - k)})`; g.lineWidth = 1; g.stroke()
            if (k > 0.01) { g.save(); g.globalAlpha *= k; const og = g.createLinearGradient(cx, 0, cx + cw, 0); og.addColorStop(0, '#ffb13b'); og.addColorStop(0.7, '#ff7a59'); og.addColorStop(1, '#ff5c8a'); slant(g, cx, cy, cw, ch, 14); g.fillStyle = og; g.fill(); g.restore() }
            g.textAlign = 'left'; g.font = `${cur ? 800 : 600} 17px ${FONT}`; g.fillStyle = x.on ? '#fff' : 'rgba(255,255,255,.45)'; g.fillText(fit(g, x.name, 380), cx + 34, cy + 26)
            g.textAlign = 'right'; g.font = `600 13px ${FONT}`; g.fillStyle = worn ? '#fff' : x.on ? 'rgba(255,255,255,.75)' : '#ffd0d0'
            g.fillText(worn ? '사용 중' : x.on ? '' : `🔒 ${x.need}`, cx + cw - 30, cy + 25)
          }
        })
      }
      g.textAlign = 'center'; g.font = `700 14px ${FONT}`; g.fillStyle = AMBER; g.fillText(msg, 865, 574)
      let kx = 48
      kx = chip(g, kx, 692, 'Tab', '탭 넘기기'); if (tab > 0) { kx = chip(g, kx, 692, '← → ↑ ↓', '고르기', '#0b2a6b', null); kx = chip(g, kx, 692, 'Enter', '적용') }
      chip(g, kx, 692, 'Esc', '뒤로')
    },
    keydown(e) {
      if (e.key === 'Escape') { sm.go('title'); return }
      if (!prof.v) { if (e.key === 'Enter' && !account.token) sm.go('account'); return }
      if (e.key === 'Tab') { e.preventDefault(); setTab(tab + (e.shiftKey ? -1 : 1)); return }
      const it = items(), cs = cols(); if (!it.length) return
      if (e.key === 'ArrowRight') sel = Math.min(it.length - 1, sel + 1)
      else if (e.key === 'ArrowLeft') sel = Math.max(0, sel - 1)
      else if (e.key === 'ArrowDown') sel = Math.min(it.length - 1, sel + cs)
      else if (e.key === 'ArrowUp') sel = Math.max(0, sel - cs)
      else if (e.key === 'Enter') void pick()
    }
  }
}
