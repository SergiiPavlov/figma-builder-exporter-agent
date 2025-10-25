# Вехи проекта

## M1 — MVP плагина (ручной режим)
- Построение из TaskSpec v0.1 (hero/features/cta/footer).
- ExportSpec.json с padding, itemSpacing, layoutMode, constraints.
- Отклонения spacing ≤ 2 px; summary с предупреждениями.

## M2 — Связка GPT Actions ↔ Relay ↔ Плагин
- OpenAPI для Actions (postTask/getTaskResult/health).
- Локальный Relay (очередь задач/результатов).
- Плагин тянет задачи, строит, пушит результат. Логи JSONL.

## M3 — Итерации и валидация
- TaskSpec v0.2 (токены/переменные/брейкпоинты).
- Валидатор допусков в плагине; режим Review (diff).
