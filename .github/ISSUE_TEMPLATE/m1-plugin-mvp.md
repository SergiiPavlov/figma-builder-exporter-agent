---
name: "M1 — MVP плагина (Builder+Exporter)"
about: "Ручной запуск, Build из TaskSpec, Export ExportSpec"
title: "M1: Plugin MVP (Builder+Exporter)"
labels: ["M1","plugin","priority:high"]
assignees: []
---

### Цели
- Построить страницу из `specs/task-spec.example.json`.
- Экспортировать `ExportSpec.json` с padding/itemSpacing/layoutMode/constraints.
- Предупреждения при отклонениях spacing > 2 px.

### Критерии приёмки
- [ ] Hero/Features/CTA/Footer построены, Auto Layout включён у контейнеров.
- [ ] ExportSpec.json содержит ключевые параметры для верстки.
- [ ] summary фиксирует отклонения и предупреждения.

### Артефакты
- [ ] Файл ExportSpec.json
- [ ] Скриншот/короткое видео процесса
- [ ] Короткий README по запуску
