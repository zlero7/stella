import type { Scene, SceneManager } from '../core/SceneManager'
import { ID_RE, NICK_RE, changeNick, changePassword, login, logout, register } from '../data/Account'
import { account, settings } from '../data/Storage'
import { pickAvatar } from '../data/Avatar'
import { PLATE_COLOR, clearAvatar, prof, refreshProfile, setAvatar } from '../data/Profile'
import { avatarCircle, gem } from '../render/profileCard'
import { FONT, AMBER, CYAN, ICE, accentFill, card, drawBg, ease, fit, fitFont, glow, header, hit, meter, press, slant, starPath } from '../render/theme'

// 계정: 로그인 · 회원가입 · (로그인 중이면) 내 계정. 타이틀과 같은 디맥식 구성 — 왼쪽에 큰 글자, 오른쪽에 비스듬한 띠 (고른 줄은 주황)
// 온라인 랭킹은 로그인해야 올라간다
type Mode = 'login' | 'register' | 'profile' | 'nick' | 'pass'
type Kind = 'id' | 'pw' | 'pw2' | 'pwold' | 'nick' | 'go' | 'switch' | 'logout' | 'back' | 'rename' | 'repass' | 'avatar' | 'unavatar'
type Row = { kind: Kind; name: string; sub: string } // 글자 칸은 name = 영문 라벨, sub = 한글 라벨 / 버튼은 name = 큰 글자, sub = 설명
const ID: Row = { kind: 'id', name: 'ID', sub: '아이디' }, PW: Row = { kind: 'pw', name: 'PASSWORD', sub: '비밀번호' }
const ROWS: Record<Mode, Row[]> = {
  login: [ID, PW, { kind: 'go', name: 'LOGIN', sub: '로그인' }, { kind: 'switch', name: 'CREATE ACCOUNT', sub: '계정이 없나요? 회원가입' }],
  register: [ID, PW, { kind: 'pw2', name: 'CONFIRM', sub: '비밀번호 확인' }, { kind: 'nick', name: 'NICKNAME', sub: '닉네임' }, { kind: 'go', name: 'SIGN UP', sub: '가입하기' }, { kind: 'switch', name: 'BACK TO LOGIN', sub: '이미 계정이 있나요? 로그인' }],
  profile: [{ kind: 'avatar', name: 'PROFILE IMAGE', sub: '프로필 이미지 바꾸기' }, { kind: 'rename', name: 'CHANGE NICKNAME', sub: '닉네임 변경' }, { kind: 'repass', name: 'CHANGE PASSWORD', sub: '비밀번호 변경' }, { kind: 'logout', name: 'LOGOUT', sub: '로그아웃' }, { kind: 'back', name: 'BACK', sub: '타이틀로' }],
  nick: [{ kind: 'nick', name: 'NEW NICKNAME', sub: '새 닉네임' }, { kind: 'go', name: 'CHANGE', sub: '바꾸기 (하루에 한 번)' }, { kind: 'switch', name: 'CANCEL', sub: '내 계정으로' }],
  pass: [{ kind: 'pwold', name: 'CURRENT', sub: '현재 비밀번호' }, { kind: 'pw', name: 'NEW PASSWORD', sub: '새 비밀번호' }, { kind: 'pw2', name: 'CONFIRM', sub: '새 비밀번호 확인' }, { kind: 'go', name: 'CHANGE', sub: '바꾸기 · 다른 기기는 로그아웃' }, { kind: 'switch', name: 'CANCEL', sub: '내 계정으로' }]
}
const TIPS: Partial<Record<Kind, string>> = { id: '영문 소문자·숫자·_ 4~16자', pw: '8~64자 (아이디와 같으면 안 됩니다)', pw2: '비밀번호를 한 번 더', pwold: '지금 쓰는 비밀번호', nick: '한글·영문·숫자 2~12자 · 랭킹에 이 이름으로 올라갑니다' }
const MAX: Partial<Record<Kind, number>> = { id: 16, pw: 64, pw2: 64, pwold: 64, nick: 12 }
const isField = (k: Kind) => k === 'id' || k === 'pw' || k === 'pw2' || k === 'pwold' || k === 'nick'
const isSecret = (k: Kind) => k === 'pw' || k === 'pw2' || k === 'pwold'
const blank = () => ({ id: '', pw: '', pw2: '', pwold: '', nick: '' })
const H = 64, PITCH = 76 // 띠 높이 · 줄 간격
// 글자를 폭에 맞춰 줄바꿈 (글자 단위, 최대 3줄)
function wrap(g: CanvasRenderingContext2D, text: string, w: number) {
  const out: string[] = []; let cur = ''
  for (const ch of text) { if (g.measureText(cur + ch).width > w && cur) { out.push(cur); cur = ch.trimStart() } else cur += ch }
  if (cur) out.push(cur)
  return out.slice(0, 3)
}

