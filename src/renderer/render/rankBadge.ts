import type { RankOpts } from '../../shared/types'
import { FONT } from './theme'

// 순위 줄 오른쪽에 붙는 작은 옵션 배지: 판정 강도(H 하드·MX 맥스), 랜덤(R)·미러(MI)·페이드(FI/FO). 보통 판정에 옵션 없음이면 아무것도 그리지 않는다 (옛 기록도 opt가 없어 배지 없음)
// rightX에 오른쪽 끝을 맞춰 그리고, 가장 왼쪽 x를 돌려준다 (옆 글자가 그 앞에서 끊기게)
export function optBadges(g: CanvasRenderingContext2D, rightX: number, baseY: number, opt?: RankOpts) {
  const list: [string, string][] = []
  if (opt?.j === 1) list.push(['H', '#ff9a4a']); else if (opt?.j === 2) list.push(['MX', '#ff4d6d'])
  if (opt?.r) list.push(['R', '#7ad8ff'])
  if (opt?.m) list.push(['MI', '#b79bff'])
  if (opt?.f) list.push([opt.f === 1 ? 'FI' : 'FO', '#7dff9a'])
  g.save(); g.font = `800 11px ${FONT}`; g.textAlign = 'center'
  let x = rightX
  for (const [t, c] of list.reverse()) {
    const w = Math.ceil(g.measureText(t).width) + 8
    x -= w; g.fillStyle = 'rgba(6,12,28,.9)'; g.fillRect(x, baseY - 11, w, 14); g.strokeStyle = c; g.lineWidth = 1; g.strokeRect(x + 0.5, baseY - 10.5, w - 1, 13)
    g.fillStyle = c; g.fillText(t, x + w / 2, baseY); x -= 3
  }
  g.restore()
  return list.length ? x + 3 : rightX
}
