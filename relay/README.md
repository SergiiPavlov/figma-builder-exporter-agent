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
- `GET /tasks/{id}` → `{ id, status, createdAt, taskSpec, logs[], result?, artifactPath?, artifactSize? }`
- `GET /tasks/{id}/result` → `{ taskId, status, exportSpec, logs[], error?, artifactPath?, artifactSize? }`
- `POST /tasks/{id}/result` body: `{ result }` → `{ ok: true }`

> Поддерживается повторный запуск задач: отправьте исходный `taskSpec` в `POST /tasks` (плагин добавляет суффикс `-rerun-<short_ts>` к `meta.id` и поле `meta.rerunOf`).

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

## Public sharing

- Публичные ссылки включаются опционально через переменные окружения (или аргументы `createApp`):
  - `PUBLIC_BASE_URL` — базовый URL, который попадёт в ответы (`https://relay.company.com`). Если не задан, используется адрес запроса.
  - `PUBLIC_TOKEN_TTL_MIN` — TTL токенов по умолчанию в минутах (1–1440, по умолчанию 60).
- `POST /tasks/{id}/share` → `{ url, expiresAt }`
  - Тело запроса (опционально): `{ "type": "json" | "zip", "ttlMin": <минуты> }`. По умолчанию выдаётся ZIP.
  - Сервер генерирует криптостойкий токен и сохраняет его вместе с типом и сроком действия (in-memory + `data/shares.json`).
- `GET /shared/{token}` — отдаёт JSON или ZIP артефакт. Заголовки совпадают с `/tasks/{id}/artifact` и `/tasks/{id}/package.zip`.
  - Неверный токен → `404 Not Found`.
  - Просроченный токен → `410 Gone`; записи очищаются по TTL.

## Notifications (Webhooks & Slack)

### Webhooks

- Настройте переменные окружения (или аргументы `createApp(...)`), чтобы включить отправку уведомлений:
  - `WEBHOOK_URL` — адрес `POST`-эндпоинта. Если пусто, вебхуки отключены.
  - `WEBHOOK_EVENTS` — CSV-список событий (`done`, `error`). По умолчанию отправляются оба.
  - `WEBHOOK_RETRIES` — количество попыток доставки (по умолчанию 3).
  - `WEBHOOK_TIMEOUT_MS` — таймаут HTTP-запроса (по умолчанию 5000 мс).
- Повторные попытки выполняются с экспоненциальной задержкой: 0.5s → 1s → 2s.
- `POST /tasks/:id/result` и совместимый `POST /results` публикуют событие `task.done`.
- Фиксация ошибки выполнения (например, через `app.locals.markTaskError(...)`) публикует событие `task.error`.
- Формат payload:

```json
{
  "event": "task.done",
  "taskId": "…",
  "createdAt": 1730,
  "status": "done",
  "artifact": {
    "json": "/tasks/{id}/artifact",
    "zip": "/tasks/{id}/package.zip"
  },
  "summary": {
    "artifactSize": 1234
  }
}
```

```json
{
  "event": "task.error",
  "taskId": "…",
  "createdAt": 1730,
  "status": "error",
  "artifact": {
    "json": "/tasks/{id}/artifact",
    "zip": "/tasks/{id}/package.zip"
  },
  "summary": {
    "artifactSize": null
  },
  "errorMessage": "Runner crashed"
}
```

### Slack

- Если задан `SLACK_WEBHOOK_URL`, дополнительно отправляется короткое сообщение с ссылками на артефакты.
- Формат для `task.done`:

```
[task.done] <taskId> ✅
JSON: http://localhost:3000/tasks/<taskId>/artifact
ZIP:  http://localhost:3000/tasks/<taskId>/package.zip
```

- Для `task.error` сообщение содержит значок ❌ и текст ошибки (если есть).
- Адрес берётся из заголовков входящего запроса (host + protocol) или по умолчанию `http://localhost:3000`.
