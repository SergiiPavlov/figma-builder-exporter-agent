figma.showUI(__html__, { width: 520, height: 640 });

function checkTaskSpec(spec) {
  const need = ["target", "grid", "sections"];
  for (const k of need) if (!(k in spec)) return `Нет обязательного поля: ${k}`;
  if (!spec.target.fileId) return "target.fileId пустой";
  if (!spec.target.pageName) return "target.pageName пустой";
  if (!Array.isArray(spec.sections) || spec.sections.length < 1) return "sections пустой";
  if (!spec.grid || spec.grid.container == null || spec.grid.columns == null || spec.grid.gap == null)
    return "grid должен содержать container/columns/gap";
  return null;
}

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === "validate") {
      const spec = JSON.parse(msg.taskSpec);
      const err = checkTaskSpec(spec);
      if (err) figma.ui.postMessage({ type: "validate:error", error: err });
      else figma.ui.postMessage({ type: "validate:ok" });
    }
    else if (msg.type === "build") {
      // Заглушка на M1: только подтверждаем приём
      figma.ui.postMessage({ type: "build:todo", note: "Логика Build появится в следующем шаге M1." });
    }
    else if (msg.type === "export") {
      // Заглушка на M1: имитация ExportSpec
      figma.ui.postMessage({
        type: "export:ok",
        exportSpec: { target: { fileId: "TODO", pageName: "TODO" }, nodes: [], summary: { warnings: [], deviations: [] } }
      });
    }
    else if (msg.type === "close") {
      figma.closePlugin();
    }
  } catch (e) {
    figma.ui.postMessage({ type: "error", error: String(e) });
  }
};
