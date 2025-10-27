<!-- Команда для Codex -->
# Figma Builder Exporter Agent

[![CI](https://github.com/sergiipavlov/figma-builder-exporter-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/sergiipavlov/figma-builder-exporter-agent/actions/workflows/ci.yml)
[![E2E](https://github.com/sergiipavlov/figma-builder-exporter-agent/actions/workflows/e2e.yml/badge.svg)](https://github.com/sergiipavlov/figma-builder-exporter-agent/actions/workflows/e2e.yml)
[![Release](https://github.com/sergiipavlov/figma-builder-exporter-agent/actions/workflows/release.yml/badge.svg)](https://github.com/sergiipavlov/figma-builder-exporter-agent/actions/workflows/release.yml)
[![GHCR](https://img.shields.io/badge/GHCR-sergiipavlov%2Ffigma--relay-0B3D91?logo=docker&labelColor=0B3D91&color=0B3D91&logoColor=white)](https://ghcr.io/sergiipavlov/figma-relay)

Этот репозиторий содержит Relay-сервер, Figma-плагин и схемы для валидации задач Codex-агента.

## Quickstart (локально)

1. Скопируйте пример настроек и обновите значения:
   ```bash
   cp relay/.env.example relay/.env
   echo "API_KEYS=dev123" >> relay/.env
   ```
   > **Никогда не коммитьте `.env`**. Для ротации ключей используйте переменную `API_KEYS_ROLLOVER`.
2. Установите зависимости Relay и поднимите dev-сервер:
   ```bash
   npm install --prefix relay
   npm run dev --prefix relay
   ```
3. Проверьте здоровье API (по умолчанию `http://localhost:3000`):
   ```bash
   curl http://localhost:3000/health
   ```
   Ответ должен содержать `200 OK` и JSON с состоянием.

## Quickstart (Docker)

1. Подготовьте `.env` на основе примера и задайте `API_KEYS=dev123`.
2. Запустите сервисы:
   ```bash
   docker compose up -d
   ```
3. Выполните smoke-проверку:
   ```bash
   curl http://localhost:3000/health
   ```

## Plugin setup

1. Откройте Figma → **Plugins → Development → Import plugin from manifest…** и выберите `plugin/manifest.json`.
2. Введите API key в поле **API key** (ключ хранится локально в `localStorage` и автоматически добавляется в `Authorization: Bearer <key>` и `X-API-Key`).
3. Минимальный сценарий работы:
   1. **Validate** — отправьте TaskSpec в `/validate/taskSpec` и убедитесь в отсутствии ошибок.
   2. **Build** — подготовьте ExportSpec и проверьте диффы внутри плагина.
   3. **Export** — запустите экспорт, дождитесь уведомления об успехе.
   4. **Artifacts** — откройте вкладку артефактов, чтобы увидеть историю экспортов.
   5. **Compare** — выберите два артефакта для сравнения изменений.
   6. **Export diff HTML/ZIP** — выгрузите отчёты для шаринга с командой.

## Glossary

- **TaskSpec** — описание задачи для агента (мета-данные, целевой фрейм, сетка и секции).
- **ExportSpec** — результат работы агента с финальной структурой и артефактами экспорта.
- **Artifact JSON/ZIP** — выгружаемые отчёты о выполненной задаче (JSON с деталями, ZIP с полным пакетом).
- **Preview** — PNG-миниатюра фрейма, загружаемая плагином и доступная через Relay.
- **Share-token** — одноразовая ссылка с TTL для передачи артефактов без доступа к API key.

## Troubleshooting

- **401 Unauthorized** — проверьте API key, заголовок `Authorization: Bearer <key>` и наличие ключа в `.env` (`API_KEYS` или `API_KEYS_ROLLOVER`).
- **413 Payload Too Large** — уменьшите размер отправляемых данных (обрезка логов, исключение тяжёлых вложений) или настройте лимиты реверс-прокси.
- **429 Too Many Requests** — включите встроенные rate-limit'ы или вынесите Relay за внешний прокси с защитой.
- **CORS/CSP** — при использовании через браузер убедитесь, что заголовки `Access-Control-Allow-*` и политика CSP разрешают домен Figma и Relay.
- **Ключи не работают в плагине** — очистите сохранённый ключ в UI, проверьте `localStorage` и перезапустите плагин.
- **SSE не стримит логи** — убедитесь, что сеть не обрезает `text/event-stream`, а Relay запущен с `TRUST_PROXY=false` (или корректно настроенным прокси).
- **Где смотреть логи** — в dev-режиме терминал с `npm run dev --prefix relay`, в Docker используйте `docker compose logs -f relay`. SSE события доступны по `GET /tasks/<id>/watch` (см. `examples/curl/watch.sh`).

## Security notes

- **Никогда не коммитьте `.env` и ключи доступа** — используйте `.gitignore` и отдельные менеджеры секретов.
- Храните ключи в переменных окружения, не передавайте их в query-параметрах и не записывайте в логи.
- Прокидывайте Relay за прокси с корректной политикой CSP и rate-limit для внешних запросов.
- Скачиваемые отчёты (`compare.html`, `compare.zip`) не содержат API key — проверяйте это перед распространением.
- При необходимости ротации ключей используйте `API_KEYS_ROLLOVER` и удаляйте устаревшие значения.

## API Reference (OpenAPI)

- [API Reference (OpenAPI)](docs/openapi.html)

## Release notes

- Подготовка к релизу `v1.0.0`: актуальный список изменений в [CHANGELOG.md](CHANGELOG.md).

## Быстрый рабочий цикл

1. Создайте задачу:
   ```bash
   curl -s -X POST http://localhost:3000/tasks \
     -H 'Authorization: Bearer dev123' \
     -H 'Content-Type: application/json' \
     -d '{"taskSpec":{"meta":{"specVersion":"0.1","id":"demo"},"target":{"fileId":"F","pageName":"P","frameName":"Root","frameSize":{"w":1440,"h":900}},"grid":{"container":1200,"columns":12,"gap":24,"margins":24},"sections":[{"type":"hero","name":"Hero"}]}}'
   ```
2. Нажмите **Fetch** в плагине, чтобы получить TaskSpec и стартовать процесс.
3. Используйте **Validate** для проверки TaskSpec (`/validate/taskSpec`).
4. Запустите **Export**, чтобы валидировать `ExportSpec`, скачать результат и отправить `/tasks/:id/result`.
5. При необходимости проверяйте результат напрямую: `curl -H 'Authorization: Bearer dev123' http://localhost:3000/tasks/<TASK_ID>/result`.
6. Для обзора последних экспортов используйте `GET /artifacts?offset=0&limit=50&order=desc` — список поддерживает пагинацию и сортировку.

## Plugin UX

- Вкладка **Artifacts** показывает дружелюбный пустой экран, skeleton-загрузчик и поддерживает ленивую подгрузку превью.
- Горячие клавиши: **F** — обновить список, **C** — открыть Compare для двух выбранных записей, **D** — скачать JSON выбранного артефакта.
- Детали артефакта автоматически подписываются на SSE-логи, можно ставить рендер на паузу и копировать прямые ссылки.
- Все долгие действия (Fetch/Compare/Share/Download) завершаются всплывающими уведомлениями об успехе или ошибке.
- Фильтры, сортировка и лимиты списка артефактов сохраняются в localStorage между перезапусками плагина.

## Тесты

- `npm run test` (выполненный из корня репозитория) проксирует запуск тестов из каталога [`relay/`](./relay/).

## End-to-End tests

Запустите Relay и e2e-набор в отдельных терминалах:

```sh
# в одном терминале
API_KEYS=dev123 TRUST_PROXY=false npm run dev --prefix relay
# в другом
RELAY_URL=http://localhost:3000 API_KEY=dev123 npm run e2e
```

## Документация для агента

Актуальные задачи, чек-листы и плейбуки находятся в каталоге [`agent-md/`](./agent-md/).
Подробности про хранение артефактов и пагинацию — в [описании задач Relay](./agent-md/tasks/relay.md#retention--pagination).
