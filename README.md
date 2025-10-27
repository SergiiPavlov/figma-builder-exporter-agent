<!-- Команда для Codex -->
# Figma Builder Exporter Agent

Этот репозиторий содержит Relay-сервер, Figma-плагин и схемы для валидации задач Codex-агента.

## Быстрый старт

### Вариант A. Docker Compose

1. Подготовьте настройки окружения (можно начать с примера):
   ```
   cp relay/.env.example relay/.env
   ```
2. Соберите образ и запустите прод-профиль (по умолчанию используется `ghcr.io/sergiipavlov/figma-relay:latest`):
   ```
   npm run docker:build
   npm run docker:up
   ```
   Сервис будет доступен на `http://localhost:3000`.
3. Выполните smoke-проверку:
   ```
   curl http://localhost:3000/health
   ```
4. Для отладки вебхуков можно поднять echo-сервис (порт `7777`):
   ```
   npm run docker:up:dev
   ```
5. Посмотреть логи и остановить контейнеры:
   ```
   npm run docker:logs
   npm run docker:down
   ```

### Вариант B. Запуск напрямую (Node.js)
```
cd relay
npm install
npm run dev
```
Сервер будет доступен на `http://localhost:3000`.

Проверка работоспособности:
```
curl http://localhost:3000/health
```

### Установка плагина
- Откройте Figma.
- Зайдите в меню **Plugins → Development → Import plugin from manifest…**.
- Выберите `plugin/manifest.json`.

### Быстрый рабочий цикл
1. Создайте задачу:
   ```
   curl -s -X POST http://localhost:3000/tasks \
     -H 'Content-Type: application/json' \
     -d '{"taskSpec":{"meta":{"specVersion":"0.1","id":"demo"},"target":{"fileId":"F","pageName":"P","frameName":"Root","frameSize":{"w":1440,"h":900}},"grid":{"container":1200,"columns":12,"gap":24,"margins":24},"sections":[{"type":"hero","name":"Hero"}]}}'
   ```
2. Нажмите **Fetch** в плагине, чтобы получить TaskSpec и стартовать процесс.
3. Используйте **Validate** для проверки TaskSpec (`/validate/taskSpec`).
4. Запустите **Export**, чтобы валидировать `ExportSpec`, скачать результат и отправить `/tasks/:id/result`.
5. При необходимости проверяйте результат напрямую: `curl http://localhost:3000/tasks/<TASK_ID>/result`.
6. Для обзора последних экспортов используйте `GET /artifacts?offset=0&limit=50&order=desc` — список поддерживает пагинацию и сортировку.

## Тесты

- `npm run test` (выполненный из корня репозитория) проксирует запуск тестов из каталога [`relay/`](./relay/).

## Документация для агента

Актуальные задачи, чек-листы и плейбуки находятся в каталоге [`agent-md/`](./agent-md/).
Подробности про хранение артефактов и пагинацию — в [описании задач Relay](./agent-md/tasks/relay.md#retention--pagination).
