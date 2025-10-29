# Figma Relay Agent Guide

## Quickstart (Relay + Plugin)
- `npm ci --prefix relay`
- `API_KEYS=dev123 npm run dev --prefix relay`
- `curl http://localhost:3000/health`
- `bash examples/curl/create-task.sh` — создаёт маркетинговую задачу и возвращает `taskId`.
- Откройте плагин в Figma, укажите Relay Base URL `http://localhost:3000`, API Key `dev123`, Plugin ID из TaskSpec и Pull interval `5` сек.
- Включите **Enable Runner** и дождитесь авто-цикла: в UI появится `taskId`, тайминги Pull/Build/Export, отчёт `created/updated/removed`, последние строки логов и уведомление об отправке результатов.
- Проверьте `GET /tasks/{taskId}/result` — ожидается `status: "done"`, блок `summary` с артефактами и `export.artifacts` (JSON/ZIP, preview при наличии).
- (Опционально) `RELAY_URL=http://localhost:3000 API_KEY=dev123 npm run e2e`
- Для ручного контроля: Validate → Build → Export доступны после выключения Runner.

## Key references
- `README.md` — сводный Quickstart и рабочий цикл
- `schemas/openapi.v1.0.0.yaml` — контракт API Relay
- `agent-md/plan/FigmaAgent_Plan_v1.0.json` — roadmap и критерии

## Рабочий цикл (Validate → Build → Export)
1. **Validate**
   - Плагин вызывает `POST /validate/taskSpec` и `POST /validate/exportSpec`.
   - Анонимный режим разрешён: ключ не требуется, ответы содержат детальные ошибки.
2. **Build**
   - Кнопка Build формирует секции `hero`, `features`, `cta`, `footer`, `custom` с авто-лейаутом и дизайн-токенами.
   - При повторном запуске Build сравнивает TaskSpec и обновляет существующие узлы без дублей. Отчёт фиксирует `created`, `updated`, `removed`.
3. **Export**
   - Плагин отправляет `POST /tasks` в Relay, ожидает `running` → `done`.
   - `POST /results` публикует экспорт, `GET /tasks/{id}/result` возвращает финальный JSON/ZIP/preview.
4. **Relay API**
   - `/tasks/pull` используется агентом для взятия задач в работу (multi-pull, лимиты и метаданные).
   - `/results` и `/tasks/{id}/log` сохраняют отчёты и логи выполнения.

## Conventions / File size policy
- Не раздувайте `plugin/ui.html` и `plugin/code.js` — оставляйте там только минимальные изменения UI и связующую логику.
- Новую тяжёлую или повторно используемую бизнес-логику выносите в `plugin/utils.js` (или отдельные файлы внутри `plugin/`, если это действительно необходимо).
- В UI добавляйте лишь точечные вставки без дробления на модули или объёмные блоки.

## Acceptance Tests (AT-01…AT-08)
### AT-01 — Validate / UX
1. Подставьте `examples/taskspecs/marketing-landing.json`, нажмите **Validate**.
   - Ожидаемый результат: «валидно», кнопки **Build** и **Export** активны.
2. Вставьте некорректный JSON (синтаксис или нарушение схемы) и снова нажмите **Validate**.
   - Ожидаемый результат: список ошибок, **Build**/**Export** заблокированы.
3. Уберите API key из плагина и повторите Validate с Relay без ключа.
   - Ожидаемый результат: дружелюбное сообщение о необходимости ключа/режима при ответе 401.

### AT-02 — Deterministic Build
1. Подготовьте TaskSpec с секциями hero/features/cta/footer/custom и токенами.
2. Нажмите **Build** — убедитесь, что все секции созданы с auto-layout и корректными токенами.
3. Измените `grid.gap` и/или padding в TaskSpec, запустите **Build** повторно.
   - Ожидаемый результат: ноды обновлены без дублей, отчёт содержит `created/updated/removed`.

### AT-03 — Export / Compare
1. Выполните **Export** для маркетингового TaskSpec.
2. Проверьте экспортированные padding, itemSpacing и layout — значения нормализованы (целые числа).
3. Убедитесь, что предупреждения отображаются только для отсутствующих ресурсов (например, шрифтов).

### AT-04 — Relay API Lifecycle
1. `POST /tasks` с ключом `dev123`.
2. `GET /tasks/pull` (multi-pull, лимиты, метаданные).
3. `POST /results` с отчётом.
4. `GET /tasks/{id}/result` — сверить ответы с README.

### AT-05 — Limits & Free Validators
1. Проверить, что `/validate/*` доступен без ключа.
2. Превью и дифф-артефакты укладываются в лимиты размера.
3. При перегрузке (превышение лимита) возвращается ожидаемая ошибка/отказ.

### AT-06 — Runner end-to-end
1. Запустите Relay:
   - `npm ci --prefix relay`
   - `API_KEYS=dev123 npm run dev --prefix relay`
2. В плагине включите Runner в auto-режиме и заполните поля: Relay Base URL, API Key, Plugin ID, Pull interval.
3. Создайте задачу: `bash examples/curl/create-task.sh` и зафиксируйте `taskId`.
4. Дождитесь цикла Runner: Pull → Build → Export → `POST /results`.
5. Проверьте API: `curl http://localhost:3000/tasks/<taskId>/result -H 'Authorization: Bearer dev123'` — ожидаются артефакты `exportSpec.json`, `build.log.jsonl` и (при наличии) `preview.png`.
6. В UI убедитесь, что отображаются `taskId`, сводка `created/updated/removed`, предупреждения и последние строки логов.

### AT-07 — Import ExportSpec
1. Выделите целевой фрейм в Figma и нажмите **Import**.
2. Убедитесь, что панель Import отображает определённый тип секций, `meta.typeConfidence` и предупреждения.
3. Сохраните полученный `ExportSpec`, повторите Import на том же фрейме и сравните JSON — результат должен совпадать byte-for-byte.

### AT-08 — Infer TaskSpec
1. Используйте экспортированный `ExportSpec` и нажмите **Generate TaskSpec**.
2. Проверьте, что TaskSpec валиден, содержит блок `acceptance` (`maxSpacingDeviation`, `checkAutoLayout`) и токены `text/primary/neutral` с предупреждениями «выбрано эвристикой».
3. Запустите **Build → Export** и убедитесь, что отклонения не превышают `maxSpacingDeviation`, `meta.inferred` равен `true`, а warnings отражаются в UI.

## Milestone status
- **M1** — ✅ источник правды (Validate → Build → Export + Relay lifecycle)
- **M2** — 🚧 в прогрессе (расширенные сценарии экспорта)
- **M3** — ⏳ pending (интеграции downstream)
