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

## Artifacts Gallery + Bulk ZIP

- Список артефактов поддерживает локальный поиск в плагине (по подстроке ID), сортировку и пагинацию.
- Для массовой выгрузки используйте `POST /artifacts/bulk.zip` с телом `{ "ids": ["id1", "id2"] }`.
- В ответе приходит ZIP-архив, где для каждой задачи есть `exportSpec.json`, `logs.txt`, `task.json`, `meta.json`. Если какие-то ID пропущены, они перечисляются в `bulk.log.txt`.

```bash
curl -s "http://localhost:3000/artifacts?limit=10&order=desc"

curl -s -X POST http://localhost:3000/artifacts/bulk.zip \
  -H 'Content-Type: application/json' \
  -d '{"ids":["task-id-1","task-id-2"]}' \
  -o artifacts-selected.zip
```
