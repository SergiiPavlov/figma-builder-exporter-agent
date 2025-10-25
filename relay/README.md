# Relay (M2)

Лёгкий локальный сервер, чтобы GPT Actions мог класть задачи для плагина Figma и забирать результат.

## Запуск
```bash
cd relay
npm i
npm run dev   # http://localhost:3000
# (опционально) ngrok http 3000
```

## Эндпоинты
- `GET /health` → `{ ok: true }`
- `POST /tasks` body: `{ taskSpec }` → `{ taskId }`
- `GET /tasks/{id}` → `{ status: pending|done, taskSpec?, result? }`
- `POST /tasks/{id}/result` body: `{ result }` → `{ ok: true }`

## Данные
- JSONL-файл `relay/data/tasks.jsonl` (last-write-wins)
