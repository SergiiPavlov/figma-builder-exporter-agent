#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <task-id> [export-spec.json]" >&2
  exit 1
fi

TASK_ID="$1"
EXPORT_SPEC_PATH="${2:-}"

: "${RELAY_URL:=http://localhost:3000}"
: "${API_KEY:?API_KEY environment variable is required}"

if [[ -n "$EXPORT_SPEC_PATH" ]]; then
  if [[ ! -f "$EXPORT_SPEC_PATH" ]]; then
    echo "ExportSpec file not found: $EXPORT_SPEC_PATH" >&2
    exit 1
  fi
  EXPORT_SPEC=$(jq -c '.' "$EXPORT_SPEC_PATH")
else
  NOW=$(date -u +%FT%TZ)
  EXPORT_SPEC=$(jq -n --arg generatedAt "$NOW" '{
    meta: {
      generatedAt: $generatedAt,
      agent: "examples/curl/post-result.sh"
    },
    summary: {
      sections: 3,
      warnings: 0
    }
  }')
fi

PAYLOAD=$(jq -n --arg taskId "$TASK_ID" --argjson exportSpec "$EXPORT_SPEC" '{
  taskId: $taskId,
  exportSpec: $exportSpec,
  logs: [
    "build started",
    {"message": "build done", "ts": (now | strftime("%Y-%m-%dT%H:%M:%SZ"))}
  ]
}')

echo "Posting result for task $TASK_ID via $RELAY_URL/results" >&2
curl -sS -X POST "$RELAY_URL/results" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" | jq .
