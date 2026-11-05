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
initVersus(sm)
void verify() // 저장된 로그인이 아직 유효한지 (서버에 못 닿으면 그대로 둔다)
sm.go('title')
if (import.meta.env.DEV) (window as unknown as { __sm: SceneManager }).__sm = sm // 개발 중 화면을 바로 열어 보는 용도

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
// 화면 크기에 맞춰 캔버스의 실제 해상도를 정한다(1280~1920폭): 큰 화면에서 글자와 선이 뭉개지지 않는다. 그림은 계속 1280x720 좌표로 그린다
function fitCanvas() {
  const w = Math.min(1920, Math.max(1280, Math.round(cv.clientWidth * devicePixelRatio)))
  if (cv.width !== w) { cv.width = w; cv.height = Math.round(w * 9 / 16) }
  g.setTransform(w / 1280, 0, 0, w / 1280, 0, 0)
}
startLoop(dt => sm.update(dt), () => { fitCanvas(); clearHits(); sm.render(g); drawPointer(g, !!hitAt(mouse.x, mouse.y)) })
