# Задачи Relay

## Актуальные эндпоинты и схемы

Текущие реализованные ручки сервера:

- `GET /health`
- `POST /tasks`
- `GET /tasks/:id`
- `POST /tasks/:id/result`
- `POST /tasks/:id/log`
- `GET /tasks/latest?status=pending|done`
- `GET /tasks/:id/result`
- `POST /validate/taskSpec`
- `POST /validate/exportSpec`

Исходники: [`relay/server.js`](../../relay/server.js), [`relay/actions.yaml`](../../relay/actions.yaml), схемы в [`schemas/`](../../schemas).

## [RELAY] SSE-подписка статуса задачи

**Статус:** todo

**Цель:** реализовать `GET /tasks/:id/watch` (SSE), чтобы сервер отправлял события `{status, progress?, log?}` при смене состояния задачи.

**Изменяемые файлы:**
- `relay/server.js`
- `relay/README.md`
- `relay/actions.yaml`

**Критерии приёмки (Acceptance):**
- При SSE-подписке клиент получает `event: status` при создании задачи, получении логов и результата.
- Соединение обрывается через 10 минут без активности; повторная подписка поддерживается.

**Smoke-тест:**
```
# Новый task → открыть SSE в отдельной консоли (curl -N ...)
curl -s -X POST http://localhost:3000/tasks -H 'Content-Type: application/json' \
  -d '{"taskSpec":{"ping":"pong"}}'
curl -N http://localhost:3000/tasks/$TASK_ID/watch
# отправить лог и результат — в SSE должны прийти события
```

## Retention & Pagination

- Параметры хранения настраиваются через переменные окружения или аргументы `createApp(...)`:
  - `MAX_ARTIFACTS` (по умолчанию 200) — оставляем только N последних JSON-файлов в `relay/data/results/`. После превышения лимита при очередной очистке удаляются самые старые записи; задачи помечаются `deleted`, активные SSE-подписки закрываются.
  - `TTL_DAYS` (по умолчанию 30) — максимальный «возраст» артефакта. Всё, что старше `TTL_DAYS` относительно `createdAt`, удаляется вместе с записью задачи.
- Очистка (`cleanupArtifacts`) выполняется один раз при старте приложения и затем лениво при запросах `GET /artifacts`, если прошло больше 10 минут с последнего прогона или появились новые артефакты. После удаления ручки `GET /tasks/:id` и `GET /tasks/:id/artifact` возвращают `404`.
- Список `/artifacts` поддерживает параметры `offset=0..`, `limit=1..200`, `order=asc|desc` (по умолчанию `offset=0`, `limit=50`, `order=desc`). Неверные значения нормализуются: `offset < 0` → `0`, `limit < 1` → `50`, `limit > 200` → `200`, неизвестный `order` → `desc`.
