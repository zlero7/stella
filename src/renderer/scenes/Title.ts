import type { Scene, SceneManager } from '../core/SceneManager'
import { account, settings } from '../data/Storage'
import { prof, refreshProfile } from '../data/Profile'
import { APP_VERSION, noticeInfo, updateInfo } from '../data/Update'
import { profileCard } from '../render/profileCard'
import { FONT, AMBER, accentFill, chip, drawBg, footer, slant, glow, hit, press, starPath, stellaSky } from '../render/theme'

const ITEMS: [string, string][] = [['START', '곡 선택'], ['LADDER', '랭크 매치 · 밴픽'], ['VERSUS', '친구와 대결'], ['COLLECTION', '프로필 · DJ CLASS · 꾸미기'], ['ACCOUNT', ''], ['SETTINGS', '환경 설정'], ['EXIT', '종료']] // ACCOUNT의 설명은 로그인 상태에 따라 바뀐다
const COLORS = ['#ff9f1a', '#ff5c8a', '#4f9bff', '#b9a4ff', '#2ee6c8', '#9aa6b8', '#ff6b4a'] // 모드마다 다른 색 (START, LADDER, VERSUS, COLLECTION, ACCOUNT, SETTINGS, EXIT)
const ign = (k: string) => /^(Shift|Control|Alt|Meta|CapsLock|NumLock|F\d+)$/.test(k) // 이 키로는 시작 화면을 넘기지 않는다
let seen = false // 처음 켰을 때만 "PRESS ANY KEY" 화면을 거친다 (설정 등에서 돌아오면 바로 메뉴)

// 모드별 바탕 색(위, 아래)과 로고 색
const PALETTE: [string, string, string][] = [['#aab4e0', '#f2a0ac', '#0b0b12'], ['#f8d49a', '#ee7a68', '#0b0b12'], ['#92dcea', '#6a8ee8', '#0b0b12'], ['#2b2519', '#86621f', '#f6e3b0'], ['#c3b0ff', '#80d2e2', '#0b0b12'], ['#a3afc2', '#dde3ee', '#0b0b12'], ['#5a5f70', '#232734', '#f2f4fa']]
// 모드별 검정 기하 로고: 가운데 (0,0) 기준 폭 약 300, 높이 약 220
function glyph(g: CanvasRenderingContext2D, i: number) {
  const poly = (...p: number[]) => { g.beginPath(); g.moveTo(p[0], p[1]); for (let k = 2; k < p.length; k += 2) g.lineTo(p[k], p[k + 1]); g.closePath(); g.fill() }
  if (i === 0) { // 키 네 개가 있는 기어 (FREE STYLE)
    poly(-150, 30, -100, -100, 150, -100, 150, -55, -62, -55, -76, -20, 150, -20, 150, 15, -90, 15, -104, 30) // F
    for (let k = 0; k < 4; k++) g.fillRect(-150 + k * 78, 56, 66, 44) // 네 키
  } else if (i === 1) { for (let k = 0; k < 5; k++) g.fillRect(-150 + k * 64, 100 - (k + 1) * 42, 52, (k + 1) * 42) } // 계단 (래더)
  else if (i === 2) { poly(-150, -100, -90, -100, 0, 60, 90, -100, 150, -100, 30, 110, -30, 110); g.globalAlpha *= 0.55; poly(-30, -100, 30, -100, 0, -40) } // V
  else if (i === 3) { for (const [dx, dy, r] of [[0, 0, 90], [-100, 20, 40], [100, 20, 40]]) { g.beginPath(); g.moveTo(dx, dy - r); g.lineTo(dx + r * 0.55, dy); g.lineTo(dx, dy + r); g.lineTo(dx - r * 0.55, dy); g.closePath(); g.fill() } }
  else if (i === 4) { g.beginPath(); g.arc(0, -40, 56, 0, 7); g.fill(); poly(-110, 100, -80, 20, 80, 20, 110, 100) }
  else if (i === 5) { g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; poly(Math.cos(a - 0.2) * 70, Math.sin(a - 0.2) * 70, Math.cos(a - 0.15) * 110, Math.sin(a - 0.15) * 110, Math.cos(a + 0.15) * 110, Math.sin(a + 0.15) * 110, Math.cos(a + 0.2) * 70, Math.sin(a + 0.2) * 70) } g.beginPath(); g.arc(0, 0, 80, 0, 7); g.arc(0, 0, 34, 0, 7, true); g.fill('evenodd') }
  else { poly(-90, -100, 20, -100, 20, 100, -90, 100); poly(40, -10, 40, -50, 130, 0, 40, 50, 40, 10, -20, 10, -20, -10) }
}

