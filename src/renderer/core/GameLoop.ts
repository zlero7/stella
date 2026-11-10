// 프레임 시작 시각(requestAnimationFrame이 주는 값, 화면 갱신에 맞춰 일정하다). 노트 위치는 이 시각 기준으로 그린다
export let frameT = performance.now()

export function startLoop(update: (dt: number) => void, render: () => void) {
  let last = performance.now()
  const frame = (now: number) => {
    frameT = now
    update((now - last) / 1000)
    last = now
    render()
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
