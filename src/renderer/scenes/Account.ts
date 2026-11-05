import type { Scene, SceneManager } from '../core/SceneManager'
import { ID_RE, NICK_RE, login, logout, register } from '../data/Account'
import { account } from '../data/Storage'
import { FONT, AMBER, ICE, accentFill, card, chip, drawBg, ease, hit, menuRow, pill, press } from '../render/theme'

// 계정: 로그인 · 회원가입 · (로그인 중이면) 내 계정. 온라인 랭킹은 로그인해야 올라간다
type Mode = 'login' | 'register' | 'profile'
type Kind = 'id' | 'pw' | 'pw2' | 'nick' | 'go' | 'switch' | 'logout' | 'back'
const ID: [string, Kind] = ['아이디', 'id'], PW: [string, Kind] = ['비밀번호', 'pw']
const ROWS: Record<Mode, [string, Kind][]> = {
  login: [ID, PW, ['로그인', 'go'], ['계정이 없나요?  회원가입', 'switch']],
  register: [ID, PW, ['비밀번호 확인', 'pw2'], ['닉네임', 'nick'], ['가입하기', 'go'], ['이미 계정이 있나요?  로그인', 'switch']],
  profile: [['로그아웃', 'logout'], ['뒤로', 'back']]
}
const TIPS: Partial<Record<Kind, string>> = { id: '영문 소문자·숫자·_ 4~16자', pw: '8~64자 (아이디와 같으면 안 됩니다)', pw2: '비밀번호를 한 번 더', nick: '한글·영문·숫자 2~12자 · 랭킹에 이 이름으로 올라갑니다' }
const MAX: Partial<Record<Kind, number>> = { id: 16, pw: 64, pw2: 64, nick: 12 }
const isField = (k: Kind) => k === 'id' || k === 'pw' || k === 'pw2' || k === 'nick'
const blank = () => ({ id: '', pw: '', pw2: '', nick: '' })

