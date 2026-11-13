import type { Scene, SceneManager } from '../core/SceneManager'
import { account, settings } from '../data/Storage'
import { prof, refreshProfile } from '../data/Profile'
import { APP_VERSION, updateInfo } from '../data/Update'
import { profileCard } from '../render/profileCard'
import { FONT, AMBER, accentFill, chip, drawBg, footer, slant, glow, hit, press, starPath } from '../render/theme'

const ITEMS: [string, string][] = [['START', '곡 선택'], ['LADDER', '랭크 매치 · 밴픽'], ['VERSUS', '친구와 대결'], ['COLLECTION', '프로필 · DJ CLASS · 꾸미기'], ['ACCOUNT', ''], ['SETTINGS', '환경 설정'], ['EXIT', '종료']] // ACCOUNT의 설명은 로그인 상태에 따라 바뀐다
const COLORS = ['#ff9f1a', '#ff5c8a', '#4f9bff', '#b9a4ff', '#2ee6c8', '#9aa6b8', '#ff6b4a'] // 모드마다 다른 색 (START, LADDER, VERSUS, COLLECTION, ACCOUNT, SETTINGS, EXIT)
const ign = (k: string) => /^(Shift|Control|Alt|Meta|CapsLock|NumLock|F\d+)$/.test(k) // 이 키로는 시작 화면을 넘기지 않는다
let seen = false // 처음 켰을 때만 "PRESS ANY KEY" 화면을 거친다 (설정 등에서 돌아오면 바로 메뉴)

