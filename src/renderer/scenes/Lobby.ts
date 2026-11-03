import type { Scene, SceneManager } from '../core/SceneManager'
import { DEFAULT_RELAY, PORT, closeVersus, openRelay, vs } from '../core/Versus'
import { saveSettings, settings } from '../data/Storage'
import { FONT, AMBER, CYAN, ICE, accentFill, card, chip, drawBg, ease, hit, menuRow, pill, press } from '../render/theme'

// 대결 로비: 닉네임을 정하고, 방을 열거나(방장) 방 코드로 들어간다(손님). 연결되면 방장이 곡을 고른다
// 중계 서버(웹소켓)를 거쳐 방 코드로 만난다. 서버 주소는 화면에 보이지 않는다 (바꾸려면 설정 파일의 relay, '-'면 IP 직접 접속)
type Step = 'menu' | 'hosting' | 'joining' | 'connected'
const ROWS = ['닉네임', '방 만들기', '참가하기']
const RY = (i: number) => 176 + i * 68 // 줄 위치 (입력 칸을 얹는 자리와 같다)
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
    if (step !== 'menu' || !FIELDS[focus]) { hideInput(); return }
    const e = input(), r = document.getElementById('c')!.getBoundingClientRect(), k = r.width / 1280, y = RY(focus), f = FIELDS[focus]
    e.style.display = 'block'; e.style.left = `${r.left + 520 * k}px`; e.style.top = `${r.top + (y + 11) * k}px`; e.style.width = `${370 * k}px`; e.style.height = `${36 * k}px`
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
      drawBg(g)
      pill(g, 40, 22, 180, 44, accentFill(g, 40, 180))
      g.font = `800 22px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('VERSUS', 130, 52)
      const cx = 640
      if (step === 'menu') {
        card(g, 340, 100, 600, 400, 'FRIENDLY MATCH'); g.textAlign = 'center'
        g.font = `15px ${FONT}`; g.fillStyle = ICE; g.fillText('같은 곡이 있는 친구와 동시에 쳐서 점수로 겨룹니다', cx, 148)
        ROWS.forEach((r, i) => {
          const on = i === focus, y = RY(i)
          hit(370, y, 540, 58, () => { if (focus === i && i > 0) press('Enter'); focus = i; if (i === 1) press('Enter') }, () => { focus = i }) // 올리면 고르고, 방 만들기/참가하기는 누르면 실행
          menuRow(g, 370, y, 540, 58, ease('lobby' + i, on))
          g.textAlign = 'left'; g.font = `${on ? 800 : 600} 20px ${FONT}`; g.fillStyle = '#fff'; g.fillText(r, 400, y + 37)
          g.textAlign = 'right'; g.font = `700 18px ${FONT}`
          if (!on || i === 1) g.fillText(i === 1 ? (relay() ? '방 코드를 만듭니다' : '내 IP로 직접 엽니다') : FIELDS[i].get() || FIELDS[i].hint, 890, y + 36)
        })
        g.textAlign = 'center'; g.font = `14px ${FONT}`; g.fillStyle = AMBER
        const tip = focus === 0 ? '닉네임 (한글·영문·숫자, 최대 12자)'
          : focus === 2 ? (relay() ? '친구가 알려 준 방 코드를 입력하고 Enter' : '상대가 알려 준 IP를 입력하고 Enter')
          : 'Enter로 방을 엽니다'
        g.fillText(err || tip, cx, 470)
      } else if (step === 'hosting' || step === 'joining') {
        card(g, 340, 150, 600, 340, step === 'hosting' ? 'WAITING FOR RIVAL' : 'CONNECTING'); g.textAlign = 'center'
        g.font = `800 24px ${FONT}`; g.fillStyle = '#fff'
        g.fillText(step === 'hosting' ? '상대를 기다리는 중…' : '접속하는 중…', cx, 230)
        if (step === 'hosting' && relay()) {
          g.font = `14px ${FONT}`; g.fillStyle = ICE; g.fillText(vs.code ? '친구에게 이 방 코드를 알려 주세요' : '서버에 연결하는 중…', cx, 268)
          if (vs.code) { g.font = `900 64px ${FONT}`; g.fillStyle = CYAN; g.fillText(vs.code.split('').join(' '), cx, 360) }
        } else if (step === 'hosting') {
          g.font = `14px ${FONT}`; g.fillStyle = ICE; g.fillText('상대에게 아래 주소 중 하나를 알려 주세요', cx, 268)
          ips.slice(0, 4).forEach((ip, i) => { g.font = `800 26px ${FONT}`; g.fillStyle = CYAN; g.fillText(`${ip}:${PORT}`, cx, 316 + i * 40) })
          g.font = `13px ${FONT}`; g.fillStyle = ICE; g.fillText('인터넷으로 만나려면 Tailscale 같은 가상망 주소를 쓰거나 포트를 열어야 합니다', cx, 466)
        }
      } else {
        card(g, 300, 150, 300, 260, 'YOU'); card(g, 680, 150, 300, 260, 'RIVAL'); g.textAlign = 'center'
        g.font = `800 34px ${FONT}`; g.fillStyle = '#fff'; g.fillText(settings.nick, 450, 270); g.fillText(vs.peerNick || '…', 830, 270)
        g.font = `14px ${FONT}`; g.fillStyle = ICE; g.fillText(vs.role === 'host' ? '방장' : '손님', 450, 300); g.fillText(vs.role === 'host' ? '손님' : '방장', 830, 300)
        g.font = `900 40px ${FONT}`; g.fillStyle = AMBER; g.fillText('VS', cx, 290)
        g.font = `800 20px ${FONT}`; g.fillStyle = '#fff'
        g.fillText(vs.role === 'host' ? 'Enter 를 눌러 곡을 고르세요' : '방장이 곡을 고르는 중…', cx, 480)
        g.font = `14px ${FONT}`; g.fillStyle = ICE; g.fillText(vs.role === 'host' ? '상대에게 없는 곡은 고를 수 없습니다 (같은 곡 파일이 있어야 합니다)' : '방장이 고르면 바로 시작합니다', cx, 510)
        if (err) { g.fillStyle = AMBER; g.fillText(err, cx, 540) }
      }
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
