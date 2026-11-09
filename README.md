# STELLA

스텔라이브 커버곡 세로 리듬게임. 앱은 Tauri 2 + TypeScript(캔버스 1280x720), 서버(`server/relay.mjs`)는 곡 배포·계정·랭킹·래더·친구 대결 중계를 맡습니다.

## 앱 빌드·실행

```bash
npm install
npm run dev                       # 개발 (브라우저 http://localhost:9261)
npm test                          # 시험 (앱 로직 + 서버 + 서버 API)
VITE_RELAY=서버주소 npm run build   # 설치 파일: src-tauri/target/release/bundle/nsis/
```

서버 주소는 소스에 없습니다. 배포용 빌드는 `VITE_RELAY=your.domain`(https 터널 주소)을 꼭 주세요. 앱 설정 화면에서 주소를 바꿀 수도 있습니다.

## 서버

```bash
node server/relay.mjs             # 127.0.0.1:9777 (PORT 환경 변수), 터널(Cloudflare 등)로 https 공개
```

| 환경 변수 | 뜻 |
|---|---|
| `PORT` | 서버 포트 (기본 9777) |
| `STELLA_DATA` | 계정(`users.json`)·랭킹(`ranks.json`) 폴더 (기본 `server/`). 시험 서버는 따로 두세요 |
| `STELLA_SONGS` | 곡 폴더 (기본 `songs/`) |

- `songs/<곡>/` 에 `meta.json`, 음원(`audio.mp4`), 표지(`cover.jpg`), 채보(`4k-hard.json` …)가 있으면 목록에 나옵니다. 곡 파일은 저작물이라 저장소에 없습니다.
- 음원·영상은 로그인한 계정만 받습니다. 표지·채보·목록은 공개.
- 점수는 "곡 시작" 기록이 있고 곡 길이의 80%가 지난 뒤에만 받습니다.
- `users.json` 은 저장할 때마다 `users.json.bak` 으로 한 벌 남깁니다. 백업은 따로 해 두세요.
- 비밀번호를 잊은 계정은 복구 수단이 없습니다 (`users.json`에서 지워야 함).
- 죽으면 가입·곡 목록이 멈춥니다. Windows 작업 스케줄러에 "시작할 때 실행, 실패하면 다시 시작"으로 `node server/relay.mjs` 를 등록하세요.

## 곡 추가 스크립트 (bash)

`gen.sh`(채보), `mkcover.sh`(표지), `mkpreview.sh`(미리보기), `regen.sh`(자동 채보 다시 만들기). ffmpeg가 PATH에 있거나 `FFMPEG_DIR`(ffmpeg가 든 폴더)을 지정해야 합니다.
