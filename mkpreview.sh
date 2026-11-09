#!/bin/bash
# 사용: mkpreview.sh <곡 폴더 이름>  (이미 preview.mp4가 있으면 건너뜀)
# 아직 받지 않은 곡의 목록 미리보기용: 미리듣기 구간 20초를 480p로 줄인다 (Preview.ts의 previewStartOf와 같은 지점)
ROOT="$(cd "$(dirname "$0")" && pwd)"
FFDIR="${FFMPEG_DIR:-$(dirname "$(command -v ffmpeg 2>/dev/null)")}" # ffmpeg 폴더: PATH에 있으면 자동, 아니면 FFMPEG_DIR 환경 변수
[ -x "$FFDIR/ffmpeg" ] || [ -x "$FFDIR/ffmpeg.exe" ] || { echo "ffmpeg를 찾을 수 없습니다 (PATH 또는 FFMPEG_DIR)" >&2; exit 1; }
d="$1"; cd "$ROOT/songs/$d" || exit 1
[ -e preview.mp4 ] && exit 0
a=$(node -e "console.log(JSON.parse(require('fs').readFileSync('meta.json','utf8')).audio)")
ps=$(node -e "console.log(JSON.parse(require('fs').readFileSync('meta.json','utf8')).previewStart||0)")
dur=$("$FFDIR/ffprobe" -v error -show_entries format=duration -of csv=p=0 "$a")
st=$(node -e "const d=+process.argv[1],p=+process.argv[2];console.log(Math.min(p||d*0.3,Math.max(d-5,0)).toFixed(2))" "$dur" "$ps")
"$FFDIR/ffmpeg" -v error -y -ss "$st" -t 20 -i "$a" -vf "scale=-2:480,fps=30" -c:v libx264 -preset veryfast -crf 29 -c:a aac -b:a 64k -movflags +faststart preview.part.mp4 && mv preview.part.mp4 preview.mp4
echo "done $d"
