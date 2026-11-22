import { chartOf, spreadLevels } from './AutoChart'

// 곡 선택 화면에서 레벨을 보여 주려고 채보를 화면이 멈추지 않게 따로 만든다
onmessage = (e: MessageEvent<{ dir: string; x: Float32Array; sr: number; diffs: string[]; hl?: [number, number][]; keys: number }>) => {
  const { dir, x, sr, diffs, hl, keys } = e.data
  const charts = diffs.map(diff => chartOf(x, sr, diff, hl, keys))
  if (charts.length === 4) spreadLevels(charts.map(c => c.level)).forEach((v, i) => { charts[i].level = v }) // 네 난이도를 한 번에 만들 때만 (일부만 만들면 다른 난이도의 레벨을 모른다)
  diffs.forEach((diff, i) => postMessage({ dir, diff, keys, chart: charts[i] }))
}
