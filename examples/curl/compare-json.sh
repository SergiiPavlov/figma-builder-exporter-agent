#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <left-id> <right-id> [mode]" >&2
  exit 1
fi

LEFT_ID="$1"
RIGHT_ID="$2"
MODE="${3:-summary}"

: "${RELAY_URL:=http://localhost:3000}"
: "${API_KEY:?API_KEY environment variable is required}"

PAYLOAD=$(jq -n --arg left "$LEFT_ID" --arg right "$RIGHT_ID" --arg mode "$MODE" '{leftId: $left, rightId: $right, mode: $mode}')

echo "Comparing $LEFT_ID vs $RIGHT_ID (mode=$MODE)" >&2
curl -sS -X POST "$RELAY_URL/artifacts/compare" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" | jq .
