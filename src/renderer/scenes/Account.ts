import type { Scene, SceneManager } from '../core/SceneManager'
import { ID_RE, NICK_RE, login, logout, register } from '../data/Account'
import { account, settings } from '../data/Storage'
import { FONT, AMBER, ICE, accentFill, drawBg, ease, fitFont, glow, hit, press, slant, starPath } from '../render/theme'

// 계정: 로그인 · 회원가입 · (로그인 중이면) 내 계정. 타이틀과 같은 디맥식 구성 — 왼쪽에 큰 글자, 오른쪽에 비스듬한 띠 (고른 줄은 주황)
// 온라인 랭킹은 로그인해야 올라간다
type Mode = 'login' | 'register' | 'profile'
type Kind = 'id' | 'pw' | 'pw2' | 'nick' | 'go' | 'switch' | 'logout' | 'back'
type Row = { kind: Kind; name: string; sub: string } // 글자 칸은 name = 영문 라벨, sub = 한글 라벨 / 버튼은 name = 큰 글자, sub = 설명
const ID: Row = { kind: 'id', name: 'ID', sub: '아이디' }, PW: Row = { kind: 'pw', name: 'PASSWORD', sub: '비밀번호' }
const ROWS: Record<Mode, Row[]> = {
  login: [ID, PW, { kind: 'go', name: 'LOGIN', sub: '로그인' }, { kind: 'switch', name: 'CREATE ACCOUNT', sub: '계정이 없나요? 회원가입' }],
  register: [ID, PW, { kind: 'pw2', name: 'CONFIRM', sub: '비밀번호 확인' }, { kind: 'nick', name: 'NICKNAME', sub: '닉네임' }, { kind: 'go', name: 'SIGN UP', sub: '가입하기' }, { kind: 'switch', name: 'BACK TO LOGIN', sub: '이미 계정이 있나요? 로그인' }],
  profile: [{ kind: 'logout', name: 'LOGOUT', sub: '로그아웃' }, { kind: 'back', name: 'BACK', sub: '타이틀로' }]
}
const TIPS: Partial<Record<Kind, string>> = { id: '영문 소문자·숫자·_ 4~16자', pw: '8~64자 (아이디와 같으면 안 됩니다)', pw2: '비밀번호를 한 번 더', nick: '한글·영문·숫자 2~12자 · 랭킹에 이 이름으로 올라갑니다' }
const MAX: Partial<Record<Kind, number>> = { id: 16, pw: 64, pw2: 64, nick: 12 }
const isField = (k: Kind) => k === 'id' || k === 'pw' || k === 'pw2' || k === 'nick'
const blank = () => ({ id: '', pw: '', pw2: '', nick: '' })
const H = 64, PITCH = 76 // 띠 높이 · 줄 간격

