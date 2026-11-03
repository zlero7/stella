import type { Scene, SceneManager } from '../core/SceneManager'
import { FONT, AMBER, NAVY, accentFill, drawBg, ease, hit, pill, press, chip, overRect } from '../render/theme'
import { settings, saveSettings, keyLabel } from '../data/Storage'

// 키 설정: 4K / 6K 탭, 위쪽 키캡 그림, 레인마다 한 줄씩 (ACTION | KEYBOARD). 줄을 고르고 Enter → 새 키를 누르면 바뀐다 (이미 쓰는 키면 서로 자리를 바꾼다)
const OK = /^(Key|Digit|Space|Semicolon|Quote|Comma|Period|Slash)/

export const Keys = (sm: SceneManager): Scene => {
  let n = 4, sel = 0, binding = false, back = 'title', backData: unknown // back·backData: 설정 화면이 돌아갈 곳
  const list = () => (n === 6 ? settings.keys6 : settings.keys)
  const setKeys = (a: string[]) => { if (n === 6) settings.keys6 = a; else settings.keys = a; saveSettings() }
  const tab = (k: number) => { n = k; sel = Math.min(sel, k - 1); binding = false }
  return {
    enter(d) { const o = d as { keys?: number; back?: string; backData?: unknown } | undefined; n = o?.keys === 6 ? 6 : o?.keys === 4 ? 4 : settings.keyMode; back = o?.back ?? 'title'; backData = o?.backData; sel = 0; binding = false },
    render(g) {
      drawBg(g)
      const keys = list(), t = performance.now() / 1000
      g.font = `800 16px ${FONT}`; g.fillStyle = '#fff'; g.fillText('INPUT SETTING', 40, 44)

      // 위쪽: 4K / 6K 탭
      for (const [i, k] of ([4, 6] as const).entries()) {
        const x = 420 + i * 224, on = n === k
        hit(x, 62, 216, 42, () => tab(k))
        if (on) pill(g, x, 62, 216, 42, accentFill(g, x, 216))
        else { const hv = ease('ktab' + k, overRect(x, 62, 216, 42)); pill(g, x, 62, 216, 42, `rgba(${8 + 40 * hv},${24 + 66 * hv},${70 + 130 * hv},.7)`); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.5; g.stroke() }
        g.font = `800 19px ${FONT}`; g.fillStyle = on ? '#fff' : 'rgba(255,255,255,.78)'; g.textAlign = 'center'; g.fillText(`${k}K KEYS`, x + 108, 90); g.textAlign = 'left'
      }

      // 키캡 그림: 고른 레인의 키가 주황으로 빛난다
      const cw = 76, gap = 14, total = n * cw + (n - 1) * gap, x0 = 640 - total / 2
      keys.forEach((code, i) => {
        const x = x0 + i * (cw + gap), on = i === sel
        hit(x, 130, cw, cw, () => { sel = i })
        g.fillStyle = on ? AMBER : 'rgba(8,24,70,.78)'; g.beginPath(); g.roundRect(x, 130, cw, cw, 14); g.fill()
        g.strokeStyle = on ? '#fff' : 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.stroke()
        g.font = `800 ${keyLabel(code).length > 3 ? 17 : 26}px ${FONT}`; g.fillStyle = on ? '#3a2000' : '#fff'; g.textAlign = 'center'; g.fillText(keyLabel(code), x + cw / 2, 130 + cw / 2 + 9); g.textAlign = 'left'
      })

      // 표: ACTION | KEYBOARD
      const AX = 330, AW = 310, KX = 644, KW = 306, RH = 44, TOP = 262
      g.font = `700 15px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.8)'; g.textAlign = 'center'
      g.fillText('ACTION', AX + AW / 2, TOP - 14); g.fillText('KEYBOARD', KX + KW / 2, TOP - 14); g.textAlign = 'left'
      keys.forEach((code, i) => {
        const y = TOP + i * (RH + 4), on = i === sel, k = ease('krow' + i, on)
        hit(AX, y, AW + 4 + KW, RH, () => { if (i === sel && !binding) press('Enter'); sel = i }, () => { if (!binding) sel = i })
        for (const [px, pw] of [[AX, AW], [KX, KW]]) {
          g.fillStyle = `rgba(${8 + 24 * k},${24 + 40 * k},${70 + 70 * k},${0.74 + 0.1 * k})`; g.fillRect(px, y, pw, RH)
          if (k > 0.02) { g.strokeStyle = `rgba(255,177,59,${k})`; g.lineWidth = 2.5; g.strokeRect(px + 1.25, y + 1.25, pw - 2.5, RH - 2.5) }
        }
        g.textAlign = 'center'
        g.font = `${on ? 800 : 700} 18px ${FONT}`; g.fillStyle = on ? '#ffe27a' : 'rgba(255,255,255,.88)'; g.fillText(`TRACK ${i + 1}`, AX + AW / 2, y + 29)
        const asking = binding && on
        g.fillStyle = asking ? `rgba(255,226,122,${0.55 + 0.45 * Math.abs(Math.sin(t * 5))})` : on ? '#ffe27a' : '#fff'
        g.fillText(asking ? '키를 누르세요' : keyLabel(code), KX + KW / 2, y + 29)
        g.textAlign = 'left'
      })

      let hx = 48
      for (const [k, label, real] of [['↑↓', '선택', null], ['Enter', '변경', undefined], ['Tab', '4K / 6K', undefined], ['Esc', '닫기', undefined]] as [string, string, string | null | undefined][]) hx = chip(g, hx, 690, k, label, NAVY, real)
    },
    keydown(e) {
      if (binding) {
        if (e.key === 'Escape') { binding = false; return }
        if (!OK.test(e.code)) return
        const a = [...list()], j = a.indexOf(e.code)
        if (j >= 0 && j !== sel) a[j] = a[sel]
        a[sel] = e.code; setKeys(a); binding = false
        return
      }
      if (e.key === 'Escape') { sm.go('settings', { back, backData, at: n === 6 ? '6키 배치' : '4키 배치' }); return }
      if (e.key === 'ArrowDown') sel = (sel + 1) % n
      else if (e.key === 'ArrowUp') sel = (sel + n - 1) % n
      else if (e.key === 'Tab') { e.preventDefault(); tab(n === 4 ? 6 : 4) }
      else if (e.key === 'Enter') binding = true
    }
  }
}
