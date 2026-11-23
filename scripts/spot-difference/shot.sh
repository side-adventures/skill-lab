#!/bin/bash
# shot.sh g s out.png [vb] [w]
cd "$(dirname "$0")"; w=${5:-1200}; h=$(( w*3/4 ))
timeout 60 google-chrome --headless=new --disable-gpu --no-first-run --user-data-dir=$PWD/out/chromeprof --hide-scrollbars --window-size=$((w+20)),$((h+20)) --screenshot=$3 "http://localhost:5175/zoom.html?g=$1&s=$2&w=$w${4:+&vb=$4}" >/dev/null 2>&1
