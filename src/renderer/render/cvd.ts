import { settings } from '../data/Storage'

// 색각 보정: 화면 전체(캔버스)에 색 변환 필터를 건다. 시뮬레이션한 색맹 시야와 원본의 차이를 다른 색 채널로 옮기는 다이얼타나이즈(daltonize) 방식
// 0 끔 · 1 적색약(P) · 2 녹색약(D) · 3 청색약(T). 표준 근사식이라 사람마다 체감은 다르다
export const CVD_NAMES = ['끔', '적색약', '녹색약', '청색약']
const SIM = [[], [[0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758]], [[0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7]], [[0.95, 0.05, 0], [0, 0.433, 0.567], [0, 0.475, 0.525]]]
const SHIFT = [[], [[0, 0, 0], [0.7, 1, 0], [0.7, 0, 1]], [[0, 0, 0], [0.7, 1, 0], [0.7, 0, 1]], [[1, 0.7, 0], [0, 1, 0], [0, 0.7, 1]]]

// I + SHIFT × (I - SIM)
export const cvdMatrix = (k: number): number[][] => {
  const I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], s = SIM[k], m = SHIFT[k]
  if (!s?.length) return I
  const diff = I.map((r, i) => r.map((v, j) => v - s[i][j]))
  return I.map((r, i) => r.map((v, j) => v + m[i].reduce((a, x, c) => a + x * diff[c][j], 0)))
}

export function applyCvd(canvas: HTMLElement) {
  const k = settings.cvd ?? 0
  if (!k) { canvas.style.filter = ''; return }
  let f = document.getElementById('cvd-filter')
  if (!f) {
    document.body.insertAdjacentHTML('beforeend', '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="cvd-filter" color-interpolation-filters="sRGB"><feColorMatrix id="cvd-m" type="matrix"/></filter></svg>')
    f = document.getElementById('cvd-filter')!
  }
  const m = cvdMatrix(k)
  document.getElementById('cvd-m')!.setAttribute('values', [...m[0], 0, 0, ...m[1], 0, 0, ...m[2], 0, 0, 0, 0, 0, 1, 0].join(' '))
  canvas.style.filter = 'url(#cvd-filter)'
}
