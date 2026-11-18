import type { Scene, SceneManager } from '../core/SceneManager'
import { DEFAULT_RELAY, PORT, closeVersus, openRelay, vs } from '../core/Versus'
import { account, saveSettings, settings } from '../data/Storage'
import { FONT, AMBER, CYAN, ICE, accentFill, card, chip, drawBg, ease, fit, header, hit, menuRow, optRow, pill, press } from '../render/theme'

// 대결 로비: 닉네임을 정하고, 방을 열거나(방장) 방 코드로 들어간다(손님). 연결되면 방장이 곡을 고른다
// 중계 서버(웹소켓)를 거쳐 방 코드로 만난다. 서버 주소는 화면에 보이지 않는다 (바꾸려면 설정 파일의 relay, '-'면 IP 직접 접속)
type Step = 'menu' | 'hosting' | 'joining' | 'connected'
const ROWS = ['닉네임', '방 만들기', '참가하기']
const RY = (i: number) => 112 + i * 70 // 줄 위치 (입력 칸을 얹는 자리와 같다)
const withPort = (a: string) => (a.includes(':') ? a : `${a}:${PORT}`)

export const Lobby = (sm: SceneManager): Scene => {
  let step: Step = 'menu', focus = 1, err = '', ips: string[] = []
  const back = () => { closeVersus(); step = 'menu'; err = '' }

  // 한글(IME)은 캔버스로 받을 수 없어서, 글자를 적는 줄(닉네임·참가·서버 주소)에는 진짜 입력 칸을 그 줄 위에 얹는다
  const FIELDS: Record<number, { get(): string; set(v: string): void; max: number; hint: string }> = {
    0: { get: () => settings.nick, set: v => { settings.nick = v }, max: 12, hint: '' },
    2: { get: () => settings.lastIp, set: v => { settings.lastIp = v }, max: 60, hint: '방 코드' }
  }
  let el: HTMLInputElement | undefined, shown = -1
  const input = () => {
    if (el) return el
    el = document.createElement('input')
    Object.assign(el.style, { position: 'fixed', background: 'transparent', border: '0', outline: '0', color: '#fff', textAlign: 'right', fontFamily: FONT, fontWeight: '700', display: 'none', zIndex: '5', padding: '0', margin: '0' })
    el.autocomplete = 'off'; el.spellcheck = false
    el.addEventListener('input', () => { FIELDS[shown]?.set(el!.value); saveSettings() })
    document.body.append(el)
    return el
  }
  const hideInput = () => { if (el) el.style.display = 'none'; shown = -1 }
  function place() { // 입력 칸을 고른 줄의 오른쪽 값 자리에 맞춘다 (화면 크기에 따라 캔버스가 늘어나므로 비율을 곱한다)
    if (step !== 'menu' || !FIELDS[focus] || (focus === 0 && account.token)) { hideInput(); return } // 로그인했으면 닉네임은 계정 것이라 고치지 못한다
    const e = input(), r = document.getElementById('c')!.getBoundingClientRect(), k = r.width / 1280, y = RY(focus), f = FIELDS[focus]
    e.style.display = 'block'; e.style.left = `${r.left + 600 * k}px`; e.style.top = `${r.top + (y + 11) * k}px`; e.style.width = `${220 * k}px`; e.style.height = `${36 * k}px`
    e.style.lineHeight = e.style.height; e.style.fontSize = `${18 * k}px`
    if (shown !== focus) { shown = focus; e.maxLength = f.max; e.placeholder = f.hint; e.value = f.get(); e.focus() }
  }

  // 서버 주소: 비어 있으면 기본 서버, '-'면 중계 없이 IP 직접 접속
  const relay = () => { const r = settings.relay.trim(); return r === '-' ? '' : r || DEFAULT_RELAY }
  async function host() {
    const net = window.api.net
    if (!settings.nick.trim()) settings.nick = 'PLAYER'
    closeVersus(); vs.role = 'host'; err = ''
    try {
      if (relay()) { step = 'hosting'; await openRelay(relay(), { t: 'host' }) } // 중계 서버에 방 만들기: 곧 방 코드가 온다
      else { await net.host(PORT); ips = await net.ips(); step = 'hosting' } // 직접 접속: 내 주소를 알려 준다
    } catch (e) { err = (e as Error).message; closeVersus(); step = 'menu' }
  }
  async function join() {
    const net = window.api.net, raw = settings.lastIp.trim()
    if (!raw) { err = '방 코드(또는 IP)를 입력하세요'; return }
    if (!settings.nick.trim()) settings.nick = 'PLAYER'
    closeVersus(); vs.role = 'guest'; err = ''; step = 'joining'
    try {
      if (relay() && !/[.:]/.test(raw)) await openRelay(relay(), { t: 'join', code: raw.toUpperCase() }) // 방 코드: 중계 서버로
      else await net.join(withPort(raw)) // IP·도메인: 방장에게 직접
    } catch (e) { err = (e as Error).message; closeVersus(); step = 'menu' }
  }

  return {
    enter() {
      err = ''
      if (account.token) settings.nick = account.nick // 로그인했으면 대결에서도 계정 닉네임으로
      if (vs.open) step = 'connected'
      else { step = 'menu'; if (vs.closed) { err = '상대와 연결이 끊어졌습니다'; vs.closed = false } }
    },
    update() {
      place()
      if ((step === 'hosting' || step === 'joining') && vs.relayErr) { err = vs.relayErr; closeVersus(); step = 'menu'; return }
      if ((step === 'hosting' || step === 'joining') && vs.closed) { err = '서버와 연결이 끊어졌습니다'; closeVersus(); step = 'menu'; return }
      if ((step === 'hosting' || step === 'joining') && vs.open) step = 'connected'
      if (step === 'connected' && vs.closed) { step = 'menu'; err = '상대와 연결이 끊어졌습니다'; vs.closed = false; vs.open = false }
    },
    render(g) {
      drawBg(g, undefined, 2)
      header(g, 'VERSUS', '친구 대결')
      g.textAlign = 'center'
      const cx = 640
      // 디맥 오픈 매치 방 구성: 왼쪽 BUTTON TUNES 카드 · 가운데 방 설정 · 오른쪽 PLAYERS 목록
      const tg = g.createLinearGradient(60, 0, 420, 0); tg.addColorStop(0, '#0f8a6a'); tg.addColorStop(1, '#2fc78a')
      g.fillStyle = tg; g.fillRect(60, 96, 360, 64); g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = `900 54px ${FONT}`; g.fillText(String(settings.keyMode), 76, 148); g.font = `900 20px ${FONT}`; g.fillText('BUTTON', 130, 126); g.font = `300 16px ${FONT}`; g.fillText('TUNES', 130, 148)
      g.fillStyle = 'rgba(8,10,20,.82)'; g.fillRect(60, 160, 360, 330)
      g.font = `300 30px ${FONT}`; g.fillStyle = '#fff'; g.fillText('FRIENDLY MATCH', 80, 214)
      g.font = `15px ${FONT}`; g.fillStyle = ICE; g.fillText('같은 곡이 있는 친구와', 80, 252); g.fillText('동시에 쳐서 점수로 겨룹니다', 80, 276)
      g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(80, 300, 320, 1)
      g.font = `700 13px ${FONT}`; g.fillStyle = AMBER; g.fillText(step === 'menu' ? '방을 만들거나 친구의 방에 들어가세요' : step === 'connected' ? (vs.role === 'host' ? '곡을 골라 시작하세요' : '방장이 곡을 고르는 중…') : '연결하는 중…', 80, 328)
      // 오른쪽 PLAYERS
      g.fillStyle = 'rgba(8,10,20,.6)'; g.fillRect(860, 96, 360, 394)
      g.font = `300 40px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText('PLAYERS', 880, 140)
      const slot = (i: number, nick: string | undefined, tag: string, col: string) => {
        const y = 160 + i * 52
        g.fillStyle = nick ? 'rgba(20,22,36,.9)' : 'rgba(255,255,255,.06)'; g.fillRect(880, y, 320, 44)
        if (!nick) return
        g.fillStyle = col; g.fillRect(1060, y, 140, 44); g.fillStyle = '#12131a'; g.textAlign = 'right'; g.font = `900 18px ${FONT}`; g.fillText(tag, 1190, y + 29)
        g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = `800 17px ${FONT}`; g.fillText(fit(g, nick, 160), 892, y + 29)
      }
      const host = step === 'menu' || vs.role === 'host'
      slot(0, step === 'menu' ? settings.nick : host ? settings.nick : vs.peerNick || '…', 'HOST', '#ffb13b')
      slot(1, step === 'connected' ? (host ? vs.peerNick || '…' : settings.nick) : undefined, 'READY', '#ff8a3c')
      for (let i = step === 'connected' ? 2 : 1; i < 6; i++) slot(i, undefined, '', '#000')
      // 가운데
      if (step === 'menu') {
        g.fillStyle = 'rgba(8,10,20,.6)'; g.fillRect(440, 96, 400, 394)
        ROWS.forEach((r, i) => {
          const on = i === focus, y = 112 + i * 70, k = ease('lobby' + i, on)
          hit(450, y, 380, 58, () => { if (focus === i && i > 0) press('Enter'); focus = i; if (i === 1) press('Enter') }, () => { focus = i }) // 올리면 고르고, 방 만들기/참가하기는 누르면 실행
          optRow(g, 450, y, 380, 58, k, 150)
          g.textAlign = 'left'; g.font = `${on ? 800 : 600} 17px ${FONT}`; g.fillStyle = '#fff'; g.fillText(r, 466, y + 36)
          g.textAlign = 'right'; g.font = `700 16px ${FONT}`
          g.fillText(fit(g, i === 1 ? (relay() ? '방 코드를 만듭니다' : '내 IP로 직접 엽니다') : FIELDS[i].get() || FIELDS[i].hint, 210), 820, y + 36)
        })
        g.textAlign = 'center'; g.font = `14px ${FONT}`; g.fillStyle = AMBER
        const tip = focus === 0 ? (account.token ? '로그인한 계정의 닉네임입니다' : '닉네임 (한글·영문·숫자, 최대 12자)')
          : focus === 2 ? (relay() ? '친구가 알려 준 방 코드를 입력하고 Enter' : '상대가 알려 준 IP를 입력하고 Enter')
          : 'Enter로 방을 엽니다'
        g.fillText(err || tip, 640, 440)
      } else if (step === 'hosting' || step === 'joining') {
        g.fillStyle = 'rgba(8,10,20,.6)'; g.fillRect(440, 96, 400, 394); g.textAlign = 'center'
        g.font = `800 22px ${FONT}`; g.fillStyle = '#fff'
        g.fillText(step === 'hosting' ? '상대를 기다리는 중…' : '접속하는 중…', cx, 150)
        if (step === 'hosting' && relay()) {
          g.font = `14px ${FONT}`; g.fillStyle = ICE; g.fillText(vs.code ? '친구에게 이 방 코드를 알려 주세요' : '서버에 연결하는 중…', cx, 190)
          if (vs.code) { g.font = `900 56px ${FONT}`; g.fillStyle = CYAN; g.fillText(vs.code.split('').join(' '), cx, 290) }
        } else if (step === 'hosting') {
          g.font = `14px ${FONT}`; g.fillStyle = ICE; g.fillText('상대에게 아래 주소 중 하나를 알려 주세요', cx, 190)
          ips.slice(0, 4).forEach((ip, i) => { g.font = `800 24px ${FONT}`; g.fillStyle = CYAN; g.fillText(`${ip}:${PORT}`, cx, 240 + i * 40) })
          g.font = `12px ${FONT}`; g.fillStyle = ICE; g.fillText('인터넷으로 만나려면 Tailscale 같은 가상망 주소를 쓰거나 포트를 열어야 합니다', cx, 440)
        }
      } else {
        g.fillStyle = 'rgba(8,10,20,.6)'; g.fillRect(440, 96, 400, 394); g.textAlign = 'center'
        g.font = `900 46px ${FONT}`; g.fillStyle = AMBER; g.fillText('VS', cx, 230)
        g.font = `800 20px ${FONT}`; g.fillStyle = '#fff'
        g.fillText(vs.role === 'host' ? 'Enter 를 눌러 곡을 고르세요' : '방장이 곡을 고르는 중…', cx, 330)
        g.font = `13px ${FONT}`; g.fillStyle = ICE; g.fillText(vs.role === 'host' ? '상대에게 없는 곡이면 상대가 받는 동안 기다립니다' : '방장이 고르면 바로 시작합니다', cx, 362)
        if (err) { g.fillStyle = AMBER; g.fillText(err, cx, 420) }
      }
      g.textAlign = 'center'
      let kx = 48
      if (step === 'menu') kx = chip(g, kx, 692, 'Enter', '확인')
      else if (step === 'connected' && vs.role === 'host') kx = chip(g, kx, 692, 'Enter', '곡 고르기')
      chip(g, kx, 692, 'Esc', step === 'menu' ? '뒤로' : '나가기')
    },
    keydown(e) {
      if (e.isComposing) return // 한글 조합 중의 Enter·방향키는 입력 칸이 쓴다
      if (e.key === 'Escape') { if (step === 'menu') { hideInput(); closeVersus(); sm.go('title') } else back(); return }
      if (step === 'connected') { if (e.key === 'Enter' && vs.role === 'host') sm.go('select', { mode: 'versus' }); return }
      if (step !== 'menu') return
      if (e.key === 'ArrowDown') focus = (focus + 1) % ROWS.length
      else if (e.key === 'ArrowUp') focus = (focus + ROWS.length - 1) % ROWS.length
      else if (e.key === 'Enter') { if (focus === 1) void host(); else if (focus === 2) void join() }
    }
  }
}
