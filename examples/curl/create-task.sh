#!/usr/bin/env bash
set -euo pipefail

: "${RELAY_URL:=http://localhost:3000}"
: "${API_KEY:?API_KEY environment variable is required}"

TASK_SPEC_PATH="${1:-$(dirname "$0")/../taskspecs/minimal.json}"

if [[ ! -f "$TASK_SPEC_PATH" ]]; then
  echo "TaskSpec file not found: $TASK_SPEC_PATH" >&2
  exit 1
fi

PAYLOAD=$(jq -c '{taskSpec: .}' "$TASK_SPEC_PATH")

echo "Creating task from $TASK_SPEC_PATH via $RELAY_URL/tasks" >&2
curl -sS -X POST "$RELAY_URL/tasks" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" | jq .
