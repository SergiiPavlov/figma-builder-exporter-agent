# Задачи GPT Actions и схем

## [ACTIONS] Дополнить OpenAPI SSE-описанием

**Статус:** todo

**Цель:** описать SSE-эндпоинт `GET /tasks/:id/watch` в `relay/actions.yaml`, указав `text/event-stream` и примеры событий.

**Изменяемые файлы:**
- `relay/actions.yaml`

**Критерии приёмки (Acceptance):**
- Обновлённый OpenAPI-документ валиден и успешно импортируется в GPT Actions.
- Описание содержит примеры событий SSE и корректные ссылки на схемы.

**Smoke-тест:**
1. Прогнать валидацию OpenAPI (например, `spectral lint` или `openapi-cli lint`).
2. Подключить обновлённый YAML в GPT Actions и убедиться, что ручка отображается корректно.

## [SCHEMA] Расширить taskSpec секцию grid/sections

**Статус:** todo

**Цель:** обновить `schemas/taskSpec.schema.json`, добавив `grid.breakpoints` (`sm`, `md`, `lg` — минимальные числа), в `sections[*]` поле `constraints` (`top`, `left`, `right`, `bottom`, опциональные) и простую `theme.palette.primary` (строка).

**Изменяемые файлы:**
- `schemas/taskSpec.schema.json`
- при необходимости дополнительные файлы схем/валидации в `schemas/`
- соответствующие тесты/валидация в `relay/server.js`

**Критерии приёмки (Acceptance):**
- Эндпоинт `/validate/taskSpec` отклоняет неправильные типы и значения меньше минимальных.
- Корректные спецификации проходят валидацию.

**Smoke-тест:**
1. `curl` с валидной спецификацией (см. README) — должен вернуть `ok`.
2. `curl` с отсутствующим `meta.id` или некорректными `breakpoints` — должен вернуть ошибку.
