#!/bin/bash
# 사용: mkcover.sh <곡 폴더 이름>  (cover.jpg·bg.jpg가 이미 있으면 건너뜀)
# 영상에서 한 장면(30% 지점에서 가장 대표적인 프레임)을 뽑아 곡 카드용 정사각형(cover.jpg)과 배경용(bg.jpg)을 만든다.
# 아직 받지 않은 곡의 목록이 원본 영상을 통째로 불러오지 않고 이 작은 그림만 받게 하려는 것
ROOT="$(cd "$(dirname "$0")" && pwd)"
FFDIR="${FFMPEG_DIR:-$(dirname "$(command -v ffmpeg 2>/dev/null)")}" # ffmpeg 폴더: PATH에 있으면 자동, 아니면 FFMPEG_DIR 환경 변수
[ -x "$FFDIR/ffmpeg" ] || [ -x "$FFDIR/ffmpeg.exe" ] || { echo "ffmpeg를 찾을 수 없습니다 (PATH 또는 FFMPEG_DIR)" >&2; exit 1; }
d="$1"; cd "$ROOT/songs/$d" || exit 1
[ -e cover.jpg ] && [ -e bg.jpg ] && exit 0
a=$(node -e "console.log(JSON.parse(require('fs').readFileSync('meta.json','utf8')).audio)")
dur=$("$FFDIR/ffprobe" -v error -show_entries format=duration -of csv=p=0 "$a")
st=$(node -e "console.log(Math.min(+process.argv[1]*0.3,Math.max(+process.argv[1]-12,0)).toFixed(2))" "$dur")
"$FFDIR/ffmpeg" -v error -y -ss "$st" -i "$a" -frames:v 1 -vf "thumbnail=300,crop='min(iw,ih)':'min(iw,ih)',scale=480:480" -q:v 4 cover.jpg
"$FFDIR/ffmpeg" -v error -y -ss "$st" -i "$a" -frames:v 1 -vf "thumbnail=300,scale=1280:-2" -q:v 4 bg.jpg
echo "done $d"