export const Account = (sm: SceneManager): Scene => {
  let mode: Mode = 'login', focus = 0, msg = '', bad = false, busy = false, vals = blank(), shown = ''
  const rows = () => ROWS[mode]
  const ry = (i: number) => (mode === 'profile' ? 250 : 176) + i * 68 // 줄 위치 (입력 칸을 얹는 자리와 같다)

  // 글자를 적는 줄에는 진짜 입력 칸을 그 줄 위에 얹는다 (한글 IME 때문에 Lobby와 같은 방식). 비밀번호 줄은 type=password라 점으로 보인다
  let el: HTMLInputElement | undefined
  const input = () => {
    if (el) return el
    el = document.createElement('input')
    Object.assign(el.style, { position: 'fixed', background: 'transparent', border: '0', outline: '0', color: '#fff', textAlign: 'right', fontFamily: FONT, fontWeight: '700', display: 'none', zIndex: '5', padding: '0', margin: '0' })
    el.autocomplete = 'off'; el.spellcheck = false
    el.addEventListener('input', () => { const k = rows()[focus]?.[1]; if (k && isField(k)) vals[k as keyof typeof vals] = el!.value })
    document.body.append(el)
    return el
  }
  const hideInput = () => { if (el) el.style.display = 'none'; shown = '' }
  function place() {
    const k = rows()[focus]?.[1]
    if (busy || !k || !isField(k)) { hideInput(); return }
    const e = input(), r = document.getElementById('c')!.getBoundingClientRect(), s = r.width / 1280
    e.style.display = 'block'; e.style.left = `${r.left + 560 * s}px`; e.style.top = `${r.top + (ry(focus) + 11) * s}px`; e.style.width = `${330 * s}px`; e.style.height = `${36 * s}px`
    e.style.lineHeight = e.style.height; e.style.fontSize = `${18 * s}px`
    if (shown !== mode + k) { shown = mode + k; e.type = k === 'pw' || k === 'pw2' ? 'password' : 'text'; e.maxLength = MAX[k]!; e.placeholder = ''; e.value = vals[k as keyof typeof vals]; e.focus() }
  }
  const say = (m: string, isBad = false) => { msg = m; bad = isBad }
  const go = (m: Mode) => { mode = m; focus = 0; vals.pw = vals.pw2 = ''; say(''); shown = '' }
  const leave = () => { hideInput(); vals = blank(); sm.go('title') }

  async function submit() {
    if (busy) return
    const id = vals.id.trim().toLowerCase(), { pw, pw2 } = vals, nick = vals.nick.trim()
    if (!ID_RE.test(id)) return say('아이디는 영문 소문자·숫자·_ 4~16자입니다', true)
    if (mode === 'register') {
      if (pw.length < 8 || pw.length > 64) return say('비밀번호는 8~64자입니다', true)
      if (pw.toLowerCase() === id) return say('아이디와 같은 비밀번호는 쓸 수 없습니다', true)
      if (pw !== pw2) return say('비밀번호가 서로 다릅니다', true)
      if (!NICK_RE.test(nick)) return say('닉네임은 한글·영문·숫자 2~12자입니다', true)
    } else if (!pw) return say('비밀번호를 입력하세요', true)
    busy = true; say(mode === 'login' ? '로그인하는 중…' : '가입하는 중…')
    try { await (mode === 'login' ? login(id, pw) : register(id, pw, nick)); leave() }
    catch (e) { say((e as Error).message, true); vals.pw = vals.pw2 = ''; shown = '' } // 틀린 비밀번호는 지우고 다시 받는다
    finally { busy = false }
  }

  return {
    enter(data) {
      mode = account.token ? 'profile' : (data as { mode?: Mode } | undefined)?.mode === 'register' ? 'register' : 'login'
      focus = 0; busy = false; vals = blank(); shown = ''; say('')
    },
    update() { place() },
    render(g) {
      drawBg(g)
      pill(g, 40, 22, 180, 44, accentFill(g, 40, 180))
      g.font = `800 22px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('ACCOUNT', 130, 52)
      const ch = mode === 'login' ? 396 : mode === 'register' ? 520 : 330, cx = 640
      card(g, 340, 100, 600, ch, mode === 'login' ? 'LOGIN' : mode === 'register' ? 'SIGN UP' : 'MY ACCOUNT'); g.textAlign = 'center'
      if (mode === 'profile') {
        g.font = `800 36px ${FONT}`; g.fillStyle = '#fff'; g.fillText(account.nick, cx, 186)
        g.font = `15px ${FONT}`; g.fillStyle = ICE; g.fillText(`ID  ${account.id}  ·  온라인 랭킹에 이 닉네임으로 올라갑니다`, cx, 220)
      } else { g.font = `15px ${FONT}`; g.fillStyle = ICE; g.fillText(mode === 'login' ? '로그인하면 온라인 랭킹에 기록이 올라갑니다' : '아이디와 비밀번호로 내 계정을 만듭니다', cx, 148) }
      rows().forEach(([label, kind], i) => {
        const on = i === focus, y = ry(i)
        hit(370, y, 540, 58, () => { focus = i; if (!isField(kind)) press('Enter') }, () => { focus = i })
        menuRow(g, 370, y, 540, 58, ease('acct' + i, on))
        g.textAlign = 'left'; g.font = `${on ? 800 : 600} 20px ${FONT}`; g.fillStyle = kind === 'go' ? AMBER : '#fff'; g.fillText(label, 400, y + 37)
        if (isField(kind) && !on) {
          const v = vals[kind as keyof typeof vals]
          g.textAlign = 'right'; g.font = `700 18px ${FONT}`; g.fillStyle = v ? '#fff' : 'rgba(255,255,255,.35)'
          g.fillText(v ? (kind === 'pw' || kind === 'pw2' ? '•'.repeat(v.length) : v) : '', 890, y + 36)
        }
      })
      g.textAlign = 'center'; g.font = `14px ${FONT}`
      const tip = TIPS[rows()[focus]?.[1]] ?? ''
      g.fillStyle = msg ? (bad ? '#ff9a9a' : AMBER) : ICE; g.fillText(msg || tip, cx, 100 + ch + 30)
      let kx = 48
      kx = chip(g, kx, 692, 'Enter', '확인'); if (mode !== 'profile') kx = chip(g, kx, 692, 'Tab', '다음 칸')
      chip(g, kx, 692, 'Esc', '뒤로')
    },
    keydown(e) {
      if (e.isComposing) return // 한글 조합 중의 Enter·방향키는 입력 칸이 쓴다
      if (e.key === 'Escape') { leave(); return }
      if (busy) return
      const n = rows().length
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) { e.preventDefault(); focus = (focus + 1) % n }
      else if (e.key === 'ArrowUp' || e.key === 'Tab') { e.preventDefault(); focus = (focus + n - 1) % n }
      else if (e.key === 'Enter') {
        const kind = rows()[focus][1]
        if (isField(kind)) { if (rows()[focus + 1]?.[1] === 'go') void submit(); else focus++ } // 마지막 칸에서 Enter면 바로 보낸다
        else if (kind === 'go') void submit()
        else if (kind === 'switch') go(mode === 'login' ? 'register' : 'login')
        else if (kind === 'logout') void logout().then(() => go('login'))
        else leave()
      }
      place() // 칸을 옮긴 직후 바로 입력 칸을 바꾼다 (다음 프레임까지 기다리면 빨리 친 글자가 옛 칸으로 들어간다)
    }
  }
}
