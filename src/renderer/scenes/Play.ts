import type { Scene, SceneManager } from '../core/SceneManager'
import type { Chart, Note, Song } from '../../shared/types'
import { AudioClock } from '../core/AudioClock'
import { HIT_WIN, JUDGES, MISS, ScoreKeeper, judgeOf, pickTarget } from '../game/ScoreKeeper'
import { buildChart } from '../game/AutoChart'
import { cleanChart, posAt, speedTable } from '../game/chartCheck'
import { chartFile, diffName } from '../data/Songs'
import { keyLabel, saveSettings, settings } from '../data/Storage'
import { sfx } from '../core/Sfx'
import { send, vs, waitFor } from '../core/Versus'
import { startPlay } from '../data/Rank'
import { drawLoading } from '../render/loading'
import { FONT, CYAN, AMBER, accentFill, ICE, NOTE_COLORS, artOf, drawBg, fit, fitFont, lighten, menuRow, rgbOf, slant, glow, card, meter, starPath, hit, press as pressKey, ease } from '../render/theme'

let LANES = 4, LANE_W = 80 // 4키는 레인 80px, 6키는 64px (enter에서 설정의 키 모드로 정한다)
const JUDGE_Y = 590, BASE_PX = 100 // 스크롤 속도 1.0 = 100px/s
const fieldX = (align: number) => [70, (1280 - LANES * LANE_W) / 2, 1280 - LANES * LANE_W - 70][align] ?? 70 // 설정의 화면 위치: 왼쪽/가운데/오른쪽
let FIELD_X = 70, CX = FIELD_X + LANES * LANE_W / 2
const activeKeys = () => (LANES === 6 ? settings.keys6 : settings.keys)
const JUDGE_COLORS = ['#7fe3ff', '#7dff9a', '#ffe27a', '#ffb066', '#ff8a8a', '#ff4d6d']
const PAUSE_ITEMS = ['계속', '다시 시작', '설정', '나가기']
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const isBlue =(lane: number) => lane === 0 || lane === LANES - 1

// wait: 아직 안 침 / hold: 롱노트 누르는 중 / done: 처리 끝
interface N extends Note { state: 'wait' | 'hold' | 'done' }
// vs: 대결 중 (키 수는 방장이 정한 keys, 채보도 방장이 보낸 것)
export interface PlayData { song: Song; diff: string; from?: number; vs?: boolean; keys?: number; ladder?: boolean }

// 노트 그림은 한 번만 만들어 두고 drawImage로 찍는다: 노트마다 shadowBlur/그라데이션을 새로 만드는 비용이 없다
// 바깥 두 레인은 시안, 안쪽 두 레인은 흰색 (디맥 4K의 색 구분)
const sprites: Record<string, HTMLCanvasElement> = {}
const noteColor = () => (NOTE_COLORS[settings.noteColor] ?? NOTE_COLORS[0])[1]
// 스프라이트는 화면에 찍히는 크기(캔버스 배율 × 레인 배율)로 만든다: 92x44로 만들어 늘려 찍으면 큰 화면에서 가장자리가 계단져 보인다. 배율은 0.25 단위로 맞춰 캐시한다
function noteSprite(outer: boolean, scale: number) {
  const col = noteColor(), s = Math.max(1, Math.round(scale * 4) / 4), k = (outer ? col : 'inner') + '@' + s
  let c = sprites[k]
  if (!c) {
    c = sprites[k] = document.createElement('canvas'); c.width = Math.ceil(92 * s); c.height = Math.ceil(44 * s)
    const x = c.getContext('2d')!; x.scale(c.width / 92, c.height / 44)
    x.shadowColor = outer ? lighten(col, 0.3) : '#ffffff'; x.shadowBlur = 10
    const gr = x.createLinearGradient(0, 15, 0, 29) // 얇은 막대(높이 14px): 위가 밝고 아래로 갈수록 색이 진해진다
    gr.addColorStop(0, outer ? lighten(col, 0.7) : '#ffffff'); gr.addColorStop(1, outer ? col : '#b7d3ff')
    x.fillStyle = gr; x.fillRect(11, 15, 70, 14)
    x.shadowBlur = 0; x.fillStyle = 'rgba(255,255,255,.95)'; x.fillRect(11, 15, 70, 2) // 윗변 하이라이트
    x.strokeStyle = outer ? '#ffffff' : 'rgba(80,140,230,.95)'; x.lineWidth = 1.5; x.strokeRect(11.5, 15.5, 69, 13)
  }
  return c
}
let laneGlow: Record<'o' | 'i', CanvasGradient> | undefined, fieldGr: CanvasGradient | undefined, edgeGr: CanvasGradient | undefined

// 배경을 은은하게 흐리게: 원본 해상도 그대로 그리면서 블러 필터를 약하게 건다 (줄였다 늘리면 네모 도트가 보인다). 가장자리가 투명해지지 않게 3% 크게 그린다
function blurred(g: CanvasRenderingContext2D, src: CanvasImageSource, sw: number, sh: number, blur = true) {
  const k = Math.max(1280 / sw, 720 / sh) * 1.03
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'
  if (blur) g.filter = 'blur(3px)'
  g.drawImage(src, (1280 - sw * k) / 2, (720 - sh * k) / 2, sw * k, sh * k)
  g.filter = 'none'
  g.fillStyle = `rgba(8,30,90,${1 - settings.bgBright / 100})`; g.fillRect(0, 0, 1280, 720) // 설정의 배경 밝기
}

