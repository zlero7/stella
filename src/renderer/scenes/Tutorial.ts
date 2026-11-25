import type { Scene, SceneManager } from '../core/SceneManager'
import { keyLabel, settings } from '../data/Storage'
import { FONT, AMBER, CYAN, ICE, chip, drawBg, header, panel } from '../render/theme'

// 튜토리얼: 곡 없이 메트로놈 박자에 맞춰 단노트 → 롱노트 → 동타를 차례로 쳐 본다. 기록·경험치 없음, 속도 고정
// 판정은 게임과 같은 시각 계산(누른 시각 = AudioContext 시각 - 출력 지연 - 판정 오프셋)을 쓴다
const B = 0.6, LEAD = 4, SPEED = 420, JY = 520, LW = 84, WIN = 0.12, PERFECT = 0.055, TAIL = 0.15
interface N { t: number; lane: number; end?: number; state: 'wait' | 'held' | 'perfect' | 'good' | 'miss' }
const note = (beat: number, lane: number, dur = 0): N => ({ t: (LEAD + beat) * B, lane, end: dur ? (LEAD + beat + dur) * B : undefined, state: 'wait' })
// [단계 이름, 설명, 시작 박, 노트]
const STAGES: [string, string, number, N[]][] = [
  ['1 · 단노트', '노트가 판정선(아래 선)에 닿을 때 그 줄의 키를 누릅니다', 0, [0, 1, 2, 3, 4, 5, 6, 7].map(i => note(i, [0, 1, 2, 3, 3, 2, 1, 0][i]))],
  ['2 · 롱노트', '길쭉한 노트는 닿을 때 누르고, 끝까지 누른 채로 있다가 뗍니다', 10, [note(12, 1, 2), note(16, 2, 2), note(20, 0, 3), note(20, 3, 3)]],
  ['3 · 동타', '한 줄에 두 개가 한꺼번에 오면 두 키를 같이 누릅니다', 26, [note(28, 0), note(28, 3), note(30, 1), note(30, 2), note(32, 0), note(32, 2), note(34, 1), note(34, 3)]]
]
const END = (LEAD + 38) * B

