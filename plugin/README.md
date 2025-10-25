# Figma Plugin “Builder+Exporter” — MVP (M1)

## Цели M1
- Ручной запуск плагина.
- Вставка TaskSpec (JSON) в UI.
- Построение страницы (создание фрейма, секций, Auto Layout, padding/spacing).
- Экспорт ExportSpec.json (padding, itemSpacing, layoutMode, constraints и др.).
- Summary с предупреждениями (отклонения spacing > допуск).

## Минимальные требования UI
- Textarea для TaskSpec (JSON).
- Кнопки: **Validate**, **Build**, **Export**.

## Логика Build (в упрощении)
1. Найти/создать страницу `target.pageName`.
2. Создать/найти корневой фрейм `target.frameName` (размер — если указан).
3. Включить Auto Layout на корневом фрейме (по умолчанию VERTICAL).
4. Построить секции из `sections[]` по порядку:
   - `layout`: stack | grid-3 | grid-4.
   - `padding`: применять к контейнеру секции.
   - `spacing`: `itemSpacing` контента.
5. Применить `tokens` (шрифты/цвета/переменные) — если заданы.

## Логика Export
- Обход дерева от корневого фрейма.
- Сбор:
  - `absBounds` (x,y,w,h),
  - `autoLayout` (layoutMode, itemSpacing, padding t/r/b/l),
  - `styles` (fill/stroke/fontFamily/fontSize/lineHeight),
  - `variables`, `constraints`,
  - `section` (соответствие секции TaskSpec).
- `summary.warnings[]`, `summary.deviations[]` (если |delta| > `acceptance.maxSpacingDeviation`).

## Приёмочные критерии M1
- Построение страницы из примера TaskSpec.
- `ExportSpec.json` содержит ключевые поля (padding, itemSpacing, layoutMode, constraints).
- Отклонения spacing ≤ 2 px (настраивается в `acceptance`).
