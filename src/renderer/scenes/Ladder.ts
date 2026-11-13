import type { Scene, SceneManager } from '../core/SceneManager'
import type { Song } from '../../shared/types'
import { closeVersus, newLadder, openRelay, relayAddr, send, vs } from '../core/Versus'
import { loadSongs } from '../data/Songs'
import { account } from '../data/Storage'
import { PLATE_COLOR, TIER_COLOR, prof, refreshProfile } from '../data/Profile'
import { FONT, AMBER, CYAN, ICE, accentFill, artOf, chip, drawBg, drawCover, ease, fit, glow, header, hit, pill, press, slant } from '../render/theme'
import { avatarCircle, gem } from '../render/profileCard'

// 래더 매치: 대기열 → 상대 확정 → 곡 5개를 번갈아 밴 → 남은 한 곡으로 한 판 (결과는 서버가 판정해 LP가 바뀐다). 디맥 래더처럼 양옆에 두 사람, 가운데에 곡 카드
const KEYS = 4
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export const Ladder = (sm: SceneManager): Scene => {
  let since = 0, err = '', focus = 0, sent = -1, byDir = new Map<string, Song>(), started = false
  const leave = (name: string, data?: unknown) => { closeVersus(); sm.go(name, data) }
  async function join() {
    closeVersus(); err = ''; since = performance.now(); focus = 0; sent = -1; started = false
    try { vs.role = 'host'; await openRelay(relayAddr(), { t: 'ladder', token: account.token }) } catch (e) { err = (e as Error).message }
  }
  const free = () => (vs.l?.songs ?? []).map((_, i) => i).filter(i => !vs.l!.banned.includes(i))

  // 사람 패널: 보석(티어) · 이름 · 레벨 · LP
  function side(g: CanvasRenderingContext2D, x: number, head: string, p: { nick: string; level: number; tier: string; tierLabel: string; lp: number; titleName?: string; avatar?: string } | undefined, on: boolean) {
    const w = 270, col = TIER_COLOR[p?.tier ?? 'UNRANKED'] ?? '#fff'
    g.textAlign = 'center'; g.font = `800 14px ${FONT}`; g.fillStyle = on ? AMBER : CYAN; g.fillText(head, x + w / 2, 156)
    gem(g, x + w / 2, 262, 72, p?.tierLabel ?? 'UNRANKED')
    g.font = `900 26px ${FONT}`; g.lineJoin = 'round'; g.lineWidth = 5; g.strokeStyle = 'rgba(6,11,28,.85)'; g.strokeText(p?.tierLabel ?? 'UNRANKED', x + w / 2, 392) // 밝은 배경에서도 티어 글자가 읽히게 어두운 테두리
    g.fillStyle = col; g.fillText(p?.tierLabel ?? 'UNRANKED', x + w / 2, 392)
    g.font = `700 14px ${FONT}`; g.fillStyle = '#0b2a6b'; g.fillText(`${p?.lp ?? 0} LP`, x + w / 2, 416)
    slant(g, x, 440, w, 64, 16); g.fillStyle = 'rgba(6,11,28,.84)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5; g.stroke()
    const [c1, c2] = PLATE_COLOR.default; avatarCircle(g, x + 36, 472, 22, p?.nick, p?.avatar, c1, c2)
    g.fillStyle = '#fff'; g.font = `800 20px ${FONT}`; g.textAlign = 'left'; g.fillText(fit(g, p?.nick ?? '…', w - 150), x + 70, 478); g.textAlign = 'center'
    g.textAlign = 'right'; g.font = `800 15px ${FONT}`; g.fillStyle = AMBER; g.fillText(`Lv ${p?.level ?? 1}`, x + w - 24, 478)
    if (p?.titleName) { g.textAlign = 'center'; g.font = `600 12px ${FONT}`; g.fillStyle = ICE; g.fillText(p.titleName, x + w / 2, 524) }
  }

  return {
    enter() {
      byDir = new Map(); void loadSongs().then(l => { byDir = new Map(l.map(s => [s.dir, s])) })
      void refreshProfile()
      if (!account.token) { err = '래더는 로그인이 필요합니다'; return }
      void join()
    },
    update() {
      const l = vs.l
      if (!account.token || !l) { if (account.token && !err && (vs.relayErr || vs.closed)) { err = vs.relayErr || '서버와 연결이 끊어졌습니다'; closeVersus() } return }
      if (l.state === 'go' && !started) { // 둘 다 준비됐다: 대결과 같은 방식으로 시작 (두 사람이 같은 채보로)
        const pick = l.songs[l.pick], song = pick && byDir.get(pick.dir)
        if (song) { started = true; sm.go('play', { song, diff: pick.diff, vs: true, keys: KEYS, ladder: true }) }
      }
      if ((l.state === 'queue' || l.state === 'ban' || l.state === 'prep') && (vs.relayErr || vs.closed) && !err) { err = vs.relayErr || '서버와 연결이 끊어졌습니다'; closeVersus() }
      if (l.state === 'ban' && !free().includes(focus)) focus = free()[0] ?? 0
    },
    render(g) {
      drawBg(g)
      const l = vs.l, me = prof.v, now = performance.now(), t = now / 1000
      header(g, 'LADDER MATCH', '랭크 대전')
      g.textAlign = 'center'; g.fillStyle = '#fff'
      const state = err ? 'err' : l?.state ?? 'queue'

      if (state === 'err' || state === 'cancel') {
        g.font = `800 28px ${FONT}`; g.fillStyle = '#fff'; g.fillText(err || l?.msg || '', 640, 330)
        g.font = `15px ${FONT}`; g.fillStyle = ICE; g.fillText(account.token ? 'Enter 다시 찾기   ·   Esc 나가기' : 'Enter 로그인하러 가기   ·   Esc 나가기', 640, 376)
        hit(440, 290, 400, 110, () => press('Enter'))
      } else if (state === 'queue') {
        side(g, 505, 'YOU', me, false)
        const s = Math.floor((now - since) / 1000)
        g.font = `800 30px ${FONT}`; g.fillStyle = '#fff'; g.fillText('상대를 찾는 중' + '.'.repeat(1 + Math.floor(t * 2) % 3), 640, 600)
        g.font = `700 20px ${FONT}`; g.fillStyle = AMBER; g.fillText(mmss(s), 640, 632)
        g.font = `13px ${FONT}`; g.fillStyle = ICE; g.fillText(s < 20 ? '비슷한 LP의 상대를 먼저 찾고, 오래 기다리면 범위를 넓힙니다' : (me?.lp ?? 0) < 800 && s < 45 ? `범위를 넓혀 찾는 중입니다 · ${45 - s}초 뒤에도 상대가 없으면 스텔라 봇과 대결합니다` : (me?.lp ?? 0) < 800 ? '상대가 없어 스텔라 봇과 연결하는 중입니다' : '범위를 넓혀 찾는 중입니다', 640, 658)
      } else if (l) {
        side(g, 70, 'YOU', me, l.turn === 'you'); side(g, 940, 'RIVAL', l.opp, l.turn === 'opp')
        // 가운데: 곡 카드 5장
        const header = l.state === 'ban' ? (l.turn === 'you' ? '밴할 곡을 고르세요' : '상대가 고르는 중…') : l.state === 'prep' ? '오늘의 곡이 정해졌습니다' : '시작합니다'
        g.textAlign = 'center'; g.font = `800 22px ${FONT}`; g.fillStyle = '#fff'; g.fillText(header, 640, 120)
        if (l.state === 'ban') {
          const left = Math.max(0, Math.ceil((l.deadline - now) / 1000))
          g.font = `900 30px ${FONT}`; g.fillStyle = left <= 5 ? '#ff8a8a' : AMBER; g.fillText(String(left), 640, 156)
        }
        const fr = free()
        l.songs.forEach((s, i) => {
          const banned = l.banned.includes(i), picked = l.state !== 'ban' && i === l.pick, y = 176 + i * 92, k = ease('lad' + i, l.state === 'ban' && l.turn === 'you' && i === focus && !banned)
          const x = 395 - 18 * k, w = 490 + 36 * k
          if (l.state !== 'ban' && !picked) g.globalAlpha = 0.35
          slant(g, x, y, w, 80, 20); g.fillStyle = 'rgba(6,11,28,.8)'; g.fill(); g.strokeStyle = picked ? AMBER : `rgba(255,255,255,${0.3 * (1 - k)})`; g.lineWidth = picked ? 3 : 1; g.stroke()
          if (k > 0.01) { g.save(); g.globalAlpha *= k; const og = g.createLinearGradient(x, 0, x + w, 0); og.addColorStop(0, '#ffb13b'); og.addColorStop(0.7, '#ff7a59'); og.addColorStop(1, '#ff5c8a'); glow(g, 'rgba(255,140,60,.6)', 16, () => { slant(g, x, y, w, 80, 20); g.fillStyle = og; g.fill() }); g.restore() }
          const sg = byDir.get(s.dir), im = sg && artOf(sg)?.img
          if (im) { g.save(); g.beginPath(); g.roundRect(x + 30, y + 8, 64, 64, 10); g.clip(); drawCover(g, im, im.width, im.height, x + 30, y + 8, 64, 64); g.restore() }
          g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = `800 19px ${FONT}`; g.fillText(fit(g, s.title, w - 190), x + 110, y + 34)
          g.font = `14px ${FONT}`; g.fillStyle = ICE; g.fillText(fit(g, s.artist, w - 190), x + 110, y + 58)
          g.textAlign = 'right'; g.font = `800 14px ${FONT}`; g.fillStyle = '#fff'; g.fillText(`${KEYS}K HARD`, x + w - 28, y + 46)
          if (banned) { // 밴: 어둡게 덮고 BAN
            g.globalAlpha = 1; slant(g, x, y, w, 80, 20); g.fillStyle = 'rgba(10,10,30,.72)'; g.fill()
            g.save(); g.translate(x + w / 2, y + 40); g.rotate(-0.08); g.font = `900 34px ${FONT}`; g.textAlign = 'center'; g.fillStyle = '#ff5c6c'; g.fillText('BAN', 0, 12); g.restore()
          }
          g.globalAlpha = 1
          if (l.state === 'ban' && l.turn === 'you' && !banned) hit(x, y, w, 80, () => { focus = i; press('Enter') }, () => { focus = i })
        })
        g.textAlign = 'center'; g.font = `600 14px ${FONT}`; g.fillStyle = ICE
        g.fillText(l.state === 'prep' ? (l.starting ? '곡을 받는 중… 상대가 준비되면 시작합니다' : '') : l.state === 'ban' && fr.length > 1 ? `남은 곡 ${fr.length}개 → 하나가 남을 때까지 번갈아 밴합니다` : '', 640, 656)
      }

      let kx = 48
      if (state === 'ban' && vs.l?.turn === 'you') { kx = chip(g, kx, 692, '↑ ↓', '고르기', '#fff', null); kx = chip(g, kx, 692, 'Enter', '밴') }
      chip(g, kx, 692, 'Esc', state === 'queue' || state === 'err' || state === 'cancel' ? '나가기' : '포기')
    },
    keydown(e) {
      const l = vs.l, state = err ? 'err' : l?.state ?? 'queue'
      if (e.key === 'Escape') { leave('title'); return }
      if (state === 'err' || state === 'cancel') { if (e.key === 'Enter') { if (account.token) void join(); else leave('account') } return }
      if (state !== 'ban' || l!.turn !== 'you') return
      const fr = free(), at = Math.max(0, fr.indexOf(focus))
      if (e.key === 'ArrowDown') focus = fr[(at + 1) % fr.length]
      else if (e.key === 'ArrowUp') focus = fr[(at + fr.length - 1) % fr.length]
      else if (e.key === 'Enter' && focus !== sent && fr.includes(focus)) { sent = focus; send({ t: 'l_ban', idx: focus }) }
    }
  }
}
