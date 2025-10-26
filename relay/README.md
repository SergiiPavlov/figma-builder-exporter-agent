# Relay service

Local express server storing tasks in JSONL and exposing API for plugin automation.

## Usage

```bash
npm install
npm run dev
# server listens on http://localhost:3000
```

## Endpoints

- `GET /health` – health check
- `POST /tasks` – create task from TaskSpec
- `GET /tasks/{id}` – fetch task by id
- `POST /tasks/{id}/result` – store result for task
- `GET /tasks/latest` – fetch most recent task by status (`pending` by default)
