# Figma Relay Agent Guide

## Quick start commands
- `npm ci --prefix relay`
- `npm run relay:dev:key`
- `npm run e2e:local`

## Key references
- `README.md` — overview of the workspace
- `schemas/openapi.v1.0.0.yaml` — API contract for the relay service
- `agent-md/plan/FigmaAgent_Plan_v1.0.json` — milestone roadmap and acceptance criteria

## Acceptance test checklist (AT-01…AT-05)
1. Relay health endpoint returns **200 OK** when the server is running.
2. Protected endpoints reject anonymous access with **401 Unauthorized**.
3. Bearer key `dev123` enables authorized access with valid JSON responses.
4. Local `npm run e2e:local` completes with all checks passing.
5. Plugin Build → Export flow yields a clean `summary` unless spacing deviations exceed ±2 px.

## Milestone status
- **M1** — ✅ completed (relay bootstrap + health checks)
- **M2** — 🚧 in progress (plugin spacing tolerances + export metadata)
- **M3** — ⏳ pending (extended API coverage + downstream integrations)