export const Title = (sm: SceneManager): Scene => {
  let shown = -1, shownAt = 0, sel = 0, menu = false, since = 0, cp = 0, last = 0 // cp: 화면에 보이는 위치 (고른 칸으로 부드럽게 따라간다)
  let updMsg = '' // 업데이트 진행·실패 안내 (비었으면 기본 안내)
  const open = (v: boolean) => { menu = seen = v; since = performance.now() }
  return {
    enter() { menu = seen; since = performance.now() - 1000; void refreshProfile() },
    render(g) {
      drawBg(g)
      if (!menu) hit(0, 0, 1280, 720, () => press(' ')) // 시작 화면: 아무 데나 누르면 메뉴로
      const now = performance.now(), t = now / 1000
      const p = Math.min(1, (now - since) / 520), m = 1 - (1 - (menu ? p : 1 - p)) ** 3 // 0 = 시작 화면, 1 = 메뉴 (부드럽게 오간다)

      // 시작 화면 (디맥 타이틀): 분홍~연보라 그라데이션 + 사선 무늬 + 위에서 모이는 V자 빛기둥, 가운데 큰 로고 마크와 넓게 벌린 검정 글자, 아래 회색 직사각 안내 버튼
      const sa = 1 - m
      if (sa > 0.001) {
        g.save(); g.globalAlpha = sa
        const sg = g.createLinearGradient(0, 0, 0, 720); sg.addColorStop(0, '#a9b0dc'); sg.addColorStop(1, '#f09fb0'); g.fillStyle = sg; g.fillRect(0, 0, 1280, 720)
        g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1
        g.beginPath(); for (let k = -720; k < 1280; k += 5) { g.moveTo(k, 720); g.lineTo(k + 720, 0) } g.stroke()
        g.fillStyle = 'rgba(70,60,140,.26)' // 두 갈래 빛기둥이 가운데 아래에서 만나 V를 이룬다
        for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(640 + sx * 330, 0); g.lineTo(640 + sx * 160, 0); g.lineTo(640, 540); g.closePath(); g.fill() }
        for (let i = 0; i < 16; i++) { // 반짝이는 십자 별
          const x = (i * 311) % 1280, y = (i * 197) % 560, a = 0.3 + 0.6 * Math.abs(Math.sin(t * 1.3 + i * 1.7))
          g.fillStyle = `rgba(255,248,220,${a})`; starPath(g, x, y, 4 + (i % 4) * 3); g.fill()
        }
        const cx = 640, my = 290
        g.fillStyle = '#ffd23a'; starPath(g, cx + 12, my - 8, 124); g.fill() // 로고 마크: 노란 별 위에 검은 별, 위에 왕관
        g.fillStyle = '#0b0b12'; starPath(g, cx, my, 112); g.fill()
        g.fillStyle = '#ffd23a'; g.beginPath(); g.moveTo(cx - 44, my - 106); g.lineTo(cx - 44, my - 146); g.lineTo(cx - 22, my - 126); g.lineTo(cx, my - 156); g.lineTo(cx + 22, my - 126); g.lineTo(cx + 44, my - 146); g.lineTo(cx + 44, my - 106); g.closePath(); g.fill()
        g.textAlign = 'left'; g.font = `900 62px ${FONT}`; g.letterSpacing = '20px'
        const parts: [string, string][] = [['STELLA', '#0b0b12'], ['/', '#ffd23a'], [`${settings.keyMode}K`, '#0b0b12']]
        const tw = parts.reduce((n, [x]) => n + g.measureText(x).width, 0)
        let lx2 = cx - tw / 2 + 10; for (const [x, col2] of parts) { g.fillStyle = col2; g.fillText(x, lx2, 470); lx2 += g.measureText(x).width }
        g.letterSpacing = '0px'
        const pa2 = 0.75 + 0.25 * Math.abs(Math.sin(t * 2.2))
        g.fillStyle = `rgba(104,104,122,${0.85 * pa2})`; g.fillRect(cx - 170, 546, 340, 38); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1; g.strokeRect(cx - 169.5, 546.5, 339, 37)
        g.textAlign = 'center'; g.font = `800 14px ${FONT}`; g.fillStyle = '#fff'; g.fillText('PRESS ANY KEY TO START', cx, 570)
        g.font = `600 12px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.92)'; g.fillText('STELLIVE COVER RHYTHM', cx, 612)
        g.textAlign = 'right'; g.font = `700 12px ${FONT}`; g.fillText(`v${APP_VERSION}`, 1250, 706)
        g.restore()
      }

      const up = updateInfo.value // 새 버전이 있으면 아래에 안내 (앱에는 자동 업데이트가 없다)
      if (noticeInfo.value) { g.textAlign = 'center'; g.font = `700 14px ${FONT}`; g.fillStyle = '#33275f'; g.fillText(`NOTICE  ${noticeInfo.value}`, 640, 664); g.textAlign = 'left' } // 서버 공지
      if (up) { g.textAlign = 'center'; g.font = `700 15px ${FONT}`; g.fillStyle = m > 0.5 ? AMBER : '#5b1020'; g.fillText(updMsg || (window.api ? `새 버전 v${up.latest}이 나왔습니다 — U 키를 누르면 지금 업데이트합니다 (현재 v${APP_VERSION})` : `새 버전 v${up.latest}이 나왔습니다 — ${up.url.replace('https://', '')} (현재 v${APP_VERSION})`), 640, 690); g.textAlign = 'left' }
      // 메뉴: 디맥처럼 모드 하나가 화면 가운데에 크게, 좌우 화살표로 넘긴다. 모드마다 색이 다르다
      if (m > 0) {
        const n = ITEMS.length, dt = Math.min((now - last) / 1000, 0.05); last = now
        let dd = ((sel - cp) % n + n) % n; if (dd > n / 2) dd -= n
        cp += dd * Math.min(dt * 11, 1); cp = (cp + n) % n
        const near = (v: number) => { let d = ((v - cp) % n + n) % n; if (d > n / 2) d -= n; return d } // 가운데에서 몇 칸 떨어졌나 (부호 있음)
        const col = COLORS[sel % COLORS.length]
        // 디맥 메인 메뉴: 모드마다 파스텔 그라데이션 전체 화면 + 사선 무늬, 가운데에 커다란 검정 기하 로고와 얇은 영문 제목. 좌우로 밀어 넘긴다
        const pal = (i: number) => PALETTE[((Math.round(i) % n) + n) % n]
        const i0 = Math.floor(cp), fr = cp - i0, mixc = (u: string, v: string) => [1, 3, 5].map(q => Math.round(parseInt(u.slice(q, q + 2), 16) * (1 - fr) + parseInt(v.slice(q, q + 2), 16) * fr))
        const [pa, pb] = [pal(i0), pal(i0 + 1)], top = mixc(pa[0], pb[0]), bot = mixc(pa[1], pb[1])
        const bgg = g.createLinearGradient(0, 0, 0, 720); bgg.addColorStop(0, `rgb(${top})`); bgg.addColorStop(1, `rgb(${bot})`)
        g.globalAlpha = m; g.fillStyle = bgg; g.fillRect(0, 0, 1280, 720)
        g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1 // 가는 사선 무늬
        g.beginPath(); for (let k = -720; k < 1280; k += 5) { g.moveTo(k, 720); g.lineTo(k + 720, 0) } g.stroke(); stellaSky(g)
        hit(940, 2, 300, 64, () => sm.go('collection')); profileCard(g, 940, 2, prof.v); g.textAlign = 'left' // 오른쪽 위 프로필 (곡 선택 화면과 같은 자리): 누르면 컬렉션
        if (updateInfo.value) { // 디맥의 RECENT NOTICE 같은 빨간 꼬리표: 새 버전이 있으면 왼쪽 위에
          hit(40, 24, 300, 36, () => press('u'))
          g.fillStyle = '#d12a3f'; g.fillRect(40, 24, 300, 36); g.font = `800 15px ${FONT}`; g.fillStyle = '#fff'; g.fillText('NEW UPDATE', 56, 48); g.fillStyle = '#ffe14a'; g.fillText(`v${updateInfo.value.latest}`, 168, 48); g.font = `600 12px ${FONT}`; g.fillStyle = '#fff'; g.fillText('U 키로 업데이트', 232, 47)
        }
        ITEMS.forEach(([name, sub], i) => {
          const d = near(i), ad = Math.abs(d); if (ad > 0.62) return
          const ink = pal(i)[2], x = 640 + d * 760
          g.globalAlpha = m * Math.max(0, 1 - ad * 1.6)
          g.save(); g.translate(x + 10, 310); g.fillStyle = '#ffd23a'; g.strokeStyle = '#ffd23a'; glyph(g, i); g.restore() // 로고와 같은 노란 그림자
          g.save(); g.translate(x, 300); g.fillStyle = ink; g.strokeStyle = ink; glyph(g, i); g.restore()
          g.textAlign = 'center'; g.fillStyle = ink; g.font = `300 44px ${FONT}`
          const label = name === 'START' ? 'FREE STYLE' : name === 'COLLECTION' ? '*Collection' : name, sp = [...label].join(String.fromCharCode(8202).repeat(3))
          g.fillText(sp, x, 520)
          g.font = `600 20px ${FONT}`; g.globalAlpha *= 0.8
          g.fillText(name === 'ACCOUNT' ? (account.token ? `${account.nick}  ·  내 계정` : '로그인 / 회원가입') : sub, x, 560)
        })
        g.globalAlpha = m
        hit(340, 120, 600, 460, () => press('Enter'))
        g.globalAlpha = m; g.textAlign = 'left'
        // 좌우 화살표 · 현재 위치 점
        if (m > 0.6) {
          for (const dir of [-1, 1] as const) {
            const ax = dir < 0 ? 44 : 1236; hit(ax - 40, 290, 80, 80, () => press(dir < 0 ? 'ArrowLeft' : 'ArrowRight'))
            g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#fff'
            g.beginPath(); g.moveTo(ax + 12 * dir * -1, 306); g.lineTo(ax + 12 * dir, 330); g.lineTo(ax + 12 * dir * -1, 354); g.stroke()
            g.lineWidth = 2; g.strokeStyle = col; g.beginPath(); g.moveTo(ax + 20 * dir * -1, 302); g.lineTo(ax + 20 * dir, 330); g.lineTo(ax + 20 * dir * -1, 358); g.stroke()
          }
        }
        g.globalAlpha = m
        footer(g)
        chip(g, 24, 684, '←→', '모드 선택', '#fff', null, 24, 13) // 디맥 하단 띠: 이동은 왼쪽, 확인·뒤로는 오른쪽
        chip(g, 1010, 684, 'Esc', '뒤로', '#fff', undefined, 24, 13); chip(g, 1120, 684, 'Enter', '확인', '#fff', undefined, 24, 13)
        g.globalAlpha = 1
      }
      g.textAlign = 'left'
    },
    keydown(e) {
      if ((e.key === 'u' || e.key === 'U') && updateInfo.value && window.api && !updMsg) { // 새 버전: 받아서 덮어 깔고 다시 시작 (곡은 그대로)
        updMsg = '새 버전을 받는 중… 끝나면 자동으로 다시 시작됩니다'
        window.api.update(updateInfo.value.latest).catch(err => { updMsg = `업데이트 실패 (${String(err.message).slice(0, 60)}) — ${updateInfo.value?.url.replace('https://', '')} 에서 직접 받으세요` })
        return
      }
      if (!menu) { if (!ign(e.key) && e.key !== 'Escape') { open(true); sel = 0 } return }
      const n = ITEMS.length
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') sel = (sel + 1) % n
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') sel = (sel + n - 1) % n
      else if (e.key === 'Escape') open(false)
      else if (e.key === 'Enter') {
        const name = ITEMS[sel][0]
        if (name === 'START') { if (settings.firstRun) sm.go('intro'); else sm.go('select', { mode: 'play' }) }
        else if (name === 'LADDER') sm.go('ladder')
        else if (name === 'COLLECTION') sm.go('collection')
        else if (name === 'VERSUS') sm.go('vs')
        else if (name === 'ACCOUNT') sm.go('account')
        else if (name === 'SETTINGS') sm.go('settings', { back: 'title' })
        else window.api?.quit?.()
      }
    }
  }
}
