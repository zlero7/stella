import { chartOf } from './AutoChart'

// 곡 선택 화면에서 레벨을 보여 주려고 채보를 화면이 멈추지 않게 따로 만든다
onmessage = (e: MessageEvent<{ dir: string; x: Float32Array; sr: number; diffs: string[]; hl?: [number, number][]; keys: number }>) => {
  const { dir, x, sr, diffs, hl, keys } = e.data
  for (const diff of diffs) postMessage({ dir, diff, keys, chart: chartOf(x, sr, diff, hl, keys) })
}
