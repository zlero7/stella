#!/bin/bash
# 사용: mkplay.sh <곡 폴더 이름>  (이미 meta의 audio가 play.mp4면 건너뜀)
# 원본 영상(audio.mp4, 30~280MB)은 서버에서 받기에 너무 커서, 영상만 480p·20fps로 줄이고 음원 트랙은 그대로 복사한 play.mp4(5~10MB)를 만든다.
# 음원 트랙이 비트 단위로 같아서 채보 타이밍은 그대로다. 앱은 meta의 audio·video(둘 다 play.mp4)만 받는다. 원본은 지우지 않는다
ROOT="$(cd "$(dirname "$0")" && pwd)"
FFDIR="${FFMPEG_DIR:-$(dirname "$(command -v ffmpeg 2>/dev/null)")}"
[ -x "$FFDIR/ffmpeg" ] || [ -x "$FFDIR/ffmpeg.exe" ] || { echo "ffmpeg를 찾을 수 없습니다 (PATH 또는 FFMPEG_DIR)" >&2; exit 1; }
d="$1"; cd "$ROOT/songs/$d" || exit 1
a=$(node -e "const m=JSON.parse(require('fs').readFileSync('meta.json','utf8'));console.log(m.audio===m.video?m.audio:'')")
[ "$a" = "play.mp4" ] && exit 0
[ -n "$a" ] || { echo "skip $d (audio와 video가 다름)"; exit 0; }
"$FFDIR/ffmpeg" -v error -y -i "$a" -vf "scale=-2:480,fps=20" -c:v libx264 -preset veryfast -crf 32 -c:a copy -movflags +faststart play.part.mp4 </dev/null && mv play.part.mp4 play.mp4 || { rm -f play.part.mp4; echo "FAIL $d"; exit 1; }
# meta는 파일이 다 만들어진 뒤에 바꾼다 (서버는 meta를 보고 목록을 만든다)
node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('meta.json','utf8'));m.audio=m.video='play.mp4';fs.writeFileSync('meta.json.tmp',JSON.stringify(m,null,2));fs.renameSync('meta.json.tmp','meta.json')"
echo "done $d"
