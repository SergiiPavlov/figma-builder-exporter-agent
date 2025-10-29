<!-- Команда для Codex -->
# Figma Builder Exporter Agent

[![CI](https://github.com/sergiipavlov/figma-builder-exporter-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/sergiipavlov/figma-builder-exporter-agent/actions/workflows/ci.yml)
[![E2E](https://github.com/sergiipavlov/figma-builder-exporter-agent/actions/workflows/e2e.yml/badge.svg)](https://github.com/sergiipavlov/figma-builder-exporter-agent/actions/workflows/e2e.yml)
[![Release](https://github.com/sergiipavlov/figma-builder-exporter-agent/actions/workflows/release.yml/badge.svg)](https://github.com/sergiipavlov/figma-builder-exporter-agent/actions/workflows/release.yml)
[![GHCR](https://img.shields.io/badge/GHCR-sergiipavlov%2Ffigma--relay-0B3D91?logo=docker&labelColor=0B3D91&color=0B3D91&logoColor=white)](https://ghcr.io/sergiipavlov/figma-relay)

Этот репозиторий содержит Relay-сервер, Figma-плагин и схемы для валидации задач Codex-агента.

## Quickstart (локально)

1. Установите зависимости Relay:
   ```bash
   npm ci --prefix relay
   ```
2. Запустите Relay с тестовым ключом (можно использовать `npm run dev:relay` при наличии `.env`):
   ```bash
   API_KEYS=dev123 npm run dev --prefix relay
   ```
   > **Никогда не коммитьте `.env`**. Для ротации ключей используйте переменную `API_KEYS_ROLLOVER`.
3. Проверьте здоровье API (по умолчанию `http://localhost:3000`):
   ```bash
   curl http://localhost:3000/health
   ```
   Ответ должен содержать `200 OK` и JSON с состоянием.
4. Импортируйте плагин в Figma через `plugin/manifest.json`.
5. Создайте задачу: `bash examples/curl/create-task.sh` (скрипт вернёт `taskId`).
6. Откройте вкладку Runner, заполните настройки (Relay Base URL `http://localhost:3000`, API Key `dev123`, Plugin ID из TaskSpec, Pull interval `5` сек.) и включите **Enable Runner**.
   - Убедитесь, что Runner отображает активный `taskId`, индикаторы Pull/Build/Export, тайминги шагов, отчёт `created/updated/removed` и последние строки логов.
   - Дождитесь завершения цикла: Runner автоматически обработает задачу (Pull → Build → Export) и выполнит `POST /tasks/<taskId>/result`; после остановки (**Stop**) ручные действия снова доступны.
7. Откройте артефакты задачи: должны быть `exportSpec`, `build.log.jsonl` и превью.
8. Проверьте результат API: `curl http://localhost:3000/tasks/<taskId>/result -H 'Authorization: Bearer dev123'` → ожидается `status: "done"`, блок `summary` (created/updated/removed, warnings) и ссылки на `export.artifacts`/`preview`.
9. Для ручной проверки отключите Runner и воспроизведите **Validate → Build → Export**.

### Runner Quickstart

1. Запустите Relay локально:
   - `npm ci --prefix relay`
   - `API_KEYS=dev123 npm run dev --prefix relay`
2. Создайте задачу: `bash examples/curl/create-task.sh` и запишите `taskId`.
3. В плагине включите Runner (режим auto) и заполните поля Relay Base URL, API Key, Plugin ID и Pull interval.
4. Дождитесь автоматического цикла Runner: Pull → Build → Export → `POST /results`.
5. Проверьте `GET /tasks/<taskId>/result` — ожидаются `exportSpec.json`, `build.log.jsonl` и (при наличии) `preview.png`.
6. В UI Runner должен отображать `taskId`, сводку `created/updated/removed`, предупреждения и последние строки логов.

## Quickstart (Docker)

1. Подготовьте `.env` на основе примера и задайте `API_KEYS=dev123`.
2. Запустите сервисы (DEV-профиль):
   ```bash
   docker compose --profile dev up -d
   ```
   Альтернатива: `COMPOSE_PROFILES=dev docker compose up -d`.
   > Доступные образы в GHCR: `docker pull ghcr.io/sergiipavlov/figma-relay:latest` и `docker pull ghcr.io/sergiipavlov/figma-relay:v1.0.0`.
3. Выполните smoke-проверку:
   ```bash
   curl -s http://localhost:3000/health
   ```
   Для прод-профиля: `docker compose --profile prod up -d`.

> **Важно:** контейнеры привязаны к профилям Compose. Без явного указания `--profile` или `COMPOSE_PROFILES` сервисы **не стартуют**.

## Plugin setup

1. Откройте Figma → **Plugins → Development → Import plugin from manifest…** и выберите `plugin/manifest.json`.
2. Введите API key в поле **API key** (ключ хранится локально в `localStorage` и автоматически добавляется в `Authorization: Bearer <key>` и `X-API-Key`). Валидаторы `/validate/*` доступны и без ключа, но для `/tasks*`, `/results` и артефактов авторизация обязательна.
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

Перед первым деплоем включите Pages вручную: Settings → Pages → Source: GitHub Actions.

## Release notes

- Релиз `v1.0.0`: сводка изменений в [CHANGELOG.md](CHANGELOG.md), статическая спецификация на [GitHub Pages](https://sergiipavlov.github.io/figma-builder-exporter-agent/docs/openapi.html) и архив плагина в разделе [Releases](https://github.com/sergiipavlov/figma-builder-exporter-agent/releases).

## Быстрый рабочий цикл

1. **Validate** — плагин или curl вызывает `/validate/taskSpec` и `/validate/exportSpec`. Эти эндпоинты доступны без ключа (free-режим). Пример: `examples/curl/validate-task-spec.sh`.
2. **Build** — кнопка в плагине создаёт/обновляет секции (`hero`, `features`, `cta`, `footer`, `custom`), поддерживает повторный запуск без дублей.
3. **Create task** — отправьте TaskSpec в Relay:
   ```bash
   jq -c '{taskSpec: .}' examples/taskspecs/marketing-landing.json | \
     curl -s -X POST http://localhost:3000/tasks \
       -H 'Authorization: Bearer dev123' \
       -H 'Content-Type: application/json' \
       -d @-
   ```
4. **Runner auto-mode** — включите **Enable Runner** в плагине: он сам выполняет Pull → Build → Export, публикует `/results`, показывает тайминги и логи, блокируя ручные действия до завершения цикла.
5. **Pull / Run (manual)** — агент (или скрипт) выбирает задачи через `GET /tasks/pull`, переводит их в `running` и стримит логи `GET /tasks/{id}/watch`.
6. **Export / Results** — Runner или плагин вручную отправляет `POST /results`, после чего доступен `GET /tasks/{id}/result` и артефакты (`/compare`, `/artifacts`).
7. **Artifacts** — `GET /artifacts?offset=0&limit=50&order=desc` позволяет просматривать историю экспортов и скачивать compare HTML/ZIP.

## Propose TaskSpec (draft)

Кнопка **Generate TaskSpec** формирует черновой TaskSpec (`meta.proposed: true`), который нужно проверить и дополнить перед запуском Build/Export.

При обнаружении сетки повторяющихся изображений черновик включает секцию галереи:

```json
{
  "type": "gallery",
  "name": "Showcase",
  "layout": "stack"
}
```

## Acceptance сценарии (Import/Infer)

- **AT-07 — Import ExportSpec.** Выделите фрейм в Figma и нажмите **Import**. Панель должна отобразить `ExportSpec` с типами секций, `meta.typeConfidence` и предупреждениями. Сохраните JSON, повторите Import на том же фрейме — результат должен совпадать byte-for-byte.
- **AT-08 — Infer TaskSpec.** Используя экспортированный `ExportSpec`, нажмите **Generate TaskSpec**. Проверяйте наличие блока `acceptance` (`maxSpacingDeviation`, `checkAutoLayout`), токенов `text/primary/neutral` и предупреждений «выбрано эвристикой». После **Build → Export** убедитесь, что отклонения не превышают `maxSpacingDeviation`, `meta.inferred` установлен в `true`, warnings отображаются.

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
