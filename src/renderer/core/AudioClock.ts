import { gainOf } from '../data/Storage'
import { frameT } from './GameLoop'

// 모든 시간의 기준: AudioContext.currentTime (기획서 '싱크의 핵심 원칙')
export class AudioClock {
  readonly ctx = new AudioContext()
  private gain = this.ctx.createGain()
  private startedAt = 0
  private src?: AudioBufferSourceNode
  offset = 0 // 곡 오프셋 + 사용자 오프셋 (초)

  constructor() { this.gain.connect(this.ctx.destination) }

  set volume(v: number) { this.gain.gain.value = gainOf(v) }

  decode(data: ArrayBuffer) { return this.ctx.decodeAudioData(data) }

  // lead초 뒤에 곡이 from초 지점부터 시작 (그 전까지 songTime은 from보다 작다 = 리드인)
  start(lead = 2, from = 0) {
    void this.ctx.resume()
    this.startedAt = this.ctx.currentTime + lead - from
  }

  play(buf: AudioBuffer, lead = 2, from = 0) {
    this.stop()
    this.start(lead, from)
    this.src = this.ctx.createBufferSource()
    this.src.buffer = buf
    this.src.connect(this.gain)
    this.src.start(this.startedAt + from, from)
  }

  // 체력이 다했을 때: sec초 동안 재생 속도(음높이도 같이)와 소리가 서서히 0으로 (테이프가 멈추는 느낌). songTime은 그대로 흐른다
  slowStop(sec: number) {
    const now = this.ctx.currentTime, g = this.gain.gain
    if (this.src) { const r = this.src.playbackRate; r.cancelScheduledValues(now); r.setValueAtTime(1, now); r.linearRampToValueAtTime(0.03, now + sec) }
    g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0, now + sec)
  }

  stop() { this.src?.stop(); this.src = undefined }
  pause() { void this.ctx.suspend() } // 컨텍스트 시간이 멈추므로 songTime도 같이 멈춘다
  resume() { void this.ctx.resume() }

  // currentTime은 소리가 출력 장치에 나가기 전 시각이라, 실제로 들리는 시각은 출력 지연만큼 늦다
  // currentTime과 outputLatency는 몇 ms씩 계단/출렁임이 있어서 그대로 그리면 빠른 스크롤에서 노트가 겹쳐 두 개로 보이거나 계단져 움직인다.
  // 그래서 곡 시각을 "sm 시각에 smAt(performance.now 기준)" 한 점과 1초에 1초씩 흐르는 직선으로 두고, 실제 시계와의 차이만 서서히(0.15초 시정수) 맞춘다. 0.05초 넘게 벌어지면(재개·탐색) 바로 맞춘다
  // 화면에 그릴 때는 이 직선을 프레임 시작 시각(frameT)에서 읽는다: 렌더 직전에 performance.now를 읽으면 그 사이 작업 시간(수 ms)만큼 노트가 흔들리는데, 속도 11 이상(초당 1000px 안팎)에서는 그게 몇 px 계단으로 보인다
  private sm = 0
  private smAt = 0
  private get rawTime() { return this.ctx.currentTime - (this.ctx.outputLatency || this.ctx.baseLatency || 0) - this.startedAt - this.offset }
  private sync() {
    const raw = this.rawTime, now = performance.now()
    if (this.ctx.state !== 'running') { this.smAt = 0; return raw }
    const dt = (now - this.smAt) / 1000, pred = this.sm + dt
    this.sm = !this.smAt || Math.abs(raw - pred) > 0.05 ? raw : pred + (raw - pred) * Math.min(1, dt / 0.15)
    this.smAt = now
    return undefined
  }
  get songTime() {
    const raw = this.sync()
    return raw ?? this.sm + (frameT - this.smAt) / 1000
  }

  // keydown의 event.timeStamp(performance.now 기준)를 곡 시각으로 변환 (프레임 사이 입력도 정확하게)
  timeAt(perfMs: number) {
    const raw = this.sync()
    return raw ?? this.sm + (perfMs - this.smAt) / 1000
  }
}
