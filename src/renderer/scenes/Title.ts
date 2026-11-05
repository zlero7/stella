import type { Scene, SceneManager } from '../core/SceneManager'
import { account, settings } from '../data/Storage'
import { FONT, AMBER, accentFill, drawBg, slant, glow, hit, press, starPath, ease } from '../render/theme'

const ITEMS: [string, string][] = [['START', '곡 선택'], ['VERSUS', '친구와 대결'], ['ACCOUNT', ''], ['SETTINGS', '환경 설정'], ['EXIT', '종료']] // ACCOUNT의 설명은 로그인 상태에 따라 바뀐다
const ign = (k: string) => /^(Shift|Control|Alt|Meta|CapsLock|NumLock|F\d+)$/.test(k) // 이 키로는 시작 화면을 넘기지 않는다
let seen = false // 처음 켰을 때만 "PRESS ANY KEY" 화면을 거친다 (설정 등에서 돌아오면 바로 메뉴)

export const Title = (sm: SceneManager): Scene => {
  let sel = 0, menu = false, since = 0
  const open = (v: boolean) => { menu = seen = v; since = performance.now() }
  return {
    enter() { menu = seen; since = performance.now() - 1000 },
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
      const fs = 196 - 64 * m, by = 352 - 14 * m, cx = 640 - 255 * m
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

      // 메뉴: 오른쪽에서 밀려 들어오는 비스듬한 세로 띠. 고른 줄은 주황으로 길게 뻗는다
      if (m > 0) {
        g.globalAlpha = m
        ITEMS.forEach(([name, sub], i) => {
          const k = ease('title' + i, i === sel), on = k > 0.5, h = 68, w = 440 + 40 * k, x = 770 - 40 * k + (1 - m) * 160, y = 196 + i * (h + 14)
          slant(g, x, y, w, h, 22); g.fillStyle = 'rgba(8,24,70,.74)'; g.fill()
          g.strokeStyle = `rgba(255,255,255,${0.3 * (1 - k)})`; g.lineWidth = 1; g.stroke()
          if (k > 0.01) {
            g.save(); g.globalAlpha *= k
            const og = g.createLinearGradient(x, 0, x + w, 0); og.addColorStop(0, '#ffb13b'); og.addColorStop(0.7, '#ff7a59'); og.addColorStop(1, '#ff5c8a')
            glow(g, 'rgba(255,140,60,.6)', 16, () => { slant(g, x, y, w, h, 22); g.fillStyle = og; g.fill() })
            g.restore()
          }
          if (m > 0.6) hit(x, y, w, h, () => { sel = i; press('Enter') }, () => { sel = i }) // 위에 올리면 고르고, 누르면 실행
          g.textAlign = 'left'
          g.fillStyle = '#fff'; g.font = `${on ? 800 : 600} ${(24 + 3 * k).toFixed(1)}px ${FONT}`
          g.fillText(name.split('').join(' '), x + 46, y + 32)
          g.font = `${(14 + k).toFixed(1)}px ${FONT}`; g.fillStyle = `rgba(255,255,255,${0.65 + 0.35 * k})`
          g.fillText(name === 'ACCOUNT' ? (account.token ? `${account.nick}  ·  내 계정` : '로그인 / 회원가입') : sub, x + 46, y + 55)
          if (on) { g.textAlign = 'right'; g.font = `800 22px ${FONT}`; g.fillStyle = '#fff'; g.fillText('▶', x + w - 34, y + 42) }
        })
        g.textAlign = 'center'; g.font = `14px ${FONT}`; g.fillStyle = '#0b2a6b'
        g.fillText('↑ ↓  선택   ·   Enter  확인   ·   Esc  뒤로', 640, 696)
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
        else if (name === 'VERSUS') sm.go('vs')
        else if (name === 'ACCOUNT') sm.go('account')
        else if (name === 'SETTINGS') sm.go('settings', { back: 'title' })
        else window.api?.quit?.()
      }
    }
  }
}
