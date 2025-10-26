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
