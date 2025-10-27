#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <task-id>" >&2
  exit 1
fi

TASK_ID="$1"
: "${RELAY_URL:=http://localhost:3000}"
: "${API_KEY:?API_KEY environment variable is required}"

URL="$RELAY_URL/tasks/$TASK_ID/watch"

echo "Streaming logs for task $TASK_ID" >&2
curl -sS -N "$URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Accept: text/event-stream"
