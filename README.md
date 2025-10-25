# Figma Builder+Exporter (M1) — Quickstart

## Запуск плагина (5 шагов)
1. Установите **Figma Desktop**: https://www.figma.com/downloads/
2. Откройте любой файл → **Plugins → Manage plugins → Import from manifest…** и выберите `plugin/manifest.json` из репозитория.
3. Запустите плагин (**Ctrl+/** → "Figma Builder+Exporter (M1) · Development").
4. В окне плагина замените `REPLACE_WITH_FILE_ID` на ключ Вашего файла Figma (фрагмент в URL между `/file/` или `/design/` и следующим `/`). Нажмите **Validate → Build → Export**.
5. Скачайте `ExportSpec.json` (кнопка **Download ExportSpec.json**) и положите файл в `artifacts/last/`.

## Полезное
- Пример спецификации: [`specs/task-spec.example.json`](specs/task-spec.example.json)
- Что делает M1: собирает каркас страницы по TaskSpec и экспортирует структуру (Auto Layout, padding/spacing, размеры) в `ExportSpec.json`.
