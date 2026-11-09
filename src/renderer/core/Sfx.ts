import { gainOf, settings } from '../data/Storage'

// 효과음: 파일 없이 짧은 소리를 즉석에서 만든다 (메뉴 이동·선택·뒤로, 플레이 타격음). 곡 시계(AudioClock)와는 별개의 컨텍스트
let ctx: AudioContext | undefined
const tone = (f0: number, f1: number, ms: number, vol: number, type: OscillatorType = 'sine') => {
  if (!settings.sfx) return
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain()
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + ms / 1000)
    g.gain.setValueAtTime(vol * gainOf(settings.volume), t); g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000)
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + ms / 1000 + 0.02)
  } catch { /* 소리를 못 내도 게임은 계속 */ }
}

export const sfx = {
  move: () => tone(900, 700, 55, 0.5),
  ok: () => tone(620, 1240, 130, 0.7, 'triangle'),
  back: () => tone(700, 380, 110, 0.55, 'triangle'),
  // 타격음: 사각파 삑 소리는 매 노트마다 귀를 찔러서, 낮고 짧은 사인파 "톡"으로 (크기는 설정의 타격음: 약/보통)
  hit: () => { if (settings.hit) tone(620, 300, 32, settings.hit === 2 ? 0.3 : 0.15) }
}

// 메뉴에서 누른 키에 맞는 소리 (플레이 화면은 제외하고 SceneManager가 부른다)
export function uiSound(key: string) {
  if (key === 'Enter' || key === ' ') sfx.ok()
  else if (key === 'Escape') sfx.back()
  else if (key.startsWith('Arrow') || key === 'Tab' || key === 'PageUp' || key === 'PageDown') sfx.move()
}
