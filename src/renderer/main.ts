import './tauriApi' // 가장 먼저: Storage 등이 불러올 때 window.api를 읽는다
import { SceneManager } from './core/SceneManager'
import { startLoop } from './core/GameLoop'
import { Title } from './scenes/Title'
import { Loading } from './scenes/Loading'
import { Keys } from './scenes/Keys'
import { SongSelect } from './scenes/SongSelect'
import { Play } from './scenes/Play'
import { Result } from './scenes/Result'
import { Settings } from './scenes/Settings'
import { Calibrate } from './scenes/Calibrate'
import { Lobby } from './scenes/Lobby'
import { VsResult } from './scenes/VsResult'
import { Account } from './scenes/Account'
import { verify } from './data/Account'
import { checkUpdate } from './data/Update'
import { prof, refreshProfile } from './data/Profile'
import { Ladder } from './scenes/Ladder'
import { Collection } from './scenes/Collection'
import { initVersus } from './core/Versus'
import { clearHits, hitAt, mouse, setDispatch } from './render/theme'
import { uiSound } from './core/Sfx'
import { drawPointer, pointerDown, pointerLeave, pointerMove } from './render/pointer'

const cv = document.getElementById('c') as HTMLCanvasElement
const g = cv.getContext('2d', { alpha: false })! // 불투명 캔버스: 합성 비용 감소
const sm = new SceneManager()
sm.add('title', Title(sm))
sm.add('loading', Loading(sm))
sm.add('keys', Keys(sm))
sm.add('select', SongSelect(sm))
sm.add('play', Play(sm))
sm.add('result', Result(sm))
sm.add('settings', Settings(sm))
sm.add('calib', Calibrate(sm))
sm.add('vs', Lobby(sm))
sm.add('vsresult', VsResult(sm))
sm.add('account', Account(sm))
sm.add('ladder', Ladder(sm))
sm.add('collection', Collection(sm))
initVersus(sm)
void checkUpdate()
void verify().then(refreshProfile) // 저장된 로그인이 아직 유효한지 (서버에 못 닿으면 그대로 둔다), 그다음 내 프로필
sm.go('title')
if (import.meta.env.DEV) Object.assign(window, { __sm: sm, __prof: prof }) // 개발 중 화면을 바로 열어 보는 용도 (프로필도 손으로 채워 본다)

// 화면 크기에 맞춰 늘어난 캔버스의 좌표를 1280x720 기준으로 되돌린다
const pos = (e: MouseEvent) => {
  const r = cv.getBoundingClientRect()
  return [(e.clientX - r.left) * 1280 / r.width, (e.clientY - r.top) * 720 / r.height] as const
}

addEventListener('keydown', e => {
  if (/^F([1-9]|10)$/.test(e.key)) e.preventDefault() // WebView2가 F3(검색)·F5(새로고침) 같은 키를 가로채지 않게
  sm.keydown(e)
})
addEventListener('keyup', e => sm.keyup(e))
// 마우스: 장면이 그리면서 등록한 클릭 영역이 있으면 그걸 누른 것으로 처리하고, 없으면 장면(에디터 등)이 직접 받는다
const fakeKey = (key: string) => ({ key, repeat: false, shiftKey: false, ctrlKey: false, altKey: false, metaKey: false, isComposing: false, timeStamp: performance.now(), preventDefault() {} }) as unknown as KeyboardEvent
setDispatch(k => sm.keydown(fakeKey(k)))
sm.onKey = uiSound
cv.addEventListener('mousedown', e => {
  const p = pos(e), t = e.button === 0 ? hitAt(...p) : undefined
  pointerMove(...p); pointerDown()
  if (t) t.click(); else sm.mousedown(...p, e.button)
})
addEventListener('mouseup', e => sm.mouseup(...pos(e), e.button))
addEventListener('mousemove', e => {
  const p = pos(e), t = hitAt(...p)
  pointerMove(...p)
  t?.over?.()
  sm.mousemove(...p)
})
addEventListener('wheel', e => sm.wheel(e.deltaY))
addEventListener('contextmenu', e => e.preventDefault())
cv.style.cursor = 'none' // 시스템 포인터 대신 게임 전용 포인터(별)를 그린다. 입력 칸 같은 HTML 위에서는 시스템 포인터가 그대로 보인다
cv.addEventListener('mouseleave', () => { pointerLeave(); mouse.x = mouse.y = -99 })
addEventListener('mousemove', e => { [mouse.x, mouse.y] = pos(e) })
// 화면 크기에 맞춰 캔버스의 실제 해상도를 정한다(1280폭 이상, 화면 픽셀 그대로): 그림을 늘려 붙이면 비스듬한 선이 계단처럼 보이고 글자가 뭉개진다. 그림은 계속 1280x720 좌표로 그린다
// 4K 화면에서 느려지면(프레임 시간 평균이 22ms 넘게 한동안 계속) 해상도 상한을 3840 → 2560 → 1920으로 한 단계씩 낮춘다
// 낮춘 지 1분이 지나면 한 단계만 다시 올려 본다 (잠깐 느렸던 것일 수 있다). 또 느려지면 다시 낮추고, 그 뒤로는 올리지 않는다
let cap = 3840, frameMs = 16.7, lastT = 0, slow = 0, loweredAt = 0, retried = false
function fitCanvas() {
  const w = Math.min(cap, Math.max(1280, Math.round(cv.clientWidth * devicePixelRatio)))
  if (cv.width !== w) { cv.width = w; cv.height = Math.round(w * 9 / 16) }
  g.setTransform(w / 1280, 0, 0, w / 1280, 0, 0)
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high' // 기본값(low)은 큰 커버·배경을 줄여 그릴 때 가장자리가 계단져 보인다. 캔버스 크기를 바꾸면 초기화되므로 매 프레임 지정
  const now = performance.now(), dt = now - lastT; lastT = now
  if (dt < 100) { frameMs += (dt - frameMs) * 0.05; slow = frameMs > 22 ? slow + 1 : 0; if (slow > 120 && cap > 1920) { cap = cap > 2560 ? 2560 : 1920; slow = 0; frameMs = 16.7; loweredAt = now } }
  if (cap < 3840 && !retried && loweredAt && now - loweredAt > 60000) { cap = cap < 2560 ? 2560 : 3840; retried = true; frameMs = 16.7; slow = 0 } // 창이 가려졌다 돌아온 큰 dt는 느린 탓이 아니므로 제외
}
startLoop(dt => sm.update(dt), () => { fitCanvas(); clearHits(); sm.render(g); drawPointer(g, !!hitAt(mouse.x, mouse.y)) })
