#!/bin/bash
cd "$(dirname "$0")"
for g in $1; do timeout 100 google-chrome --headless=new --disable-gpu --no-first-run --user-data-dir=$PWD/out/chromeprof --virtual-time-budget=600000 --dump-dom "http://localhost:5175/px.html?g=$g&n=${2:-6}" 2>/dev/null | sed -n '/<pre id="res">/,/<\/pre>/p' | sed 's/<\/\?[a-z][^>]*>//g'; done
