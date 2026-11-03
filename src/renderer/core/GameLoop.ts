export function startLoop(update: (dt: number) => void, render: () => void) {
  let last = performance.now()
  const frame = (now: number) => {
    update((now - last) / 1000)
    last = now
    render()
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
