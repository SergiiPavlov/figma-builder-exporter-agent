#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <left-id> <right-id> [mode] [output-file]" >&2
  exit 1
fi

LEFT_ID="$1"
RIGHT_ID="$2"
MODE="${3:-summary}"
OUTPUT_PATH="${4:-compare-${LEFT_ID}-${RIGHT_ID}.zip}"

: "${RELAY_URL:=http://localhost:3000}"
: "${API_KEY:?API_KEY environment variable is required}"

URL="$RELAY_URL/artifacts/compare.zip?leftId=${LEFT_ID}&rightId=${RIGHT_ID}&mode=${MODE}"

echo "Downloading ZIP diff to $OUTPUT_PATH" >&2
curl -sS "$URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Accept: application/zip" \
  -o "$OUTPUT_PATH"

echo "Saved ZIP diff to $OUTPUT_PATH" >&2
