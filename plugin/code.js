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

// ---------- Build (как в предыдущем шаге) ----------
function findOrCreatePage(name) {
  let page = figma.root.children.find(n => n.type === "PAGE" && n.name === name);
  if (!page) { page = figma.createPage(); page.name = name; }
  return page;
}

function parsePadding(pad) {
  if (!pad || !pad.length) return { t:0, r:0, b:0, l:0 };
  if (pad.length === 2) { const [v,h] = pad; return { t:v, r:h, b:v, l:h }; }
  if (pad.length === 3) { const [t,h,b] = pad; return { t, r:h, b, l:h }; }
  const [t,r,b,l] = pad; return { t, r, b, l };
}

function createRootFrame(spec, page) {
  const name = spec.target.frameName || "Root";
  let root = page.findOne(n => n.type === "FRAME" && n.name === name);
  if (!root) { root = figma.createFrame(); root.name = name; page.appendChild(root); }

  const container = spec.grid?.container ?? 1200;
  const margins = spec.grid?.margins ?? 24;
  const width = spec.target?.frameSize?.w ?? (container + margins*2);
  const height = spec.target?.frameSize?.h ?? 10;

  root.layoutMode = "VERTICAL";
  root.primaryAxisSizingMode = "AUTO";
  root.counterAxisSizingMode = "FIXED";
  root.counterAxisAlignItems = "CENTER";
  root.itemSpacing = 24;

  root.paddingLeft = margins;
  root.paddingRight = margins;
  root.paddingTop = 0;
  root.paddingBottom = 0;

  root.x = 0; root.y = 0;
  root.resize(width, height);

  return root;
}

function buildSections(root, spec) {
  const gap = spec.grid?.gap ?? 24;
  const innerWidth = root.width - (root.paddingLeft + root.paddingRight);

  for (const section of (spec.sections || [])) {
    const s = figma.createFrame();
    s.name = section.name || section.type || "section";

    const p = parsePadding(section.padding || []);
    s.paddingTop = p.t; s.paddingRight = p.r; s.paddingBottom = p.b; s.paddingLeft = p.l;

    s.primaryAxisSizingMode = "AUTO";
    s.counterAxisSizingMode = "FIXED";
    s.counterAxisAlignItems = "MIN";
    s.itemSpacing = section.spacing ?? 0;

    // базовый тип — вертикальный стек
    s.layoutMode = "VERTICAL";
    s.resize(innerWidth, 10);

    root.appendChild(s);

    // сетка: grid-3 / grid-4
    if (section.layout && section.layout.startsWith("grid-")) {
      const n = parseInt(section.layout.split("-")[1] || "3", 10);
      s.layoutMode = "HORIZONTAL";
      s.itemSpacing = gap;

      const available = innerWidth - gap * (n - 1);
      const colW = Math.max(10, Math.floor(available / n));

      for (let i = 0; i < n; i++) {
        const col = figma.createFrame();
        col.name = `${s.name}/col-${i+1}`;
        col.layoutMode = "VERTICAL";
        col.primaryAxisSizingMode = "AUTO";
        col.counterAxisSizingMode = "FIXED";
        col.resize(colW, 10);
        s.appendChild(col);
      }
    }
  }
}

// ---------- Export v1 ----------
const isFrameLike = (n) => ["FRAME","COMPONENT","INSTANCE","SECTION","GROUP","AUTO_LAYOUT_FRAME"].includes(n.type) || (n.type === "FRAME");

function absBounds(n) {
  const t = n.absoluteTransform; // [[a,b,tx],[c,d,ty]]
  const x = t[0][2], y = t[1][2];
  return { x, y, w: n.width, h: n.height };
}

function firstSolid(paints) {
  try {
    if (!Array.isArray(paints)) return undefined;
    const p = paints.find(p => p.type === "SOLID");
    if (!p) return undefined;
    const { r,g,b } = p.color;
    const a = (p.opacity != null ? p.opacity : 1);
    const to255 = (v)=>Math.round(v*255);
    return `rgba(${to255(r)}, ${to255(g)}, ${to255(b)}, ${a})`;
  } catch { return undefined; }
}