export const Title = (sm: SceneManager): Scene => {
  let sel = 0, menu = false, since = 0, cp = 0, last = 0 // cp: 화면에 보이는 위치 (고른 칸으로 부드럽게 따라간다)
  const open = (v: boolean) => { menu = seen = v; since = performance.now() }
  return {
    enter() { menu = seen; since = performance.now() - 1000; void refreshProfile() },
    render(g) {
      drawBg(g)
      if (!menu) hit(0, 0, 1280, 720, () => press(' ')) // 시작 화면: 아무 데나 누르면 메뉴로
      const now = performance.now(), t = now / 1000
      const p = Math.min(1, (now - since) / 520), m = 1 - (1 - (menu ? p : 1 - p)) ** 3 // 0 = 시작 화면, 1 = 메뉴 (부드럽게 오간다)

      // 한가운데에서 퍼지는 빛줄기: 천천히 돈다
      g.save(); g.translate(640, 330); g.rotate(t * 0.035)
      const ray = g.createRadialGradient(0, 0, 40, 0, 0, 900); ray.addColorStop(0, 'rgba(255,255,255,.22)'); ray.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = ray
      for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(0, 0); g.lineTo(900, -34); g.lineTo(900, 34); g.closePath(); g.fill() }
      g.restore()

      // 양옆: 천천히 내려오는 노트 (인게임 레인의 메아리). 메뉴가 열리면 오른쪽 줄은 메뉴 뒤로 사라진다
      for (const [side, x0] of [[0, 56], [1, 1040]] as const) {
        g.globalAlpha = side ? 1 - m : 1
        for (let l = 0; l < 2; l++) {
          const x = x0 + l * 92
          slant(g, x, -20, 84, 760, 20); g.fillStyle = 'rgba(255,255,255,.10)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.stroke()
          const blue = (l + side) % 2 === 0, [c1, c2] = blue ? ['#4f9bff', '#cfeeff'] : ['#ffffff', '#9db6d0']
          for (let k = 0; k < 3; k++) {
            const y = ((t * 60 + side * 170 + l * 230 + k * 270) % 800) - 40
            const gr = g.createLinearGradient(x, 0, x + 84, 0); gr.addColorStop(0, c1); gr.addColorStop(1, c2)
            glow(g, c1, 14, () => { slant(g, x + 8, y, 68, 22, 11); g.fillStyle = gr; g.fill() })
          }
        }
        g.globalAlpha = 1
      }

      // 떠오르는 별가루
      for (let i = 0; i < 44; i++) {
        const x = (i * 997) % 1280, y = ((i * 571) % 740 - t * (7 + (i % 7) * 4) + 1480) % 740 - 10, a = 0.25 + 0.55 * Math.abs(Math.sin(t * 1.4 + i))
        g.fillStyle = `rgba(255,255,255,${a})`
        if (i % 6 === 0) { starPath(g, x, y, 5 + (i % 3) * 2); g.fill() } else { g.beginPath(); g.arc(x, y, 1 + (i % 3) * 0.8, 0, 7); g.fill() }
      }
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2
      const sp = (t % 5) / 1.3 // 별똥별: 5초 주기로 한 줄기
      if (sp < 1) {
        const sx = 1000 - sp * 700, sy = 40 + sp * 240, tail = g.createLinearGradient(sx, sy, sx + 160, sy - 64)
        tail.addColorStop(0, `rgba(255,255,255,${0.95 * (1 - sp)})`); tail.addColorStop(1, 'rgba(143,123,255,0)')
        g.strokeStyle = tail; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + 160, sy - 64); g.stroke()
      }

      // 로고: 시작 화면에서는 한가운데에 크게, 메뉴가 열리면 왼쪽으로 옮겨 앉는다
      const fs = 196, by = 352, cx = 640
      g.globalAlpha = 1 - m
      g.textAlign = 'center'
      g.font = `700 15px ${FONT}`; g.fillStyle = '#eaf6ff'
      g.fillText('S T E L L I V E   C O V E R   R H Y T H M', cx, by - fs * 0.76 - 14)
      g.font = `900 ${fs}px ${FONT}`
      const w = g.measureText('STELLA').width, lx = cx - w / 2
      const gr = g.createLinearGradient(lx, 0, lx + w, 0); gr.addColorStop(0, '#fff'); gr.addColorStop(0.5, '#e8f7ff'); gr.addColorStop(1, '#bfe6ff')
      glow(g, 'rgba(10,50,140,.65)', 34, () => { g.fillStyle = gr; g.fillText('STELLA', cx, by) })
      for (const [dx, dy, r, ph] of [[w / 2 + 6, -fs * 0.62, fs * 0.1, 0], [w / 2 - 22, -fs * 0.74, fs * 0.05, 1.3], [-w / 2 + 30, -fs * 0.3, fs * 0.045, 2.6]] as const) {
        const k = 0.65 + 0.35 * Math.sin(t * 2.4 + ph)
        glow(g, AMBER, 18, () => { starPath(g, cx + dx, by + dy, r * k); g.fillStyle = '#fff6d6'; g.fill() })
      }
      slant(g, cx - 210, by + 26, 420, 5, 2); g.fillStyle = accentFill(g, cx - 210, 420); g.fill()
      g.font = `15px ${FONT}`; g.fillStyle = '#eaf6ff'
      g.fillText(`${settings.keyMode}K  ·  세로 리듬 게임`, cx, by + 62)
      g.globalAlpha = 1

      const up = updateInfo.value // 새 버전이 있으면 아래에 안내 (앱에는 자동 업데이트가 없다)
      if (up) { g.textAlign = 'center'; g.font = `700 15px ${FONT}`; g.fillStyle = AMBER; g.fillText(`새 버전 v${up.latest}이 나왔습니다 — ${up.url.replace('https://', '')} 에서 받아 설치하세요 (현재 v${APP_VERSION})`, 640, 690); g.textAlign = 'left' }
      // 시작 화면: 깜빡이는 PRESS ANY KEY
      if (m < 1) {
        g.globalAlpha = 1 - m
        const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 2.2)), label = 'P R E S S   A N Y   K E Y'
        g.font = `800 24px ${FONT}`; const lw = g.measureText(label).width
        for (const s of [-1, 1]) {
          const lg = g.createLinearGradient(640 + s * (lw / 2 + 30), 0, 640 + s * (lw / 2 + 280), 0); lg.addColorStop(0, 'rgba(255,255,255,.8)'); lg.addColorStop(1, 'rgba(255,255,255,0)')
          g.fillStyle = lg; g.fillRect(s > 0 ? 640 + lw / 2 + 30 : 640 - lw / 2 - 280, 584, 250, 2)
        }
        g.fillStyle = `rgba(255,255,255,${a})`; glow(g, '#2b6ee0', 14, () => g.fillText(label, 640, 594))
        g.globalAlpha = 1
      }

      // 메뉴: 디맥처럼 모드 하나가 화면 가운데에 크게, 좌우 화살표로 넘긴다. 모드마다 색이 다르다
      if (m > 0) {
        const n = ITEMS.length, dt = Math.min((now - last) / 1000, 0.05); last = now
        let dd = ((sel - cp) % n + n) % n; if (dd > n / 2) dd -= n
        cp += dd * Math.min(dt * 11, 1); cp = (cp + n) % n
        const near = (v: number) => { let d = ((v - cp) % n + n) % n; if (d > n / 2) d -= n; return d } // 가운데에서 몇 칸 떨어졌나 (부호 있음)
        const col = COLORS[sel % COLORS.length]
        g.globalAlpha = m
        // 모드 색 바탕: 큰 빛무리 · 사선 띠 · 천천히 도는 고리
        const wash = g.createRadialGradient(640, 330, 20, 640, 330, 640); wash.addColorStop(0, col + '66'); wash.addColorStop(1, col + '00')
        g.fillStyle = wash; g.fillRect(0, 0, 1280, 720)
        g.save(); g.translate(640, 330)
        for (const [r, sp, a0] of [[250, 0.12, 0.35], [330, -0.08, 0.22], [420, 0.05, 0.14]] as const) {
          g.save(); g.rotate(t * sp); g.strokeStyle = col; g.globalAlpha = m * a0; g.lineWidth = 2; g.setLineDash([60, 40, 8, 40]); g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); g.restore()
        }
        g.restore()
        g.globalAlpha = m * 0.16; g.fillStyle = col
        slant(g, -80, 250, 1500, 70, 40); g.fill(); slant(g, -80, 400, 1500, 24, 40); g.fill()
        g.globalAlpha = m
        profileCard(g, 40, 24, prof.v)
        ITEMS.forEach(([name, sub], i) => {
          const d = near(i), ad = Math.abs(d); if (ad > 1.6) return
          // 글자 폭에 맞춰 크기를 정한다: 가운데 글자는 600px 안, 양옆 글자는 190px 안. COLLECTION처럼 긴 이름이 옆 글자·화살표와 겹치지 않게
          g.font = `900 100px ${FONT}`; const wu = g.measureText(name).width / 100
          const big = Math.min(128, 600 / wu), small = Math.min(36, 190 / wu)
          const x = 640 + Math.sign(d) * Math.min(ad, 1) * 430 + Math.sign(d) * Math.max(ad - 1, 0) * 300, fsz = big + (small - big) * Math.min(ad, 1), al = Math.max(0, 1 - ad * 0.7)
          g.globalAlpha = m * al; g.textAlign = 'center'; g.font = `900 ${fsz.toFixed(0)}px ${FONT}`
          if (ad < 0.5) { g.fillStyle = col; g.fillText(name, x - 5, 360 + 3); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillText(name, x + 5, 360 - 3) } // 어긋난 그림자 (디맥의 지직거리는 글자)
          g.fillStyle = '#fff'; glow(g, ad < 0.5 ? col : 'rgba(0,0,0,0)', 26, () => g.fillText(name, x, 360))
          if (ad < 0.6) {
            g.globalAlpha = m * (1 - ad / 0.6); g.font = `600 20px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.85)'
            g.fillText(name === 'ACCOUNT' ? (account.token ? `${account.nick}  ·  내 계정` : '로그인 / 회원가입') : sub, x, 408)
          }
        })
        g.globalAlpha = m; g.textAlign = 'left'
        // 좌우 화살표 · 현재 위치 점
        if (m > 0.6) {
          for (const dir of [-1, 1] as const) {
            const ax = dir < 0 ? 44 : 1236; hit(ax - 40, 290, 80, 80, () => press(dir < 0 ? 'ArrowLeft' : 'ArrowRight'))
            g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#fff'
            g.beginPath(); g.moveTo(ax + 12 * dir * -1, 306); g.lineTo(ax + 12 * dir, 330); g.lineTo(ax + 12 * dir * -1, 354); g.stroke()
            g.lineWidth = 2; g.strokeStyle = col; g.beginPath(); g.moveTo(ax + 20 * dir * -1, 302); g.lineTo(ax + 20 * dir, 330); g.lineTo(ax + 20 * dir * -1, 358); g.stroke()
          }
          hit(440, 270, 400, 120, () => press('Enter')) // 가운데 이름을 누르면 실행
        }
        ITEMS.forEach((_, i) => { g.fillStyle = i === sel ? col : 'rgba(255,255,255,.3)'; g.beginPath(); g.arc(640 + (i - (n - 1) / 2) * 22, 560, i === sel ? 5 : 3.5, 0, Math.PI * 2); g.fill() })
        g.globalAlpha = m
        footer(g)
        let kx = 24
        for (const [k, label, real] of [['←→', '모드 선택', null], ['Enter', '확인', undefined], ['Esc', '뒤로', undefined]] as [string, string, string | null | undefined][]) kx = chip(g, kx, 684, k, label, '#fff', real, 24, 13)
        g.globalAlpha = 1
      }
      g.textAlign = 'left'
    },
    keydown(e) {
      if (!menu) { if (!ign(e.key) && e.key !== 'Escape') { open(true); sel = 0 } return }
      const n = ITEMS.length
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') sel = (sel + 1) % n
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') sel = (sel + n - 1) % n
      else if (e.key === 'Escape') open(false)
      else if (e.key === 'Enter') {
        const name = ITEMS[sel][0]
        if (name === 'START') sm.go('select', { mode: 'play' })
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
