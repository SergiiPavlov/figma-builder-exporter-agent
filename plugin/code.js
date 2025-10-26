figma.showUI(__html__, { width: 760, height: 680 });

function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'validate') {
      const spec = safeParseJSON(msg.taskSpec);
      if (!spec) {
        return figma.ui.postMessage({ type: 'validate:error', error: 'Invalid JSON' });
      }
      if (!spec.meta || !spec.target) {
        return figma.ui.postMessage({ type: 'validate:error', error: 'Missing meta/target' });
      }
      figma.ui.postMessage({ type: 'validate:ok' });
    } else if (msg.type === 'build') {
      const spec = safeParseJSON(msg.taskSpec);
      if (!spec) {
        return figma.ui.postMessage({ type: 'error', error: 'Invalid JSON' });
      }
      const sectionsCount = Array.isArray(spec.sections) ? spec.sections.length : 0;
      figma.ui.postMessage({ type: 'build:ok', sections: sectionsCount });
    } else if (msg.type === 'export') {
      const spec = safeParseJSON(msg.taskSpec);
      if (!spec) {
        return figma.ui.postMessage({ type: 'error', error: 'Invalid JSON' });
      }
      const exportSpec = {
        meta: { ...spec.meta, exportedAt: new Date().toISOString() },
        target: spec.target || {},
        summary: {
          sections: Array.isArray(spec.sections) ? spec.sections.length : 0,
        },
      };
      figma.ui.postMessage({
        type: 'export:ok',
        exportSpec,
        filename: 'ExportSpec.json',
      });
    } else if (msg.type === 'close') {
      figma.closePlugin();
    }
  } catch (err) {
    figma.ui.postMessage({ type: 'error', error: String((err && err.message) || err) });
  }
};
