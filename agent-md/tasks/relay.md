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

## Retention

- `MAX_ARTIFACTS` (по умолчанию 200) — максимальное число артефактов в `data/results`. При превышении лимита при очистке удаляются самые старые файлы, а соответствующие задачи помечаются удалёнными.
- `TTL_DAYS` (по умолчанию 30) — сколько дней хранить артефакты. Всё, что старше значения, удаляется при очистке. Порог отсчитывается от `createdAt` задачи.
- Очистка выполняется один раз при запуске приложения и лениво при обращении к `GET /artifacts` (если появились новые артефакты или прошло больше 10 минут с предыдущего прогона). После удаления артефакта `GET /tasks/:id` и `GET /tasks/:id/artifact` возвращают `404`.
