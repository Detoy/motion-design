#!/usr/bin/env bash
# Bake a settled poster frame as frame 0 without changing duration or audio sync.
# Usage: bake-poster.sh <input.mp4> <output.mp4> <poster.jpg> <timestamp>
set -euo pipefail

IN="${1:?input mp4}"
OUT="${2:?output mp4}"
POSTER="${3:?poster jpg}"
TS="${4:?timestamp seconds, e.g. 3.2}"

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

ffmpeg -y -ss "$TS" -i "$IN" -frames:v 1 -q:v 2 "$POSTER"

ffmpeg -y -i "$IN" -i "$POSTER" \
  -filter_complex "[0:v][1:v]overlay=0:0:enable='eq(n,0)'[v]" \
  -map "[v]" -map 0:a? \
  -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p \
  -c:a copy \
  -movflags +faststart \
  "$TMPDIR/out.mp4"

ffprobe -v error "$TMPDIR/out.mp4" >/dev/null
mv "$TMPDIR/out.mp4" "$OUT"
echo "poster $POSTER baked into $OUT at t=$TS"