export const Tutorial = (sm: SceneManager): Scene => {
  let ctx: AudioContext | undefined, t0 = 0, next = 0, notes: N[] = [], back = 'settings', backData: unknown, flash = { text: '', at: -9, lane: 0 }
  const lat = () => ctx?.outputLatency || ctx?.baseLatency || 0
  const now = () => (ctx ? ctx.currentTime - t0 : -2)
  const stop = () => { void ctx?.close(); ctx = undefined }
  const start = () => { stop(); ctx = new AudioContext(); void ctx.resume(); t0 = ctx.currentTime + 1; next = 0; flash.at = -9; notes = STAGES.flatMap(s => s[3].map(n => ({ ...n, state: 'wait' as const }))) }
  const finished = () => now() > END
  const leave = () => { stop(); if (back === 'intro') sm.go('intro', { step: 2 }); else sm.go('settings', { back, backData }) }
  const beep = (at: number, f = 1000, v = 0.25) => {
    if (!ctx) return
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.frequency.value = f; g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.06)
    o.connect(g).connect(ctx.destination); o.start(at); o.stop(at + 0.08)
  }
  const say = (text: string, lane: number) => { flash = { text, at: now(), lane } }
  const laneOf = (code: string) => settings.keys.indexOf(code)
  const stageOf = (t: number) => { let k = 0; STAGES.forEach((s, i) => { if (t >= (LEAD + s[2] - 2) * B) k = i }); return k }
  const score = (k: number) => { const ns = STAGES[k][3].map(s => notes.find(n => n.t === s.t && n.lane === s.lane)!); return [ns.filter(n => n.state === 'perfect').length, ns.filter(n => n.state === 'good').length, ns.length] }

  return {
    enter(d) { const o = d as { back?: string; backData?: unknown } | undefined; back = o?.back ?? 'settings'; backData = o?.backData; start() },
    update() {
      if (!ctx || finished()) return
      while (t0 + next * B < ctx.currentTime + 0.5) { beep(t0 + next * B, next % 4 === 0 ? 1200 : 800, next % 4 === 0 ? 0.3 : 0.15); next++ } // 박자 소리: 네 박마다 높은 소리
      const t = now()
      for (const n of notes) {
        if (n.state === 'wait' && t > n.t + WIN) { n.state = 'miss'; say('MISS', n.lane) }
        else if (n.state === 'held' && t >= n.end! - TAIL) { n.state = 'perfect'; say('PERFECT', n.lane) } // 끝까지 눌렀다
      }
    },
    render(g) {
      drawBg(g)
      header(g, 'TUTORIAL', '튜토리얼')
      const t = now(), cur = STAGES[stageOf(Math.max(t, 0))], X0 = 640 - LW * 2
      panel(g, X0 - 20, 90, LW * 4 + 40, 560, 'rgba(34,224,255,.45)', 8, 0.85)
      for (let i = 0; i < 4; i++) { g.fillStyle = i % 3 === 0 ? 'rgba(122,216,255,.07)' : 'rgba(255,255,255,.05)'; g.fillRect(X0 + i * LW + 2, 96, LW - 4, JY - 96 + 30) }
      g.fillStyle = AMBER; g.fillRect(X0, JY - 2, LW * 4, 4)
      // 노트
      for (const n of notes) {
        if (n.state === 'miss' || n.state === 'perfect' && !n.end || n.state === 'good' && !n.end) continue
        const y = JY - (n.t - t) * SPEED, yt = n.end ? JY - (n.end - t) * SPEED : y, x = X0 + n.lane * LW + 6, held = n.state === 'held' || n.state === 'perfect' || n.state === 'good'
        if (y < 90 || yt > JY + 40) continue
        g.fillStyle = n.lane % 3 === 0 ? CYAN : '#fff'
        if (n.end) { const top = Math.max(yt, 96), bot = held ? JY : Math.min(y, JY + 30); g.globalAlpha = 0.55; g.fillRect(x + 12, top, LW - 36, bot - top); g.globalAlpha = 1 }
        if (!held) g.fillRect(x, y - 9, LW - 12, 18)
      }
      // 키캡
      settings.keys.forEach((k, i) => { g.fillStyle = 'rgba(6,11,28,.9)'; g.fillRect(X0 + i * LW + 6, JY + 40, LW - 12, 44); g.textAlign = 'center'; g.font = `800 20px ${FONT}`; g.fillStyle = AMBER; g.fillText(keyLabel(k), X0 + i * LW + LW / 2, JY + 70) })
      if (t - flash.at < 0.5) { g.font = `800 24px ${FONT}`; g.fillStyle = flash.text === 'MISS' ? '#ff6b6b' : flash.text === 'GOOD' ? '#7dff9a' : '#fff'; g.fillText(flash.text, 640, 440) }
      // 설명
      g.textAlign = 'left'
      if (!finished()) {
        g.font = `800 28px ${FONT}`; g.fillStyle = '#fff'; g.fillText(cur[0], 60, 170)
        g.font = `600 16px ${FONT}`; g.fillStyle = ICE
        for (let i = 0, line = '', ly = 206; i <= cur[1].length; i++) { const w = cur[1].slice(i, i + 1); if (i === cur[1].length || (w === ' ' && g.measureText(line).width > 300)) { g.fillText(line.trim(), 60, ly); ly += 26; line = '' } else line += w }
        if (t < 0) { g.font = `800 22px ${FONT}`; g.fillStyle = AMBER; g.fillText('박자 소리를 듣고 준비하세요', 60, 330) }
      } else {
        g.textAlign = 'center'; g.font = `800 34px ${FONT}`; g.fillStyle = '#fff'; g.fillText('튜토리얼 끝', 640, 200)
        STAGES.forEach((s, k) => { const [p, gd, tot] = score(k); g.font = `700 20px ${FONT}`; g.fillStyle = p + gd === tot ? '#7dff9a' : ICE; g.fillText(`${s[0]}   ${p + gd} / ${tot}`, 640, 270 + k * 40) })
        g.font = `15px ${FONT}`; g.fillStyle = ICE; g.fillText('놓친 것이 많으면 R로 다시 해 보세요. 곡 선택에서 쉬운 곡(EASY)부터 시작하면 됩니다.', 640, 430)
      }
      let kx = 48
      kx = chip(g, kx, 684, 'R', '다시', '#fff', 'r')
      kx = chip(g, kx, 684, finished() ? 'Enter' : 'Esc', finished() ? '끝내기' : '건너뛰기', '#fff', undefined)
    },
    keydown(e) {
      if (e.key === 'Escape' || (e.key === 'Enter' && finished())) { leave(); return }
      if (e.key.toLowerCase() === 'r') { start(); return }
      const lane = laneOf(e.code)
      if (lane < 0 || e.repeat || !ctx || finished()) return
      const at = ctx.currentTime - (performance.now() - e.timeStamp) / 1000 - lat() - settings.judgeOffset / 1000 - t0
      let best: N | undefined
      for (const n of notes) if (n.state === 'wait' && n.lane === lane && Math.abs(at - n.t) <= WIN && (!best || n.t < best.t)) best = n
      if (!best) return
      const perfect = Math.abs(at - best.t) <= PERFECT
      beep(ctx.currentTime, 1500, 0.2)
      if (best.end) best.state = 'held'
      else best.state = perfect ? 'perfect' : 'good'
      say(perfect ? 'PERFECT' : 'GOOD', lane)
    },
    keyup(e) {
      const lane = laneOf(e.code), t = now()
      const n = notes.find(x => x.state === 'held' && x.lane === lane)
      if (!n) return
      if (t >= n.end! - TAIL) n.state = 'perfect'
      else { n.state = 'miss'; say('MISS', lane) } // 끝나기 전에 뗐다
    }
  }
}
