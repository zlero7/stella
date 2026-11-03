import type { Song } from '../../shared/types'
import { FONT, AMBER, artOf, drawBg, drawCover, fit } from './theme'

const TIPS = [
  'F3 키로 4키 / 6키를 바꿀 수 있습니다.',
  'Tab 키로 가수별 분류를 바꿀 수 있습니다.',
  'F1 키로 설정에서 싱크와 노트 속도를 맞출 수 있습니다.',
  '플레이 중 Esc 키로 잠시 멈출 수 있습니다.',
  '곡 선택에서 글자 키를 누르면 그 글자로 시작하는 곡으로 건너뜁니다.'
]

// 곡 로딩 화면: 곡 그림을 꽉 채우고, 가운데 어두운 띠에 곡명 · 가수 · 진행률, 아래에 안내 한 줄
// pct: 0~1 (모르면 undefined: 띠 아래 선이 흐르기만 한다). msg가 있으면 진행률 자리에 그 글자를 보여 준다
export function drawLoading(g: CanvasRenderingContext2D, song: Song | undefined, pct?: number, msg?: string, sub?: string) {
  const art = artOf(song), t = performance.now() / 1000
  if (art?.img) drawCover(g, art.img as CanvasImageSource, (art.img as { width: number }).width, (art.img as { height: number }).height, 0, 0, 1280, 720)
  else drawBg(g, song)

  const y = 300
  g.fillStyle = 'rgba(0,0,0,.58)'; g.fillRect(0, y, 1280, 112) // 곡명 띠
  g.fillStyle = 'rgba(0,0,0,.72)'; g.fillRect(0, y + 112, 1280, 52) // 가수 띠
  // 진행선: 곡명 띠 아래. 진행률을 모르면 빛이 흘러간다
  g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(0, y + 110, 1280, 3)
  g.fillStyle = '#fff'
  if (pct !== undefined) g.fillRect(0, y + 110, 1280 * pct, 3)
  else { const x = ((t * 0.7) % 1.4 - 0.2) * 1280; g.fillRect(Math.max(x, 0), y + 110, Math.min(260, 1280 - x), 3) }

  g.textAlign = 'left'
  g.font = `300 56px ${FONT}`; g.fillStyle = '#fff'
  g.fillText(fit(g, song?.meta.title ?? '', 1000), 40, y + 76)
  g.textAlign = 'right'; g.font = `600 17px ${FONT}`; g.fillStyle = msg ? AMBER : 'rgba(255,255,255,.85)'
  g.fillText(msg ?? (pct !== undefined ? `${Math.round(pct * 100)}%` : ''), 1250, y + 100)

  g.textAlign = 'left'
  let x = 40
  const part = (label: string, value: string) => {
    g.font = `600 15px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(label, x, y + 144); x += g.measureText(label).width + 10
    g.font = `800 15px ${FONT}`; g.fillStyle = '#fff'; const v = fit(g, value, 420); g.fillText(v, x, y + 144); x += g.measureText(v).width + 40
  }
  if (song) {
    part('Artist', song.meta.artist)
    const sg = song.meta.singers?.join(', ')
    if (sg && sg !== song.meta.artist) part('Sung by', sg)
  }
  if (sub) part('Mode', sub)

  // 아래 안내: 곡마다 같은 문구가 나온다
  g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 680, 1280, 40)
  g.textAlign = 'center'; g.font = `500 15px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.88)'
  const tip = TIPS[[...(song?.dir ?? '')].reduce((n, c) => n + c.charCodeAt(0), 0) % TIPS.length]
  const w = g.measureText(tip).width
  g.fillText(tip, 640 + 14, 706)
  g.beginPath(); g.arc(640 - w / 2 - 6, 700, 8, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,.85)'; g.fill()
  g.fillStyle = '#000'; g.font = `800 12px ${FONT}`; g.fillText('i', 640 - w / 2 - 6, 704.5)
  g.textAlign = 'left'
}
