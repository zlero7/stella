import { serverUrl } from './Songs'

// 프로필 이미지: 서버가 공개 주소(/avatar/<번호>.jpg?v=<시각>)로 내준다. 키는 프로필의 avatar ("번호.시각", 없으면 '')
const cache = new Map<string, HTMLImageElement>()
export function avatarImg(key?: string) { // 다 받은 그림만 돌려준다 (못 받았으면 undefined: 첫 글자 그림으로 그린다)
  if (!key) return undefined
  let im = cache.get(key)
  if (!im) { const [pid, v] = key.split('.'); im = new Image(); im.src = `${serverUrl()}/avatar/${pid}.jpg?v=${v}`; cache.set(key, im) }
  return im.complete && im.naturalWidth ? im : undefined
}

// 사진 고르기: 숨은 파일 입력을 눌러 윈도우 파일 창을 연다. 가운데를 정사각형으로 잘라 160px JPEG로 줄인다 (서버는 64KB까지, 보통 10KB 안팎). 취소하면 undefined
export function pickAvatar(): Promise<Blob | undefined> {
  return new Promise((ok, no) => {
    const el = document.createElement('input'); el.type = 'file'; el.accept = 'image/png,image/jpeg,image/webp,image/gif'
    el.addEventListener('cancel', () => ok(undefined))
    el.addEventListener('change', async () => {
      const f = el.files?.[0]; if (!f) return ok(undefined)
      try {
        const bm = await createImageBitmap(f), s = Math.min(bm.width, bm.height), cv = document.createElement('canvas'); cv.width = cv.height = 160
        const g = cv.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, 160, 160) // 투명 PNG는 흰 바탕 위에
        g.drawImage(bm, (bm.width - s) / 2, (bm.height - s) / 2, s, s, 0, 0, 160, 160)
        cv.toBlob(b => (b ? ok(b) : no(new Error('이미지를 줄이지 못했습니다'))), 'image/jpeg', 0.85)
      } catch { no(new Error('읽을 수 없는 이미지입니다')) }
    })
    el.click()
  })
}
