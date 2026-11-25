import type { Scene, SceneManager } from '../core/SceneManager'
import { account, keyLabel, saveSettings, settings } from '../data/Storage'
import { FONT, AMBER, CYAN, ICE, NAVY, chip, drawBg, ease, footer, header, hit, overRect, panel } from '../render/theme'

// 첫 실행 안내: 키 확인 → 싱크 보정 → 연습 → 로그인 안내. 어느 단계든 Esc로 건너뛰고, 끝내거나 건너뛰면 다시 뜨지 않는다 (settings.firstRun)
// 키 설정·보정은 기존 화면을 그대로 불러 쓰고, 끝나면 이 화면의 다음 단계로 돌아온다
interface Step { title: string; sub: string; lines: string[]; btns: [string, () => void][] }

export const Intro = (sm: SceneManager): Scene => {
  let step = 0, sel = 0
  const finish = (to = 'select', data: unknown = { mode: 'play' }) => { settings.firstRun = false; saveSettings(); sm.go(to, data) }
  const next = () => { if (step >= 3) finish(); else { step++; sel = 0 } }
  const steps = (): Step[] => [
    { title: 'STEP 1 · 키 확인', sub: '노트가 내려오면 아래 키를 누릅니다',
      lines: ['4키 모드의 기본 키입니다. 6키 모드와 다른 키로 바꾸고 싶으면 키 바꾸기를 누르세요.', '나중에 설정(F1) → CONTROL에서도 바꿀 수 있습니다.'],
      btns: [['다음', next], ['키 바꾸기', () => sm.go('keys', { keys: 4, back: 'intro' })]] },
    { title: 'STEP 2 · 싱크 보정', sub: '소리와 화면이 어긋나면 이유 없이 어렵게 느껴집니다',
      lines: ['메트로놈 소리에 맞춰 아무 키나 12번 누르면 자동으로 맞춰집니다 (약 20초).', '유선 이어폰·헤드폰을 권장합니다. 나중에 설정 → GAME 맨 위에서 다시 할 수 있습니다.'],
      btns: [['보정하기', () => sm.go('calib', { back: 'intro' })], ['다음', next]] },
    { title: 'STEP 3 · 연습', sub: '곡을 치기 전에 노트 치는 법을 한 번 해 봅니다',
      lines: ['단노트, 롱노트, 동타를 차례로 쳐 봅니다 (약 40초). 기록은 남지 않습니다.', '건너뛰어도 됩니다. 나중에 설정 → GAME의 튜토리얼에서 다시 할 수 있습니다.'],
      btns: [['연습하기', () => sm.go('tutorial', { back: 'intro' })], ['다음', next]] },
    { title: 'STEP 4 · 로그인', sub: '로그인하면 순위와 레벨이 남습니다',
      lines: ['로그인하지 않아도 플레이할 수 있지만, 순위·경험치·컬렉션·래더는 로그인해야 씁니다.', '계정은 아이디와 비밀번호만으로 만듭니다. 메인 메뉴의 ACCOUNT에서 언제든 만들 수 있습니다.'],
      btns: [['시작하기', () => finish()], [account.token ? '이미 로그인했습니다' : '로그인하러 가기', () => { if (!account.token) finish('account', undefined); else finish() }]] }
  ]
  const skip = () => finish()
  return {
    enter(d) { const o = d as { step?: number } | undefined; step = o?.step ?? 0; sel = 0 },
    render(g) {
      drawBg(g)
      header(g, 'WELCOME', '첫 실행 안내')
      const s = steps()[step], X = 270, Y = 120, W = 740, H = 470
      panel(g, X, Y, W, H, 'rgba(34,224,255,.6)', 14, 0.88)
      for (let i = 0; i < 4; i++) { g.fillStyle = i === step ? AMBER : i < step ? CYAN : 'rgba(255,255,255,.22)'; g.fillRect(X + 40 + i * 64, Y + 28, 54, 5) }
      g.textAlign = 'left'; g.font = `800 30px ${FONT}`; g.fillStyle = '#fff'; g.fillText(s.title, X + 40, Y + 84)
      g.font = `600 17px ${FONT}`; g.fillStyle = CYAN; g.fillText(s.sub, X + 40, Y + 116)
      if (step === 0) { // 키캡
        const ks = settings.keys, cw = 76, gap = 14, x0 = X + W / 2 - (ks.length * cw + (ks.length - 1) * gap) / 2
        ks.forEach((k, i) => { const x = x0 + i * (cw + gap); g.fillStyle = 'rgba(6,11,28,.85)'; g.fillRect(x, Y + 150, cw, cw); g.strokeStyle = AMBER; g.lineWidth = 2; g.strokeRect(x + 1, Y + 150, cw - 2, cw); g.textAlign = 'center'; g.font = `800 ${keyLabel(k).length > 3 ? 17 : 28}px ${FONT}`; g.fillStyle = '#fff'; g.fillText(keyLabel(k), x + cw / 2, Y + 150 + cw / 2 + 10) })
      } else if (step === 1) { // 오프셋 요약
        g.textAlign = 'center'; g.font = `300 56px ${FONT}`; g.fillStyle = '#fff'; g.fillText(`${settings.judgeOffset > 0 ? '+' : ''}${settings.judgeOffset} ms`, X + W / 2, Y + 205)
        g.font = `600 14px ${FONT}`; g.fillStyle = ICE; g.fillText('지금 판정 오프셋', X + W / 2, Y + 232)
      } else if (step === 2) {
        g.textAlign = 'center'; g.font = `800 28px ${FONT}`; g.fillStyle = '#fff'; g.fillText('단노트 · 롱노트 · 동타', X + W / 2, Y + 205)
      } else {
        g.textAlign = 'center'; g.font = `800 22px ${FONT}`; g.fillStyle = account.token ? '#7dff9a' : AMBER; g.fillText(account.token ? `${account.nick} 으로 로그인되어 있습니다` : '지금은 손님으로 플레이합니다', X + W / 2, Y + 205)
      }
      g.textAlign = 'left'; g.font = `15px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.85)'
      let ly = Y + 290 // 글자 폭을 재서 카드 안에서 줄을 바꾼다
      for (const para of s.lines) { let cur = ''; for (const w of para.split(' ')) { if (cur && g.measureText(cur + ' ' + w).width > W - 80) { g.fillText(cur, X + 40, ly); ly += 24; cur = w } else cur = cur ? cur + ' ' + w : w } g.fillText(cur, X + 40, ly); ly += 30 }
      const bw = 300, by = Y + H - 84
      s.btns.forEach(([label, fn], i) => {
        const bx = X + 40 + i * (bw + 20), on = sel === i, hv = ease(`intro${i}`, on || overRect(bx, by, bw, 52))
        hit(bx, by, bw, 52, () => { sel = i; fn() }, () => { sel = i })
        g.fillStyle = on ? AMBER : `rgba(${20 + 30 * hv},${40 + 40 * hv},${90 + 60 * hv},.85)`; g.fillRect(bx, by, bw, 52)
        g.strokeStyle = on ? '#fff' : 'rgba(255,255,255,.4)'; g.lineWidth = 1.5; g.strokeRect(bx + 0.75, by + 0.75, bw - 1.5, 50.5)
        g.textAlign = 'center'; g.font = `800 20px ${FONT}`; g.fillStyle = on ? NAVY : '#fff'; g.fillText(label, bx + bw / 2, by + 33)
      })
      footer(g)
      let kx = 48
      kx = chip(g, kx, 684, '←→', '고르기', '#fff', null, 24, 13); kx = chip(g, kx, 684, 'Enter', '확인', '#fff', undefined, 24, 13)
      chip(g, kx, 684, 'Esc', '건너뛰고 시작', '#fff', undefined, 24, 13)
    },
    keydown(e) {
      if (e.key === 'Escape') skip()
      else if (e.key === 'ArrowRight') sel = Math.min(sel + 1, 1)
      else if (e.key === 'ArrowLeft') sel = Math.max(sel - 1, 0)
      else if (e.key === 'Enter') steps()[step].btns[sel][1]()
    }
  }
}
