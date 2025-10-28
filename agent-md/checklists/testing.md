# Чек-лист тестирования перед мержем

## Документация
- [ ] Обновлены релевантные файлы в `agent-md/`, `README.md` и примеры в `examples/curl/`.
- [ ] Статусы задач синхронизированы с milestone M1 (источник правды для Validate → Build → Export).

## Команды (Relay)
- [ ] `npm ci --prefix relay`
- [ ] `npm test --prefix relay`
- [ ] `API_KEYS=dev123 npm run dev --prefix relay` (smoke-запуск перед ручными сценариями)
- [ ] (Опционально) `RELAY_URL=http://localhost:3000 API_KEY=dev123 npm run e2e`

## Acceptance Tests (AT-01…AT-06)
- [ ] **AT-01 Validate / UX**
    1. Вставить `examples/taskspecs/marketing-landing.json`, нажать **Validate** → «валидно», **Build/Export** активны.
    2. Вставить невалидный JSON → отрисовался список ошибок, **Build/Export** заблокированы.
    3. Очистить API key, воспроизвести Validate при 401 → отображается дружелюбное сообщение о ключе/режиме.
- [ ] **AT-02 Deterministic Build**
    1. Выполнить **Build** → секции hero/features/cta/footer/custom созданы с auto-layout и токенами.
    2. Изменить `grid.gap`/padding в TaskSpec → повторный **Build** обновляет ноды (без дублей), отчёт показывает `created/updated/removed`.
- [ ] **AT-03 Export / Compare**
    1. Выполнить **Export** → padding/itemSpacing/layout нормализованы (целые значения).
    2. Предупреждения выдаются только для отсутствующих ресурсов (шрифты и т. п.).
- [ ] **AT-04 Relay API Lifecycle**
    1. `POST /tasks` (Bearer `dev123`).
    2. `GET /tasks/pull` (multi-pull + лимит + метаданные).
    3. `POST /results`.
    4. `GET /tasks/{id}/result` — ответы соответствуют README.
- [ ] **AT-05 Limits & Free Validators**
    1. `/validate/*` доступен без ключа.
    2. Превью/дифф артефакты укладываются в лимиты; превышение → ожидаемая ошибка/отказ.
- [ ] **AT-06 Runner end-to-end**
    1. Запустить Relay:
        - `npm ci --prefix relay`
        - `API_KEYS=dev123 npm run dev --prefix relay`
    2. Создать задачу: `bash examples/curl/create-task.sh` и сохранить `taskId`.
    3. В плагине включить Runner (auto) с заполненными Relay Base URL, API Key, Plugin ID и Pull interval.
        - Проверить UI: `taskId`, сводка `created/updated/removed`, предупреждения и последние строки логов.
    4. Подтвердить, что Runner проходит Pull → Build → Export → `POST /results`.
    5. `curl http://localhost:3000/tasks/<taskId>/result -H 'Authorization: Bearer dev123'` → `status: done`, артефакты `exportSpec.json`, `build.log.jsonl`, `preview.png` (если загружен).

## Плагин
- [ ] Плагин установлен через `plugin/manifest.json`.
- [ ] Ручной прогон: Validate → Build → Export на маркетинговом TaskSpec.
- [ ] Список артефактов, Compare и экспорт HTML/ZIP работают.

## PR-подготовка
- [ ] В PR перечислены выполненные проверки и приложены логи/скриншоты по UI-изменениям.
