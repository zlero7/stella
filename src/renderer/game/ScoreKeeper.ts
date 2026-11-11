// 판정 범위와 체력 증감은 여기 상수 하나로 관리 (기획서: 플레이해보며 조정)
// hp: 이 판정이 나올 때 체력(0~100)이 변하는 양. 디맥처럼 잘 치면 조금씩 차고, NICE·BAD·MISS는 깎인다
export const JUDGES = [
  { name: 'PERFECT', win: 0.055, weight: 1, hp: 0.4 },
  { name: 'GREAT', win: 0.1, weight: 0.7, hp: 0.3 },
  { name: 'GOOD', win: 0.14, weight: 0.4, hp: 0.15 },
  { name: 'NICE', win: 0.17, weight: 0.2, hp: -1.5 },
  { name: 'BAD', win: 0.2, weight: 0.1, hp: -3 },
  { name: 'MISS', win: Infinity, weight: 0, hp: -5 }
] as const
export const MISS = JUDGES.length - 1
export const MAX_WIN = 0.025 // PERFECT 안에서도 이 안쪽(±25ms)이면 MAX (표시와 집계만, 점수는 같다)
export const HIT_WIN = JUDGES[MISS - 1].win // 이보다 늦으면 놓친 것, 이보다 이르면 입력 무시

// dt = 노트 시각 - 입력 시각 (초). 양수면 빠르게 누른 것(Fast)
// 판정 강도: 1 보통, 0.5 하드, 0.25 맥스 (모든 판정 폭과 MAX 폭을 이 배수만큼 좁힌다.
// 키를 받아 주는 범위 HIT_WIN은 그대로지만, 좁아진 BAD 폭 밖의 입력은 "아직 멀었다"로 보고 무시한다. 노트는 그대로 남아 다시 눌러 맞출 수 있다)
export const judgeMul = { v: 1 }
export const judgeOf = (dt: number) => JUDGES.findIndex(j => Math.abs(dt) <= j.win * judgeMul.v)

// 키를 눌렀을 때 판정할 노트: 그 레인에서 아직 안 친 가장 이른 노트. (빠른 연타에서 조금 늦게 눌렀을 때 뒤 노트가 더 가깝다고 뒤 노트를 고르면,
// 앞 노트가 남아 Miss가 되고 이후 입력이 한 칸씩 밀려 계속 어긋난다.)
// 단 앞 노트가 GREAT 폭보다 늦었고 뒤 노트가 더 가까우면 앞 노트는 건너뛴 것으로 보고 뒤 노트를 판정한다 (앞 노트를 놓치고 뒤 노트를 제때 친 경우)
// ns는 시각순이고, from은 아직 끝나지 않은 첫 노트 위치
export function pickTarget<N extends { lane: number; time: number; state: string }>(ns: N[], from: number, lane: number, t: number): N | undefined {
  let first: N | undefined, near: N | undefined
  for (let i = from; i < ns.length && ns[i].time - t <= HIT_WIN; i++) {
    const n = ns[i]
    if (n.lane !== lane || n.state !== 'wait') continue
    first ??= n
    if (!near || Math.abs(n.time - t) < Math.abs(near.time - t)) near = n
  }
  return first && near && first !== near && t - first.time > JUDGES[1].win * judgeMul.v ? near : first
}

// 콤보 배율: 콤보가 쌓일수록 노트 하나의 점수가 커진다 (400콤보에서 1.5배로 멈춤). 끊기면 처음부터
export const comboMult = (combo: number) => 1 + 0.5 * Math.min(combo, 400) / 400

const CHORD_LOSS = 8 // 같은 시각에 놓친 동타가 한 번에 깎는 체력의 상한 (3중동타를 놓쳐도 -15가 아니라 -8)

// 정확도(%) → 등급
export const rankOf = (a: number) => (a >= 99 ? 'S+' : a >= 95 ? 'S' : a >= 90 ? 'A' : a >= 80 ? 'B' : a >= 70 ? 'C' : 'D') // 클리어한 가장 낮은 등급은 D, F는 체력이 다해 실패한 판 전용

