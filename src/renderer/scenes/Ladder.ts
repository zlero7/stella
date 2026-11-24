import type { Scene, SceneManager } from '../core/SceneManager'
import type { Song } from '../../shared/types'
import { closeVersus, newLadder, openRelay, relayAddr, send, vs } from '../core/Versus'
import { loadSongs } from '../data/Songs'
import { account } from '../data/Storage'
import { PLATE_COLOR, TIER_COLOR, prof, refreshProfile } from '../data/Profile'
import { FONT, AMBER, CYAN, ICE, accentFill, artOf, chip, drawBg, drawCover, ease, fit, glow, header, hit, overRect, pill, press, slant } from '../render/theme'
import { avatarCircle, gem } from '../render/profileCard'

// 래더 매치: 대기열 → 상대 확정 → 곡 5개 중 3개가 남을 때까지 번갈아 밴 → 남은 3곡을 차례로 쳐서 3판 2선승 (결과는 서버가 판정해 LP가 바뀐다). 디맥 래더처럼 양옆에 두 사람, 가운데에 곡 카드
const KEYS = 4, KEEP = 3 // KEEP: 밴이 끝났을 때 남는 곡 수
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export const Ladder = (sm: SceneManager): Scene => {
  let since = 0, err = '', focus = 0, sent = -1, byDir = new Map<string, Song>(), started = false
  const leave = (name: string, data?: unknown) => { closeVersus(); sm.go(name, data) }
  async function join() {
    closeVersus(); err = ''; since = performance.now(); focus = 0; sent = -1; started = false
    try { vs.role = 'host'; await openRelay(relayAddr(), { t: 'ladder', token: account.token }) } catch (e) { err = (e as Error).message }
  }
  const free = () => (vs.l?.songs ?? []).map((_, i) => i).filter(i => !vs.l!.banned.includes(i))

  // 위쪽 이름표: 보석(티어) · 이름 · 레벨 · LP
  function plate(g: CanvasRenderingContext2D, x: number, y: number, head: string, p: { nick: string; level: number; tier: string; tierLabel: string; lp: number; avatar?: string } | undefined, on: boolean) {
    const w = 300, col = TIER_COLOR[p?.tier ?? 'UNRANKED'] ?? '#fff'
    g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x, y, w, 64); g.fillStyle = on ? AMBER : CYAN; g.fillRect(x, y, 4, 64)
    const [c1, c2] = PLATE_COLOR.default; avatarCircle(g, x + 36, y + 32, 22, p?.nick, p?.avatar, c1, c2)
    g.textAlign = 'left'; g.font = `800 11px ${FONT}`; g.fillStyle = on ? AMBER : CYAN; g.fillText(head, x + 68, y + 20)
    g.font = `800 18px ${FONT}`; g.fillStyle = '#fff'; g.fillText(fit(g, p?.nick ?? '…', 150), x + 68, y + 44)
    g.textAlign = 'right'; g.font = `900 14px ${FONT}`; g.fillStyle = col; g.fillText(p?.tierLabel ?? 'UNRANKED', x + w - 14, y + 28)
    g.font = `700 12px ${FONT}`; g.fillStyle = '#fff'; g.fillText(`Lv ${p?.level ?? 1}  ·  ${p?.lp ?? 0} LP`, x + w - 14, y + 48); g.textAlign = 'left'
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
      drawBg(g, undefined, 1)
      const l = vs.l, me = prof.v, now = performance.now(), t = now / 1000
      header(g, 'LADDER MATCH', '랭크 대전')
      g.textAlign = 'center'; g.fillStyle = '#fff'
      const state = err ? 'err' : l?.state ?? 'queue'

      if (state === 'err' || state === 'cancel') {
        g.font = `800 28px ${FONT}`; g.fillStyle = '#fff'; g.fillText(err || l?.msg || '', 640, 330)
        g.font = `15px ${FONT}`; g.fillStyle = ICE; g.fillText(account.token ? 'Enter 다시 찾기   ·   Esc 나가기' : 'Enter 로그인하러 가기   ·   Esc 나가기', 640, 376)
        const on = ease('ladBtn', overRect(480, 408, 320, 56))
        slant(g, 480, 408, 320, 56, 14); g.fillStyle = on > 0.5 ? '#ffd84a' : AMBER; g.fill() // 눌러야 한다는 것이 보이게 (컬렉션의 로그인 버튼과 같은 모양)
        g.font = `800 20px ${FONT}`; g.fillStyle = '#1a1200'; g.fillText(account.token ? '다시 찾기' : '로그인하러 가기', 640, 443)
        hit(480, 408, 320, 56, () => press('Enter'))
      } else if (state === 'queue') {
        // 디맥 래더 로비: 얇은 금색 LOBBY 제목, 버튼 모드 카드 4장(고른 것은 주황 테두리), 오른쪽 DETAILS, 아래 큰 매칭 띠
        const s = Math.floor((now - since) / 1000), ORG = '#ffa31a'
        g.textAlign = 'left'; g.font = `300 52px ${FONT}`; g.fillStyle = '#ffc455'; g.fillText('LOBBY', 60, 134)
        g.font = `800 15px ${FONT}`; g.fillStyle = '#fff'; g.fillText('SEASON', 60, 196); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(60, 204, 150, 1)
        g.fillStyle = 'rgba(120,100,70,.7)'; g.fillRect(60, 214, 150, 26); g.fillStyle = '#ffe9b0'; g.font = `800 13px ${FONT}`; g.textAlign = 'center'; g.fillText('RANKED', 135, 232)
        ;([4, 5, 6, 8] as const).forEach((n, i) => {
          const x = 250 + i * 164, y = 170, w = 160, h = 280, on = n === KEYS, cx = x + w / 2
          g.fillStyle = on ? 'rgba(18,18,24,.88)' : 'rgba(12,12,16,.6)'; g.fillRect(x, y, w, h)
          if (on) { g.strokeStyle = ORG; g.lineWidth = 3; g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3) }
          g.textAlign = 'center'; g.font = `900 54px ${FONT}`; g.fillStyle = on ? '#fff' : 'rgba(255,255,255,.4)'; g.fillText(String(n), cx, y + 62)
          g.font = `800 15px ${FONT}`; g.fillText('BUTTON', cx, y + 84)
          if (on) {
            gem(g, cx, y + 160, 54, me?.tierLabel ?? 'UNRANKED')
            g.font = `900 18px ${FONT}`; g.fillStyle = TIER_COLOR[me?.tier ?? 'UNRANKED'] ?? '#fff'; g.fillText(me?.tierLabel ?? 'UNRANKED', cx, y + 244)
            g.font = `700 13px ${FONT}`; g.fillStyle = '#fff'; g.fillText(`${me?.lp ?? 0} LP`, cx, y + 264)
          } else { g.font = `700 14px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.45)'; g.fillText('준비 중', cx, y + 172) }
        })
        g.textAlign = 'left'; g.font = `800 15px ${FONT}`; g.fillStyle = '#fff'; g.fillText('DETAILS', 930, 196); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(930, 204, 290, 1)
        g.fillStyle = 'rgba(120,100,70,.7)'; g.fillRect(930, 214, 290, 26); g.fillStyle = '#ffe9b0'; g.font = `800 13px ${FONT}`; g.textAlign = 'center'; g.fillText(`${KEYS} BUTTON`, 1075, 232)
        ;([['GAMES', me ? me.wins + me.losses + me.draws : 0], ['WINS', me?.wins ?? 0], ['LEVEL', me?.level ?? 1], ['LP', me?.lp ?? 0]] as const).forEach(([k, v], i) => {
          g.textAlign = 'left'; g.font = `800 11px ${FONT}`; g.fillStyle = '#ffc455'; g.fillText(k, 934, 270 + i * 44); g.font = `300 26px ${FONT}`; g.fillStyle = '#fff'; g.fillText(String(v), 934, 294 + i * 44)
        })
        g.fillStyle = 'rgba(14,26,70,.92)'; g.fillRect(60, 470, 1160, 96)
        g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(60, 470, 1160, 2)
        g.textAlign = 'center'; g.font = `900 34px ${FONT}`; g.fillStyle = '#fff'; g.fillText('MATCHING' + '.'.repeat(1 + Math.floor(t * 2) % 3), 640, 520)
        g.font = `800 16px ${FONT}`; g.fillStyle = AMBER; g.fillText(mmss(s), 640, 548)
        g.font = `13px ${FONT}`; g.fillStyle = ICE; g.fillText(s < 20 ? '비슷한 LP의 상대를 먼저 찾고, 오래 기다리면 범위를 넓힙니다' : (me?.lp ?? 0) < 800 && s < 45 ? `범위를 넓혀 찾는 중입니다 · ${45 - s}초 뒤에도 상대가 없으면 스텔라 봇과 대결합니다` : (me?.lp ?? 0) < 800 ? '상대가 없어 스텔라 봇과 연결하는 중입니다' : '범위를 넓혀 찾는 중입니다', 640, 606)
      } else if (l) {
        // 디맥 밴픽: 가운데 어두운 띠에 곡 카드가 가로로 나열되고, 위에 얇은 큰 제목. 두 사람은 위쪽 이름표로
        plate(g, 40, 84, 'YOU', me, l.turn === 'you'); plate(g, 940, 84, 'RIVAL', l.opp, l.turn === 'opp')
        const head = l.state === 'ban' ? (l.turn === 'you' ? '이번 매칭에서 제외할 곡을 선택해주세요.' : '상대가 곡을 고르는 중…') : l.state === 'prep' ? `${l.round}번째 곡 · 3판 2선승` : '시작합니다'
        const hg = g.createLinearGradient(380, 0, 900, 0); hg.addColorStop(0, '#ff5a6e'); hg.addColorStop(1, '#ff8a2a')
        g.textAlign = 'center'; g.font = `300 78px ${FONT}`; g.fillStyle = hg; g.fillText(l.state === 'ban' ? 'SELECT SONG' : 'NEXT SONG', 640, 190)
        g.fillStyle = 'rgba(0,0,0,.78)'; g.fillRect(0, 214, 1280, 360)
        g.font = `800 18px ${FONT}`; g.fillStyle = l.state === 'ban' && l.turn === 'you' ? '#ff6a5a' : '#fff'; g.fillText(head, 640, 246)
        if (l.state === 'ban') {
          const left = Math.max(0, Math.ceil((l.deadline - now) / 1000))
          g.font = `900 30px ${FONT}`; g.fillStyle = left <= 5 ? '#ff8a8a' : AMBER; g.fillText(String(left), 1180, 250)
        }
        const fr = free(), n = l.songs.length, cw = 166, gap = 16, x0 = 640 - (n * cw + (n - 1) * gap) / 2
        l.songs.forEach((s, i) => {
          const banned = l.banned.includes(i), picked = l.state !== 'ban' && i === l.pick, turnNo = l.order.indexOf(i) + 1, x = x0 + i * (cw + gap), y = 268
          const sel = l.state === 'ban' && l.turn === 'you' && i === focus && !banned
          if (l.state !== 'ban' && !picked) g.globalAlpha = banned ? 0.35 : 0.7
          const sg = byDir.get(s.dir), im = sg && artOf(sg)?.img
          g.fillStyle = '#16161c'; g.fillRect(x, y + 34, cw, cw)
          if (im) drawCover(g, im, im.width, im.height, x, y + 34, cw, cw)
          g.fillStyle = 'rgba(8,60,70,.92)'; g.fillRect(x, y + 34 + cw - 26, cw, 26); g.textAlign = 'left'; g.font = `900 15px ${FONT}`; g.fillStyle = '#fff'; g.fillText(`${KEYS}B`, x + 8, y + 34 + cw - 8)
          g.textAlign = 'right'; g.font = `800 13px ${FONT}`; g.fillStyle = '#ffd45e'; g.fillText('HARD', x + cw - 8, y + 34 + cw - 8)
          g.textAlign = 'left'; g.font = `800 16px ${FONT}`; g.fillStyle = '#fff'; g.fillText(fit(g, s.title, cw), x, y + 22)
          g.font = `13px ${FONT}`; g.fillStyle = ICE; g.fillText(fit(g, s.artist, cw), x, y + 34 + cw + 22)
          if (picked || sel) { g.strokeStyle = picked ? AMBER : '#ff3b3b'; g.lineWidth = 4; g.strokeRect(x - 2, y + 32, cw + 4, cw + 4) }
          if (l.state !== 'ban' && turnNo > 0) { g.textAlign = 'right'; g.font = `900 13px ${FONT}`; g.fillStyle = picked ? AMBER : ICE; g.fillText(`${turnNo}번째 판`, x + cw, y + 34 + cw + 44) }
          if (banned) { g.globalAlpha = 1; g.fillStyle = 'rgba(8,8,16,.72)'; g.fillRect(x, y + 34, cw, cw); g.save(); g.translate(x + cw / 2, y + 34 + cw / 2); g.rotate(-0.08); g.font = `900 40px ${FONT}`; g.textAlign = 'center'; g.fillStyle = '#ff4a5a'; g.fillText('BAN', 0, 14); g.restore() }
          g.globalAlpha = 1
          if (l.state === 'ban' && l.turn === 'you' && !banned) hit(x, y + 34, cw, cw, () => { focus = i; press('Enter') }, () => { focus = i })
        })
        if (l.state === 'ban' && l.turn === 'you') { // OK 버튼 (Enter와 같다)
          const ok = focus !== sent && fr.includes(focus)
          hit(540, 500, 200, 48, () => press('Enter'))
          g.fillStyle = ok ? '#ffb400' : 'rgba(255,180,0,.35)'; g.fillRect(540, 500, 200, 48); g.textAlign = 'center'; g.font = `900 20px ${FONT}`; g.fillStyle = '#12131a'; g.fillText('OK', 640, 532)
        }
        g.textAlign = 'center'; g.font = `600 14px ${FONT}`; g.fillStyle = ICE
        g.fillText(l.state === 'prep' ? (l.starting ? '곡을 받는 중… 상대가 준비되면 시작합니다' : '') : l.state === 'ban' && fr.length > KEEP ? `남은 곡 ${fr.length}개 → ${KEEP}곡이 남을 때까지 번갈아 밴하고, 남은 곡을 차례로 쳐서 먼저 2승하면 이깁니다` : '', 640, 620)
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
