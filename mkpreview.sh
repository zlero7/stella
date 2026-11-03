#!/bin/bash
# 사용: mkpreview.sh <곡 폴더 이름>  (이미 preview.mp4가 있으면 건너뜀)
# 아직 받지 않은 곡의 목록 미리보기용: 미리듣기 구간 20초를 480p로 줄인다 (Preview.ts의 previewStartOf와 같은 지점)
d="$1"; cd "D:/리듬게임/songs/$d" || exit 1
B="/c/Users/Administrator/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin"
[ -e preview.mp4 ] && exit 0
a=$(node -e "console.log(JSON.parse(require('fs').readFileSync('meta.json','utf8')).audio)")
ps=$(node -e "console.log(JSON.parse(require('fs').readFileSync('meta.json','utf8')).previewStart||0)")
dur=$("$B/ffprobe.exe" -v error -show_entries format=duration -of csv=p=0 "$a")
st=$(node -e "const d=+process.argv[1],p=+process.argv[2];console.log(Math.min(p||d*0.3,Math.max(d-5,0)).toFixed(2))" "$dur" "$ps")
"$B/ffmpeg.exe" -v error -y -ss "$st" -t 20 -i "$a" -vf "scale=-2:480,fps=30" -c:v libx264 -preset veryfast -crf 29 -c:a aac -b:a 64k -movflags +faststart preview.part.mp4 && mv preview.part.mp4 preview.mp4
echo "done $d"
