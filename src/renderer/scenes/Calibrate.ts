import type { Scene, SceneManager } from '../core/SceneManager'
import { saveSettings, settings } from '../data/Storage'
import { FONT, AMBER, CYAN, ICE, accentFill, card, chip, drawBg, header, meter, pill } from '../render/theme'

// 캘리브레이션: 메트로놈(120BPM) 소리에 맞춰 아무 키나 12번 누르면, 평균 오차로 판정 오프셋을 정한다 (처음 2번은 버린다)
// 게임과 같은 식으로 잰다: 누른 시각 = AudioContext 시각 - 출력 지연. 평균이 +면 소리보다 늦게 누른 것이라 판정 오프셋도 +
const BEAT = 0.5, NEED = 12, SKIP = 2
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

export const Calibrate = (sm: SceneManager): Scene => {
  let ctx: AudioContext | undefined, t0 = 0, next = 0, errs: number[] = [], back = 'settings', backData: unknown
  const lat = () => ctx?.outputLatency || ctx?.baseLatency || 0
  const stop = () => { void ctx?.close(); ctx = undefined }
  const start = () => { stop(); ctx = new AudioContext(); void ctx.resume(); t0 = ctx.currentTime + 1.2; next = 0; errs = [] }
  const done = () => errs.length >= NEED
  const stats = () => {
    const v = errs.slice(SKIP), m = v.reduce((a, b) => a + b, 0) / Math.max(v.length, 1)
    return { m, sd: Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(v.length, 1)) }
  }
  const leave = () => { stop(); sm.go('settings', { back, backData }) }
  const beep = (at: number) => {
    const o = ctx!.createOscillator(), g = ctx!.createGain()
    o.frequency.value = 1000; g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.35, at + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.06)
    o.connect(g).connect(ctx!.destination); o.start(at); o.stop(at + 0.08)
  }

  return {
    enter(d) { const o = d as { back?: string; backData?: unknown } | undefined; back = o?.back ?? 'title'; backData = o?.backData; start() },
    update() {
      if (!ctx || done()) return
      while (t0 + next * BEAT < ctx.currentTime + 1) { beep(t0 + next * BEAT); next++ }
    },
    render(g) {
      drawBg(g)
      header(g, 'SYNC', '싱크 보정')
      g.textAlign = 'center'
      const cx = 640
      card(g, 340, 100, 600, 520, 'CALIBRATION')
      g.textAlign = 'center'
      g.font = `700 18px ${FONT}`; g.fillStyle = '#fff'
      g.fillText(done() ? '측정 완료' : '화면 말고 소리에 맞춰 아무 키나 누르세요', cx, 160)
      g.font = `14px ${FONT}`; g.fillStyle = ICE
      g.fillText(done() ? '아래 값을 판정 오프셋에 적용할 수 있습니다' : `유선 이어폰·헤드폰을 권장합니다 (처음 ${SKIP}번은 계산에서 빠집니다)`, cx, 186)

      // 메트로놈 박동: 소리가 나는 순간 링이 퍼진다
      const now = ctx?.currentTime ?? 0, ph = ctx && !done() ? ((now - t0) / BEAT) % 1 : 0.5, pulse = ctx && now > t0 && !done() ? Math.max(0, 1 - ph * 3) : 0
      g.strokeStyle = `rgba(122,216,255,${0.25 + 0.6 * pulse})`; g.lineWidth = 3 + 5 * pulse
      g.beginPath(); g.arc(cx, 290, 44 + 14 * pulse, 0, Math.PI * 2); g.stroke()
      g.font = `900 40px ${FONT}`; g.fillStyle = '#fff'; g.fillText(`${Math.min(errs.length, NEED)}`, cx, 304)
      g.font = `600 13px ${FONT}`; g.fillStyle = ICE; g.fillText(`/ ${NEED}`, cx, 326)

      // 오차 띠: 가운데 = 소리와 정확히 일치. 누른 순간마다 점이 찍힌다
      const sx = 380, sw = 520, sy = 400, range = 120 // ±120ms
      g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.roundRect(sx, sy - 30, sw, 60, 14); g.fill()
      g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(cx - 1, sy - 30, 2, 60)
      errs.forEach((e, i) => {
        const x = cx + clamp(e, -range, range) / range * (sw / 2 - 10), skipped = i < SKIP
        g.fillStyle = skipped ? 'rgba(255,255,255,.3)' : i === errs.length - 1 ? AMBER : CYAN
        g.beginPath(); g.arc(x, sy + ((i % 3) - 1) * 14, 6, 0, Math.PI * 2); g.fill()
      })
      g.font = `600 13px ${FONT}`; g.fillStyle = ICE; g.textAlign = 'left'; g.fillText('← 빠름', sx, sy + 52); g.textAlign = 'right'; g.fillText('늦음 →', sx + sw, sy + 52); g.textAlign = 'center'
      meter(g, sx, 470, sw, errs.length / NEED)

      if (done()) {
        const { m, sd } = stats(), rec = clamp(Math.round(m / 5) * 5, -100, 100)
        g.font = `800 26px ${FONT}`; g.fillStyle = '#fff'
        g.fillText(`평균 ${m >= 0 ? '+' : ''}${Math.round(m)}ms  ${Math.abs(m) < 3 ? '정확' : m > 0 ? '(늦게 누름)' : '(빠르게 누름)'}`, cx, 520)
        g.font = `14px ${FONT}`; g.fillStyle = ICE
        g.fillText(`적용할 판정 오프셋 ${rec > 0 ? '+' : ''}${rec}ms  (지금 ${settings.judgeOffset > 0 ? '+' : ''}${settings.judgeOffset}ms)${sd > 40 ? '  ·  입력이 들쭉날쭉합니다, R로 다시' : ''}`, cx, 548)
      } else {
        g.font = `14px ${FONT}`; g.fillStyle = ICE; g.fillText('지금 판정 오프셋 ' + `${settings.judgeOffset > 0 ? '+' : ''}${settings.judgeOffset}ms`, cx, 520)
      }
      // 키 안내
      let kx = 48
      for (const [k, label] of (done() ? [['Enter', '적용'], ['R', '다시'], ['Esc', '취소']] : [['R', '다시'], ['Esc', '취소']]) as [string, string][]) kx = chip(g, kx, 684, k, label, '#0b2a6b', k === 'R' ? 'r' : undefined)
    },
    keydown(e) {
      if (e.key === 'Escape') { leave(); return }
      if (e.key.toLowerCase() === 'r') { start(); return }
      if (done()) {
        if (e.key === 'Enter') { settings.judgeOffset = clamp(Math.round(stats().m / 5) * 5, -100, 100); saveSettings(); leave() }
        return
      }
      if (!ctx || e.repeat || /^(Shift|Control|Alt|Meta|Tab|F\d+|Arrow.*)$/.test(e.key)) return
      // 게임과 같은 시각 계산: 키가 눌린 순간의 AudioContext 시각에서 출력 지연을 뺀다
      const at = ctx.currentTime - (performance.now() - e.timeStamp) / 1000 - lat(), k = Math.round((at - t0) / BEAT), err = (at - t0 - k * BEAT) * 1000
      if (k < 0 || Math.abs(err) > 250) return // 첫 소리 전이거나 어느 박자에도 안 맞는 입력
      errs.push(err)
      if (done()) void ctx.suspend() // 측정이 끝나면 메트로놈을 멈춘다
    }
  }
}
