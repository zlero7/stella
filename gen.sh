#!/bin/bash
# 사용: gen.sh <곡 폴더 이름>  (4키·6키 채보가 다 있는 곡은 건너뜀)
ROOT="$(cd "$(dirname "$0")" && pwd)"
FFDIR="${FFMPEG_DIR:-$(dirname "$(command -v ffmpeg 2>/dev/null)")}" # ffmpeg 폴더: PATH에 있으면 자동, 아니면 FFMPEG_DIR 환경 변수
[ -x "$FFDIR/ffmpeg" ] || [ -x "$FFDIR/ffmpeg.exe" ] || { echo "ffmpeg를 찾을 수 없습니다 (PATH 또는 FFMPEG_DIR)" >&2; exit 1; }
d="$1"; cd "$ROOT"
miss=0; for k in 4 6; do for df in easy normal hard stella; do [ -e songs/$d/${k}k-$df.json ] || miss=1; done; done; [ $miss = 0 ] && exit 0
a=$(node -e "console.log(JSON.parse(require('fs').readFileSync('songs/$d/meta.json','utf8')).audio)")
mkdir -p tmp_gen
"$FFDIR/ffmpeg" -v error -y -i "songs/$d/$a" -af "pan=mono|c0=c0" -ar 48000 -f f32le tmp_gen/$d.pcm && node src/renderer/game/gen.ts tmp_gen/$d.pcm songs/$d 2>&1 | grep -v -i -E "warn|module|trace"
rm -f tmp_gen/$d.pcm
echo "done $d"