export class ScoreKeeper {
  counts = JUDGES.map(() => 0)
  combo = 0
  maxCombo = 0
  hp = 100 // 체력. 0이 되면 실패
  private sum = 0
  private lossAt = -1 // 마지막으로 체력이 깎인 노트 시각과 그 시각에 깎인 합
  private lossSum = 0
  readonly mul = judgeMul.v // 이 판의 판정 강도 (MAX 개수를 세는 폭에도 쓴다)
  readonly total: number // 전체 판정 수 (롱노트는 시작·끝 각각)
  private num = 0 // 콤보 배율을 곱한 판정 점수의 합
  private n = 0 // 지금까지 판정한 수
  readonly pace: number[] = [] // 판정 수가 전체의 5%씩 쌓일 때마다의 점수 (최고 기록과 실시간으로 비교하려고 기록에 같이 남긴다)
  private den = 0 // 전부 PERFECT일 때의 합 (이게 100만점)

  constructor(total: number) { this.total = total; for (let c = 1; c <= total; c++) this.den += comboMult(c) }

  // at = 그 노트의 시각(초). 같은 시각에 여러 개가 깎이면 합계를 CHORD_LOSS로 제한한다
  add(j: number, at = -1) {
    this.counts[j]++
    this.sum += JUDGES[j].weight
    let d: number = JUDGES[j].hp
    if (d < 0 && at >= 0) {
      if (Math.abs(at - this.lossAt) < 0.02) d = -Math.min(-d, Math.max(CHORD_LOSS - this.lossSum, 0)), this.lossSum -= d
      else this.lossAt = at, this.lossSum = -d
    }
    this.hp = Math.min(Math.max(this.hp + d, 0), 100)
    if (j === MISS) this.combo = 0
    else this.maxCombo = Math.max(this.maxCombo, ++this.combo)
    this.num += JUDGES[j].weight * comboMult(this.combo)
    this.n++
    while (this.total > 0 && this.pace.length < 20 && this.n * 20 >= this.total * (this.pace.length + 1)) this.pace.push(this.score)
  }
  get failed() { return this.hp <= 0 }

  // 누른 타이밍 오차 기록 (dt 양수 = 빠름). 결과 화면에서 평균을 보고 JUDGE OFFSET을 맞춘다
  private errSum = 0
  private errN = 0
  readonly errs: number[] = [] // 입력마다의 오차(초) — 결과 화면의 분포 그래프용
  press(dt: number) { this.errSum += dt; this.errN++; this.errs.push(dt) }
  // 입력 오차 분포: 왼쪽이 빠름, 오른쪽이 느림. 구간 하나가 binMs, 양쪽 rangeMs까지 (넘는 입력은 맨 끝 칸에 합친다)
  histogram(binMs = 20, rangeMs = 200) {
    const n = (2 * rangeMs) / binMs, h = new Array<number>(n).fill(0)
    for (const dt of this.errs) h[Math.min(Math.max(Math.floor((-1000 * dt + rangeMs) / binMs), 0), n - 1)]++
    return h
  }
  get maxCount() { return this.errs.filter(dt => Math.abs(dt) <= MAX_WIN * this.mul).length }
  get avgMs() { return this.errN ? Math.round((1000 * this.errSum) / this.errN) : 0 }

  get score() { return this.den ? Math.round(1_000_000 * this.num / this.den) : 0 }
  get mult() { return comboMult(this.combo) }
  // 지금까지 친 판정의 평균 (곡이 끝나면 전체 평균과 같다)
  get accuracy() {
    const judged = this.counts.reduce((a, b) => a + b, 0)
    return judged ? 100 * this.sum / judged : 100
  }
  get rank() {
    return rankOf(this.accuracy)
  }
  get badge() {
    if (this.counts[MISS]) return ''
    return this.counts.slice(1, MISS).some(n => n) ? 'FULL COMBO' : 'ALL PERFECT'
  }
}