export const Account = (sm: SceneManager): Scene => {
  let mode: Mode = 'login', focus = 0, msg = '', bad = false, busy = false, vals = blank(), shown = '', since = 0
  const rows = () => ROWS[mode]
  const y0 = () => (720 - (rows().length * PITCH - 12)) / 2 - 6 // 줄이 몇 개든 화면 세로 가운데에

  // 글자를 적는 줄에는 진짜 입력 칸을 그 띠 위에 얹는다 (한글 IME 때문에 Lobby와 같은 방식). 비밀번호 줄은 type=password라 점으로 보인다
  let el: HTMLInputElement | undefined
  const input = () => {
    if (el) return el
    el = document.createElement('input')
    Object.assign(el.style, { position: 'fixed', background: 'transparent', border: '0', outline: '0', color: '#fff', textAlign: 'left', fontFamily: FONT, fontWeight: '700', display: 'none', zIndex: '5', padding: '0', margin: '0' })
    el.autocomplete = 'off'; el.spellcheck = false
    el.addEventListener('input', () => { const k = rows()[focus]?.kind; if (k && isField(k)) vals[k as keyof typeof vals] = el!.value })
    document.body.append(el)
    return el
  }
  const hideInput = () => { if (el) el.style.display = 'none'; shown = '' }
  function place() {
    const k = rows()[focus]?.kind
    if (busy || !k || !isField(k)) { hideInput(); return }
    const e = input(), r = document.getElementById('c')!.getBoundingClientRect(), s = r.width / 1280
    e.style.display = 'block'; e.style.left = `${r.left + 776 * s}px`; e.style.top = `${r.top + (y0() + focus * PITCH + 30) * s}px`; e.style.width = `${370 * s}px`; e.style.height = `${28 * s}px`
    e.style.lineHeight = e.style.height; e.style.fontSize = `${22 * s}px`
    if (shown !== mode + k) { shown = mode + k; e.type = k === 'pw' || k === 'pw2' ? 'password' : 'text'; e.maxLength = MAX[k]!; e.placeholder = ''; e.value = vals[k as keyof typeof vals]; e.focus() }
  }
  const say = (m: string, isBad = false) => { msg = m; bad = isBad }
  const go = (m: Mode) => { mode = m; focus = 0; vals.pw = vals.pw2 = ''; say(''); shown = ''; since = performance.now() }
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
      focus = 0; busy = false; vals = blank(); shown = ''; say(''); since = performance.now()
    },
    update() { place() },
    render(g) {
      drawBg(g)
      const now = performance.now(), t = now / 1000, p = Math.min(1, (now - since) / 520), m = 1 - (1 - p) ** 3 // 들어올 때 부드럽게

      // 한가운데에서 퍼지는 빛줄기 (타이틀과 같은 느낌, 더 옅게)
      g.save(); g.translate(400, 340); g.rotate(t * 0.035)
      const ray = g.createRadialGradient(0, 0, 40, 0, 0, 800); ray.addColorStop(0, 'rgba(255,255,255,.16)'); ray.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = ray
      for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(0, 0); g.lineTo(800, -30); g.lineTo(800, 30); g.closePath(); g.fill() }
      g.restore()

      // 왼쪽: 큰 글자. 로그인·가입은 화면 이름, 내 계정은 닉네임
      const cx = 380, by = 372
      g.textAlign = 'center'; g.globalAlpha = m
      g.font = `700 15px ${FONT}`; g.fillStyle = '#eaf6ff'
      g.fillText(mode === 'profile' ? 'P L A Y E R' : 'P L A Y E R   A C C O U N T', cx, by - 108)
      const big = mode === 'login' ? 'LOGIN' : mode === 'register' ? 'SIGN UP' : account.nick
      const label = fitFont(g, big, 600, 900, mode === 'profile' ? 120 : 132, 40)
      const w = g.measureText(label).width, lx = cx - w / 2, gr = g.createLinearGradient(lx, 0, lx + w, 0)
      gr.addColorStop(0, '#fff'); gr.addColorStop(0.5, '#e8f7ff'); gr.addColorStop(1, '#bfe6ff')
      glow(g, 'rgba(10,50,140,.65)', 34, () => { g.fillStyle = gr; g.fillText(label, cx, by) })
      const k1 = 0.65 + 0.35 * Math.sin(t * 2.4)
      glow(g, AMBER, 18, () => { starPath(g, cx + w / 2 + 6, by - 96, 14 * k1); g.fillStyle = '#fff6d6'; g.fill() })
      slant(g, cx - 210, by + 26, 420, 5, 2); g.fillStyle = accentFill(g, cx - 210, 420); g.fill()
      g.font = `15px ${FONT}`; g.fillStyle = '#eaf6ff'
      g.fillText(mode === 'profile' ? `ID  ${account.id}  ·  ${settings.keyMode}K` : mode === 'login' ? '로그인하면 온라인 랭킹에 기록이 올라갑니다' : '아이디와 비밀번호로 내 계정을 만듭니다', cx, by + 62)
      g.globalAlpha = 1

      // 오른쪽: 비스듬한 띠. 고른 줄은 주황으로 길게 뻗는다
      const n = rows().length, top = y0()
      g.globalAlpha = m
      rows().forEach((r, i) => {
        const on0 = i === focus, k = ease('acct' + i, on0), on = k > 0.5, w = 440 + 40 * k, x = 770 - 40 * k + (1 - m) * 160, y = top + i * PITCH
        slant(g, x, y, w, H, 22); g.fillStyle = 'rgba(8,24,70,.74)'; g.fill()
        g.strokeStyle = `rgba(255,255,255,${0.3 * (1 - k)})`; g.lineWidth = 1; g.stroke()
        if (k > 0.01) {
          g.save(); g.globalAlpha *= k
          const og = g.createLinearGradient(x, 0, x + w, 0); og.addColorStop(0, '#ffb13b'); og.addColorStop(0.7, '#ff7a59'); og.addColorStop(1, '#ff5c8a')
          glow(g, 'rgba(255,140,60,.6)', 16, () => { slant(g, x, y, w, H, 22); g.fillStyle = og; g.fill() })
          g.restore()
        }
        if (m > 0.6) hit(x, y, w, H, () => { focus = i; if (!isField(r.kind)) press('Enter') }, () => { focus = i })
        g.textAlign = 'left'; g.fillStyle = '#fff'
        if (isField(r.kind)) {
          g.font = `700 12px ${FONT}`; g.fillStyle = `rgba(255,255,255,${0.7 + 0.3 * k})`
          g.fillText(`${r.name.split('').join(' ')}   ·   ${r.sub}`, x + 46, y + 24)
          if (!on0) { // 고른 줄은 진짜 입력 칸이 이 자리에 얹힌다
            const v = vals[r.kind as keyof typeof vals]
            g.font = `700 22px ${FONT}`; g.fillStyle = v ? '#fff' : 'rgba(255,255,255,.3)'
            g.fillText(v ? (r.kind === 'pw' || r.kind === 'pw2' ? '•'.repeat(v.length) : v) : '—', x + 46, y + 51)
          }
        } else {
          g.fillStyle = r.kind === 'go' && !on ? AMBER : '#fff'; g.font = `${on ? 800 : 600} ${(22 + 3 * k).toFixed(1)}px ${FONT}`
          g.fillText(r.name.split('').join(' '), x + 46, y + 30)
          g.font = `${(13 + k).toFixed(1)}px ${FONT}`; g.fillStyle = `rgba(255,255,255,${0.65 + 0.35 * k})`; g.fillText(r.sub, x + 46, y + 52)
          if (on) { g.textAlign = 'right'; g.font = `800 22px ${FONT}`; g.fillStyle = '#fff'; g.fillText('▶', x + w - 34, y + 40) }
        }
      })
      // 안내·오류: 띠 아래
      g.textAlign = 'left'; g.font = `700 14px ${FONT}`
      g.fillStyle = msg ? (bad ? '#ffd0d0' : AMBER) : ICE
      g.fillText(msg || TIPS[rows()[focus]?.kind] || '', 776, top + n * PITCH + 18)
      g.globalAlpha = 1

      g.textAlign = 'center'; g.font = `14px ${FONT}`; g.fillStyle = '#0b2a6b'
      g.fillText(mode === 'profile' ? '↑ ↓  선택   ·   Enter  확인   ·   Esc  뒤로' : '↑ ↓ · Tab  칸 이동   ·   Enter  확인   ·   Esc  뒤로', 640, 696)
    },
    keydown(e) {
      if (e.isComposing) return // 한글 조합 중의 Enter·방향키는 입력 칸이 쓴다
      if (e.key === 'Escape') { leave(); return }
      if (busy) return
      const n = rows().length
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) { e.preventDefault(); focus = (focus + 1) % n }
      else if (e.key === 'ArrowUp' || e.key === 'Tab') { e.preventDefault(); focus = (focus + n - 1) % n }
      else if (e.key === 'Enter') {
        const kind = rows()[focus].kind
        if (isField(kind)) { if (rows()[focus + 1]?.kind === 'go') void submit(); else focus++ } // 마지막 칸에서 Enter면 바로 보낸다
        else if (kind === 'go') void submit()
        else if (kind === 'switch') go(mode === 'login' ? 'register' : 'login')
        else if (kind === 'logout') void logout().then(() => go('login'))
        else leave()
      }
      place() // 칸을 옮긴 직후 바로 입력 칸을 바꾼다 (다음 프레임까지 기다리면 빨리 친 글자가 옛 칸으로 들어간다)
    }
  }
}