export const Account = (sm: SceneManager): Scene => {
  let mode: Mode = 'login', focus = 0, msg = '', bad = false, busy = false, vals = blank(), shown = '', since = 0, msgAt = 0
  const REMOVE: Row = { kind: 'unavatar', name: 'REMOVE IMAGE', sub: '프로필 이미지 지우기' }
  const rows = () => (mode === 'profile' && prof.v?.avatar ? [ROWS.profile[0], REMOVE, ...ROWS.profile.slice(1)] : ROWS[mode]) // 이미지를 올렸을 때만 지우기 줄이 나온다
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
    if (shown !== mode + k) { shown = mode + k; e.type = isSecret(k) ? 'password' : 'text'; e.maxLength = MAX[k]!; e.placeholder = ''; e.value = vals[k as keyof typeof vals]; e.focus() }
  }
  const say = (m: string, isBad = false) => { msg = m; bad = isBad; msgAt = performance.now() }
  const go = (m: Mode) => { mode = m; focus = 0; vals.pw = vals.pw2 = vals.pwold = ''; vals.nick = ''; say(''); shown = ''; since = performance.now() }
  async function changeAvatar(remove: boolean) {
    busy = true
    try {
      if (remove) { await clearAvatar(); say('프로필 이미지를 지웠습니다') }
      else { const jpeg = await pickAvatar(); if (jpeg) { say('올리는 중…'); await setAvatar(jpeg); say('프로필 이미지를 바꿨습니다') } }
    } catch (e) { say((e as Error).message, true) } finally { busy = false; focus = remove ? 0 : Math.min(focus, rows().length - 1) }
  }
  // 내 계정 대시보드: 프로필 이미지·닉네임·칭호·레벨·경험치·기록·DJ CLASS·래더 티어를 한 장에 (플레이트 색이 위쪽에 번진다)
  function dash(g: CanvasRenderingContext2D) {
    const p = prof.v, X = 56, Y = 94, W = 560, H = 556, [c1, c2] = PLATE_COLOR[p?.plate ?? 'default'] ?? PLATE_COLOR.default
    card(g, X, Y, W, H, 'MY PROFILE')
    g.textAlign = 'right'; g.font = `700 13px ${FONT}`; g.fillStyle = ICE; g.fillText(`ID  ${account.id}`, X + W - 22, Y + 30)
    g.save(); g.beginPath(); g.roundRect(X, Y, W, H, 20); g.clip()
    const pl = g.createRadialGradient(X + 100, Y + 112, 10, X + 100, Y + 112, 340); pl.addColorStop(0, c1); pl.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha *= 0.55; g.fillStyle = pl; g.fillRect(X, Y, W, 260); g.restore()
    avatarCircle(g, X + 100, Y + 112, 52, account.nick, p?.avatar, c1, c2)
    g.textAlign = 'left'; g.font = `900 34px ${FONT}`; g.fillStyle = '#fff'; g.fillText(fit(g, account.nick, 340), X + 178, Y + 108)
    if (!p) { g.font = `600 16px ${FONT}`; g.fillStyle = ICE; g.fillText('프로필을 불러오는 중…', X + 178, Y + 140); return }
    g.font = `700 15px ${FONT}`; g.fillStyle = AMBER; g.fillText(fit(g, p.titleName || 'STELLA', 340), X + 178, Y + 134)
    g.font = `800 17px ${FONT}`; g.fillStyle = '#fff'; g.fillText(`Lv ${p.level}`, X + 178, Y + 166)
    meter(g, X + 244, Y + 156, W - 244 - 30 + 0, p.need ? p.cur / p.need : 1)
    g.textAlign = 'right'; g.font = `600 12px ${FONT}`; g.fillStyle = ICE; g.fillText(p.need ? `${p.cur} / ${p.need} EXP` : 'MAX', X + W - 28, Y + 148)
    const line = (y: number) => { g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(X + 28, y, W - 56, 1) }
    line(Y + 192)
    const stats: [string, string | number][] = [['총 플레이', p.plays], ['풀콤보', p.fcs], ['올퍼펙트', p.aps], ['경험치 합계', p.exp.toLocaleString()]]
    stats.forEach(([label, v], i) => {
      const sx = X + 30 + (i % 2) * 260, sy = Y + 222 + Math.floor(i / 2) * 76
      g.textAlign = 'left'; g.font = `700 12px ${FONT}`; g.fillStyle = CYAN; g.fillText(label, sx, sy)
      g.font = `800 28px ${FONT}`; g.fillStyle = '#fff'; g.fillText(String(v), sx, sy + 34)
    })
    line(Y + 368)
    g.textAlign = 'left'; g.font = `700 12px ${FONT}`; g.fillStyle = CYAN; g.fillText('DJ CLASS', X + 30, Y + 398)
    g.font = `800 24px ${FONT}`; g.fillStyle = '#fff'; g.fillText(p.cls.label, X + 30, Y + 430)
    g.textAlign = 'right'; g.font = `700 14px ${FONT}`; g.fillStyle = AMBER; g.fillText(`${p.cls.points} PT`, X + W - 30, Y + 430)
    meter(g, X + 30, Y + 442, W - 60, p.cls.hi ? (p.cls.points - p.cls.lo) / (p.cls.hi - p.cls.lo) : 1)
    line(Y + 466)
    gem(g, X + 76, Y + 508, 24, p.tierLabel)
    g.textAlign = 'left'; g.font = `800 22px ${FONT}`; g.fillStyle = '#fff'; g.fillText(p.tierLabel, X + 136, Y + 504)
    g.font = `600 14px ${FONT}`; g.fillStyle = ICE; g.fillText(`${p.lp} LP   ·   ${p.wins}승 ${p.losses}패 ${p.draws}무`, X + 136, Y + 528)
  }
  const leave = () => { hideInput(); vals = blank(); sm.go('title') }

  async function submit() {
    if (busy) return
    const id = vals.id.trim().toLowerCase(), { pw, pw2 } = vals, nick = vals.nick.trim()
    if (mode === 'nick') {
      if (!NICK_RE.test(nick)) return say('닉네임은 한글·영문·숫자 2~12자입니다', true)
      busy = true; say('바꾸는 중…')
      try { await changeNick(nick); go('profile'); say('닉네임을 바꿨습니다') } catch (e) { say((e as Error).message, true) } finally { busy = false }
      return
    }
    if (mode === 'pass') {
      if (pw.length < 8 || pw.length > 64) return say('새 비밀번호는 8~64자입니다', true)
      if (pw !== pw2) return say('새 비밀번호가 서로 다릅니다', true)
      busy = true; say('바꾸는 중…')
      try { await changePassword(vals.pwold, pw); go('profile'); say('비밀번호를 바꿨습니다. 다른 기기는 로그아웃됩니다') } catch (e) { say((e as Error).message, true); vals.pwold = vals.pw = vals.pw2 = ''; shown = '' } finally { busy = false }
      return
    }
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
      void refreshProfile() // 프로필 이미지 줄을 정하려고 최신 프로필을 받는다
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

      header(g, 'ACCOUNT', mode === 'profile' ? '내 계정' : mode === 'login' ? '로그인' : mode === 'register' ? '회원가입' : mode === 'nick' ? '닉네임 변경' : '비밀번호 변경')
      // 왼쪽: 내 계정은 프로필 대시보드, 나머지는 큰 글자 (화면 이름)
      const cx = 380, by = 372
      if (mode === 'profile') { g.globalAlpha = m; dash(g); g.globalAlpha = 1 }
      else {
      g.textAlign = 'center'; g.globalAlpha = m
      g.font = `700 15px ${FONT}`; g.fillStyle = '#eaf6ff'
      g.fillText(mode === 'nick' || mode === 'pass' ? 'M Y   A C C O U N T' : 'P L A Y E R   A C C O U N T', cx, by - 108)
      const big = mode === 'login' ? 'LOGIN' : mode === 'register' ? 'SIGN UP' : mode === 'nick' ? 'NICKNAME' : 'PASSWORD'
      const label = fitFont(g, big, 600, 900, 132, 40)
      const w = g.measureText(label).width, lx = cx - w / 2, gr = g.createLinearGradient(lx, 0, lx + w, 0)
      gr.addColorStop(0, '#fff'); gr.addColorStop(0.5, '#e8f7ff'); gr.addColorStop(1, '#bfe6ff')
      glow(g, 'rgba(10,50,140,.65)', 34, () => { g.fillStyle = gr; g.fillText(label, cx, by) })
      const k1 = 0.65 + 0.35 * Math.sin(t * 2.4)
      glow(g, AMBER, 18, () => { starPath(g, cx + w / 2 + 6, by - 96, 14 * k1); g.fillStyle = '#fff6d6'; g.fill() })
      slant(g, cx - 210, by + 26, 420, 5, 2); g.fillStyle = accentFill(g, cx - 210, 420); g.fill()
      g.font = `15px ${FONT}`; g.fillStyle = '#eaf6ff'
      g.fillText(mode === 'nick' ? '랭킹과 래더에 보이는 이름을 바꿉니다 (하루에 한 번)' : mode === 'pass' ? '비밀번호를 바꾸면 다른 기기의 로그인은 풀립니다' : mode === 'login' ? '로그인하면 온라인 랭킹에 기록이 올라갑니다' : '아이디와 비밀번호로 내 계정을 만듭니다', cx, by + 62)
      g.globalAlpha = 1
      }

      // 오른쪽: 비스듬한 띠. 고른 줄은 주황으로 길게 뻗는다
      const n = rows().length, top = y0()
      g.globalAlpha = m
      rows().forEach((r, i) => {
        const on0 = i === focus, k = ease('acct' + i, on0), on = k > 0.5, w = 440 + 40 * k, x = 770 - 40 * k + (1 - m) * 160, y = top + i * PITCH
        slant(g, x, y, w, H, 22); g.fillStyle = 'rgba(6,11,28,.74)'; g.fill()
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
            g.fillText(v ? (isSecret(r.kind) ? '•'.repeat(v.length) : v) : '—', x + 46, y + 51)
          }
        } else {
          g.fillStyle = r.kind === 'go' && !on ? AMBER : '#fff'; g.font = `${on ? 800 : 600} ${(22 + 3 * k).toFixed(1)}px ${FONT}`
          g.fillText(r.name.split('').join(' '), x + 46, y + 30)
          g.font = `${(13 + k).toFixed(1)}px ${FONT}`; g.fillStyle = `rgba(255,255,255,${0.65 + 0.35 * k})`; g.fillText(r.sub, x + 46, y + 52)
          if (on) { g.textAlign = 'right'; g.font = `800 22px ${FONT}`; g.fillStyle = '#fff'; g.fillText('▶', x + w - 34, y + 40) }
        }
      })
      // 안내·오류: 띠 아래의 눈에 띄는 상자. 오류는 빨간 상자가 살짝 흔들리며 나타나고, 평소에는 이 칸의 입력 안내를 보여 준다
      const text = msg || TIPS[rows()[focus]?.kind] || ''
      if (text) {
        const age = Math.min(1, (now - msgAt) / 260), shake = msg && bad ? Math.sin(age * 22) * 7 * (1 - age) : 0, bw = 440, pad = 18
        g.font = `800 ${msg ? 17 : 15}px ${FONT}`
        const lines = wrap(g, (msg && bad ? '⚠  ' : '') + text, bw - pad * 2 - 10), bh = 22 + lines.length * 24, bx = 770 + shake, by = top + n * PITCH + 4
        g.globalAlpha = m * (msg ? 0.4 + 0.6 * age : 1)
        slant(g, bx, by, bw, bh, 14); g.fillStyle = msg ? (bad ? 'rgba(168,28,52,.94)' : 'rgba(6,11,28,.92)') : 'rgba(6,11,28,.78)'; g.fill()
        g.lineWidth = msg ? 2 : 1; g.strokeStyle = msg ? (bad ? '#ffb3bd' : AMBER) : 'rgba(255,255,255,.3)'; g.stroke()
        g.textAlign = 'left'; g.fillStyle = msg ? '#fff' : ICE
        lines.forEach((ln, i) => g.fillText(ln, bx + pad + 10, by + 28 + i * 24))
        g.globalAlpha = 1
      }
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
        else if (kind === 'switch') go(mode === 'nick' || mode === 'pass' ? 'profile' : mode === 'login' ? 'register' : 'login')
        else if (kind === 'avatar' || kind === 'unavatar') void changeAvatar(kind === 'unavatar')
        else if (kind === 'rename') go('nick')
        else if (kind === 'repass') go('pass')
        else if (kind === 'logout') void logout().then(() => go('login'))
        else leave()
      }
      place() // 칸을 옮긴 직후 바로 입력 칸을 바꾼다 (다음 프레임까지 기다리면 빨리 친 글자가 옛 칸으로 들어간다)
    }
  }
}
