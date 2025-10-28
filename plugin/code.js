figma.showUI(__html__, { width: 760, height: 680 });

function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object';
}

function clampUnit(value) {
  if (!Number.isFinite(value)) return null;
  return Math.max(-10000, Math.min(10000, value));
}

function normalizePadding(raw) {
  if (typeof raw === 'number') {
    const normalized = clampUnit(raw);
    if (normalized == null) return null;
    return { top: normalized, right: normalized, bottom: normalized, left: normalized };
  }
  if (!isObject(raw)) return null;
  const out = { top: null, right: null, bottom: null, left: null };
  const map = {
    top: ['top', 't'],
    right: ['right', 'r'],
    bottom: ['bottom', 'b'],
    left: ['left', 'l'],
  };
  for (const key of Object.keys(map)) {
    for (const alias of map[key]) {
      if (Number.isFinite(raw[alias])) {
        out[key] = clampUnit(raw[alias]);
        break;
      }
    }
  }
  if (out.top == null && out.right == null && out.bottom == null && out.left == null) {
    return null;
  }
  for (const side of Object.keys(out)) {
    if (out[side] == null) out[side] = 0;
  }
  return out;
}

function applyPadding(frame, padding) {
  if (!padding) return;
  if ('paddingTop' in frame && padding.top != null) frame.paddingTop = padding.top;
  if ('paddingRight' in frame && padding.right != null) frame.paddingRight = padding.right;
  if ('paddingBottom' in frame && padding.bottom != null) frame.paddingBottom = padding.bottom;
  if ('paddingLeft' in frame && padding.left != null) frame.paddingLeft = padding.left;
}

function applyAutoLayoutConfig(frame, config) {
  if (!config) return;
  if (config.layoutMode && 'layoutMode' in frame) {
    frame.layoutMode = config.layoutMode;
  }
  if ('itemSpacing' in config && Number.isFinite(config.itemSpacing) && 'itemSpacing' in frame) {
    frame.itemSpacing = clampUnit(config.itemSpacing) ?? frame.itemSpacing;
  }
  if (config.padding) {
    applyPadding(frame, config.padding);
  }
}

function ensureFrameAutoLayout(frame, mode = 'VERTICAL') {
  if ('layoutMode' in frame) {
    frame.layoutMode = mode;
  }
  if ('primaryAxisSizingMode' in frame) {
    frame.primaryAxisSizingMode = 'AUTO';
  }
  if ('counterAxisSizingMode' in frame) {
    frame.counterAxisSizingMode = mode === 'VERTICAL' ? 'FIXED' : 'AUTO';
  }
  if ('itemSpacing' in frame && !Number.isFinite(frame.itemSpacing)) {
    frame.itemSpacing = 0;
  }
  if ('layoutAlign' in frame) {
    frame.layoutAlign = 'STRETCH';
  }
  if ('layoutGrow' in frame) {
    frame.layoutGrow = 0;
  }
  if ('clipsContent' in frame) {
    frame.clipsContent = false;
  }
  if ('fills' in frame && frame.fills !== undefined && Array.isArray(frame.fills)) {
    try {
      frame.fills = frame.fills.map((paint) => ({ ...paint }));
    } catch {
      frame.fills = [];
    }
  }
}

function applyAutoLayoutSource(target, source) {
  if (!isObject(source)) return;
  if (Number.isFinite(source.itemSpacing)) {
    target.itemSpacing = source.itemSpacing;
  }
  if (source.padding != null) {
    const padding = normalizePadding(source.padding);
    if (padding) {
      target.padding = Object.assign(target.padding || {}, padding);
    }
  }
  const paddingPairs = [
    ['paddingTop', 'top'],
    ['paddingRight', 'right'],
    ['paddingBottom', 'bottom'],
    ['paddingLeft', 'left'],
  ];
  for (const [prop, side] of paddingPairs) {
    if (Number.isFinite(source[prop])) {
      const normalized = clampUnit(source[prop]);
      if (normalized != null) {
        if (!target.padding) target.padding = {};
        target.padding[side] = normalized;
      }
    }
  }
  if (typeof source.layoutMode === 'string') {
    target.layoutMode = source.layoutMode;
  }
}

