# Relay (M2)

Лёгкий локальный сервер, чтобы GPT Actions мог класть задачи для плагина Figma и забирать результат.

## Запуск
```bash
cd relay
npm i
npm run dev   # http://localhost:3000
# (опционально) ngrok http 3000
```

## Запуск с .env

Скопируйте `.env.example` → `.env` и заполните нужные переменные (например, `API_KEYS`, `CORS_ORIGIN`).
Сервер автоматически подхватит файл при старте (`npm run dev`).

Примеры значений `TRUST_PROXY` для `.env`:

```
TRUST_PROXY=false        # по умолчанию, без прокси
TRUST_PROXY=1            # один доверенный прокси перед приложением
TRUST_PROXY=loopback     # доверять локальному прокси
```

> Если у вас только один промежуточный хоп, не ставьте `TRUST_PROXY=true`: передайте точное количество или адреса, чтобы предотвратить спуф заголовков `X-Forwarded-For`.

## Эндпоинты
- `GET /health` → `{ ok: true }`
- `POST /tasks` body: `{ taskSpec }` → `{ taskId }`
- `GET /tasks/{id}` → `{ id, status, createdAt, taskSpec, logs[], result?, artifactPath?, artifactSize? }`
- `GET /tasks/{id}/result` → `{ taskId, status, exportSpec, logs[], error?, artifactPath?, artifactSize? }`
- `POST /tasks/{id}/result` body: `{ result }` → `{ ok: true }`
- `POST /tasks/{id}/preview` body: `{ contentType: "image/png", base64 }` → `{ ok: true, size }`
- `GET /tasks/{id}/preview.png` → binary `image/png`

> Поддерживается повторный запуск задач: отправьте исходный `taskSpec` в `POST /tasks` (плагин добавляет суффикс `-rerun-<short_ts>` к `meta.id` и поле `meta.rerunOf`).

## Auth & Protection

- Включите простую API-аутентификацию через переменную `API_KEYS` (CSV-список значений). Пример: `API_KEYS="dev123,dev456"`.
- Сервер принимает ключи в заголовках `Authorization: Bearer <key>` или `X-API-Key: <key>`. Для SSE-подписок (`/tasks/{id}/watch`) можно передать ключ в query-параметре `?apiKey=<key>`.
- Переменная `API_FREE_ENDPOINTS` задаёт список публичных маршрутов (формат: `METHOD /path`, поддерживаются параметры `:token`). По умолчанию доступны `GET /health` и `GET /shared/:token`.
- Лимиты: по умолчанию действует 100 запросов за 5 минут на ключ/IP (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`). SSE-потоки `/tasks/{id}/watch` исключены из жёсткого лимита. Значение `0` отключает лимитер. Для корректной работы лимита по IP убедитесь, что `TRUST_PROXY` настроен в соответствии с вашей сетью.
- CORS настраивается через `CORS_ORIGIN`: `*` (значение по умолчанию в dev) или CSV списка доверенных origin (`https://relay.company.com,https://app.company.com`). Заголовки `Authorization`, `Content-Type` и `X-API-Key` добавлены в allow-list.
- В плагине Figma во вкладке Builder появился блок “API key”: ключ сохраняется локально и автоматически прокидывается во все HTTP-запросы, включая загрузки артефактов и SSE.

## Данные
- JSONL-файл `relay/data/tasks.jsonl` (last-write-wins)

## Proxy & Rate-limit safety

- Переменная `TRUST_PROXY` управляет поведением Express `app.set('trust proxy', ...)`. По умолчанию значение `false`, поэтому сервер игнорирует заголовки `X-Forwarded-For` и использует реальный `remoteAddress` для защиты и лимитера.
- Допустимые значения: `false`, `loopback`, `uniquelocal`, а также явный список подсетей/IP в формате CIDR (CSV). Примеры:
  - `TRUST_PROXY=false` — безопасное значение по умолчанию без доверия к промежуточным прокси.
  - `TRUST_PROXY=loopback` — доверять только локальному обратному прокси (например, `127.0.0.1`).
  - `TRUST_PROXY=127.0.0.1/8,::1` — доверять указанным адресам/подсетям.
- Лимитер строит ключ по API-ключу (если он валиден) либо по IP. При отключённом `TRUST_PROXY` попытка подменить `X-Forwarded-For` не изменит идентификатор клиента. Если Relay работает за прокси/балансировщиком, добавьте в `TRUST_PROXY` только те адреса, которые вы контролируете.

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

## Diff HTML report

- `GET /artifacts/compare.html?leftId=<id>&rightId=<id>&mode=summary|full` — HTML-отчёт сравнения двух артефактов.
- По умолчанию `mode=summary`; `full` добавляет блоки `unchanged` в список изменений.
- Заголовок содержит идентификаторы и отметку генерации, секции `Summary` и `Changes` отображают счётчики и список путей
  (для каждого значения показывается компактный `left/right`).
- Внизу есть кнопка «Download JSON diff», которая отправляет `POST /artifacts/compare` с теми же параметрами.
- Ограничение размера входящих артефактов — 5 МБ (тот же лимит, что и для JSON diff); превышение даёт `413`.
- Если хотя бы один артефакт не найден, возвращается `404`.
- Для защищённых инстансов можно добавить `apiKey=<value>` в query-string, чтобы открыть отчёт и скачать JSON.

```bash
curl -i "http://localhost:3000/artifacts/compare.html?leftId=task-a&rightId=task-b&mode=full"
```

## Compare ZIP report

- `GET /artifacts/compare.zip?leftId=<id>&rightId=<id>&mode=summary|full` — архив с результатами сравнения.
- Внутри находятся `diff.json` (как `POST /artifacts/compare`), `diff.html` (идентичен `GET /artifacts/compare.html`) и `meta.txt`
  с отметкой генерации и параметрами запроса.
- Ответ приходит с заголовком `Content-Type: application/zip` и именем файла `compare-<left>-vs-<right>.zip`.
- Ошибки совпадают с JSON/HTML-диффом: `404`, если артефакт отсутствует, и `413`, если размер превысил лимит 5 МБ.
- Для закрытых инстансов можно передать `apiKey` в query-string, чтобы собрать архив с действующим ключом.

```bash
curl -I "http://localhost:3000/artifacts/compare.zip?leftId=task-a&rightId=task-b&mode=full"
```

## Previews

- PNG-превью хранятся в `relay/data/previews/{taskId}.png`.
- Загрузка: `POST /tasks/{id}/preview` с телом `{ "contentType": "image/png", "base64": "..." }`. Лимит размера — 2 МБ; неверный тип или base64 → `400`, превышение лимита → `413`.
- Получение: `GET /tasks/{id}/preview.png` (возвращает `image/png`, `404`, если файла нет).
- Когда превью сохранено, `/artifacts` помечает записи `hasPreview=true`, детальные эндпоинты (`/tasks/{id}`, `/tasks/{id}/result`) додают `previewUrl`, а `package.zip` включает файл `preview.png`.

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