function extractAutoLayout(frame) {
  if (!("layoutMode" in frame)) return undefined;
  const padding = {
    t: frame.paddingTop ?? 0,
    r: frame.paddingRight ?? 0,
    b: frame.paddingBottom ?? 0,
    l: frame.paddingLeft ?? 0
  };
  return {
    layoutMode: frame.layoutMode || "NONE",
    itemSpacing: frame.itemSpacing ?? 0,
    padding
  };
}

function extractStyles(n) {
  const s = {};
  if ("fills" in n) s.fill = firstSolid(n.fills);
  if ("strokes" in n) s.stroke = firstSolid(n.strokes);
  if (n.type === "TEXT") {
    try {
      if (typeof n.fontName === "object" && "family" in n.fontName) s.fontFamily = n.fontName.family;
      if (typeof n.fontSize === "number") s.fontSize = n.fontSize;
      if (n.lineHeight && typeof n.lineHeight === "object" && "unit" in n.lineHeight) {
        const lh = n.lineHeight;
        s.lineHeight = lh.unit === "PIXELS" ? `${lh.value}px` : lh.unit.toLowerCase();
      }
    } catch {}
  }
  return s;
}

function walk(node, collector, currentSection = undefined) {
  const base = {
    id: node.id,
    name: node.name,
    type: node.type,
    absBounds: absBounds(node),
    section: currentSection
  };

  if (isFrameLike(node)) {
    base.autoLayout = extractAutoLayout(node) || undefined;
  }

  const st = extractStyles(node);
  if (Object.keys(st).length) base.styles = st;

  collector.push(base);

  if ("children" in node && Array.isArray(node.children)) {
    const nextSection = (node.parent && node.parent.type === "PAGE") ? node.name : (currentSection || (node.type === "FRAME" ? currentSection : currentSection));
    for (const ch of node.children) walk(ch, collector, nextSection || currentSection);
  }
}

function exportSpecFrom(root, spec) {
  const nodes = [];
  walk(root, nodes, undefined);
  return {
    target: {
      fileId: spec.target.fileId,
      pageName: spec.target.pageName,
      frameId: root.id,
      frameName: root.name
    },
    nodes,
    summary: { warnings: [], deviations: [] }
  };
}

// ---------- UI messages ----------
figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === "validate") {
      const spec = JSON.parse(msg.taskSpec);
      const err = checkTaskSpec(spec);
      if (err) figma.ui.postMessage({ type: "validate:error", error: err });
      else figma.ui.postMessage({ type: "validate:ok" });
    }
    else if (msg.type === "build") {
      const spec = JSON.parse(msg.taskSpec);
      const err = checkTaskSpec(spec);
      if (err) { figma.ui.postMessage({ type: "validate:error", error: err }); return; }

      const page = findOrCreatePage(spec.target.pageName);
      figma.currentPage = page;

      const root = createRootFrame(spec, page);

      // очистим старые секции в корневом фрейме
      for (const ch of [...root.children]) ch.remove();

      buildSections(root, spec);

      figma.viewport.scrollAndZoomIntoView([root]);
      figma.ui.postMessage({ type: "build:ok", rootId: root.id, sections: (spec.sections||[]).length });
      figma.notify("Build v1: контейнеры и секции созданы");
    }
    else if (msg.type === "export") {
      const spec = JSON.parse(msg.taskSpec);
      const err = checkTaskSpec(spec);
      if (err) { figma.ui.postMessage({ type: "validate:error", error: err }); return; }

      const page = figma.root.children.find(p => p.type === "PAGE" && p.name === spec.target.pageName);
      if (!page) { figma.ui.postMessage({ type: "error", error: `Страница '${spec.target.pageName}' не найдена` }); return; }

      const root = page.findOne(n => n.type === "FRAME" && n.name === (spec.target.frameName || "Root"));
      if (!root) { figma.ui.postMessage({ type: "error", error: `Фрейм '${spec.target.frameName || "Root"}' не найден` }); return; }

      const exportSpec = exportSpecFrom(root, spec);
      figma.ui.postMessage({ type: "export:ok", exportSpec, filename: "ExportSpec.json" });
    }
    else if (msg.type === "close") {
      figma.closePlugin();
    }
  } catch (e) {
    figma.ui.postMessage({ type: "error", error: String(e) });
  }
};
