#!/usr/bin/env bash
set -euo pipefail

project="$(cd "$(dirname "$0")/.." && pwd)"
dist="$project/dist"

mkdir -p "$dist/server" "$dist/assets" "$dist/data"
cp "$project/worker/index.js" "$dist/server/index.js"
cp "$project/index.html" "$project/exam.html" "$project/review.html" "$dist/"
cp "$project/Iansui-Regular.ttf" "$project/.nojekyll" "$dist/"
cp -R "$project/assets/." "$dist/assets/"
cp -R "$project/data/." "$dist/data/"

printf 'Sites build ready: %s\n' "$dist"
