#!/usr/bin/env bash
set -euo pipefail

: "${RELAY_URL:=http://localhost:3000}"

TASK_SPEC_PATH="${1:-$(dirname "$0")/../taskspecs/marketing-landing.json}"

if [[ ! -f "$TASK_SPEC_PATH" ]]; then
  echo "TaskSpec file not found: $TASK_SPEC_PATH" >&2
  exit 1
fi

curl -sS -X POST "$RELAY_URL/validate/taskSpec" \
  -H "Content-Type: application/json" \
  -d @"$TASK_SPEC_PATH" | jq .