// 채보도 음원도 없을 때 쓰는 데모 노트
const demoNotes = (): Note[] =>
  Array.from({ length: 48 }, (_, i): Note => ({ time: 1 + i * 0.4, lane: (i * 3 + (i >> 2)) % LANES, ...(i % 9 === 8 ? { duration: 0.8 } : {}) }))

export const Play = (sm: SceneManager): Scene => {
  const clock = new AudioClock()
  let data: PlayData, song: Song, ns: N[] = [], endTime = 1, dur = 1, sk = new ScoreKeeper(0)
  let ready = false, finished = false, paused = false, pSel = 0, token = 0
  // 체력이 다하면 DIE_S초 동안 노트 속도와 소리가 점점 느려지다가 결과 화면으로 넘어간다. dying = 시작한 시각(ms), dyT0 = 그때의 곡 시각
  const DIE_S = 1.6
  let dying = 0, dyT0 = 0, sentAt = 0
  const dieTime = (now: number) => { const x = Math.min((now - dying) / 1000, DIE_S); return dyT0 + x - (x * x) / (2 * DIE_S) } // 속도가 1에서 0으로 줄어드는 동안 흐른 시간의 합
  let speedAt = -1e9
  let spd = speedTable() // 변속 표 (노트 화면 위치 = posAt(spd, 시각))
  const posOf = (time: number) => posAt(spd, time)
  let resumeAt = 0 // 일시정지에서 계속을 누른 뒤 곡이 다시 흐르기 시작할 시각(performance.now). 그 전까지 3초 카운트다운
  let slowMs = 16.7, lowQ = false // 프레임 시간(ms)의 이동평균. 24ms를 넘으면(약 40fps 미만) 이 곡은 배경 블러를 끈다
  let chartOffset = 0 // 채보 자체의 오프셋(초). 설정에서 싱크 오프셋을 바꾸고 돌아오면 다시 합친다
  let dispHp = 100 // 체력바에 보이는 값 (실제 체력을 부드럽게 따라간다)
  let head = 0 // 처리가 끝난 앞쪽 노트는 건너뛰기 위한 시작 위치
  let flash = { j: 0, dt: 0, at: -1e9 }
  const down = new Set<number>()
  const laneOf = (e: KeyboardEvent) => activeKeys().indexOf(e.code)

  // 칠 때 효과: 판정선에서 빛기둥·고리·별·불꽃이 터진다. 판정이 좋을수록 크고 밝다 (MISS는 없음)
  const fx: { lane: number; at: number; j: number }[] = []
  const judge = (j: number, dt = 0, lane = -1, at = -1) => {
    sk.add(j, at); flash = { j, dt, at: performance.now() }
    if (lane >= 0 && j !== MISS) { fx.push({ lane, at: performance.now(), j }); if (fx.length > 32) fx.shift() }
  }
  function drawFx(g: CanvasRenderingContext2D, t: number) {
    const lv = settings.fx
    if (!lv) return
    const now = performance.now(), base = noteColor()
    g.save(); g.globalCompositeOperation = 'lighter'
    for (const e of fx) {
      const k = (now - e.at) / 400
      if (k >= 1) continue
      const cx = FIELD_X + e.lane * LANE_W + LANE_W / 2, big = ([1, 0.85, 0.7, 0.55, 0.45][e.j] ?? 0.5) * (lv === 1 ? 0.6 : 1) * (LANE_W / 80) // 약: 60% 크기, 빛기둥·불꽃 없음
      const rgb = rgbOf(e.j === 0 ? lighten(isBlue(e.lane) ? base : '#ffffff', 0.45) : JUDGE_COLORS[e.j]), ease = 1 - (1 - k) * (1 - k)
      if (lv === 2) {
        const bh = 160 * big * (1 - k * 0.3), lg = g.createLinearGradient(0, JUDGE_Y, 0, JUDGE_Y - bh) // 빛기둥
        lg.addColorStop(0, `rgba(${rgb},${0.38 * big * (1 - k)})`); lg.addColorStop(1, `rgba(${rgb},0)`)
        g.fillStyle = lg; g.fillRect(cx - LANE_W / 2 + 6, JUDGE_Y - bh, LANE_W - 12, bh)
      }
      g.strokeStyle = `rgba(${rgb},${0.9 * (1 - k)})`; g.lineWidth = 1 + 3 * (1 - k) // 퍼지는 고리
      g.beginPath(); g.ellipse(cx, JUDGE_Y, (14 + 48 * ease) * big, (6 + 20 * ease) * big, 0, 0, Math.PI * 2); g.stroke()
      g.fillStyle = `rgba(255,255,255,${1 - k})`; starPath(g, cx, JUDGE_Y, 28 * big * (1 - 0.6 * k)); g.fill() // 별 반짝임
      g.fillStyle = `rgba(${rgb},${1 - k})` // 위로 퍼지는 불꽃 알갱이
      for (let i = 0; lv === 2 && i < 8; i++) {
        const a = -Math.PI + (i / 7) * Math.PI, d = (18 + 72 * ease) * big
        g.beginPath(); g.arc(cx + Math.cos(a) * d, JUDGE_Y + Math.sin(a) * d * 0.9, 0.6 + 2.6 * (1 - k), 0, Math.PI * 2); g.fill()
      }
    }
    for (let i = head; i < ns.length && ns[i].time <= t; i++) { // 롱노트를 잡고 있는 동안은 판정선에서 계속 빛난다 (head 앞은 끝난 노트, t 뒤는 아직 안 온 노트)
      const n = ns[i]
      if (n.state !== 'hold') continue
      const cx = FIELD_X + n.lane * LANE_W + LANE_W / 2, r = (44 + 6 * Math.sin(now / 60)) * (LANE_W / 80), rgb = rgbOf(isBlue(n.lane) ? lighten(base, 0.4) : '#ffffff')
      const rg = g.createRadialGradient(cx, JUDGE_Y, 0, cx, JUDGE_Y, r)
      rg.addColorStop(0, `rgba(${rgb},.8)`); rg.addColorStop(1, `rgba(${rgb},0)`)
      g.fillStyle = rg; g.fillRect(cx - r, JUDGE_Y - r, r * 2, r * 2)
      g.fillStyle = 'rgba(255,255,255,.85)'; starPath(g, cx, JUDGE_Y, 14 + 5 * Math.sin(now / 45)); g.fill()
    }
    g.restore()
  }

  function press(lane: number, t: number) {
    const n = pickTarget(ns, head, lane, t) // 누른 시각에 가장 가까운 노트
    if (!n) return
    const dt = n.time - t // 양수 = 빠르게 누름(Fast)
    if (dt > HIT_WIN) return // 너무 이른 입력은 무시
    const j = judgeOf(dt)
    if (j === MISS) return // 이미 지난 노트는 update()가 Miss 처리
    judge(j, dt, lane, n.time); sk.press(dt); sfx.hit()
    n.state = n.duration ? 'hold' : 'done'
  }

  function release(lane: number, t: number) {
    const n = ns.find(n => n.lane === lane && n.state === 'hold')
    if (!n) return
    const dt = n.time + n.duration! - t
    judge(dt > HIT_WIN ? MISS : judgeOf(dt), dt, lane, n.time + n.duration!) // 일찍 떼면 끝 판정 Miss
    n.state = 'done'
  }

  // 창을 바꾸면(Alt+Tab 등) 곡이 계속 흐르지 않고 일시정지한다. 대결은 멈출 수 없으므로 제외
  addEventListener('blur', () => { if (ready && !paused && !finished && !dying && !resumeAt && !data.vs) { paused = true; pSel = 0; down.clear(); clock.pause() } })

  function leave(name: string, d?: unknown) {
    token++; finished = true; clock.stop(); clock.resume(); dropVideo()
    sm.go(name, d)
  }
  const quit = () => leave('select')

  // 배경 영상: 소리는 AudioClock이 내므로 영상은 음소거하고 곡 시각에 맞춰 따라가게 한다
  let video: HTMLVideoElement | undefined
  function dropVideo() {
    if (!video) return
    video.pause(); URL.revokeObjectURL(video.src); video.removeAttribute('src'); video.load(); video = undefined
  }

  async function load() {
    const my = ++token
    let buf: AudioBuffer | undefined
    try {
      const raw = await window.api.readFile(song.dir, song.meta.audio)
      // decodeAudioData가 버퍼를 가져가므로 영상용 Blob을 먼저 만든다
      const v = settings.bg && song.meta.video === song.meta.audio ? document.createElement('video') : undefined
      if (v) { v.muted = true; v.src = URL.createObjectURL(new Blob([raw], { type: 'video/mp4' })); if (my === token) video = v; else URL.revokeObjectURL(v.src) }
      buf = await clock.decode(raw)
    } catch { /* 음원 없음 */ }
    let chart: Chart | undefined
    if (data.vs && vs.role === 'guest') { // 손님: 방장이 보내는 채보로 친다 (두 사람이 똑같은 채보여야 공정하다)
      await waitFor(() => vs.chart, 15000)
      chart = vs.chart
      if (!chart) { if (my === token) leave(data.ladder ? 'ladder' : 'vs'); return }
    } else try { chart = JSON.parse(new TextDecoder().decode(await window.api.readFile(song.dir, chartFile(data.diff)))) } catch { /* 채보 없음 */ }
    if (!chart && buf) { // 채보가 없으면 음원에서 자동 생성해 저장
      chart = buildChart(buf, data.diff, song.meta.highlights, LANES)
      try { await window.api.writeFile(song.dir, chartFile(data.diff), JSON.stringify(chart)) } catch { /* 저장 실패해도 이번 플레이는 가능 */ }
    }
    if (my !== token) return // 로딩 중 나갔음
    if (data.vs && vs.role === 'host' && chart) send({ t: 'chart', chart })
    const from = data.from
    spd = speedTable(chart?.speeds)
    const notes = cleanChart(chart?.notes ?? demoNotes(), LANES).notes.filter(n => from === undefined || n.time >= from + 0.5)
    ns = notes.map(n => ({ ...n, state: 'wait' as const })).sort((a, b) => a.time - b.time)
    head = 0
    sk = new ScoreKeeper(ns.reduce((s, n) => s + (n.duration ? 2 : 1), 0))
    endTime = Math.max(...ns.map(n => n.time + (n.duration ?? 0)), (from ?? 0) + 1) + 2
    dur = buf?.duration ?? endTime
    chartOffset = chart?.offset ?? 0
    clock.offset = chartOffset + settings.offset / 1000
    clock.volume = settings.volume
    if (video) await waitFor(() => (video?.readyState ?? 4) >= 2, 4000) // 배경 영상의 첫 장면이 뜰 때까지 로딩 화면을 유지한다 (필드가 먼저 나오고 배경이 뒤늦게 켜지지 않게)
    if (my !== token) return
    if (data.vs) { // 둘 다 준비될 때까지 기다렸다가 같이 출발
      send({ t: 'ready' })
      if (!(await waitFor(() => vs.peerReady, 20000)) || my !== token) { if (my === token) leave(data.ladder ? 'ladder' : 'vs'); return }
    }
    if (buf) clock.play(buf, 2, from ?? 0); else clock.start(2, from ?? 0)
    if (!data.vs && from === undefined) startPlay(song.dir, data.diff, LANES) // 랭킹 점수는 시작 기록이 있어야 받는다 (연습 구간 재생은 기록하지 않는다)
    ready = true
  }

  return {
    enter(d) {
      if ((d as { resume?: boolean }).resume && ready) { // 일시정지에서 설정을 열었다가 돌아옴: 곡은 그대로 두고 바뀐 설정만 다시 적용한다
        FIELD_X = fieldX(settings.align); CX = FIELD_X + LANES * LANE_W / 2
        laneGlow = undefined; clock.offset = chartOffset + settings.offset / 1000; clock.volume = settings.volume
        return
      }
      data = d as PlayData; song = data.song
      LANES = data.keys ?? settings.keyMode; LANE_W = LANES === 6 ? 64 : 80
      FIELD_X = fieldX(settings.align); CX = FIELD_X + LANES * LANE_W / 2
      down.clear(); fx.length = 0; slowMs = 16.7; lowQ = false; resumeAt = 0; dispHp = 100; laneGlow = undefined; ready = false; finished = false; paused = false; pSel = 0; flash.at = -1e9; dying = 0
      clock.stop(); clock.resume(); dropVideo()
      void load()
    },
    update(dt) {
      if (ready && !paused && !resumeAt && !finished && settings.bg && dt < 0.25) { slowMs += (dt * 1000 - slowMs) * 0.05; if (slowMs > 24) lowQ = true } // 큰 dt(창 전환·멈춤)는 느린 컴퓨터 탓이 아니므로 제외
      if (video && ready) {
        const t = clock.songTime
        if (paused || resumeAt || t < 0) video.pause()
        else if (dying) video.playbackRate = Math.max(1 - (performance.now() - dying) / 1000 / DIE_S, 0.0625) // 영상도 같이 느려진다
        else {
          if (video.paused) void video.play().catch(() => {})
          if (Math.abs(video.currentTime - t) > 0.2) video.currentTime = t // 어긋나면 곡 시각으로 되감기/건너뛰기
        }
      }
      if (resumeAt && performance.now() >= resumeAt) { resumeAt = 0; clock.resume() }
      if (!ready || paused || resumeAt || finished) return
      if (dying) { // 느려지는 중: 판정은 멈추고, 끝나면 결과로
        if (performance.now() - dying > (DIE_S + 0.4) * 1000) { finished = true; clock.stop(); dropVideo(); sm.go(data.vs ? 'vsresult' : 'result', { song, diff: data.diff, sk, failed: true, keys: LANES }) }
        return
      }
      if (data.vs) { // 점수를 상대에게 알린다 (0.15초마다). 상대가 나가 버리면 지금까지의 결과로 끝낸다
        if (vs.closed) { finished = true; clock.stop(); dropVideo(); sm.go('vsresult', { song, diff: data.diff, sk, failed: sk.failed, keys: LANES }); return }
        if (performance.now() - sentAt > 150) { sentAt = performance.now(); send({ t: 'score', s: sk.score, c: sk.combo, hp: sk.hp, a: sk.accuracy }) }
      }
      const t = clock.songTime
      while (head < ns.length && ns[head].state === 'done') head++
      for (let i = head; i < ns.length; i++) {
        const n = ns[i]
        if (n.time - t > 1) break // 아직 1초 넘게 남은 노트부터는 판정할 게 없다
        if (n.state === 'wait' && t - n.time > HIT_WIN) {
          judge(MISS, 0, -1, n.time); if (n.duration) judge(MISS, 0, -1, n.time + n.duration) // 롱노트는 시작을 놓치면 끝도 Miss
          n.state = 'done'
        } else if (n.state === 'hold' && t >= n.time + n.duration!) {
          judge(0, 0, n.lane, n.time + n.duration!); n.state = 'done' // 끝까지 유지하면 떼지 않아도 끝 판정 Perfect
        }
      }
      if (sk.failed) { dying = performance.now(); dyT0 = t; down.clear(); clock.slowStop(DIE_S); return }
      if (t > endTime) {
        finished = true; clock.stop(); dropVideo()
        sm.go(data.vs ? 'vsresult' : 'result', { song, diff: data.diff, sk, keys: LANES })
      }
    },
    render(g) {
      if (!ready) {
        drawLoading(g, song, undefined, data.vs ? '상대를 기다리는 중…' : undefined, `${LANES}K · ${diffName(data.diff)}`)
        return
      }
      const t = dying ? dieTime(performance.now()) : clock.songTime, speed = settings.scroll * BASE_PX
      g.fillStyle = '#0a1a50'; g.fillRect(0, 0, 1280, 720) // 바닥을 먼저 칠한다: 배경 영상이 아직 첫 장면을 못 그렸을 때 앞 화면(로딩)이 비쳐 보이지 않게
      if (!settings.bg) drawBg(g) // 배경 끄기: 곡 영상·표지 없이 하늘 배경만
      else if (video && video.readyState >= 2 && video.videoWidth) blurred(g, video, video.videoWidth, video.videoHeight, !lowQ)
      else { const a = artOf(song); if (a) blurred(g, a.bg, 1280, 720, !lowQ); else drawBg(g) }
      // 레인: 위는 투명하게 밝아지고 아래로 짙어지는 유리 띠 + 시안→보라 경계선. 그라데이션은 처음에 한 번만 만든다
      const fw = LANES * LANE_W
      if (!laneGlow) {
        laneGlow = { o: g.createLinearGradient(0, JUDGE_Y - 300, 0, JUDGE_Y), i: g.createLinearGradient(0, JUDGE_Y - 300, 0, JUDGE_Y) }
        laneGlow.o.addColorStop(0, `rgba(${rgbOf(noteColor())},0)`); laneGlow.o.addColorStop(1, `rgba(${rgbOf(noteColor())},.55)`)
        laneGlow.i.addColorStop(0, 'rgba(255,255,255,0)'); laneGlow.i.addColorStop(1, 'rgba(255,255,255,.4)')
        fieldGr = g.createLinearGradient(0, 0, 0, 720); const pa = settings.panelA / 100; fieldGr.addColorStop(0, `rgba(10,32,90,${pa * 0.8})`); fieldGr.addColorStop(0.7, `rgba(8,28,80,${pa})`); fieldGr.addColorStop(1, `rgba(8,24,70,${Math.min(pa + 0.08, 1)})`)
        edgeGr = g.createLinearGradient(0, 0, 0, 720); edgeGr.addColorStop(0, 'rgba(255,255,255,.1)'); edgeGr.addColorStop(0.7, 'rgba(255,255,255,.85)'); edgeGr.addColorStop(1, 'rgba(170,220,255,.95)')
       
      }
      g.fillStyle = fieldGr!; g.fillRect(FIELD_X - 4, 0, fw + 8, 720)
      g.fillStyle = 'rgba(6,20,60,.96)'; g.fillRect(FIELD_X - 16, 0, 12, 720); g.fillRect(FIELD_X + fw + 4, 0, 12, 720) // 기어 옆 틀: 체력 게이지가 들어간다
      g.fillStyle = edgeGr!; g.fillRect(FIELD_X - 4, 0, 2, 720); g.fillRect(FIELD_X + fw + 2, 0, 2, 720)
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(FIELD_X - 16, 0, 1, 720); g.fillRect(FIELD_X + fw + 15, 0, 1, 720)
      g.save(); g.font = `900 30px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.06)'; g.textAlign = 'center'
      for (const [sx, dir] of [[FIELD_X + 20, -1], [FIELD_X + fw - 20, 1]] as const) { g.save(); g.translate(sx, 340); g.rotate(dir * Math.PI / 2); g.fillText('C O M B O   X ' + Math.max(1, Math.floor(sk.combo / 50) + 1), 0, 10); g.restore() }
      g.restore()
      g.fillStyle = 'rgba(255,255,255,.07)'
      for (let l = 1; l < LANES; l++) g.fillRect(FIELD_X + l * LANE_W, 0, 1, 720)
      down.forEach(l => { g.fillStyle = laneGlow![isBlue(l) ? 'o' : 'i']; g.fillRect(FIELD_X + l * LANE_W, JUDGE_Y - 300, LANE_W, 300) })
      g.fillStyle = 'rgba(190,235,255,.4)'; g.fillRect(FIELD_X - 4, JUDGE_Y - 9, fw + 8, 18) // 판정선 번짐
      g.fillStyle = '#fff'; g.fillRect(FIELD_X - 4, JUDGE_Y - 2, fw + 8, 4)
      const curPos = posOf(t)
      for (let i = head; i < ns.length; i++) {
        const n = ns[i]
        if (n.state === 'done') continue
        const holding = n.state === 'hold'
        const y = holding ? JUDGE_Y : JUDGE_Y - (posOf(n.time) - curPos) * speed
        if (y < -40) break // 시간 순 정렬이라 여기서부터는 전부 화면 위쪽 밖
        if (!holding && y > JUDGE_Y + 14) continue // 판정선을 넘어가면 사라진다
        const sc = LANE_W / 80, x = FIELD_X + n.lane * LANE_W + 4 * sc
        const len = n.duration ? (posOf(n.time + n.duration) - (holding ? curPos : posOf(n.time))) * speed : 0
        if (y - len > 740) continue
        if (len > 0) { g.fillStyle = isBlue(n.lane) ? `rgba(${rgbOf(noteColor())},.55)` : 'rgba(255,255,255,.4)'; g.fillRect(x + 14 * sc, y - len, LANE_W - 36 * sc, len) }
        g.drawImage(noteSprite(isBlue(n.lane), g.getTransform().a * Math.max(sc, 1)), x - 10 * sc, y - 22, 92 * sc, 44)
      }
      drawFx(g, t)
      activeKeys().slice(0, LANES).forEach((k, i) => {
        const on = down.has(i), blue = isBlue(i), x = FIELD_X + i * LANE_W + 4, w = LANE_W - 8, y = JUDGE_Y + 20 + (on ? 3 : 0), h = 72 - (on ? 3 : 0) // 디맥 키처럼 반듯한 네모 건반: 누르면 가라앉으며 빛난다
        const top = blue ? (on ? lighten(noteColor(), 0.55) : lighten(noteColor(), 0.05)) : (on ? '#ffffff' : '#dfe9f5'), bot = blue ? (on ? lighten(noteColor(), 0.2) : '#123c93') : (on ? '#cfe3ff' : '#8fa7c6')
        const kg = g.createLinearGradient(0, y, 0, y + h); kg.addColorStop(0, top); kg.addColorStop(1, bot)
        if (on) glow(g, blue ? noteColor() : '#ffffff', 22, () => { g.beginPath(); g.roundRect(x, y, w, h, 6); g.fillStyle = kg; g.fill() })
        else { g.beginPath(); g.roundRect(x, y, w, h, 6); g.fillStyle = kg; g.fill() }
        g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x + 4, y + 2, w - 8, 3) // 윗면 하이라이트
        g.fillStyle = 'rgba(6,20,60,.35)'; g.fillRect(x + 2, y + h - 6, w - 4, 4) // 아랫면 그림자
        g.beginPath(); g.roundRect(x, y, w, h, 6); g.strokeStyle = on ? '#fff' : 'rgba(255,255,255,.65)'; g.lineWidth = 1.5; g.stroke()
        g.font = `900 ${keyLabel(k).length > 2 ? 15 : 26}px ${FONT}`; g.fillStyle = blue && !on ? '#fff' : '#0b2a6b'; g.textAlign = 'center'
        g.fillText(keyLabel(k), x + w / 2, y + h / 2 + (keyLabel(k).length > 2 ? 5 : 9))
      })
      // 기어 아래 띠 (디맥의 기어 아래쪽처럼): 난이도 이름 + 스크롤 속도 칸. 판정선 위에는 지금까지의 정확도
      { const by = JUDGE_Y + 100, col = ({ easy: '#2ecc71', normal: '#f1c40f', hard: '#e74c3c', stella: '#a855f7' } as Record<string, string>)[data.diff] ?? CYAN
        g.fillStyle = 'rgba(6,20,60,.92)'; g.fillRect(FIELD_X - 4, by, fw + 8, 26); g.fillStyle = col; g.fillRect(FIELD_X - 4, by, fw + 8, 2)
        g.font = `900 14px ${FONT}`; g.fillStyle = col; g.textAlign = 'left'; g.fillText(diffName(data.diff), FIELD_X + 6, by + 19)
        g.textAlign = 'right'; g.font = `700 11px ${FONT}`; g.fillStyle = ICE; g.fillText('SPEED', FIELD_X + fw - 44, by + 18)
        g.font = `900 16px ${FONT}`; g.fillStyle = '#fff'; g.fillText(settings.scroll.toFixed(1), FIELD_X + fw - 4, by + 19)
        g.textAlign = 'center'; g.font = `900 22px ${FONT}`; g.fillStyle = sk.accuracy >= 100 ? '#ffe27a' : 'rgba(255,255,255,.85)'
        g.fillText(`${sk.accuracy >= 100 ? 'MAX ' : ''}${sk.accuracy.toFixed(sk.accuracy >= 100 ? 0 : 1)}%`, FIELD_X + fw / 2, JUDGE_Y - 36); g.textAlign = 'left' }
      // 체력 게이지: 기어 양옆 틀 안의 세로 막대 두 줄. 가득 → 하늘색, 절반 아래 → 금색, 25% 아래 → 깜빡이는 빨강
      dispHp += (sk.hp - dispHp) * 0.2
      const hy = 90, hh = JUDGE_Y - hy, fillH = (hh * dispHp) / 100
      g.fillStyle = dispHp > 50 ? CYAN : dispHp > 25 ? AMBER : (Math.floor(performance.now() / 160) % 2 ? '#ff5a6e' : '#ff9aa6')
      for (const gx of [FIELD_X - 14, FIELD_X + fw + 6]) {
        g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(gx, hy, 8, hh)
        g.fillStyle = dispHp > 50 ? CYAN : dispHp > 25 ? AMBER : (Math.floor(performance.now() / 160) % 2 ? '#ff5a6e' : '#ff9aa6')
        g.fillRect(gx, hy + hh - fillH, 8, fillH)
        g.fillStyle = 'rgba(6,20,60,.9)'; for (const q of [0.25, 0.5, 0.75]) g.fillRect(gx, hy + hh * q, 8, 1.5) // 눈금
      }
      g.font = `800 13px ${FONT}`; g.fillStyle = dispHp > 25 ? '#fff' : '#ff8a9a'; g.textAlign = 'center' // 체력 숫자는 기어 아래 띠 가운데에 (좌우 틀 밖으로 잘리지 않게)
      g.fillText(`HP ${Math.round(sk.hp)}%`, FIELD_X + fw / 2, JUDGE_Y + 119); g.textAlign = 'left'
      g.fillStyle = AMBER; g.fillRect(0, 0, 1280 * Math.min(Math.max(t / endTime, 0), 1), 5)
      // 점수 카드: 곡 정보 카드와 같은 모양. 필드가 오른쪽이면 왼쪽 끝으로 옮긴다
      const qx = settings.align !== 2 ? 1280 - 24 - 300 : 24, qy = 24, qi = 260
      card(g, qx, qy, 300, 132, 'SCORE')
      g.font = `800 50px ${FONT}`; g.fillStyle = '#fff'; g.fillText(String(sk.score).padStart(7, '0'), qx + 20, qy + 80)
      meter(g, qx + 20, qy + 96, qi, sk.accuracy / 100) // 정확도 막대
      g.font = `600 13px ${FONT}`; g.fillStyle = ICE; g.fillText('ACCURACY', qx + 20, qy + 120)
      g.textAlign = 'right'; g.fillText(`${sk.accuracy.toFixed(2)}%`, qx + 20 + qi, qy + 120)
      if (data.vs) { // 상대 카드: 점수·점수 차이·체력
        const ry = qy + 144, p = vs.peer, diff = sk.score - p.s
        card(g, qx, ry, 300, 112, `RIVAL  ·  ${vs.peerNick || 'PLAYER'}`)
        g.textAlign = 'left'; g.font = `800 38px ${FONT}`; g.fillStyle = '#fff'; g.fillText(String(p.s).padStart(7, '0'), qx + 20, ry + 72)
        g.textAlign = 'right'; g.font = `800 15px ${FONT}`; g.fillStyle = diff >= 0 ? AMBER : '#ff8a9a'; g.fillText(`${diff >= 0 ? '+' : '-'}${Math.abs(diff).toLocaleString()}`, qx + 20 + qi, ry + 30)
        g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.roundRect(qx + 20, ry + 88, qi, 4, 2); g.fill()
        g.fillStyle = p.hp > 50 ? CYAN : p.hp > 25 ? AMBER : '#ff5a6e'; g.beginPath(); g.roundRect(qx + 20, ry + 88, Math.max(qi * p.hp / 100, 0), 4, 2); g.fill()
        g.textAlign = 'left'
      }
      g.textAlign = 'center'
      if (sk.combo > 1) {
        // 콤보 숫자 색과 글자로 지금 올 퍼펙트(금색)·풀 콤보(하늘색)가 가능한지 알린다 (색만으로 전하지 않는다)
        const ap = sk.counts.slice(1).every(c => c === 0), fc = sk.counts[MISS] === 0
        const pop = 1 + 0.18 * Math.max(0, 1 - (performance.now() - flash.at) / 120) // 칠 때마다 살짝 커졌다 돌아온다
        g.save(); g.translate(CX, 250); g.scale(pop, pop)
        g.font = `900 72px ${FONT}`; g.lineJoin = 'round'; g.lineWidth = 9; g.strokeStyle = 'rgba(6,20,70,.9)'; g.strokeText(String(sk.combo), 0, 0)
        const cg = g.createLinearGradient(0, -56, 0, 6); if (ap) { cg.addColorStop(0, '#fff6c2'); cg.addColorStop(1, '#ffb52e') } else if (fc) { cg.addColorStop(0, '#e6fbff'); cg.addColorStop(1, '#5fd0ff') } else { cg.addColorStop(0, '#ffffff'); cg.addColorStop(1, '#bcd6ff') }
        g.fillStyle = cg; g.fillText(String(sk.combo), 0, 0); g.restore()
        g.font = `900 17px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.95)'; g.fillText(ap ? 'ALL PERFECT' : fc ? 'FULL COMBO' : 'COMBO', CX, 278)
      }
      const age = performance.now() - flash.at
      if (age < 500) {
        g.globalAlpha = 1 - age / 500
        g.font = `900 36px ${FONT}`; g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = 'rgba(6,20,70,.85)'; g.strokeText(JUDGES[flash.j].name, CX, 470)
        g.fillStyle = JUDGE_COLORS[flash.j]; g.fillText(JUDGES[flash.j].name, CX, 470)
        if (settings.fastSlow && flash.j !== MISS && flash.j !== 0) {
          g.font = `700 18px ${FONT}`; g.fillStyle = flash.dt > 0 ? CYAN : AMBER
          g.fillText(flash.dt > 0 ? 'FAST' : 'SLOW', CX, 498)
        }
        g.globalAlpha = 1
      }
      g.textAlign = 'left'
      // 곡 정보 카드: 필드와 안 겹치는 빈 쪽에 둔다 (가운데=왼쪽 끝, 왼쪽 필드=필드 오른쪽, 오른쪽 필드=점수 카드 옆)
      const px = [FIELD_X + fw + 40, 24, 380][settings.align] ?? 24, pw = 400, py = 24, iw = pw - 40
      card(g, px, py, pw, 132, `${data.vs ? 'VERSUS' : 'NOW PLAYING'}  ·  ${LANES}K ${diffName(data.diff)}`)
      const line = `${song.meta.title} - ${song.meta.artist}`
      g.font = `800 19px ${FONT}`; g.fillStyle = '#fff'
      const tw = g.measureText(line).width
      g.save(); g.beginPath(); g.rect(px + 20, py + 38, iw, 32); g.clip() // 긴 곡명은 옆으로 흘러간다
      if (tw <= iw) g.fillText(line, px + 20, py + 62)
      else { const o = (performance.now() / 1000 * 45) % (tw + 60); g.fillText(line, px + 20 - o, py + 62); g.fillText(line, px + 20 - o + tw + 60, py + 62) }
      g.restore()
      const cur = Math.min(Math.max(t, 0), dur), kx = px + 20 + iw * cur / dur // 재생 시간 / 전체 시간
      meter(g, px + 20, py + 87, iw, cur / dur)
      glow(g, '#ff9f1a', 10, () => { g.fillStyle = '#fff'; g.beginPath(); g.arc(kx, py + 89, 7, 0, Math.PI * 2); g.fill() })
      g.font = `600 13px ${FONT}`; g.fillStyle = ICE; g.fillText(mmss(cur), px + 20, py + 116)
      g.textAlign = 'right'; g.fillText(mmss(dur), px + 20 + iw, py + 116); g.textAlign = 'left'
      const hx = px
      g.font = `16px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText('Esc 일시정지   ↑↓ 속도', hx, 700)
      if (performance.now() - speedAt < 1200) { // 속도를 바꾼 직후에만 잠깐 표시
        g.font = `800 22px ${FONT}`; g.fillStyle = AMBER; g.textAlign = 'center'
        g.fillText(`속도 ${settings.scroll.toFixed(1)}`, CX, 330); g.textAlign = 'left'
      }

      if (dying) { // 실패 연출: 붉게 물들며 FAILED
        const k = Math.min((performance.now() - dying) / 1000 / DIE_S, 1)
        g.fillStyle = `rgba(120,10,30,${0.45 * k})`; g.fillRect(0, 0, 1280, 720)
        g.globalAlpha = k; g.font = `900 56px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'
        glow(g, 'rgba(255,90,110,.8)', 24, () => g.fillText('FAILED', CX, 330)); g.textAlign = 'left'; g.globalAlpha = 1
      }
      if (resumeAt) {
        const left = Math.ceil((resumeAt - performance.now()) / 1000)
        g.fillStyle = 'rgba(8,30,90,.45)'; g.fillRect(0, 0, 1280, 720)
        g.font = `900 140px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'; glow(g, 'rgba(122,216,255,.8)', 30, () => g.fillText(String(Math.max(left, 1)), CX, 400))
        g.font = `700 18px ${FONT}`; g.fillStyle = ICE; g.fillText('곧 다시 시작합니다', CX, 450); g.textAlign = 'left'
      }
      if (paused) {
        g.fillStyle = 'rgba(4,16,48,.78)'; g.fillRect(0, 0, 1280, 720)
        g.fillStyle = 'rgba(8,28,80,.9)'; g.fillRect(0, 196, 1280, 340) // 가운데 가로 띠 (디맥의 일시정지처럼)
        g.fillStyle = accentFill(g, 0, 1280); g.fillRect(0, 196, 1280, 2); g.fillRect(0, 534, 1280, 2)
        g.font = `800 18px ${FONT}`; g.fillStyle = AMBER; g.fillText('P A U S E', 440, 240)
        PAUSE_ITEMS.forEach((p, i) => {
          const y = 258 + i * 62, on = i === pSel
          hit(440, y, 400, 52, () => { pSel = i; pressKey('Enter') }, () => { pSel = i }) // 올리면 고르고, 누르면 실행
          menuRow(g, 440, y, 400, 52, ease('pause' + i, on))
          g.font = `800 22px ${FONT}`; g.fillStyle = '#fff'; g.fillText(p, 480, y + 34)
        })
      }
    },
    keydown(e) {
      if (!ready) { if (e.key === 'Escape') quit(); return }
      if (paused) {
        if (e.key === 'ArrowDown') pSel = (pSel + 1) % PAUSE_ITEMS.length
        else if (e.key === 'ArrowUp') pSel = (pSel + PAUSE_ITEMS.length - 1) % PAUSE_ITEMS.length
        else if (e.key === 'Escape' || (e.key === 'Enter' && pSel === 0)) { paused = false; resumeAt = performance.now() + 3000 } // 곡은 멈춘 채 3초 센 뒤 재개
        else if (e.key === 'Enter') {
          if (pSel === 1) { clock.resume(); sm.go('play', data) }
          else if (pSel === 2) sm.go('settings', { back: 'play', backData: { ...data, resume: true } }) // 곡은 멈춘 채로 설정을 연다
          else quit()
        }
        return
      }
      if (dying) return // 실패 연출 중에는 일시정지 불가
      if (data.vs && e.key === 'Escape') { sk.hp = 0; return } // 대결 중에는 멈출 수 없다: Esc는 기권(실패 처리)
      if (e.key === 'Escape') { paused = true; resumeAt = 0; pSel = 0; down.clear(); clock.pause(); return }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { // 플레이 중 스크롤 속도 조절 (꾹 눌러도 한 번에 한 칸)
        if (e.repeat) return
        settings.scroll = Math.min(Math.max(Math.round((settings.scroll + (e.key === 'ArrowUp' ? 0.5 : -0.5)) * 10) / 10, 1), 20)
        saveSettings(); speedAt = performance.now(); return
      }
      const l = laneOf(e)
      if (l >= 0 && l < LANES) { down.add(l); if (!finished && !resumeAt && !dying) press(l, clock.timeAt(e.timeStamp) - settings.judgeOffset / 1000) }
    },
    keyup(e) {
      const l = laneOf(e)
      if (l < 0 || l >= LANES) return
      down.delete(l)
      if (ready && !paused && !resumeAt && !finished && !dying) release(l, clock.timeAt(e.timeStamp) - settings.judgeOffset / 1000)
    }
  }
}