function resolveRootAutoLayout(spec) {
  const result = { layoutMode: 'VERTICAL', padding: undefined, itemSpacing: undefined };
  if (isObject(spec.defaults)) {
    if (isObject(spec.defaults.autoLayout)) {
      applyAutoLayoutSource(result, spec.defaults.autoLayout);
    }
    if (isObject(spec.defaults.root)) {
      if (isObject(spec.defaults.root.autoLayout)) {
        applyAutoLayoutSource(result, spec.defaults.root.autoLayout);
      } else {
        applyAutoLayoutSource(result, spec.defaults.root);
      }
    }
  }
  if (isObject(spec.target) && isObject(spec.target.autoLayout)) {
    applyAutoLayoutSource(result, spec.target.autoLayout);
  }
  if (!Number.isFinite(result.itemSpacing) && isObject(spec.grid) && Number.isFinite(spec.grid.gap)) {
    result.itemSpacing = spec.grid.gap;
  }
  if (!result.padding && isObject(spec.grid) && Number.isFinite(spec.grid.margins)) {
    const margins = clampUnit(spec.grid.margins);
    if (margins != null) {
      result.padding = { top: margins, right: margins, bottom: margins, left: margins };
    }
  }
  return result;
}

function resolveSectionAutoLayout(spec, section) {
  const result = { layoutMode: 'VERTICAL', padding: undefined, itemSpacing: undefined };
  if (isObject(spec.defaults)) {
    if (isObject(spec.defaults.autoLayout)) {
      applyAutoLayoutSource(result, spec.defaults.autoLayout);
    }
    const sectionsDefaults = spec.defaults.sections;
    if (isObject(sectionsDefaults)) {
      if (isObject(sectionsDefaults.global)) {
        const globalSource = isObject(sectionsDefaults.global.autoLayout)
          ? sectionsDefaults.global.autoLayout
          : sectionsDefaults.global;
        applyAutoLayoutSource(result, globalSource);
      }
      if (section && typeof section.type === 'string' && isObject(sectionsDefaults[section.type])) {
        const typeSource = isObject(sectionsDefaults[section.type].autoLayout)
          ? sectionsDefaults[section.type].autoLayout
          : sectionsDefaults[section.type];
        applyAutoLayoutSource(result, typeSource);
      }
    }
  }
  if (isObject(section)) {
    if (isObject(section.autoLayout)) {
      applyAutoLayoutSource(result, section.autoLayout);
    }
    if (isObject(section.layout) && isObject(section.layout.autoLayout)) {
      applyAutoLayoutSource(result, section.layout.autoLayout);
    }
    if (Number.isFinite(section.itemSpacing)) {
      result.itemSpacing = section.itemSpacing;
    }
    if (section.padding != null) {
      const padding = normalizePadding(section.padding);
      if (padding) {
        result.padding = Object.assign(result.padding || {}, padding);
      }
    }
  }
  if (!Number.isFinite(result.itemSpacing) && isObject(spec.grid) && Number.isFinite(spec.grid.gap)) {
    result.itemSpacing = spec.grid.gap;
  }
  return result;
}

