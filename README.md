<!-- Команда для Codex -->
# Figma Builder Exporter Agent

Этот репозиторий содержит Relay-сервер, Figma-плагин и схемы для валидации задач Codex-агента.

## Быстрый старт

### 1. Запуск Relay
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

### 2. Установка плагина
- Откройте Figma.
- Зайдите в меню **Plugins → Development → Import plugin from manifest…**.
- Выберите `plugin/manifest.json`.

### 3. Быстрый рабочий цикл
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

## Документация для агента

Актуальные задачи, чек-листы и плейбуки находятся в каталоге [`agent-md/`](./agent-md/).
Подробности про хранение артефактов и пагинацию — в [описании задач Relay](./agent-md/tasks/relay.md#retention--pagination).
