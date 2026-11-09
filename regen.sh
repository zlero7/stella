#!/bin/bash
# 자동 채보만 지우고 다시 만든다. 에디터로 고친 채보("hand": true)는 그대로 둔다
ROOT="$(cd "$(dirname "$0")" && pwd)"; cd "$ROOT"
for f in songs/imp-*/[46]k-*.json; do grep -Eq '"hand": ?true' "$f" || rm -f "$f"; done
ls songs | grep '^imp-' | xargs -P4 -n1 ./gen.sh