function parseColor(value) {
  if (typeof value === 'string') {
    const hex = value.trim().replace(/^#/, '');
    if (hex.length === 6 || hex.length === 8) {
      const int = parseInt(hex, 16);
      if (Number.isNaN(int)) return null;
      const hasAlpha = hex.length === 8;
      const r = (int >> (hasAlpha ? 24 : 16)) & 0xff;
      const g = (int >> (hasAlpha ? 16 : 8)) & 0xff;
      const b = (int >> (hasAlpha ? 8 : 0)) & 0xff;
      const a = hasAlpha ? int & 0xff : 255;
      return {
        color: { r: r / 255, g: g / 255, b: b / 255 },
        opacity: a / 255,
      };
    }
  }
  if (isObject(value)) {
    const r = Number.isFinite(value.r) ? value.r : Number.isFinite(value.red) ? value.red : null;
    const g = Number.isFinite(value.g) ? value.g : Number.isFinite(value.green) ? value.green : null;
    const b = Number.isFinite(value.b) ? value.b : Number.isFinite(value.blue) ? value.blue : null;
    const a = Number.isFinite(value.a) ? value.a : Number.isFinite(value.alpha) ? value.alpha : null;
    if (r != null && g != null && b != null) {
      const divisor = r > 1 || g > 1 || b > 1 ? 255 : 1;
      const opacityDivisor = a != null && a > 1 ? 255 : 1;
      return {
        color: { r: r / divisor, g: g / divisor, b: b / divisor },
        opacity: a != null ? a / opacityDivisor : undefined,
      };
    }
  }
  return null;
}

function applyFill(node, fillValue) {
  if (!('fills' in node)) return;
  const parsed = parseColor(fillValue);
  if (!parsed) return;
  const paints = Array.isArray(node.fills) ? node.fills.map((paint) => ({ ...paint })) : [];
  const nextPaint = {
    type: 'SOLID',
    color: parsed.color,
  };
  if (parsed.opacity != null) {
    nextPaint.opacity = parsed.opacity;
  }
  paints[0] = nextPaint;
  try {
    node.fills = paints;
  } catch {
    // ignore assignment issues
  }
}

function applyStroke(node, strokeValue) {
  if (!('strokes' in node)) return;
  const parsed = parseColor(strokeValue);
  if (!parsed) return;
  const strokes = Array.isArray(node.strokes) ? node.strokes.map((paint) => ({ ...paint })) : [];
  const nextStroke = {
    type: 'SOLID',
    color: parsed.color,
  };
  if (parsed.opacity != null) {
    nextStroke.opacity = parsed.opacity;
  }
  strokes[0] = nextStroke;
  try {
    node.strokes = strokes;
  } catch {
    // ignore assignment issues
  }
}

function applyVariables(node, variables) {
  if (!isObject(variables)) return;
  if (typeof node.setBoundVariable !== 'function') return;
  for (const [property, variableId] of Object.entries(variables)) {
    if (typeof variableId !== 'string' || !variableId) continue;
    try {
      node.setBoundVariable(property, variableId);
    } catch (_) {
      // ignore invalid bindings
    }
  }
}

function applyTokensToNode(node, tokens, context) {
  if (!isObject(tokens)) return;
  const sources = [];
  if (isObject(tokens.global)) sources.push(tokens.global);
  if (context && context.scope === 'root' && isObject(tokens.root)) sources.push(tokens.root);
  if (context && context.type && isObject(tokens.sections) && isObject(tokens.sections[context.type])) {
    sources.push(tokens.sections[context.type]);
  }
  if (context && isObject(context.section) && isObject(context.section.tokens)) {
    sources.push(context.section.tokens);
  }
  if (context && context.name && isObject(tokens.sectionByName) && isObject(tokens.sectionByName[context.name])) {
    sources.push(tokens.sectionByName[context.name]);
  }
  for (const source of sources) {
    if (!isObject(source)) continue;
    if (source.fill != null) {
      applyFill(node, source.fill);
    }
    if (source.stroke != null) {
      applyStroke(node, source.stroke);
    }
    if (source.variables) {
      applyVariables(node, source.variables);
    }
  }
}

function ensurePage(pageName, log) {
  if (typeof pageName !== 'string' || !pageName.trim()) {
    throw new Error('target.pageName is required');
  }
  const trimmed = pageName.trim();
  let page = figma.root.children.find((node) => node.type === 'PAGE' && node.name === trimmed);
  if (!page) {
    page = figma.createPage();
    page.name = trimmed;
    log(`Created page “${trimmed}”`);
  } else {
    log(`Reused existing page “${trimmed}”`);
  }
  figma.currentPage = page;
  return page;
}

function ensureRootFrame(page, spec, log) {
  if (!isObject(spec.target) || typeof spec.target.frameName !== 'string') {
    throw new Error('target.frameName is required');
  }
  const frameName = spec.target.frameName.trim();
  let frame = page.children.find((child) => child.type === 'FRAME' && child.name === frameName);
  if (!frame) {
    frame = figma.createFrame();
    frame.name = frameName;
    page.appendChild(frame);
    log(`Created root frame “${frameName}”`);
  } else {
    log(`Reused existing frame “${frameName}”`);
  }
  ensureFrameAutoLayout(frame, 'VERTICAL');
  const layoutConfig = resolveRootAutoLayout(spec);
  applyAutoLayoutConfig(frame, layoutConfig);
  if (isObject(spec.target.frameSize)) {
    const { w, h } = spec.target.frameSize;
    if (Number.isFinite(w) && Number.isFinite(h) && typeof frame.resizeWithoutConstraints === 'function') {
      frame.resizeWithoutConstraints(w, h);
      log(`Adjusted root frame size to ${w}×${h}`);
    }
  }
  if ('x' in frame) frame.x = 0;
  if ('y' in frame) frame.y = 0;
  if (isObject(spec.meta) && typeof spec.meta.id === 'string') {
    try {
      frame.setPluginData('relay:taskId', spec.meta.id);
    } catch {
      // ignore plugin data issues
    }
  }
  applyTokensToNode(frame, spec.tokens, { scope: 'root' });
  return frame;
}

function resolveSectionGrid(section, spec) {
  if (!isObject(section)) return null;
  const layoutValue = section.layout || section.gridLayout || section.grid;
  const layoutString =
    typeof layoutValue === 'string'
      ? layoutValue
      : typeof layoutValue?.type === 'string'
        ? layoutValue.type
        : null;
  if (!layoutString || !/^grid-(\d+)/i.test(layoutString)) return null;
  const match = layoutString.match(/grid-(\d+)/i);
  const columns = match ? parseInt(match[1], 10) : NaN;
  if (!Number.isFinite(columns) || columns <= 0) return null;
  const gap = Number.isFinite(section.gap)
    ? section.gap
    : Number.isFinite(section.gridGap)
      ? section.gridGap
      : Number.isFinite(spec?.grid?.gap)
        ? spec.grid.gap
        : 0;
  return { columns, gap };
}

function ensureGridStructure(sectionNode, section, spec, log) {
  const gridInfo = resolveSectionGrid(section, spec);
  if (!gridInfo) return;
  const { columns, gap } = gridInfo;

  const containerId = 'relay:gridContainer';
  let container = sectionNode.children.find((child) => {
    if (child.type !== 'FRAME') return false;
    try {
      return child.getPluginData(containerId) === '1';
    } catch {
      return false;
    }
  });
  if (!container) {
    container = figma.createFrame();
    container.name = `${section.name || sectionNode.name} · Grid`;
    sectionNode.appendChild(container);
    try {
      container.setPluginData(containerId, '1');
    } catch {}
    log(`Created grid container for section “${sectionNode.name}” with ${columns} columns`);
  }
  ensureFrameAutoLayout(container, 'HORIZONTAL');
  container.counterAxisSizingMode = 'AUTO';
  container.layoutGrow = 1;
  if ('layoutAlign' in container) {
    container.layoutAlign = 'STRETCH';
  }
  container.itemSpacing = Number.isFinite(gap) ? gap : 0;
  applyPadding(container, normalizePadding(0));
  if ('fills' in container) {
    container.fills = [];
  }

  const columnPluginKey = 'relay:gridColumnIndex';
  const desiredColumns = [];
  for (let i = 0; i < columns; i += 1) {
    let column = container.children.find((child) => {
      if (child.type !== 'FRAME') return false;
      try {
        const data = child.getPluginData(columnPluginKey);
        return Number.parseInt(data || '', 10) === i;
      } catch {
        return false;
      }
    });
    if (!column) {
      column = figma.createFrame();
      column.name = `Column ${i + 1}`;
      container.appendChild(column);
      try {
        column.setPluginData(columnPluginKey, String(i));
      } catch {}
    }
    ensureFrameAutoLayout(column, 'VERTICAL');
    column.layoutGrow = 1;
    if ('layoutAlign' in column) {
      column.layoutAlign = 'STRETCH';
    }
    column.counterAxisSizingMode = 'AUTO';
    if ('fills' in column) {
      column.fills = [];
    }
    desiredColumns.push(column);
  }

  desiredColumns.forEach((column, index) => {
    if (column.parent === container) {
      container.insertChild(index, column);
    }
  });

  const toRemove = container.children.filter((child) => !desiredColumns.includes(child));
  for (const extra of toRemove) {
    try {
      extra.remove();
    } catch {}
  }
}

function ensureSectionFrame(rootFrame, spec, section, log) {
  if (!section || typeof section.name !== 'string') {
    throw new Error('Every section requires a name');
  }
  const sectionName = section.name.trim();
  let frame = rootFrame.children.find((child) => child.type === 'FRAME' && child.name === sectionName);
  if (!frame) {
    frame = figma.createFrame();
    frame.name = sectionName;
    rootFrame.appendChild(frame);
    log(`Created section “${sectionName}”`);
  } else {
    log(`Updated section “${sectionName}”`);
  }
  ensureFrameAutoLayout(frame, 'VERTICAL');
  const layoutConfig = resolveSectionAutoLayout(spec, section);
  applyAutoLayoutConfig(frame, layoutConfig);
  frame.layoutGrow = 0;
  if ('counterAxisSizingMode' in frame) {
    frame.counterAxisSizingMode = 'AUTO';
  }
  if ('fills' in frame) {
    frame.fills = [];
  }
  try {
    frame.setPluginData('relay:sectionType', String(section.type || 'custom'));
  } catch {}
  applyTokensToNode(frame, spec.tokens, {
    type: section.type,
    name: sectionName,
    section,
  });
  ensureGridStructure(frame, section, spec, log);
  return frame;
}

async function runBuild(spec) {
  const logs = [];
  const log = (entry) => {
    logs.push(`[build] ${entry}`);
  };
  if (!isObject(spec.meta) || !isObject(spec.target)) {
    throw new Error('TaskSpec meta/target are required');
  }
  const page = ensurePage(spec.target.pageName, log);
  const rootFrame = ensureRootFrame(page, spec, log);
  const sections = Array.isArray(spec.sections) ? spec.sections : [];
  const sectionFrames = [];
  for (const section of sections) {
    const frame = ensureSectionFrame(rootFrame, spec, section, log);
    sectionFrames.push(frame);
  }
  sectionFrames.forEach((frame, index) => {
    if (frame.parent === rootFrame) {
      rootFrame.insertChild(index, frame);
    }
  });
  log(`Processed ${sectionFrames.length} sections`);
  const timestamp = new Date().toISOString();
  try {
    rootFrame.setPluginData('relay:lastBuildAt', timestamp);
  } catch {}
  return {
    page,
    rootFrame,
    sections: sectionFrames,
    logs,
  };
}

function extractBounds(node) {
  const fallback = { x: 0, y: 0, width: 0, height: 0 };
  const box = node.absoluteRenderBounds || node.absoluteBoundingBox || fallback;
  return {
    x: Number.isFinite(box.x) ? box.x : 0,
    y: Number.isFinite(box.y) ? box.y : 0,
    w: Number.isFinite(box.width) ? box.width : 0,
    h: Number.isFinite(box.height) ? box.height : 0,
  };
}

function extractAutoLayout(node) {
  if (!('layoutMode' in node)) return null;
  const padding = {
    t: 'paddingTop' in node && Number.isFinite(node.paddingTop) ? node.paddingTop : 0,
    r: 'paddingRight' in node && Number.isFinite(node.paddingRight) ? node.paddingRight : 0,
    b: 'paddingBottom' in node && Number.isFinite(node.paddingBottom) ? node.paddingBottom : 0,
    l: 'paddingLeft' in node && Number.isFinite(node.paddingLeft) ? node.paddingLeft : 0,
  };
  return {
    layoutMode: node.layoutMode,
    itemSpacing: Number.isFinite(node.itemSpacing) ? node.itemSpacing : null,
    padding,
  };
}

function extractPaintStyle(paints) {
  if (!Array.isArray(paints) || paints.length === 0) return null;
  const paint = paints[0];
  if (!isObject(paint)) return null;
  if (paint.type === 'SOLID') {
    const color = isObject(paint.color) ? paint.color : { r: 0, g: 0, b: 0 };
    return {
      type: 'SOLID',
      color: {
        r: Number.isFinite(color.r) ? color.r : 0,
        g: Number.isFinite(color.g) ? color.g : 0,
        b: Number.isFinite(color.b) ? color.b : 0,
      },
      opacity: Number.isFinite(paint.opacity) ? paint.opacity : 1,
    };
  }
  return { type: paint.type || 'UNKNOWN' };
}

function extractStyles(node) {
  const styles = {};
  if ('fills' in node) {
    const fill = extractPaintStyle(node.fills);
    if (fill) styles.fill = fill;
  }
  if ('strokes' in node) {
    const stroke = extractPaintStyle(node.strokes);
    if (stroke) styles.stroke = stroke;
  }
  if (node.type === 'TEXT') {
    const fontName = node.fontName;
    if (fontName && fontName !== figma.mixed) {
      styles.fontFamily = fontName.family;
      styles.fontStyle = fontName.style;
    }
    const fontSize = node.fontSize;
    if (fontSize && fontSize !== figma.mixed) {
      styles.fontSize = fontSize;
    }
    const lineHeight = node.lineHeight;
    if (lineHeight && lineHeight !== figma.mixed) {
      styles.lineHeight = lineHeight;
    }
  }
  return styles;
}

function extractStyleIds(node) {
  const result = {};
  const assign = (prop) => {
    if (prop in node) {
      const value = node[prop];
      if (typeof value === 'string' && value.trim()) {
        result[prop] = value;
      }
    }
  };
  assign('textStyleId');
  assign('effectStyleId');
  assign('strokeStyleId');
  assign('fillStyleId');
  return Object.keys(result).length ? result : null;
}

function extractVariables(node) {
  if (!('boundVariables' in node)) return null;
  try {
    const bindings = node.boundVariables;
    if (!isObject(bindings)) return null;
    const result = {};
    for (const [key, value] of Object.entries(bindings)) {
      if (typeof value === 'string' && value) {
        result[key] = value;
      }
    }
    return Object.keys(result).length ? result : null;
  } catch {
    return null;
  }
}

function extractConstraints(node) {
  if (!('constraints' in node) || !isObject(node.constraints)) return null;
  const { horizontal, vertical } = node.constraints;
  return { horizontal, vertical };
}

function resolveSectionName(node, rootFrame) {
  let current = node;
  while (current && current !== rootFrame) {
    if (current.parent === rootFrame) {
      return current.name || null;
    }
    current = current.parent;
  }
  return null;
}

function collectNode(node, rootFrame) {
  const styleIds = extractStyleIds(node);
  const result = {
    id: node.id,
    name: node.name || '',
    type: node.type,
    absBounds: extractBounds(node),
    autoLayout: extractAutoLayout(node),
    styles: extractStyles(node),
    variables: extractVariables(node),
    constraints: extractConstraints(node),
    section: resolveSectionName(node, rootFrame),
  };
  if (styleIds) {
    Object.assign(result, styleIds);
  }
  return result;
}

function computeDeviationSummary(spec, rootFrame, logs) {
  const sections = Array.isArray(spec.sections) ? spec.sections : [];
  const tolerance = Number.isFinite(spec.acceptance?.maxSpacingDeviation)
    ? spec.acceptance.maxSpacingDeviation
    : 2;
  const deviations = [];
  const warnings = [];
  if (spec.acceptance?.checkAutoLayout && rootFrame.layoutMode !== 'VERTICAL') {
    warnings.push('Root frame is not using VERTICAL auto layout');
  }
  for (const section of sections) {
    const sectionNode = rootFrame.children.find(
      (child) => child.type === 'FRAME' && child.name === section.name,
    );
    if (!sectionNode) {
      warnings.push(`Section “${section.name}” not found on canvas`);
      continue;
    }
    const expected = resolveSectionAutoLayout(spec, section);
    const actualSpacing = Number.isFinite(sectionNode.itemSpacing) ? sectionNode.itemSpacing : null;
    if (Number.isFinite(expected.itemSpacing) && actualSpacing != null) {
      const delta = actualSpacing - expected.itemSpacing;
      if (Math.abs(delta) > tolerance) {
        deviations.push({
          section: section.name,
          property: 'itemSpacing',
          expected: expected.itemSpacing,
          actual: actualSpacing,
          delta,
        });
        warnings.push(`Spacing deviation in “${section.name}”: Δ=${delta.toFixed(2)}px`);
      }
    }
    const expectedPadding = normalizePadding(expected.padding || section.padding || null);
    if (expectedPadding) {
      const actualPadding = {
        top: Number.isFinite(sectionNode.paddingTop) ? sectionNode.paddingTop : 0,
        right: Number.isFinite(sectionNode.paddingRight) ? sectionNode.paddingRight : 0,
        bottom: Number.isFinite(sectionNode.paddingBottom) ? sectionNode.paddingBottom : 0,
        left: Number.isFinite(sectionNode.paddingLeft) ? sectionNode.paddingLeft : 0,
      };
      for (const side of ['top', 'right', 'bottom', 'left']) {
        const delta = actualPadding[side] - expectedPadding[side];
        if (Math.abs(delta) > tolerance) {
          deviations.push({
            section: section.name,
            property: `padding${side[0].toUpperCase()}${side.slice(1)}`,
            expected: expectedPadding[side],
            actual: actualPadding[side],
            delta,
          });
          warnings.push(
            `Padding deviation (${side}) in “${section.name}”: Δ=${delta.toFixed(2)}px`,
          );
        }
      }
    }
    const gridInfo = resolveSectionGrid(section, spec);
    if (gridInfo && Number.isFinite(gridInfo.columns)) {
      const containerId = 'relay:gridContainer';
      let container = null;
      if (Array.isArray(sectionNode.children)) {
        container = sectionNode.children.find((child) => {
          if (child.type !== 'FRAME') return false;
          try {
            return child.getPluginData(containerId) === '1';
          } catch {
            return false;
          }
        }) || null;
        if (!container) {
          container = sectionNode.children.find(
            (child) => child.type === 'FRAME' && /·\s*Grid$/i.test(child.name || ''),
          );
        }
      }
      let actualColumns = 0;
      if (container && 'children' in container && Array.isArray(container.children)) {
        actualColumns = container.children.filter((child) => child.type === 'FRAME').length;
      }
      if (actualColumns !== gridInfo.columns) {
        warnings.push(
          `Grid mismatch in “${section.name}”: expected ${gridInfo.columns} columns, found ${actualColumns}`,
        );
      }
    }
  }
  if (deviations.length) {
    logs.push(`[export] Detected ${deviations.length} layout deviations`);
  }
  return { deviations, warnings };
}

async function runExport(spec) {
  const logs = [];
  const log = (entry) => logs.push(`[export] ${entry}`);
  if (!isObject(spec.target) || typeof spec.target.pageName !== 'string') {
    throw new Error('target.pageName is required for export');
  }
  const page = figma.root.children.find(
    (node) => node.type === 'PAGE' && node.name === spec.target.pageName.trim(),
  );
  if (!page) {
    throw new Error(`Page “${spec.target.pageName}” not found`);
  }
  figma.currentPage = page;
  if (typeof spec.target.frameName !== 'string') {
    throw new Error('target.frameName is required for export');
  }
  const frame = page.children.find(
    (child) => child.type === 'FRAME' && child.name === spec.target.frameName.trim(),
  );
  if (!frame) {
    throw new Error(`Frame “${spec.target.frameName}” not found on page “${page.name}”`);
  }
  const nodes = [];
  const visit = (node) => {
    nodes.push(collectNode(node, frame));
    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        visit(child);
      }
    }
  };
  visit(frame);
  log(`Collected ${nodes.length} nodes from “${frame.name}”`);
  const deviationSummary = computeDeviationSummary(spec, frame, logs);
  return {
    exportSpec: {
      meta: { ...spec.meta, exportedAt: new Date().toISOString() },
      target: spec.target,
      summary: {
        sections: Array.isArray(spec.sections) ? spec.sections.length : 0,
        warnings: deviationSummary.warnings,
        deviations: deviationSummary.deviations,
      },
      document: {
        rootId: frame.id,
        pageId: page.id,
        nodes,
      },
      logs,
    },
    frame,
    logs,
  };
}

