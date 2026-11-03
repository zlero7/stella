import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { chartOf } from './AutoChart.ts'
// 일괄 채보 생성 (gen.sh가 부른다): 곡 폴더의 하이라이트 구간을 써서 4키·6키 채보를 난이도 4개씩 만든다. 이미 있는 채보는 건너뛴다
const [pcm, dir, keyList = '4,6'] = process.argv.slice(2), sr = 48000
const b = readFileSync(pcm), x = new Float32Array(b.buffer, b.byteOffset, b.length >> 2)
const hl = JSON.parse(readFileSync(`${dir}/meta.json`, 'utf8')).highlights
for (const keys of keyList.split(',').map(Number)) for (const d of ['easy', 'normal', 'hard', 'stella']) {
  const f = `${dir}/${keys}k-${d}.json`
  if (!existsSync(f)) writeFileSync(f, JSON.stringify(chartOf(x, sr, d, hl, keys)))
}
