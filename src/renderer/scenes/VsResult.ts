import type { Scene, SceneManager } from '../core/SceneManager'
import type { Song } from '../../shared/types'
import { ScoreKeeper } from '../game/ScoreKeeper'
import { closeVersus, send, sleep, vs } from '../core/Versus'
import { TIER_COLOR, ladderResult, refreshProfile, reportLadder, type LadderResult } from '../data/Profile'
import { gem } from '../render/profileCard'
import { settings } from '../data/Storage'
import { diffName } from '../data/Songs'
import { FONT, AMBER, CYAN, ICE, artOf, card, chip, drawBg, drawCover, fit, glow, meter, pill } from '../render/theme'

// 대결 결과: 내 결과를 보내고, 상대 결과가 오면 승패를 가른다. 실패한 쪽이 지고, 둘 다 같은 상태면 점수가 높은 쪽이 이긴다
interface D { song: Song; diff: string; sk: ScoreKeeper; failed?: boolean; keys: number }
const fmt = (n: number) => String(n).padStart(7, '0')

export const VsResult = (sm: SceneManager): Scene => {
  let d: D, lad: LadderResult | undefined, polling = 0 // lad: 래더면 서버가 판정한 결과 (LP 변화)
  const mine = () => ({ s: d.sk.score, a: d.sk.accuracy, mc: d.sk.maxCombo, failed: !!d.failed, rank: d.failed ? 'F' : d.sk.rank })
  // 상대가 끝났거나 연결이 끊겼으면 판정 가능
  const ready = () => !!vs.peerDone || vs.closed
  const verdict = () => {
    if (lad?.result) return lad.result // 래더는 서버의 판정이 기준
    const m = mine(), p = vs.peerDone
    if (!p) return m.failed ? 'LOSE' : 'WIN' // 상대가 끊김: 끝까지 친 쪽이 이긴다
    if (m.failed !== p.failed) return m.failed ? 'LOSE' : 'WIN'
    return m.s === p.s ? 'DRAW' : m.s > p.s ? 'WIN' : 'LOSE'
  }

  return {
    enter(data) {
      d = data as D
      send({ t: 'done', ...mine() })
      lad = undefined
      const mid = vs.l?.mid, my = ++polling
      if (mid) { // 래더: 내 결과를 서버에 올리고, 상대 결과까지 모이면 서버가 판정한다 (2초마다 물어본다)
        void reportLadder(mid, d.sk.score, !!d.failed).catch(() => {})
        void (async () => { for (let i = 0; i < 90 && my === polling; i++) { await sleep(2000); try { const r = await ladderResult(mid); if (r.state === 'done') { lad = r; void refreshProfile(); return } if (r.state === 'none') return } catch { /* 다음에 다시 */ } } })()
      }
    },
    render(g) {
      const { song } = d, t = performance.now() / 1000
      drawBg(g, song)
      g.textAlign = 'left'
      card(g, 40, 22, 1200, 100)
      const im = artOf(song)!.img
      g.save(); g.beginPath(); g.roundRect(58, 36, 72, 72, 14); g.clip(); drawCover(g, im, im.width, im.height, 58, 36, 72, 72); g.restore()
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(58, 36, 72, 72, 14); g.stroke()
      g.font = `700 13px ${FONT}`; g.fillStyle = CYAN; g.fillText(`VERSUS  ·  ${d.keys}K ${diffName(d.diff)}`, 152, 52)
      g.font = `800 28px ${FONT}`; g.fillStyle = '#fff'; g.fillText(fit(g, song.meta.title, 1000), 152, 86)
      g.font = `16px ${FONT}`; g.fillStyle = ICE; g.fillText(fit(g, song.meta.artist, 1000), 152, 110)

      // 가운데 판정 띠
      const fin = ready(), v = fin ? verdict() : ''
      const col = v === 'WIN' ? ['#ffb13b', '#ff5c8a'] : v === 'LOSE' ? ['#4a6bb0', '#2a3f78'] : ['#7ad8ff', '#5b8cff']
      const bg = g.createLinearGradient(520, 0, 760, 0); bg.addColorStop(0, col[0]); bg.addColorStop(1, col[1])
      glow(g, v === 'WIN' ? '#ff9f1a' : 'rgba(0,0,0,0)', 22, () => pill(g, 500, 140, 280, 64, fin ? bg : 'rgba(255,255,255,.18)'))
      g.textAlign = 'center'; g.font = `900 34px ${FONT}`; g.fillStyle = '#fff'
      g.fillText(fin ? v : '상대가 치는 중…', 640, 184)
      if (fin && vs.l?.mid) { // 래더: LP 변화
        g.font = `800 20px ${FONT}`; g.textAlign = 'center'
        if (lad) { const c = TIER_COLOR[lad.tierLabel?.split(' ')[0] ?? ''] ?? '#fff'; gem(g, 540, 222, 12, c); g.fillStyle = (lad.delta ?? 0) >= 0 ? AMBER : '#9ab'; g.fillText(`${(lad.delta ?? 0) >= 0 ? '+' : ''}${lad.delta} LP   ·   ${lad.tierLabel}`, 650, 230) }
        else { g.fillStyle = ICE; g.font = `700 15px ${FONT}`; g.fillText('래더 결과를 확인하는 중…', 640, 230) }
      } else if (fin && !vs.peerDone) { g.font = `13px ${FONT}`; g.fillStyle = ICE; g.fillText('상대와 연결이 끊어졌습니다', 640, 226) }

      const side = (x: number, head: string, nick: string, s: { s: number; a: number; mc?: number; failed?: boolean; rank?: string }, live: boolean) => {
        card(g, x, 240, 560, 380, head)
        g.textAlign = 'left'; g.font = `800 24px ${FONT}`; g.fillStyle = '#fff'; g.fillText(fit(g, nick, 380), x + 20, 312)
        if (s.rank) { // 등급 글자
          const rg = g.createLinearGradient(0, 330, 0, 430); rg.addColorStop(0, '#fff'); rg.addColorStop(1, s.failed ? '#ffb0b0' : '#9aeaff')
          glow(g, 'rgba(120,210,255,.6)', 20, () => { g.font = `900 100px ${FONT}`; g.fillStyle = rg; g.fillText(s.rank!, x + 28, 420) })
        } else { g.font = `800 20px ${FONT}`; g.fillStyle = ICE; g.fillText('진행 중…', x + 28, 400) }
        g.font = `900 64px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'right'; g.fillText(fmt(s.s), x + 540, 420)
        meter(g, x + 20, 460, 520, s.a / 100)
        g.font = `600 14px ${FONT}`; g.fillStyle = ICE; g.textAlign = 'left'; g.fillText('ACCURACY', x + 20, 496); g.textAlign = 'right'; g.fillText(`${s.a.toFixed(2)}%`, x + 540, 496)
        if (s.mc !== undefined) { g.textAlign = 'left'; g.fillText('MAX COMBO', x + 20, 528); g.textAlign = 'right'; g.fillText(String(s.mc), x + 540, 528) }
        if (s.failed) { g.font = `800 14px ${FONT}`; pill(g, x + 20, 560, 90, 30, '#c0392b'); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('FAILED', x + 65, 580) }
        else if (live) { g.fillStyle = AMBER; g.font = `700 14px ${FONT}`; g.textAlign = 'left'; g.fillText(`콤보 ${vs.peer.c}   체력 ${Math.round(vs.peer.hp)}%`, x + 20, 580) }
        g.textAlign = 'left'
      }
      const m = mine()
      side(40, 'YOU', settings.nick, { ...m, mc: m.mc }, false)
      const p = vs.peerDone
      side(680, 'RIVAL', vs.peerNick || 'PLAYER', p ?? { s: vs.peer.s, a: vs.peer.a }, !p)
      if (fin && vs.peerDone) { // 점수 차이
        const diff = m.s - vs.peerDone.s
        g.textAlign = 'center'; g.font = `800 18px ${FONT}`; g.fillStyle = diff >= 0 ? AMBER : '#9ab'
        g.fillText(`${diff >= 0 ? '+' : '-'}${Math.abs(diff).toLocaleString()}`, 640, 330 + 4 * Math.sin(t * 3))
      }
      let kx = 48
      if (fin && !vs.closed && vs.l) kx = chip(g, kx, 684, 'Enter', '다시 찾기')
      else if (fin && !vs.closed) kx = chip(g, kx, 684, 'Enter', vs.role === 'host' ? '한 판 더 (곡 고르기)' : '로비로 (방장이 곡을 고름)')
      chip(g, kx, 684, 'Esc', '나가기')
    },
    keydown(e) {
      if (e.key === 'Escape') { closeVersus(); sm.go('title') }
      else if (e.key === 'Enter' && ready() && vs.l) sm.go('ladder')
      else if (e.key === 'Enter' && ready() && !vs.closed) { if (vs.role === 'host') sm.go('select', { mode: 'versus' }); else sm.go('vs') }
    }
  }
}
