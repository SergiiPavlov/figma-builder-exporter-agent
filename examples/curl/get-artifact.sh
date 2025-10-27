#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <task-id> [output-file]" >&2
  exit 1
fi

TASK_ID="$1"
OUTPUT_PATH="${2:-${TASK_ID}.json}"

: "${RELAY_URL:=http://localhost:3000}"
: "${API_KEY:?API_KEY environment variable is required}"

URL="$RELAY_URL/tasks/$TASK_ID/artifact"

echo "Downloading artifact $TASK_ID to $OUTPUT_PATH" >&2
curl -sS "$URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Accept: application/json" \
  -o "$OUTPUT_PATH"

jq . "$OUTPUT_PATH" >/dev/null && echo "Saved JSON artifact to $OUTPUT_PATH" >&2
