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

## Retention & Pagination

- Настройте хранение через переменные окружения:
  - `MAX_ARTIFACTS` (по умолчанию 200) — сколько последних результатов оставлять в `data/results`.
  - `TTL_DAYS` (по умолчанию 30) — сколько дней хранить артефакты перед удалением.
- Очистка запускается при старте сервера и лениво при запросах к `/artifacts`.
- Список артефактов поддерживает пагинацию и сортировку:

```bash
curl -s "http://localhost:3000/artifacts?limit=5"
curl -s "http://localhost:3000/artifacts?offset=5&limit=5&order=asc"
```