async function maybeExportPreview() {
  try {
    const currentPage = figma.currentPage;
    const selection =
      currentPage && Array.isArray(currentPage.selection) ? currentPage.selection : [];
    let exportNode = null;
    for (const candidate of selection) {
      if (candidate && typeof candidate.exportAsync === 'function') {
        exportNode = candidate;
        break;
      }
    }
    if (!exportNode && currentPage && typeof currentPage.exportAsync === 'function') {
      exportNode = currentPage;
    }
    if (exportNode && typeof exportNode.exportAsync === 'function') {
      const bytes = await exportNode.exportAsync({
        format: 'PNG',
        constraint: { type: 'SCALE', value: 1 },
      });
      if (bytes && bytes.length > 0) {
        return {
          contentType: 'image/png',
          base64: figma.base64Encode(bytes),
          size: bytes.length,
        };
      }
    }
  } catch (error) {
    return { error: error && error.message ? error.message : String(error) };
  }
  return null;
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
      const { page, rootFrame, sections, logs } = await runBuild(spec);
      figma.ui.postMessage({
        type: 'build:ok',
        sections: sections.length,
        pageId: page.id,
        frameId: rootFrame.id,
        logs,
      });
    } else if (msg.type === 'export') {
      const spec = safeParseJSON(msg.taskSpec);
      if (!spec) {
        return figma.ui.postMessage({ type: 'error', error: 'Invalid JSON' });
      }
      const { exportSpec, logs } = await runExport(spec);
      const previewResult = await maybeExportPreview();
      const previewPayload = previewResult && !previewResult.error ? previewResult : null;
      const previewError = previewResult && previewResult.error ? previewResult.error : null;
      figma.ui.postMessage({
        type: 'export:ok',
        exportSpec,
        filename: 'ExportSpec.json',
        preview: previewPayload,
        previewError,
        logs,
      });
    } else if (msg.type === 'close') {
      figma.closePlugin();
    }
  } catch (err) {
    figma.ui.postMessage({ type: 'error', error: String((err && err.message) || err) });
  }
};
