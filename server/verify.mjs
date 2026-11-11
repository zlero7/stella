// 점수 검증: 앱이 점수와 함께 보낸 판정 개수(n)로 점수·정확도·콤보·배지가 서로 맞는지 본다.
// 서버는 판을 다시 계산할 수 없어서(리플레이가 없다), 숫자끼리 앞뒤가 맞는지만 확인한다. 숫자를 마음대로 올린 요청을 걸러 내는 용도다.
const W = [1, 0.7, 0.4, 0.2, 0.1, 0] // 판정별 가중치 (앱의 JUDGES.weight와 같다)
const COMBO_MAX = 1.5 // 점수의 콤보 배율 상한 (앱의 comboMult와 같다)

// n: 판정 개수 6칸(PERFECT·GREAT·GOOD·NICE·BAD·MISS). total(그 채보의 판정 총수)을 알면 합이 그 수와 거의 같은지도 본다.
// 앱이 내려받은 채보가 서버와 조금 다를 수 있어(자동 채보 재생성) 1%(최소 2) 안쪽 차이는 허용한다. 노트를 몇 개만 친 것처럼 꾸민 제출을 막는 용도다
export function plausible({ score, acc, mc, badge, n }, total) {
  if (!Array.isArray(n) || n.length !== 6 || !n.every(x => Number.isInteger(x) && x >= 0 && x <= 99999)) return false
  const sum = n.reduce((a, b) => a + b, 0)
  if (sum === 0 || (total && Math.abs(sum - total) > Math.max(2, total * 0.01)) || mc > sum) return false
  const frac = n.reduce((s, c, i) => s + c * W[i], 0) / sum // 가중치 평균 0~1
  if (Math.abs(acc - 100 * frac) > 0.05) return false
  // 점수 = 100만 × (배율 곱한 가중치 합 / 배율 합), 배율은 1~1.5라서 이 범위를 벗어날 수 없다
  if (score > 1e6 * Math.min(1, frac * COMBO_MAX) + 0.5 || score < (1e6 * frac) / COMBO_MAX - 1) return false
  if (n[5] > 0) return !badge // MISS가 있으면 배지는 없다
  if (badge === 'ALL PERFECT') return n.slice(1).every(c => c === 0)
  if (badge === 'FULL COMBO') return mc === sum
  return false // MISS가 없으면 풀콤보나 올 퍼펙트 배지가 붙어야 한다
}
