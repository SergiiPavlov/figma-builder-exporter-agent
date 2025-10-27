#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <task-id> [json|zip] [ttl-minutes]" >&2
  exit 1
fi

TASK_ID="$1"
SHARE_TYPE="${2:-zip}"
TTL_MIN="${3:-60}"

if ! [[ "$SHARE_TYPE" =~ ^(json|zip)$ ]]; then
  echo "Share type must be 'json' or 'zip'" >&2
  exit 1
fi

if ! [[ "$TTL_MIN" =~ ^[0-9]+$ ]]; then
  echo "TTL must be an integer number of minutes" >&2
  exit 1
fi

: "${RELAY_URL:=http://localhost:3000}"
: "${API_KEY:?API_KEY environment variable is required}"

PAYLOAD=$(jq -n --arg type "$SHARE_TYPE" --argjson ttl "$TTL_MIN" '{type: $type, ttlMin: $ttl}')

echo "Requesting share token for $TASK_ID (type=$SHARE_TYPE, ttl=$TTL_MIN min)" >&2
curl -sS -X POST "$RELAY_URL/tasks/$TASK_ID/share" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" | jq .
