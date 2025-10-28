"use strict";function _regenerator() {
/*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */var e,t,r = "function" == typeof Symbol ? Symbol : {},n = r.iterator || "@@iterator",o = r.toStringTag || "@@toStringTag";function i(r, n, o, i) {var c = n && n.prototype instanceof Generator ? n : Generator,u = Object.create(c.prototype);return _regeneratorDefine2(u, "_invoke", function (r, n, o) {var i,c,u,f = 0,p = o || [],y = !1,G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) {return i = t, c = 0, u = e, G.n = r, a;} };function d(r, n) {for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) {var o,i = p[t],d = G.p,l = i[2];r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0));}if (o || r > 1) return a;throw y = !0, n;}return function (o, p, l) {if (f > 1) throw TypeError("Generator is already running");for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) {i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u);try {if (f = 2, i) {if (c || (o = "next"), t = i[o]) {if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object");if (!t.done) return t;u = t.value, c < 2 && (c = 0);} else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1);i = e;} else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break;} catch (t) {i = e, c = 1, u = t;} finally {f = 1;}}return { value: t, done: y };};}(r, o, i), !0), u;}var a = {};function Generator() {}function GeneratorFunction() {}function GeneratorFunctionPrototype() {}t = Object.getPrototypeOf;var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () {return this;}), t),u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);function f(e) {return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e;}return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () {return this;}), _regeneratorDefine2(u, "toString", function () {return "[object Generator]";}), (_regenerator = function _regenerator() {return { w: i, m: f };})();}function _regeneratorDefine2(e, r, n, t) {var i = Object.defineProperty;try {i({}, "", {});} catch (e) {i = 0;}_regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) {function o(r, n) {_regeneratorDefine2(e, r, function (e) {return this._invoke(r, n, e);});}r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2));}, _regeneratorDefine2(e, r, n, t);}function asyncGeneratorStep(n, t, e, r, o, a, c) {try {var i = n[a](c),u = i.value;} catch (n) {return void e(n);}i.done ? t(u) : Promise.resolve(u).then(r, o);}function _asyncToGenerator(n) {return function () {var t = this,e = arguments;return new Promise(function (r, o) {var a = n.apply(t, e);function _next(n) {asyncGeneratorStep(a, r, o, _next, _throw, "next", n);}function _throw(n) {asyncGeneratorStep(a, r, o, _next, _throw, "throw", n);}_next(void 0);});};}function _slicedToArray(r, e) {return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();}function _nonIterableRest() {throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}function _iterableToArrayLimit(r, l) {var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];if (null != t) {var e,n,i,u,a = [],f = !0,o = !1;try {if (i = (t = t.call(r)).next, 0 === l) {if (Object(t) !== t) return;f = !1;} else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);} catch (r) {o = !0, n = r;} finally {try {if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return;} finally {if (o) throw n;}}return a;}}function _arrayWithHoles(r) {if (Array.isArray(r)) return r;}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);}function _createForOfIteratorHelper(r, e) {var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];if (!t) {if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {t && (r = t);var _n = 0,F = function F() {};return { s: F, n: function n() {return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] };}, e: function e(r) {throw r;}, f: F };}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}var o,a = !0,u = !1;return { s: function s() {t = t.call(r);}, n: function n() {var r = t.next();return a = r.done, r;}, e: function e(r) {u = !0, o = r;}, f: function f() {try {a || null == t["return"] || t["return"]();} finally {if (u) throw o;}} };}function _unsupportedIterableToArray(r, a) {if (r) {if ("string" == typeof r) return _arrayLikeToArray(r, a);var t = {}.toString.call(r).slice(8, -1);return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;}}function _arrayLikeToArray(r, a) {(null == a || a > r.length) && (a = r.length);for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];return n;}function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}figma.showUI(__html__, { width: 760, height: 680 });
function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

function isObject(value) {
  return value !== null && _typeof(value) === 'object';
}

function clampUnit(value) {
  if (!Number.isFinite(value)) return null;
  return Math.max(-10000, Math.min(10000, value));
}

function normalizePadding(raw) {
  if (typeof raw === 'number') {
    var normalized = clampUnit(raw);
    if (normalized == null) return null;
    return { top: normalized, right: normalized, bottom: normalized, left: normalized };
  }
  if (!isObject(raw)) return null;
  var out = { top: null, right: null, bottom: null, left: null };
  var map = {
    top: ['top', 't'],
    right: ['right', 'r'],
    bottom: ['bottom', 'b'],
    left: ['left', 'l']
  };
  for (var _i = 0, _Object$keys = Object.keys(map); _i < _Object$keys.length; _i++) {var key = _Object$keys[_i];var _iterator = _createForOfIteratorHelper(
        map[key]),_step;try {for (_iterator.s(); !(_step = _iterator.n()).done;) {var alias = _step.value;
        if (Number.isFinite(raw[alias])) {
          out[key] = clampUnit(raw[alias]);
          break;
        }
      }} catch (err) {_iterator.e(err);} finally {_iterator.f();}
  }
  if (out.top == null && out.right == null && out.bottom == null && out.left == null) {
    return null;
  }
  for (var _i2 = 0, _Object$keys2 = Object.keys(out); _i2 < _Object$keys2.length; _i2++) {var side = _Object$keys2[_i2];
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
  if ('itemSpacing' in config && Number.isFinite(config.itemSpacing) && 'itemSpacing' in frame) {var _clampUnit;
    frame.itemSpacing = (_clampUnit = clampUnit(config.itemSpacing)) !== null && _clampUnit !== void 0 ? _clampUnit : frame.itemSpacing;
  }
  if (config.padding) {
    applyPadding(frame, config.padding);
  }
}

function ensureFrameAutoLayout(frame) {var mode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'VERTICAL';
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
      frame.fills = frame.fills.map(function (paint) {return _objectSpread({}, paint);});
    } catch (e) {
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
    var padding = normalizePadding(source.padding);
    if (padding) {
      target.padding = Object.assign(target.padding || {}, padding);
    }
  }
  var paddingPairs = [
  ['paddingTop', 'top'],
  ['paddingRight', 'right'],
  ['paddingBottom', 'bottom'],
  ['paddingLeft', 'left']];

  for (var _i3 = 0, _paddingPairs = paddingPairs; _i3 < _paddingPairs.length; _i3++) {var _paddingPairs$_i = _slicedToArray(_paddingPairs[_i3], 2),prop = _paddingPairs$_i[0],side = _paddingPairs$_i[1];
    if (Number.isFinite(source[prop])) {
      var normalized = clampUnit(source[prop]);
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
  var result = { layoutMode: 'VERTICAL', padding: undefined, itemSpacing: undefined };
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
    var margins = clampUnit(spec.grid.margins);
    if (margins != null) {
      result.padding = { top: margins, right: margins, bottom: margins, left: margins };
    }
  }
  return result;
}

function resolveSectionAutoLayout(spec, section) {
  var result = { layoutMode: 'VERTICAL', padding: undefined, itemSpacing: undefined };
  if (isObject(spec.defaults)) {
    if (isObject(spec.defaults.autoLayout)) {
      applyAutoLayoutSource(result, spec.defaults.autoLayout);
    }
    var sectionsDefaults = spec.defaults.sections;
    if (isObject(sectionsDefaults)) {
      if (isObject(sectionsDefaults.global)) {
        var globalSource = isObject(sectionsDefaults.global.autoLayout) ?
        sectionsDefaults.global.autoLayout :
        sectionsDefaults.global;
        applyAutoLayoutSource(result, globalSource);
      }
      if (section && typeof section.type === 'string' && isObject(sectionsDefaults[section.type])) {
        var typeSource = isObject(sectionsDefaults[section.type].autoLayout) ?
        sectionsDefaults[section.type].autoLayout :
        sectionsDefaults[section.type];
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
      var padding = normalizePadding(section.padding);
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
    var hex = value.trim().replace(/^#/, '');
    if (hex.length === 6 || hex.length === 8) {
      var _int = parseInt(hex, 16);
      if (Number.isNaN(_int)) return null;
      var hasAlpha = hex.length === 8;
      var r = _int >> (hasAlpha ? 24 : 16) & 0xff;
      var g = _int >> (hasAlpha ? 16 : 8) & 0xff;
      var b = _int >> (hasAlpha ? 8 : 0) & 0xff;
      var a = hasAlpha ? _int & 0xff : 255;
      return {
        color: { r: r / 255, g: g / 255, b: b / 255 },
        opacity: a / 255
      };
    }
  }
  if (isObject(value)) {
    var _r = Number.isFinite(value.r) ? value.r : Number.isFinite(value.red) ? value.red : null;
    var _g = Number.isFinite(value.g) ? value.g : Number.isFinite(value.green) ? value.green : null;
    var _b = Number.isFinite(value.b) ? value.b : Number.isFinite(value.blue) ? value.blue : null;
    var _a = Number.isFinite(value.a) ? value.a : Number.isFinite(value.alpha) ? value.alpha : null;
    if (_r != null && _g != null && _b != null) {
      var divisor = _r > 1 || _g > 1 || _b > 1 ? 255 : 1;
      var opacityDivisor = _a != null && _a > 1 ? 255 : 1;
      return {
        color: { r: _r / divisor, g: _g / divisor, b: _b / divisor },
        opacity: _a != null ? _a / opacityDivisor : undefined
      };
    }
  }
  return null;
}

function applyFill(node, fillValue) {
  if (!('fills' in node)) return;
  var parsed = parseColor(fillValue);
  if (!parsed) return;
  var paints = Array.isArray(node.fills) ? node.fills.map(function (paint) {return _objectSpread({}, paint);}) : [];
  var nextPaint = {
    type: 'SOLID',
    color: parsed.color
  };
  if (parsed.opacity != null) {
    nextPaint.opacity = parsed.opacity;
  }
  paints[0] = nextPaint;
  try {
    node.fills = paints;
  } catch (e) {

    // ignore assignment issues
  }}

function applyStroke(node, strokeValue) {
  if (!('strokes' in node)) return;
  var parsed = parseColor(strokeValue);
  if (!parsed) return;
  var strokes = Array.isArray(node.strokes) ? node.strokes.map(function (paint) {return _objectSpread({}, paint);}) : [];
  var nextStroke = {
    type: 'SOLID',
    color: parsed.color
  };
  if (parsed.opacity != null) {
    nextStroke.opacity = parsed.opacity;
  }
  strokes[0] = nextStroke;
  try {
    node.strokes = strokes;
  } catch (e) {

    // ignore assignment issues
  }}

function applyVariables(node, variables) {
  if (!isObject(variables)) return;
  if (typeof node.setBoundVariable !== 'function') return;
  for (var _i4 = 0, _Object$entries = Object.entries(variables); _i4 < _Object$entries.length; _i4++) {var _Object$entries$_i = _slicedToArray(_Object$entries[_i4], 2),property = _Object$entries$_i[0],variableId = _Object$entries$_i[1];
    if (typeof variableId !== 'string' || !variableId) continue;
    try {
      node.setBoundVariable(property, variableId);
    } catch (_) {

      // ignore invalid bindings
    }}
}

function applyTokensToNode(node, tokens, context) {
  if (!isObject(tokens)) return;
  var sources = [];
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
  for (var _i5 = 0, _sources = sources; _i5 < _sources.length; _i5++) {var source = _sources[_i5];
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
  var trimmed = pageName.trim();
  var page = figma.root.children.find(function (node) {return node.type === 'PAGE' && node.name === trimmed;});
  if (!page) {
    page = figma.createPage();
    page.name = trimmed;
    log("Created page \u201C".concat(trimmed, "\u201D"));
  } else {
    log("Reused existing page \u201C".concat(trimmed, "\u201D"));
  }
  figma.currentPage = page;
  return page;
}

function ensureRootFrame(page, spec, log) {
  if (!isObject(spec.target) || typeof spec.target.frameName !== 'string') {
    throw new Error('target.frameName is required');
  }
  var frameName = spec.target.frameName.trim();
  var frame = page.children.find(function (child) {return child.type === 'FRAME' && child.name === frameName;});
  if (!frame) {
    frame = figma.createFrame();
    frame.name = frameName;
    page.appendChild(frame);
    log("Created root frame \u201C".concat(frameName, "\u201D"));
  } else {
    log("Reused existing frame \u201C".concat(frameName, "\u201D"));
  }
  ensureFrameAutoLayout(frame, 'VERTICAL');
  var layoutConfig = resolveRootAutoLayout(spec);
  applyAutoLayoutConfig(frame, layoutConfig);
  if (isObject(spec.target.frameSize)) {
    var _spec$target$frameSiz = spec.target.frameSize,w = _spec$target$frameSiz.w,h = _spec$target$frameSiz.h;
    if (Number.isFinite(w) && Number.isFinite(h) && typeof frame.resizeWithoutConstraints === 'function') {
      frame.resizeWithoutConstraints(w, h);
      log("Adjusted root frame size to ".concat(w, "\xD7").concat(h));
    }
  }
  if ('x' in frame) frame.x = 0;
  if ('y' in frame) frame.y = 0;
  if (isObject(spec.meta) && typeof spec.meta.id === 'string') {
    try {
      frame.setPluginData('relay:taskId', spec.meta.id);
    } catch (e) {

      // ignore plugin data issues
    }}
  applyTokensToNode(frame, spec.tokens, { scope: 'root' });
  return frame;
}

function resolveSectionGrid(section, spec) {var _spec$grid;
  if (!isObject(section)) return null;
  var layoutValue = section.layout || section.gridLayout || section.grid;
  var layoutString =
  typeof layoutValue === 'string' ?
  layoutValue :
  typeof (layoutValue === null || layoutValue === void 0 ? void 0 : layoutValue.type) === 'string' ?
  layoutValue.type :
  null;
  if (!layoutString || !/^grid-(\d+)/i.test(layoutString)) return null;
  var match = layoutString.match(/grid-(\d+)/i);
  var columns = match ? parseInt(match[1], 10) : NaN;
  if (!Number.isFinite(columns) || columns <= 0) return null;
  var gap = Number.isFinite(section.gap) ?
  section.gap :
  Number.isFinite(section.gridGap) ?
  section.gridGap :
  Number.isFinite(spec === null || spec === void 0 || (_spec$grid = spec.grid) === null || _spec$grid === void 0 ? void 0 : _spec$grid.gap) ?
  spec.grid.gap :
  0;
  return { columns: columns, gap: gap };
}

function ensureGridStructure(sectionNode, section, spec, log) {
  var gridInfo = resolveSectionGrid(section, spec);
  if (!gridInfo) return;
  var columns = gridInfo.columns,gap = gridInfo.gap;

  var containerId = 'relay:gridContainer';
  var container = sectionNode.children.find(function (child) {
    if (child.type !== 'FRAME') return false;
    try {
      return child.getPluginData(containerId) === '1';
    } catch (e) {
      return false;
    }
  });
  if (!container) {
    container = figma.createFrame();
    container.name = "".concat(section.name || sectionNode.name, " \xB7 Grid");
    sectionNode.appendChild(container);
    try {
      container.setPluginData(containerId, '1');
    } catch (e) {}
    log("Created grid container for section \u201C".concat(sectionNode.name, "\u201D with ").concat(columns, " columns"));
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

  var columnPluginKey = 'relay:gridColumnIndex';
  var desiredColumns = [];var _loop = function _loop(i)
  {
    var column = container.children.find(function (child) {
      if (child.type !== 'FRAME') return false;
      try {
        var data = child.getPluginData(columnPluginKey);
        return Number.parseInt(data || '', 10) === i;
      } catch (e) {
        return false;
      }
    });
    if (!column) {
      column = figma.createFrame();
      column.name = "Column ".concat(i + 1);
      container.appendChild(column);
      try {
        column.setPluginData(columnPluginKey, String(i));
      } catch (e) {}
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
  };for (var i = 0; i < columns; i += 1) {_loop(i);}

  desiredColumns.forEach(function (column, index) {
    if (column.parent === container) {
      container.insertChild(index, column);
    }
  });

  var toRemove = container.children.filter(function (child) {return !desiredColumns.includes(child);});var _iterator2 = _createForOfIteratorHelper(
      toRemove),_step2;try {for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {var extra = _step2.value;
      try {
        extra.remove();
      } catch (e) {}
    }} catch (err) {_iterator2.e(err);} finally {_iterator2.f();}
}

function ensureSectionFrame(rootFrame, spec, section, log) {
  if (!section || typeof section.name !== 'string') {
    throw new Error('Every section requires a name');
  }
  var sectionName = section.name.trim();
  var frame = rootFrame.children.find(function (child) {return child.type === 'FRAME' && child.name === sectionName;});
  if (!frame) {
    frame = figma.createFrame();
    frame.name = sectionName;
    rootFrame.appendChild(frame);
    log("Created section \u201C".concat(sectionName, "\u201D"));
  } else {
    log("Updated section \u201C".concat(sectionName, "\u201D"));
  }
  ensureFrameAutoLayout(frame, 'VERTICAL');
  var layoutConfig = resolveSectionAutoLayout(spec, section);
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
  } catch (e) {}
  applyTokensToNode(frame, spec.tokens, {
    type: section.type,
    name: sectionName,
    section: section
  });
  ensureGridStructure(frame, section, spec, log);
  return frame;
}function

runBuild(_x) {return _runBuild.apply(this, arguments);}function _runBuild() {_runBuild = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(spec) {var logs, log, page, rootFrame, sections, sectionFrames, _iterator4, _step4, section, frame, timestamp;return _regenerator().w(function (_context2) {while (1) switch (_context2.n) {case 0:
          logs = [];
          log = function log(entry) {
            logs.push("[build] ".concat(entry));
          };if (!(
          !isObject(spec.meta) || !isObject(spec.target))) {_context2.n = 1;break;}throw (
            new Error('TaskSpec meta/target are required'));case 1:

          page = ensurePage(spec.target.pageName, log);
          rootFrame = ensureRootFrame(page, spec, log);
          sections = Array.isArray(spec.sections) ? spec.sections : [];
          sectionFrames = [];_iterator4 = _createForOfIteratorHelper(
            sections);try {for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {section = _step4.value;
              frame = ensureSectionFrame(rootFrame, spec, section, log);
              sectionFrames.push(frame);
            }} catch (err) {_iterator4.e(err);} finally {_iterator4.f();}
          sectionFrames.forEach(function (frame, index) {
            if (frame.parent === rootFrame) {
              rootFrame.insertChild(index, frame);
            }
          });
          log("Processed ".concat(sectionFrames.length, " sections"));
          timestamp = new Date().toISOString();
          try {
            rootFrame.setPluginData('relay:lastBuildAt', timestamp);
          } catch (e) {}return _context2.a(2,
          {
            page: page,
            rootFrame: rootFrame,
            sections: sectionFrames,
            logs: logs
          });}}, _callee2);}));return _runBuild.apply(this, arguments);}


function extractBounds(node) {
  var fallback = { x: 0, y: 0, width: 0, height: 0 };
  var box = node.absoluteRenderBounds || node.absoluteBoundingBox || fallback;
  return {
    x: Number.isFinite(box.x) ? box.x : 0,
    y: Number.isFinite(box.y) ? box.y : 0,
    w: Number.isFinite(box.width) ? box.width : 0,
    h: Number.isFinite(box.height) ? box.height : 0
  };
}

function extractAutoLayout(node) {
  if (!('layoutMode' in node)) return null;
  var padding = {
    t: 'paddingTop' in node && Number.isFinite(node.paddingTop) ? node.paddingTop : 0,
    r: 'paddingRight' in node && Number.isFinite(node.paddingRight) ? node.paddingRight : 0,
    b: 'paddingBottom' in node && Number.isFinite(node.paddingBottom) ? node.paddingBottom : 0,
    l: 'paddingLeft' in node && Number.isFinite(node.paddingLeft) ? node.paddingLeft : 0
  };
  return {
    layoutMode: node.layoutMode,
    itemSpacing: Number.isFinite(node.itemSpacing) ? node.itemSpacing : null,
    padding: padding
  };
}

function extractPaintStyle(paints) {
  if (!Array.isArray(paints) || paints.length === 0) return null;
  var paint = paints[0];
  if (!isObject(paint)) return null;
  if (paint.type === 'SOLID') {
    var color = isObject(paint.color) ? paint.color : { r: 0, g: 0, b: 0 };
    return {
      type: 'SOLID',
      color: {
        r: Number.isFinite(color.r) ? color.r : 0,
        g: Number.isFinite(color.g) ? color.g : 0,
        b: Number.isFinite(color.b) ? color.b : 0
      },
      opacity: Number.isFinite(paint.opacity) ? paint.opacity : 1
    };
  }
  return { type: paint.type || 'UNKNOWN' };
}

function extractStyles(node) {
  var styles = {};
  if ('fills' in node) {
    var fill = extractPaintStyle(node.fills);
    if (fill) styles.fill = fill;
  }
  if ('strokes' in node) {
    var stroke = extractPaintStyle(node.strokes);
    if (stroke) styles.stroke = stroke;
  }
  if (node.type === 'TEXT') {
    var fontName = node.fontName;
    if (fontName && fontName !== figma.mixed) {
      styles.fontFamily = fontName.family;
      styles.fontStyle = fontName.style;
    }
    var fontSize = node.fontSize;
    if (fontSize && fontSize !== figma.mixed) {
      styles.fontSize = fontSize;
    }
    var lineHeight = node.lineHeight;
    if (lineHeight && lineHeight !== figma.mixed) {
      styles.lineHeight = lineHeight;
    }
  }
  return styles;
}

function extractStyleIds(node) {
  var result = {};
  var assign = function assign(prop) {
    if (prop in node) {
      var value = node[prop];
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
    var bindings = node.boundVariables;
    if (!isObject(bindings)) return null;
    var result = {};
    for (var _i6 = 0, _Object$entries2 = Object.entries(bindings); _i6 < _Object$entries2.length; _i6++) {var _Object$entries2$_i = _slicedToArray(_Object$entries2[_i6], 2),key = _Object$entries2$_i[0],value = _Object$entries2$_i[1];
      if (typeof value === 'string' && value) {
        result[key] = value;
      }
    }
    return Object.keys(result).length ? result : null;
  } catch (e) {
    return null;
  }
}

function extractConstraints(node) {
  if (!('constraints' in node) || !isObject(node.constraints)) return null;
  var _node$constraints = node.constraints,horizontal = _node$constraints.horizontal,vertical = _node$constraints.vertical;
  return { horizontal: horizontal, vertical: vertical };
}

function resolveSectionName(node, rootFrame) {
  var current = node;
  while (current && current !== rootFrame) {
    if (current.parent === rootFrame) {
      return current.name || null;
    }
    current = current.parent;
  }
  return null;
}

function collectNode(node, rootFrame) {
  var styleIds = extractStyleIds(node);
  var result = {
    id: node.id,
    name: node.name || '',
    type: node.type,
    absBounds: extractBounds(node),
    autoLayout: extractAutoLayout(node),
    styles: extractStyles(node),
    variables: extractVariables(node),
    constraints: extractConstraints(node),
    section: resolveSectionName(node, rootFrame)
  };
  if (styleIds) {
    Object.assign(result, styleIds);
  }
  return result;
}

function computeDeviationSummary(spec, rootFrame, logs) {var _spec$acceptance, _spec$acceptance2;
  var sections = Array.isArray(spec.sections) ? spec.sections : [];
  var tolerance = Number.isFinite((_spec$acceptance = spec.acceptance) === null || _spec$acceptance === void 0 ? void 0 : _spec$acceptance.maxSpacingDeviation) ?
  spec.acceptance.maxSpacingDeviation :
  2;
  var deviations = [];
  var warnings = [];
  if ((_spec$acceptance2 = spec.acceptance) !== null && _spec$acceptance2 !== void 0 && _spec$acceptance2.checkAutoLayout && rootFrame.layoutMode !== 'VERTICAL') {
    warnings.push('Root frame is not using VERTICAL auto layout');
  }var _iterator3 = _createForOfIteratorHelper(
      sections),_step3;try {var _loop2 = function _loop2() {var section = _step3.value;
      var sectionNode = rootFrame.children.find(
        function (child) {return child.type === 'FRAME' && child.name === section.name;}
      );
      if (!sectionNode) {
        warnings.push("Section \u201C".concat(section.name, "\u201D not found on canvas"));return 1; // continue

      }
      var expected = resolveSectionAutoLayout(spec, section);
      var actualSpacing = Number.isFinite(sectionNode.itemSpacing) ? sectionNode.itemSpacing : null;
      if (Number.isFinite(expected.itemSpacing) && actualSpacing != null) {
        var delta = actualSpacing - expected.itemSpacing;
        if (Math.abs(delta) > tolerance) {
          deviations.push({
            section: section.name,
            property: 'itemSpacing',
            expected: expected.itemSpacing,
            actual: actualSpacing,
            delta: delta
          });
          warnings.push("Spacing deviation in \u201C".concat(section.name, "\u201D: \u0394=").concat(delta.toFixed(2), "px"));
        }
      }
      var expectedPadding = normalizePadding(expected.padding || section.padding || null);
      if (expectedPadding) {
        var actualPadding = {
          top: Number.isFinite(sectionNode.paddingTop) ? sectionNode.paddingTop : 0,
          right: Number.isFinite(sectionNode.paddingRight) ? sectionNode.paddingRight : 0,
          bottom: Number.isFinite(sectionNode.paddingBottom) ? sectionNode.paddingBottom : 0,
          left: Number.isFinite(sectionNode.paddingLeft) ? sectionNode.paddingLeft : 0
        };
        for (var _i7 = 0, _arr = ['top', 'right', 'bottom', 'left']; _i7 < _arr.length; _i7++) {var side = _arr[_i7];
          var _delta = actualPadding[side] - expectedPadding[side];
          if (Math.abs(_delta) > tolerance) {
            deviations.push({
              section: section.name,
              property: "padding".concat(side[0].toUpperCase()).concat(side.slice(1)),
              expected: expectedPadding[side],
              actual: actualPadding[side],
              delta: _delta
            });
            warnings.push("Padding deviation (".concat(
              side, ") in \u201C").concat(section.name, "\u201D: \u0394=").concat(_delta.toFixed(2), "px")
            );
          }
        }
      }
      var gridInfo = resolveSectionGrid(section, spec);
      if (gridInfo && Number.isFinite(gridInfo.columns)) {
        var containerId = 'relay:gridContainer';
        var container = null;
        if (Array.isArray(sectionNode.children)) {
          container = sectionNode.children.find(function (child) {
            if (child.type !== 'FRAME') return false;
            try {
              return child.getPluginData(containerId) === '1';
            } catch (e) {
              return false;
            }
          }) || null;
          if (!container) {
            container = sectionNode.children.find(
              function (child) {return child.type === 'FRAME' && /·\s*Grid$/i.test(child.name || '');}
            );
          }
        }
        var actualColumns = 0;
        if (container && 'children' in container && Array.isArray(container.children)) {
          actualColumns = container.children.filter(function (child) {return child.type === 'FRAME';}).length;
        }
        if (actualColumns !== gridInfo.columns) {
          warnings.push("Grid mismatch in \u201C".concat(
            section.name, "\u201D: expected ").concat(gridInfo.columns, " columns, found ").concat(actualColumns)
          );
        }
      }
    };for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {if (_loop2()) continue;}} catch (err) {_iterator3.e(err);} finally {_iterator3.f();}
  if (deviations.length) {
    logs.push("[export] Detected ".concat(deviations.length, " layout deviations"));
  }
  return { deviations: deviations, warnings: warnings };
}function

runExport(_x2) {return _runExport.apply(this, arguments);}function _runExport() {_runExport = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(spec) {var logs, log, page, frame, nodes, _visit, deviationSummary;return _regenerator().w(function (_context3) {while (1) switch (_context3.n) {case 0:
          logs = [];
          log = function log(entry) {return logs.push("[export] ".concat(entry));};if (!(
          !isObject(spec.target) || typeof spec.target.pageName !== 'string')) {_context3.n = 1;break;}throw (
            new Error('target.pageName is required for export'));case 1:

          page = figma.root.children.find(
            function (node) {return node.type === 'PAGE' && node.name === spec.target.pageName.trim();}
          );if (
          page) {_context3.n = 2;break;}throw (
            new Error("Page \u201C".concat(spec.target.pageName, "\u201D not found")));case 2:

          figma.currentPage = page;if (!(
          typeof spec.target.frameName !== 'string')) {_context3.n = 3;break;}throw (
            new Error('target.frameName is required for export'));case 3:

          frame = page.children.find(
            function (child) {return child.type === 'FRAME' && child.name === spec.target.frameName.trim();}
          );if (
          frame) {_context3.n = 4;break;}throw (
            new Error("Frame \u201C".concat(spec.target.frameName, "\u201D not found on page \u201C").concat(page.name, "\u201D")));case 4:

          nodes = [];
          _visit = function visit(node) {
            nodes.push(collectNode(node, frame));
            if ('children' in node && Array.isArray(node.children)) {var _iterator5 = _createForOfIteratorHelper(
                  node.children),_step5;try {for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {var child = _step5.value;
                  _visit(child);
                }} catch (err) {_iterator5.e(err);} finally {_iterator5.f();}
            }
          };
          _visit(frame);
          log("Collected ".concat(nodes.length, " nodes from \u201C").concat(frame.name, "\u201D"));
          deviationSummary = computeDeviationSummary(spec, frame, logs);return _context3.a(2,
          {
            exportSpec: {
              meta: _objectSpread(_objectSpread({}, spec.meta), {}, { exportedAt: new Date().toISOString() }),
              target: spec.target,
              summary: {
                sections: Array.isArray(spec.sections) ? spec.sections.length : 0,
                warnings: deviationSummary.warnings,
                deviations: deviationSummary.deviations
              },
              document: {
                rootId: frame.id,
                pageId: page.id,
                nodes: nodes
              },
              logs: logs
            },
            frame: frame,
            logs: logs
          });}}, _callee3);}));return _runExport.apply(this, arguments);}function


maybeExportPreview() {return _maybeExportPreview.apply(this, arguments);}function _maybeExportPreview() {_maybeExportPreview = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {var currentPage, selection, exportNode, _iterator6, _step6, candidate, bytes, _t2, _t3;return _regenerator().w(function (_context4) {while (1) switch (_context4.p = _context4.n) {case 0:_context4.p = 0;

          currentPage = figma.currentPage;
          selection =
          currentPage && Array.isArray(currentPage.selection) ? currentPage.selection : [];
          exportNode = null;_iterator6 = _createForOfIteratorHelper(
            selection);_context4.p = 1;_iterator6.s();case 2:if ((_step6 = _iterator6.n()).done) {_context4.n = 4;break;}candidate = _step6.value;if (!(
          candidate && typeof candidate.exportAsync === 'function')) {_context4.n = 3;break;}
          exportNode = candidate;return _context4.a(3, 4);case 3:_context4.n = 2;break;case 4:_context4.n = 6;break;case 5:_context4.p = 5;_t2 = _context4.v;_iterator6.e(_t2);case 6:_context4.p = 6;_iterator6.f();return _context4.f(6);case 7:



          if (!exportNode && currentPage && typeof currentPage.exportAsync === 'function') {
            exportNode = currentPage;
          }if (!(
          exportNode && typeof exportNode.exportAsync === 'function')) {_context4.n = 9;break;}_context4.n = 8;return (
            exportNode.exportAsync({
              format: 'PNG',
              constraint: { type: 'SCALE', value: 1 }
            }));case 8:bytes = _context4.v;if (!(
          bytes && bytes.length > 0)) {_context4.n = 9;break;}return _context4.a(2,
          {
            contentType: 'image/png',
            base64: figma.base64Encode(bytes),
            size: bytes.length
          });case 9:_context4.n = 11;break;case 10:_context4.p = 10;_t3 = _context4.v;return _context4.a(2,



          { error: _t3 && _t3.message ? _t3.message : String(_t3) });case 11:return _context4.a(2,

          null);}}, _callee4, null, [[1, 5, 6, 7], [0, 10]]);}));return _maybeExportPreview.apply(this, arguments);}


figma.ui.onmessage = /*#__PURE__*/function () {var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(msg) {var spec, _spec, _yield$runBuild, page, rootFrame, sections, logs, _spec2, _yield$runExport, exportSpec, _logs, previewResult, previewPayload, previewError, _t;return _regenerator().w(function (_context) {while (1) switch (_context.p = _context.n) {case 0:_context.p = 0;if (!(

          msg.type === 'validate')) {_context.n = 3;break;}
          spec = safeParseJSON(msg.taskSpec);if (
          spec) {_context.n = 1;break;}return _context.a(2,
          figma.ui.postMessage({ type: 'validate:error', error: 'Invalid JSON' }));case 1:if (!(

          !spec.meta || !spec.target)) {_context.n = 2;break;}return _context.a(2,
          figma.ui.postMessage({ type: 'validate:error', error: 'Missing meta/target' }));case 2:

          figma.ui.postMessage({ type: 'validate:ok' });_context.n = 11;break;case 3:if (!(
          msg.type === 'build')) {_context.n = 6;break;}
          _spec = safeParseJSON(msg.taskSpec);if (
          _spec) {_context.n = 4;break;}return _context.a(2,
          figma.ui.postMessage({ type: 'error', error: 'Invalid JSON' }));case 4:_context.n = 5;return (

            runBuild(_spec));case 5:_yield$runBuild = _context.v;page = _yield$runBuild.page;rootFrame = _yield$runBuild.rootFrame;sections = _yield$runBuild.sections;logs = _yield$runBuild.logs;
          figma.ui.postMessage({
            type: 'build:ok',
            sections: sections.length,
            pageId: page.id,
            frameId: rootFrame.id,
            logs: logs
          });_context.n = 11;break;case 6:if (!(
          msg.type === 'export')) {_context.n = 10;break;}
          _spec2 = safeParseJSON(msg.taskSpec);if (
          _spec2) {_context.n = 7;break;}return _context.a(2,
          figma.ui.postMessage({ type: 'error', error: 'Invalid JSON' }));case 7:_context.n = 8;return (

            runExport(_spec2));case 8:_yield$runExport = _context.v;exportSpec = _yield$runExport.exportSpec;_logs = _yield$runExport.logs;_context.n = 9;return (
            maybeExportPreview());case 9:previewResult = _context.v;
          previewPayload = previewResult && !previewResult.error ? previewResult : null;
          previewError = previewResult && previewResult.error ? previewResult.error : null;
          figma.ui.postMessage({
            type: 'export:ok',
            exportSpec: exportSpec,
            filename: 'ExportSpec.json',
            preview: previewPayload,
            previewError: previewError,
            logs: _logs
          });_context.n = 11;break;case 10:
          if (msg.type === 'close') {
            figma.closePlugin();
          }case 11:_context.n = 13;break;case 12:_context.p = 12;_t = _context.v;

          figma.ui.postMessage({ type: 'error', error: String(_t && _t.message || _t) });case 13:return _context.a(2);}}, _callee, null, [[0, 12]]);}));return function (_x3) {return _ref.apply(this, arguments);};}();
