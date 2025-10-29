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

function validateTaskSpecSchema(value) {
  var errors = [];
  var addError = function addError(path, message) {
    errors.push({ path: path, message: message });
  };
  var isFiniteNumber = function isFiniteNumber(input) {
    return typeof input === 'number' && Number.isFinite(input);
  };
  if (!isObject(value)) {
    addError('/', 'TaskSpec must be an object');
    return { valid: false, errors: errors };
  }

  var meta = value.meta,
      target = value.target,
      grid = value.grid,
      sections = value.sections,
      acceptance = value.acceptance;

  if (!isObject(meta)) {
    addError('/meta', 'meta must be an object');
  } else {
    if (typeof meta.specVersion !== 'string') {
      addError('/meta/specVersion', 'specVersion must be a string');
    }
    if (typeof meta.id !== 'string') {
      addError('/meta/id', 'id must be a string');
    }
    if (Object.prototype.hasOwnProperty.call(meta, 'inferred') && typeof meta.inferred !== 'boolean') {
      addError('/meta/inferred', 'inferred must be a boolean');
    }
  }

  if (!isObject(target)) {
    addError('/target', 'target must be an object');
  } else {
    if (typeof target.fileId !== 'string') {
      addError('/target/fileId', 'fileId must be a string');
    }
    if (typeof target.pageName !== 'string') {
      addError('/target/pageName', 'pageName must be a string');
    }
    if (typeof target.frameName !== 'string') {
      addError('/target/frameName', 'frameName must be a string');
    }
    if (!isObject(target.frameSize)) {
      addError('/target/frameSize', 'frameSize must be an object');
    } else {
      var frameSize = target.frameSize;
      if (!isFiniteNumber(frameSize.w) || frameSize.w < 1) {
        addError('/target/frameSize/w', 'w must be a number ≥ 1');
      }
      if (!isFiniteNumber(frameSize.h) || frameSize.h < 1) {
        addError('/target/frameSize/h', 'h must be a number ≥ 1');
      }
      var allowedFrameSizeKeys = new Set(['w', 'h']);
      Object.keys(frameSize).forEach(function (key) {
        if (!allowedFrameSizeKeys.has(key)) {
          addError('/target/frameSize/'.concat(key), 'Unknown property');
        }
      });
    }
  }

  if (!isObject(grid)) {
    addError('/grid', 'grid must be an object');
  } else {
    if (!isFiniteNumber(grid.container) || grid.container < 1) {
      addError('/grid/container', 'container must be a number ≥ 1');
    }
    if (!Number.isInteger(grid.columns) || grid.columns < 1) {
      addError('/grid/columns', 'columns must be an integer ≥ 1');
    }
    if (!isFiniteNumber(grid.gap) || grid.gap < 0) {
      addError('/grid/gap', 'gap must be a number ≥ 0');
    }
    if (!isFiniteNumber(grid.margins) || grid.margins < 0) {
      addError('/grid/margins', 'margins must be a number ≥ 0');
    }
  }

  if (!Array.isArray(sections)) {
    addError('/sections', 'sections must be an array');
  } else if (sections.length === 0) {
    addError('/sections', 'sections must contain at least one item');
  } else {
    var allowedTypes = new Set(['hero', 'features', 'gallery', 'cta', 'footer', 'custom']);
    sections.forEach(function (section, index) {
      var basePath = '/sections/'.concat(index);
      if (!isObject(section)) {
        addError(basePath, 'section must be an object');
        return;
      }
      if (typeof section.type !== 'string' || !allowedTypes.has(section.type)) {
        addError(basePath.concat('/type'), 'type must be one of hero, features, gallery, cta, footer, custom');
      }
      if (typeof section.name !== 'string') {
        addError(basePath.concat('/name'), 'name must be a string');
      }
    });
  }

  if (acceptance != null) {
    if (!isObject(acceptance)) {
      addError('/acceptance', 'acceptance must be an object');
    } else {
      if (Object.prototype.hasOwnProperty.call(acceptance, 'maxSpacingDeviation') && !isFiniteNumber(acceptance.maxSpacingDeviation)) {
        addError('/acceptance/maxSpacingDeviation', 'maxSpacingDeviation must be a number');
      }
      if (Object.prototype.hasOwnProperty.call(acceptance, 'checkAutoLayout') && typeof acceptance.checkAutoLayout !== 'boolean') {
        addError('/acceptance/checkAutoLayout', 'checkAutoLayout must be a boolean');
      }
    }
  }

  return { valid: errors.length === 0, errors: errors };
}

function roundToInt(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.round(value);
}

function truncateText(value) {
  var limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 160;
  if (typeof value !== 'string') return '';
  var trimmed = value.trim();
  if (trimmed.length <= limit) return trimmed;
  return "".concat(trimmed.slice(0, limit - 1), "\u2026");
}

function sanitizeFilename(value) {
  var fallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'ExportSpec';
  if (typeof value !== 'string') return fallback;
  var trimmed = value.trim();
  if (!trimmed) return fallback;
  var cleaned = trimmed.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/\.+$/, '');
  if (!cleaned) return fallback;
  if (cleaned.length > 120) {
    cleaned = cleaned.slice(0, 120);
  }
  return cleaned;
}

function toHex(value) {
  var hex = value.toString(16);
  if (hex.length === 1) return "0".concat(hex);
  if (hex.length === 0) return '00';
  return hex;
}

function clampColorComponent(value) {
  if (!Number.isFinite(value)) return 0;
  var scaled = Math.round(value * 255);
  if (scaled < 0) scaled = 0;
  if (scaled > 255) scaled = 255;
  return scaled;
}

function convertSolidPaintToColor(paint) {
  if (!paint || paint.type !== 'SOLID' || !isObject(paint.color)) return null;
  var color = paint.color;
  var opacity = typeof paint.opacity === 'number' && Number.isFinite(paint.opacity) ? paint.opacity : 1;
  if (opacity < 0) opacity = 0;
  if (opacity > 1) opacity = 1;
  var r = clampColorComponent(color.r);
  var g = clampColorComponent(color.g);
  var b = clampColorComponent(color.b);
  var alpha = Math.round(opacity * 255);
  var hex = "#".concat(toHex(r)).concat(toHex(g)).concat(toHex(b));
  if (alpha < 255) {
    hex += toHex(alpha);
  }
  var roundedOpacity = Math.round(opacity * 100) / 100;
  return {
    hex: hex,
    rgba: "rgba(".concat(r, ", ").concat(g, ", ").concat(b, ", ").concat(roundedOpacity, ")"),
    opacity: opacity
  };
}

function extractNodeSolidFill(node, warnings, context) {
  if (!node || !('fills' in node)) return null;
  var fills = node.fills;
  if (fills == null) return null;
  if (fills === figma.mixed) {
    if (warnings) warnings.push("".concat(context, ": \u0441\u043c\u0435\u0448\u0430\u043d\u043d\u044b\u0435 fills"));
    return null;
  }
  if (!Array.isArray(fills) || fills.length === 0) return null;
  var visible = [];
  for (var i = 0; i < fills.length; i++) {
    var paint = fills[i];
    if (paint && paint.visible !== false) {
      visible.push(paint);
    }
  }
  if (visible.length === 0) return null;
  var solid = null;
  for (var j = 0; j < visible.length; j++) {
    if (visible[j].type === 'SOLID') {
      solid = visible[j];
      break;
    }
  }
  if (!solid) {
    if (warnings) warnings.push("".concat(context, ": \u0431\u0430\u0437\u043e\u0432\u0430\u044f \u0437\u0430\u043b\u0438\u0432\u043a\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430"));
    return null;
  }
  if (visible.length > 1 && warnings) {
    warnings.push("".concat(context, ": \u043d\u0435\u0441\u043a\u043e\u043b\u044c\u043a\u043e \u0437\u0430\u043b\u0438\u0432\u043e\u043a, \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u043c \u043f\u0435\u0440\u0432\u0443\u044e SOLID"));
  }
  return convertSolidPaintToColor(solid);
}

function normalizeLineHeightValue(raw, warnings, context) {
  if (raw === figma.mixed) {
    if (warnings) warnings.push("".concat(context, ": \u0441\u043c\u0435\u0448\u0430\u043d\u043d\u044b\u0439 lineHeight"));
    return null;
  }
  if (raw === 'AUTO') {
    return { value: null, unit: 'AUTO' };
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return { value: Math.round(raw), unit: 'PIXELS' };
  }
  if (isObject(raw)) {
    var unit = typeof raw.unit === 'string' ? raw.unit : null;
    var value = Number.isFinite(raw.value) ? Math.round(raw.value) : null;
    return { value: value, unit: unit };
  }
  return null;
}

function analyzeTextNode(textNode, sectionWarnings, context) {
  if (!textNode) return null;
  var characters = typeof textNode.characters === 'string' ? textNode.characters : '';
  var info = {
    id: textNode.id,
    name: textNode.name || null,
    characters: truncateText(characters, 200),
    characterCount: characters.length,
    fontFamily: null,
    fontStyle: null,
    fontSize: null,
    lineHeight: null,
    fill: null
  };
  var label = context || 'Text';
  try {
    var fontName = textNode.fontName;
    if (fontName === figma.mixed) {
      if (typeof textNode.getRangeFontName === 'function' && characters.length > 0) {
        try {
          var sampleFont = textNode.getRangeFontName(0, 1);
          if (sampleFont && sampleFont !== figma.mixed) {
            info.fontFamily = sampleFont.family || null;
            info.fontStyle = sampleFont.style || null;
          }
        } catch (err) {
          if (sectionWarnings) sectionWarnings.push("".concat(label, ": \u0448\u0440\u0438\u0444\u0442: ").concat(err && err.message ? err.message : err));
        }
      } else if (sectionWarnings) {
        sectionWarnings.push("".concat(label, ": \u0448\u0440\u0438\u0444\u0442 \u043d\u0435 \u0441\u0447\u0438\u0442\u0430\u043d"));
      }
    } else if (isObject(fontName)) {
      info.fontFamily = fontName.family || null;
      info.fontStyle = fontName.style || null;
    }
  } catch (err) {
    if (sectionWarnings) sectionWarnings.push("".concat(label, ": \u0448\u0440\u0438\u0444\u0442: ").concat(err && err.message ? err.message : err));
  }
  try {
    if (textNode.fontSize === figma.mixed) {
      if (typeof textNode.getRangeFontSize === 'function' && characters.length > 0) {
        var fontSize = textNode.getRangeFontSize(0, 1);
        if (Number.isFinite(fontSize)) {
          info.fontSize = Math.round(fontSize);
        }
      }
    } else if (Number.isFinite(textNode.fontSize)) {
      info.fontSize = Math.round(textNode.fontSize);
    }
  } catch (err) {
    if (sectionWarnings) sectionWarnings.push("".concat(label, ": fontSize: ").concat(err && err.message ? err.message : err));
  }
  var lineHeight = null;
  try {
    lineHeight = textNode.lineHeight;
    if (lineHeight === figma.mixed && typeof textNode.getRangeLineHeight === 'function' && characters.length > 0) {
      try {
        lineHeight = textNode.getRangeLineHeight(0, 1);
      } catch (err) {
        if (sectionWarnings) sectionWarnings.push("".concat(label, ": lineHeight: ").concat(err && err.message ? err.message : err));
      }
    }
  } catch (err) {
    if (sectionWarnings) sectionWarnings.push("".concat(label, ": lineHeight: ").concat(err && err.message ? err.message : err));
  }
  info.lineHeight = normalizeLineHeightValue(lineHeight, sectionWarnings, label);
  info.fill = extractNodeSolidFill(textNode, sectionWarnings, "".concat(label, " — \u0446\u0432\u0435\u0442"));
  return info;
}

function collectTextSamples(sectionNode, sectionWarnings) {
  var collected = [];
  if (!sectionNode || !('children' in sectionNode) || !Array.isArray(sectionNode.children)) return collected;
  var queue = sectionNode.children.slice();
  while (queue.length && collected.length < 12) {
    var current = queue.shift();
    if (!current || current.visible === false) continue;
    if (current.type === 'TEXT') {
      var textInfo = analyzeTextNode(current, sectionWarnings, "\u0422\u0435\u043a\u0441\u0442 \u201C".concat(current.name || '', "\u201D"));
      if (textInfo) collected.push(textInfo);
    }
    if ('children' in current && Array.isArray(current.children)) {
      for (var i = 0; i < current.children.length; i++) {
        queue.push(current.children[i]);
      }
    }
  }
  if (collected.length <= 3) return collected;
  collected.sort(function (a, b) {
    var sizeA = Number.isFinite(a && a.fontSize) ? a.fontSize : 0;
    var sizeB = Number.isFinite(b && b.fontSize) ? b.fontSize : 0;
    if (sizeB !== sizeA) return sizeB - sizeA;
    var lenA = Number.isFinite(a && a.characterCount) ? a.characterCount : 0;
    var lenB = Number.isFinite(b && b.characterCount) ? b.characterCount : 0;
    return lenB - lenA;
  });
  return collected.slice(0, 3);
}

function detectGridSection(sectionNode, sectionWarnings) {
  if (!sectionNode || sectionNode.layoutMode !== 'HORIZONTAL') return null;
  if (!Array.isArray(sectionNode.children) || sectionNode.children.length === 0) return null;
  var items = [];
  for (var i = 0; i < sectionNode.children.length; i++) {
    var child = sectionNode.children[i];
    if (!child || child.visible === false) continue;
    items.push(child);
  }
  if (items.length < 2) return null;
  var baseWidth = Number.isFinite(items[0].width) ? items[0].width : null;
  if (baseWidth == null) return null;
  var tolerance = 2;
  for (var j = 1; j < items.length; j++) {
    var currentWidth = Number.isFinite(items[j].width) ? items[j].width : null;
    if (currentWidth == null || Math.abs(currentWidth - baseWidth) > tolerance) {
      if (sectionWarnings) {
        sectionWarnings.push("\u0421\u0435\u043a\u0446\u0438\u044f \u201C".concat(sectionNode.name || '', "\u201D: \u0440\u0430\u0437\u043d\u0430\u044f \u0448\u0438\u0440\u0438\u043d\u0430 \u044d\u043b\u0435\u043c\u0435\u043d\u0442\u043e\u0432"));
      }
      return null;
    }
  }
  return {
    columns: items.length,
    gap: roundToInt(sectionNode.itemSpacing),
    columnWidth: roundToInt(baseWidth)
  };
}

function buildSectionInfo(sectionNode, index, warnings) {
  var sectionWarnings = [];
  var name = sectionNode.name || "Section ".concat(index + 1);
  var context = "\u0421\u0435\u043a\u0446\u0438\u044f \u201C".concat(name, "\u201D");
  if (typeof sectionNode.layoutMode !== 'string' || !sectionNode.layoutMode) {
    sectionWarnings.push("".concat(context, ": layoutMode \u043d\u0435 \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u0451\u043d"));
  }
  var padding = null;
  if ('paddingTop' in sectionNode || 'paddingRight' in sectionNode || 'paddingBottom' in sectionNode || 'paddingLeft' in sectionNode) {
    padding = {
      top: roundToInt(sectionNode.paddingTop),
      right: roundToInt(sectionNode.paddingRight),
      bottom: roundToInt(sectionNode.paddingBottom),
      left: roundToInt(sectionNode.paddingLeft)
    };
  }
  var info = {
    id: sectionNode.id,
    name: sectionNode.name || null,
    type: sectionNode.type,
    layoutMode: typeof sectionNode.layoutMode === 'string' ? sectionNode.layoutMode : null,
    padding: padding,
    itemSpacing: 'itemSpacing' in sectionNode ? roundToInt(sectionNode.itemSpacing) : null,
    size: { width: roundToInt(sectionNode.width), height: roundToInt(sectionNode.height) },
    fill: extractNodeSolidFill(sectionNode, sectionWarnings, "".concat(context, " — \u0444\u043e\u043d")),
    texts: collectTextSamples(sectionNode, sectionWarnings),
    grid: detectGridSection(sectionNode, sectionWarnings),
    warnings: sectionWarnings
  };
  if (sectionNode.counterAxisSizingMode) {
    info.counterAxisSizingMode = sectionNode.counterAxisSizingMode;
  }
  if (Array.isArray(sectionWarnings) && sectionWarnings.length && Array.isArray(warnings)) {
    for (var i = 0; i < sectionWarnings.length; i++) {
      warnings.push(sectionWarnings[i]);
    }
  }
  return info;
}

function collectDocumentNodes(frame) {
  var nodes = [];
  if (!frame) return nodes;
  var queue = [frame];
  while (queue.length) {
    var current = queue.shift();
    if (!current) continue;
    nodes.push(collectNode(current, frame));
    if ('children' in current && Array.isArray(current.children)) {
      for (var i = 0; i < current.children.length; i++) {
        queue.push(current.children[i]);
      }
    }
  }
  return nodes;
}

function buildImportFilename(frame, page) {
  var parts = ['ExportSpec'];
  if (page && typeof page.name === 'string' && page.name.trim()) {
    parts.push(sanitizeFilename(page.name, 'Page'));
  }
  if (frame && typeof frame.name === 'string' && frame.name.trim()) {
    parts.push(sanitizeFilename(frame.name, 'Frame'));
  }
  var base = parts.join(' - ');
  if (!/\.json$/i.test(base)) {
    base += '.json';
  }
  return base;
}

function getSelectionStateSummary() {
  var info = {
    count: 0,
    isSingleFrame: false,
    frameId: null,
    frameName: null,
    pageId: null,
    pageName: null,
    reason: ''
  };
  var currentPage = figma.currentPage;
  if (!currentPage) {
    info.reason = '\u0421\u0442\u0440\u0430\u043d\u0438\u0446\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430';
    return info;
  }
  var selection = currentPage.selection;
  var count = Array.isArray(selection) ? selection.length : 0;
  info.count = count;
  info.pageId = currentPage.id;
  info.pageName = currentPage.name || null;
  if (count === 0) {
    info.reason = '\u0412\u044b\u0434\u0435\u043b\u0435\u043d\u0438\u0435 \u043e\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442';
    return info;
  }
  if (count !== 1) {
    info.reason = '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u043e\u0432\u043d\u043e \u043e\u0434\u0438\u043d \u0444\u0440\u0435\u0439\u043c';
    return info;
  }
  var node = selection[0];
  if (!node || node.type !== 'FRAME') {
    info.reason = '\u0412\u044b\u0431\u0440\u0430\u043d \u043d\u0435 \u0444\u0440\u0435\u0439\u043c';
    return info;
  }
  info.isSingleFrame = true;
  info.frameId = node.id;
  info.frameName = node.name || null;
  info.reason = '';
  return info;
}

function notifySelectionState() {
  try {
    figma.ui.postMessage({ type: 'selection:update', selection: getSelectionStateSummary() });
  } catch (err) {}
}

function buildExportSpecFromFrame(frame) {
  if (!frame) throw new Error('Frame not found');
  var warnings = [];
  var page = frame.parent && frame.parent.type === 'PAGE' ? frame.parent : null;
  if (!page) {
    warnings.push('\u0421\u0442\u0440\u0430\u043d\u0438\u0446\u0430 \u0434\u043b\u044f \u0444\u0440\u0435\u0439\u043c\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430');
  }
  if (frame.layoutMode !== 'VERTICAL') {
    warnings.push('\u041a\u043e\u0440\u043d\u0435\u0432\u043e\u0439 \u0444\u0440\u0435\u0439\u043c \u043d\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442 VERTICAL Auto Layout');
  }
  var sections = [];
  var children = Array.isArray(frame.children) ? frame.children : [];
  if (children.length === 0) {
    warnings.push('\u0424\u0440\u0435\u0439\u043c \u043d\u0435 \u0441\u043e\u0434\u0435\u0440\u0436\u0438\u0442 \u0441\u0435\u043a\u0446\u0438\u0439');
  }
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (!child || child.visible === false) continue;
    if (child.type !== 'FRAME') {
      warnings.push("\u041f\u043e\u0442\u043e\u043c\u043e\u043a \u201C".concat(child.name || "#".concat(i + 1), "\u201D \u043d\u0435 FRAME \u0438 \u0431\u0443\u0434\u0435\u0442 \u043f\u0440\u043e\u043f\u0443\u0449\u0435\u043d"));
      continue;
    }
    sections.push(buildSectionInfo(child, i, warnings));
  }
  var nodes = collectDocumentNodes(frame);
  var pageId = page ? page.id : null;
  var exportSpec = {
    meta: {
      source: 'import-from-selection',
      importedAt: new Date().toISOString(),
      frameId: frame.id,
      frameName: frame.name || null,
      frameSize: { width: roundToInt(frame.width), height: roundToInt(frame.height) },
      layoutMode: typeof frame.layoutMode === 'string' ? frame.layoutMode : null
    },
    target: {
      pageId: pageId,
      pageName: page ? page.name : null,
      frameId: frame.id,
      frameName: frame.name || null
    },
    summary: {
      sections: sections.length,
      warnings: warnings.slice(),
      deviations: []
    },
    sections: sections,
    document: {
      rootId: frame.id,
      pageId: pageId,
      nodes: nodes
    },
    warnings: warnings.slice(),
    logs: []
  };
  var rootFill = extractNodeSolidFill(frame, warnings, '\u041a\u043e\u0440\u043d\u0435\u0432\u043e\u0439 \u0444\u0440\u0435\u0439\u043c — \u0444\u043e\u043d');
  if (rootFill) {
    exportSpec.meta.fill = rootFill;
  }
  exportSpec.summary.warnings = warnings.slice();
  exportSpec.warnings = warnings.slice();
  return {
    exportSpec: exportSpec,
    warnings: warnings,
    filename: buildImportFilename(frame, page)
  };
}

function handleImportFromSelectionMessage() {
  var selectionInfo = getSelectionStateSummary();
  if (!selectionInfo.isSingleFrame) {
    figma.ui.postMessage({
      type: 'import:error',
      error: selectionInfo.reason || '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u043e\u0432\u043d\u043e \u043e\u0434\u0438\u043d \u0444\u0440\u0435\u0439\u043c',
      selection: selectionInfo
    });
    return;
  }
  var currentPage = figma.currentPage;
  var selection = currentPage && Array.isArray(currentPage.selection) ? currentPage.selection : [];
  var frame = selection[0];
  if (!frame || frame.type !== 'FRAME') {
    figma.ui.postMessage({
      type: 'import:error',
      error: '\u0412\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0439 \u0443\u0437\u0435\u043b \u043d\u0435 \u044f\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u0444\u0440\u0435\u0439\u043c\u043e\u043c',
      selection: selectionInfo
    });
    return;
  }
  try {
    var result = buildExportSpecFromFrame(frame);
    figma.ui.postMessage({
      type: 'import:ok',
      exportSpec: result.exportSpec,
      warnings: result.warnings,
      filename: result.filename,
      selection: selectionInfo
    });
  } catch (err) {
    figma.ui.postMessage({
      type: 'import:error',
      error: err && err.message ? err.message : String(err),
      selection: selectionInfo
    });
  }
}

function clampUnit(value) {
  if (!Number.isFinite(value)) return null;
  var rounded = Math.round(value);
  return Math.max(-10000, Math.min(10000, rounded));
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

var BUILDER_PATH_KEY = 'relay:builderPath';

function safeGetPluginData(node, key) {
  try {
    return node.getPluginData(key) || '';
  } catch (e) {
    return '';
  }
}

function safeSetPluginData(node, key, value) {
  try {
    node.setPluginData(key, value != null ? String(value) : '');
  } catch (e) {}
}

function createNodeOfType(type) {
  switch (type) {
    case 'FRAME':
      return figma.createFrame();
    case 'TEXT':
      return figma.createText();
    case 'RECTANGLE':
      return figma.createRectangle();
    default:
      return figma.createFrame();
  }
}

function ensureBuilderNode(parent, options, context) {
  var path = options.path;
  var type = options.type;
  var name = options.name;
  var node = null;
  var childArray = Array.isArray(parent.children) ? parent.children : [];
  if (path) {
    node = childArray.find(function (child) {return safeGetPluginData(child, BUILDER_PATH_KEY) === path;});
  }
  if (!node && name) {
    node = childArray.find(function (child) {
      return child.name === name && !safeGetPluginData(child, BUILDER_PATH_KEY);
    });
  }
  var created = false;
  if (!node) {
    node = createNodeOfType(type);
    created = true;
    parent.appendChild(node);
  } else if (node.type !== type) {
    try {
      node.remove();
    } catch (e) {}
    node = createNodeOfType(type);
    created = true;
    parent.appendChild(node);
    if (context && context.report) {
      context.report.removed += 1;
    }
  }
  if (node.parent !== parent) {
    parent.appendChild(node);
  }
  if (name) {
    node.name = name;
  }
  if (path) {
    safeSetPluginData(node, BUILDER_PATH_KEY, path);
  }
  if (typeof options.setup === 'function') {
    options.setup(node, created);
  }
  if (context && context.report) {
    if (created) {
      context.report.created += 1;
    } else {
      context.report.updated += 1;
    }
  }
  if (context && typeof context.log === 'function' && options.logMessage) {
    context.log(options.logMessage, created ? 'info' : 'debug', { path: path, created: created });
  }
  return { node: node, created: created, path: path };
}

function reorderBuilderChildren(parent, orderedNodes) {
  orderedNodes.forEach(function (child, index) {
    if (child && child.parent === parent) {
      parent.insertChild(index, child);
    }
  });
}

function cleanupBuilderChildren(parent, expectedPaths, context) {
  var keep = new Set(expectedPaths);
  var removed = 0;
  Array.from(parent.children || []).forEach(function (child) {
    var path = safeGetPluginData(child, BUILDER_PATH_KEY);
    if (!path) return;
    if (!keep.has(path)) {
      try {
        child.remove();
        removed += 1;
      } catch (e) {}
    }
  });
  if (removed && context && context.report) {
    context.report.removed += removed;
  }
  if (removed && context && typeof context.log === 'function') {
    context.log("Removed ".concat(removed, " outdated node(s)"), 'info', { parent: parent.name });
  }
}

function ensureTextNode(parent, path, label, textValue, context, options) {
  options = options || {};
  return ensureBuilderNode(parent, {
    path: path,
    type: 'TEXT',
    name: label,
    setup: function setup(node, created) {
      if (context && context.fontName) {
        try {
          node.fontName = context.fontName;
        } catch (e) {}
      }
      if ('textAutoResize' in node) {
        node.textAutoResize = 'HEIGHT';
      }
      if (options.fontSize && Number.isFinite(options.fontSize)) {
        var size = clampUnit(options.fontSize);
        if (size != null) {
          node.fontSize = size;
        }
      }
      if (typeof textValue === 'string') {
        if (node.characters !== textValue) {
          node.characters = textValue;
        }
      } else if (textValue != null) {
        var str = String(textValue);
        if (node.characters !== str) {
          node.characters = str;
        }
      } else if (created) {
        node.characters = '';
      }
      if (options.fillColor) {
        applyFill(node, options.fillColor);
      }
      applyTokensToNode(node, context ? context.tokens : null, options.tokenContext || null);
    }
  }, context).node;
}

function resolveTokenColor(tokens, key) {
  if (!isObject(tokens) || !isObject(tokens.colors)) return null;
  var value = tokens.colors[key];
  return value != null ? value : null;
}

function addBuildWarning(context, message) {
  if (!context) return;
  if (context.report && Array.isArray(context.report.warnings)) {
    context.report.warnings.push(message);
  }
  if (typeof context.log === 'function') {
    context.log(message, 'warn');
  }
}

function ensureButton(parent, path, label, context, options) {
  options = options || {};
  var fillColor = options.fillColor || resolveTokenColor(context ? context.tokens : null, 'primary');
  var button = ensureBuilderNode(parent, {
    path: path,
    type: 'FRAME',
    name: options.name || label || 'Button',
    setup: function setup(node) {
      ensureFrameAutoLayout(node, 'HORIZONTAL');
      if ('primaryAxisSizingMode' in node) node.primaryAxisSizingMode = 'AUTO';
      if ('counterAxisSizingMode' in node) node.counterAxisSizingMode = 'AUTO';
      node.layoutGrow = 0;
      applyPadding(node, normalizePadding(options.padding != null ? options.padding : 12));
      if (fillColor) {
        applyFill(node, fillColor);
      }
      if ('cornerRadius' in node && Number.isFinite(options.cornerRadius)) {
        node.cornerRadius = clampUnit(options.cornerRadius);
      }
    }
  }, context).node;

  var textColor = options.textColor || resolveTokenColor(context ? context.tokens : null, 'onPrimary') || '#FFFFFF';
  var textNode = ensureTextNode(button, path + '/label', ''.concat(label, ' Label'), label || '', context, {
    fontSize: options.fontSize || 16,
    fillColor: textColor,
    tokenContext: options.tokenContext || null
  });
  reorderBuilderChildren(button, [textNode]);
  cleanupBuilderChildren(button, [path + '/label'], context);
  return button;
}

function collectFontFamilies(spec) {
  var families = [];
  if (isObject(spec === null || spec === void 0 ? void 0 : spec.tokens) && typeof spec.tokens.fontFamily === 'string') {
    families.push(spec.tokens.fontFamily);
  }
  if (isObject(spec === null || spec === void 0 ? void 0 : spec.target) && Array.isArray(spec.target.fonts)) {
    spec.target.fonts.forEach(function (family) {
      if (typeof family === 'string' && family.trim()) families.push(family.trim());
    });
  }
  families.push('Inter', 'Roboto');
  return families;
}

function buildFontName(family) {
  if (!family) return null;
  return { family: family, style: 'Regular' };
}

function ensureFontsForSpec(spec) {
  return _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {var families, unique, loadedFamily, warnings, _iterator5, _step5, family, fontName;return _regenerator().w(function (_context3) {while (1) switch (_context3.n) {case 0:
          families = collectFontFamilies(spec);
          unique = [];
          families.forEach(function (family) {
            if (typeof family !== 'string') return;
            var trimmed = family.trim();
            if (!trimmed) return;
            if (!unique.includes(trimmed)) unique.push(trimmed);
          });
          loadedFamily = null;
          warnings = [];
          fontName = null;_iterator5 = _createForOfIteratorHelper(
            unique);_context3.f(1);case 4:_context3.s();case 5:if ((_step5 = _context3.n()).done) {_context3.n = 12;break;}family = _step5.value;_context3.n = 6;return (
              figma.loadFontAsync(buildFontName(family)));case 6:_context3.n = 7;break;case 7:

            if (!loadedFamily) {
              loadedFamily = family;
            }_context3.n = 11;break;case 8:_context3.p = 8;_context3.t0 = _context3.v;

            warnings.push("Font \u201C".concat(family, "\u201D unavailable; falling back"));case 11:_context3.n = 5;break;case 12:_context3.f(1);case 13:
          fontName = buildFontName(loadedFamily);
          if (!loadedFamily) {
            loadedFamily = 'Roboto';
            fontName = buildFontName(loadedFamily);_context3.n = 16;return (
              figma.loadFontAsync(fontName));case 16:_context3.n = 17;break;case 17:_context3.p = 17;_context3.t1 = _context3.v;case 18:return _context3.a(0,
          {
            fontName: fontName,
            family: loadedFamily,
            warnings: warnings
          });case 19:case "end":return _context3.stop();}}, null, null, [[4, 13, 13, 13], [5, 8], [16, 17]]);
        }))();
}

function buildHeroSection(frame, section, basePath, context) {
  var nodes = [];
  var paths = [];
  var textColor = resolveTokenColor(context ? context.tokens : null, 'text');

  var headline = typeof section.headline === 'string' ? section.headline : section.title || section.name || null;
  if (headline) {
    var headlinePath = ''.concat(basePath, '/headline');
    nodes.push(ensureTextNode(frame, headlinePath, 'Hero Headline', headline, context, {
      fontSize: 48,
      fillColor: textColor,
      tokenContext: { type: section.type, role: 'headline', name: section.name }
    }));
    paths.push(headlinePath);
  }

  var subheading = typeof section.subheading === 'string' ? section.subheading : section.subtitle || section.description || null;
  if (subheading) {
    var subPath = ''.concat(basePath, '/subheading');
    nodes.push(ensureTextNode(frame, subPath, 'Hero Subheading', subheading, context, {
      fontSize: 20,
      fillColor: textColor,
      tokenContext: { type: section.type, role: 'subheading', name: section.name }
    }));
    paths.push(subPath);
  }

  var actions = [];
  if (typeof section.primaryAction === 'string') {
    actions.push({ label: section.primaryAction, variant: 'primary' });
  }
  if (typeof section.secondaryAction === 'string') {
    actions.push({ label: section.secondaryAction, variant: 'secondary' });
  }
  if (Array.isArray(section.actions)) {
    section.actions.forEach(function (item) {
      if (typeof item === 'string') {
        actions.push({ label: item, variant: 'secondary' });
      } else if (isObject(item) && typeof item.label === 'string') {
        actions.push({ label: item.label, variant: item.variant || 'secondary' });
      }
    });
  }

  if (actions.length) {
    var actionsPath = ''.concat(basePath, '/actions');
    var actionsFrame = ensureBuilderNode(frame, {
      path: actionsPath,
      type: 'FRAME',
      name: 'Actions',
      setup: function setup(node) {
        ensureFrameAutoLayout(node, 'HORIZONTAL');
        if ('primaryAxisSizingMode' in node) node.primaryAxisSizingMode = 'AUTO';
        if ('counterAxisSizingMode' in node) node.counterAxisSizingMode = 'AUTO';
        var gap = Number.isFinite(section.actionSpacing) ? section.actionSpacing : 16;
        if ('itemSpacing' in node) {
          var spacing = clampUnit(gap);
          node.itemSpacing = spacing != null ? spacing : 16;
        }
      }
    }, context).node;
    var buttonNodes = [];
    var buttonPaths = [];
    actions.forEach(function (action, index) {
      var buttonPath = ''.concat(actionsPath, '/items[').concat(index, ']');
      var button = ensureButton(actionsFrame, buttonPath, action.label, context, {
        name: ''.concat(action.variant || 'button', ' ').concat(index + 1),
        tokenContext: { type: section.type, role: 'action', variant: action.variant }
      });
      buttonNodes.push(button);
      buttonPaths.push(buttonPath);
    });
    reorderBuilderChildren(actionsFrame, buttonNodes);
    cleanupBuilderChildren(actionsFrame, buttonPaths, context);
    nodes.push(actionsFrame);
    paths.push(actionsPath);
  }

  reorderBuilderChildren(frame, nodes);
  cleanupBuilderChildren(frame, paths, context);
  return { nodes: nodes, paths: paths };
}

function buildFeaturesSection(frame, section, basePath, context, gridResult) {
  var nodes = [];
  var paths = [];
  var textColor = resolveTokenColor(context ? context.tokens : null, 'text');
  var heading = section.title || section.heading || null;
  if (heading) {
    var headingPath = ''.concat(basePath, '/title');
    nodes.push(ensureTextNode(frame, headingPath, 'Section Title', heading, context, {
      fontSize: 32,
      fillColor: textColor,
      tokenContext: { type: section.type, role: 'title', name: section.name }
    }));
    paths.push(headingPath);
  }

  if (gridResult && gridResult.container) {
    var container = gridResult.container;
    nodes.push(container);
    var containerPath = ''.concat(basePath, '/grid');
    safeSetPluginData(container, BUILDER_PATH_KEY, containerPath);
    paths.push(containerPath);
    var items = Array.isArray(section.items) ? section.items : [];
    var columnNodes = [];
    var columnPaths = [];
    gridResult.columns.forEach(function (column, index) {
      var columnPath = ''.concat(containerPath, '/column[').concat(index, ']');
      safeSetPluginData(column, BUILDER_PATH_KEY, columnPath);
      ensureFrameAutoLayout(column, 'VERTICAL');
      if ('itemSpacing' in column) {
        var spacing = clampUnit(section.itemSpacing || 12);
        column.itemSpacing = spacing != null ? spacing : 12;
      }
      column.layoutGrow = 1;
      if ('layoutAlign' in column) column.layoutAlign = 'STRETCH';
      columnNodes.push(column);
      columnPaths.push(columnPath);
      var item = items[index];
      if (item && (typeof item.title === 'string' || typeof item.description === 'string')) {
        var titlePath = ''.concat(basePath, '/items[').concat(index, ']/title');
        var descPath = ''.concat(basePath, '/items[').concat(index, ']/description');
        var childNodes = [];
        var childPaths = [];
        if (typeof item.title === 'string') {
          childNodes.push(ensureTextNode(column, titlePath, 'Feature Title', item.title, context, {
            fontSize: 20,
            fillColor: textColor,
            tokenContext: { type: section.type, role: 'itemTitle', index: index }
          }));
          childPaths.push(titlePath);
        }
        if (typeof item.description === 'string') {
          childNodes.push(ensureTextNode(column, descPath, 'Feature Description', item.description, context, {
            fontSize: 14,
            fillColor: textColor,
            tokenContext: { type: section.type, role: 'itemDescription', index: index }
          }));
          childPaths.push(descPath);
        }
        reorderBuilderChildren(column, childNodes);
        cleanupBuilderChildren(column, childPaths, context);
      } else {
        cleanupBuilderChildren(column, [], context);
      }
    });
    reorderBuilderChildren(container, columnNodes);
    cleanupBuilderChildren(container, columnPaths, context);
  }

  reorderBuilderChildren(frame, nodes);
  cleanupBuilderChildren(frame, paths, context);
  return { nodes: nodes, paths: paths };
}

function buildGallerySection(frame, section, basePath, context, gridResult) {
  var nodes = [];
  var paths = [];
  var textColor = resolveTokenColor(context ? context.tokens : null, 'text');
  var sectionSpacing = Number.isFinite(section.itemSpacing) ? section.itemSpacing : Number.isFinite(frame.itemSpacing) ? frame.itemSpacing : null;
  var normalizedSpacing = clampUnit(sectionSpacing != null ? sectionSpacing : 16);
  var itemSpacing = normalizedSpacing != null ? normalizedSpacing : 16;
  var items = Array.isArray(section.items) ? section.items : [];

  function ensureGalleryItem(parent, item, index) {
    var itemPath = ''.concat(basePath, '/items[').concat(index, ']');
    var itemFrame = ensureBuilderNode(parent, {
      path: itemPath,
      type: 'FRAME',
      name: 'Gallery Item '.concat(index + 1),
      setup: function setup(node) {
        ensureFrameAutoLayout(node, 'VERTICAL');
        if ('itemSpacing' in node) {
          node.itemSpacing = itemSpacing;
        }
        if ('layoutGrow' in node) {
          node.layoutGrow = 1;
        }
        if ('layoutAlign' in node) {
          node.layoutAlign = 'STRETCH';
        }
        if ('fills' in node) {
          node.fills = [];
        }
      }
    }, context).node;
    applyTokensToNode(itemFrame, context ? context.tokens : null, { type: section.type, role: 'item', index: index });
    var childNodes = [];
    var childPaths = [];
    var imagePath = ''.concat(itemPath, '/image');
    var imageNode = ensureBuilderNode(itemFrame, {
      path: imagePath,
      type: 'RECTANGLE',
      name: 'Gallery Image',
      setup: function setup(node) {
        var heightValue = Number.isFinite(item && item.imageHeight) ? clampUnit(item.imageHeight) : clampUnit(180);
        var imageHeight = heightValue != null ? heightValue : 180;
        var width = Math.max(1, Math.round(node.width || frame.width || 320));
        if (typeof node.resizeWithoutConstraints === 'function') {
          try {
            node.resizeWithoutConstraints(width, imageHeight);
          } catch (e) {}
        } else if (typeof node.resize === 'function') {
          try {
            node.resize(width, imageHeight);
          } catch (e2) {}
        }
        if ('layoutAlign' in node) {
          node.layoutAlign = 'STRETCH';
        }
        var borderColor = resolveTokenColor(context ? context.tokens : null, 'border');
        var placeholderFill = resolveTokenColor(context ? context.tokens : null, 'surface') || '#F3F4F6';
        var hasImage = item && typeof item.imageUrl === 'string' && item.imageUrl.trim();
        if (hasImage) {
          if ('strokes' in node) {
            node.strokes = [];
          }
          if ('fills' in node) {
            node.fills = [];
          }
          try {
            node.setPluginData('relay:imageUrl', item.imageUrl);
          } catch (e3) {}
        } else {
          if ('strokeWeight' in node) {
            node.strokeWeight = 1;
          }
          if (borderColor) {
            applyStroke(node, borderColor);
          } else {
            applyStroke(node, '#D4D4D8');
          }
          if (placeholderFill) {
            applyFill(node, placeholderFill);
          }
          try {
            node.setPluginData('relay:imageUrl', '');
          } catch (e4) {}
        }
        applyTokensToNode(node, context ? context.tokens : null, { type: section.type, role: 'image', index: index });
      }
    }, context).node;
    childNodes.push(imageNode);
    childPaths.push(imagePath);
    if (item && typeof item.title === 'string' && item.title.trim()) {
      var titlePath = ''.concat(itemPath, '/title');
      childNodes.push(ensureTextNode(itemFrame, titlePath, 'Gallery Item Title', item.title, context, {
        fontSize: 18,
        fillColor: textColor,
        tokenContext: { type: section.type, role: 'itemTitle', index: index }
      }));
      childPaths.push(titlePath);
    }
    if (item && typeof item.caption === 'string' && item.caption.trim()) {
      var captionPath = ''.concat(itemPath, '/caption');
      childNodes.push(ensureTextNode(itemFrame, captionPath, 'Gallery Item Caption', item.caption, context, {
        fontSize: 14,
        fillColor: textColor,
        tokenContext: { type: section.type, role: 'itemCaption', index: index }
      }));
      childPaths.push(captionPath);
    }
    reorderBuilderChildren(itemFrame, childNodes);
    cleanupBuilderChildren(itemFrame, childPaths, context);
    return { node: itemFrame, path: itemPath };
  }

  var layoutType = null;
  if (typeof section.layout === 'string') {
    layoutType = section.layout;
  } else if (typeof section.gridLayout === 'string') {
    layoutType = section.gridLayout;
  } else if (isObject(section.grid) && typeof section.grid.type === 'string') {
    layoutType = section.grid.type;
  }
  var isGrid3 = typeof layoutType === 'string' && layoutType.toLowerCase() === 'grid-3';
  var gridGap = null;
  if (isObject(section.grid) && Number.isFinite(section.grid.gap)) {
    var gapValue = clampUnit(section.grid.gap);
    if (gapValue != null) {
      gridGap = gapValue;
    }
  }

  if (isGrid3 && frame) {
    var containerPath = ''.concat(basePath, '/grid');
    var container;
    if (gridResult && gridResult.container) {
      container = gridResult.container;
      safeSetPluginData(container, BUILDER_PATH_KEY, containerPath);
    } else {
      container = ensureBuilderNode(frame, {
        path: containerPath,
        type: 'FRAME',
        name: ''.concat(section.name || frame.name || 'Gallery', ' · Grid'),
        setup: function setup(node) {
          ensureFrameAutoLayout(node, 'HORIZONTAL');
          if ('counterAxisSizingMode' in node) {
            node.counterAxisSizingMode = 'AUTO';
          }
          if ('layoutGrow' in node) {
            node.layoutGrow = 1;
          }
          if ('layoutAlign' in node) {
            node.layoutAlign = 'STRETCH';
          }
          if ('fills' in node) {
            node.fills = [];
          }
        }
      }, context).node;
    }
    ensureFrameAutoLayout(container, 'HORIZONTAL');
    if ('counterAxisSizingMode' in container) {
      container.counterAxisSizingMode = 'AUTO';
    }
    if ('layoutGrow' in container) {
      container.layoutGrow = 1;
    }
    if ('layoutAlign' in container) {
      container.layoutAlign = 'STRETCH';
    }
    if ('fills' in container) {
      container.fills = [];
    }
    if (gridGap != null && 'itemSpacing' in container) {
      container.itemSpacing = gridGap;
    }
    var columnCount = 3;
    var columnNodes = [];
    var columnPaths = [];
    for (var columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      (function (colIndex) {
        var columnPath = ''.concat(containerPath, '/column[').concat(colIndex, ']');
        var columnResult = ensureBuilderNode(container, {
          path: columnPath,
          type: 'FRAME',
          name: 'Column '.concat(colIndex + 1),
          setup: function setup(node) {
            ensureFrameAutoLayout(node, 'VERTICAL');
            if ('layoutGrow' in node) {
              node.layoutGrow = 1;
            }
            if ('layoutAlign' in node) {
              node.layoutAlign = 'STRETCH';
            }
            if ('fills' in node) {
              node.fills = [];
            }
            if ('itemSpacing' in node) {
              node.itemSpacing = itemSpacing;
            }
          }
        }, context);
        var columnNode = columnResult.node;
        if ('itemSpacing' in columnNode) {
          columnNode.itemSpacing = itemSpacing;
        }
        columnNodes.push(columnNode);
        columnPaths.push(columnPath);
      })(columnIndex);
    }
    reorderBuilderChildren(container, columnNodes);
    cleanupBuilderChildren(container, columnPaths, context);
    var assignments = [];
    for (var i = 0; i < columnCount; i += 1) {
      assignments.push([]);
    }
    items.forEach(function (item, index) {
      var columnIndex = index % columnCount;
      assignments[columnIndex].push({ item: item, index: index });
    });
    columnNodes.forEach(function (columnNode, columnIndex) {
      var columnItems = assignments[columnIndex] || [];
      var childNodes = [];
      var childPaths = [];
      columnItems.forEach(function (entry) {
        var result = ensureGalleryItem(columnNode, entry.item, entry.index);
        childNodes.push(result.node);
        childPaths.push(result.path);
      });
      reorderBuilderChildren(columnNode, childNodes);
      cleanupBuilderChildren(columnNode, childPaths, context);
    });
    nodes.push(container);
    paths.push(containerPath);
  } else {
    items.forEach(function (item, index) {
      var result = ensureGalleryItem(frame, item, index);
      nodes.push(result.node);
      paths.push(result.path);
    });
  }

  reorderBuilderChildren(frame, nodes);
  cleanupBuilderChildren(frame, paths, context);
  return { nodes: nodes, paths: paths };
}

function buildCTASection(frame, section, basePath, context) {
  var nodes = [];
  var paths = [];
  var textColor = resolveTokenColor(context ? context.tokens : null, 'text');
  var title = section.title || section.heading || section.name || null;
  if (title) {
    var titlePath = ''.concat(basePath, '/title');
    nodes.push(ensureTextNode(frame, titlePath, 'CTA Title', title, context, {
      fontSize: 36,
      fillColor: textColor,
      tokenContext: { type: section.type, role: 'title', name: section.name }
    }));
    paths.push(titlePath);
  }

  var body = section.subtitle || section.description || (isObject(section.content) && section.content.body ? section.content.body : null);
  if (body) {
    var bodyPath = ''.concat(basePath, '/body');
    nodes.push(ensureTextNode(frame, bodyPath, 'CTA Body', body, context, {
      fontSize: 16,
      fillColor: textColor,
      tokenContext: { type: section.type, role: 'body', name: section.name }
    }));
    paths.push(bodyPath);
  }

  var actions = [];
  if (typeof section.ctaText === 'string') {
    actions.push({ label: section.ctaText, variant: 'primary' });
  }
  if (typeof section.secondaryAction === 'string') {
    actions.push({ label: section.secondaryAction, variant: 'secondary' });
  }
  if (Array.isArray(section.actions)) {
    section.actions.forEach(function (action) {
      if (typeof action === 'string') {
        actions.push({ label: action, variant: 'secondary' });
      } else if (isObject(action) && typeof action.label === 'string') {
        actions.push({ label: action.label, variant: action.variant || 'secondary' });
      }
    });
  }
  if (actions.length) {
    var actionsPath = ''.concat(basePath, '/actions');
    var actionsFrame = ensureBuilderNode(frame, {
      path: actionsPath,
      type: 'FRAME',
      name: 'CTA Actions',
      setup: function setup(node) {
        ensureFrameAutoLayout(node, 'HORIZONTAL');
        if ('primaryAxisSizingMode' in node) node.primaryAxisSizingMode = 'AUTO';
        if ('counterAxisSizingMode' in node) node.counterAxisSizingMode = 'AUTO';
        if ('itemSpacing' in node) {
          var spacing = clampUnit(section.actionSpacing || 16);
          node.itemSpacing = spacing != null ? spacing : 16;
        }
      }
    }, context).node;
    var buttons = [];
    var buttonPaths = [];
    actions.forEach(function (action, index) {
      var buttonPath = ''.concat(actionsPath, '/items[').concat(index, ']');
      buttons.push(ensureButton(actionsFrame, buttonPath, action.label, context, {
        name: ''.concat(action.variant || 'cta', ' ').concat(index + 1),
        tokenContext: { type: section.type, role: 'action', variant: action.variant }
      }));
      buttonPaths.push(buttonPath);
    });
    reorderBuilderChildren(actionsFrame, buttons);
    cleanupBuilderChildren(actionsFrame, buttonPaths, context);
    nodes.push(actionsFrame);
    paths.push(actionsPath);
  }

  reorderBuilderChildren(frame, nodes);
  cleanupBuilderChildren(frame, paths, context);
  return { nodes: nodes, paths: paths };
}

function buildFooterSection(frame, section, basePath, context) {
  var nodes = [];
  var paths = [];
  var textColor = resolveTokenColor(context ? context.tokens : null, 'text');
  var caption = section.caption || section.description || null;
  if (caption) {
    var captionPath = ''.concat(basePath, '/caption');
    nodes.push(ensureTextNode(frame, captionPath, 'Footer Caption', caption, context, {
      fontSize: 14,
      fillColor: textColor,
      tokenContext: { type: section.type, role: 'caption', name: section.name }
    }));
    paths.push(captionPath);
  }

  var links = Array.isArray(section.links) ? section.links : [];
  if (links.length) {
    var listPath = ''.concat(basePath, '/links');
    var listFrame = ensureBuilderNode(frame, {
      path: listPath,
      type: 'FRAME',
      name: 'Footer Links',
      setup: function setup(node) {
        ensureFrameAutoLayout(node, 'VERTICAL');
        if ('itemSpacing' in node) {
          var spacing = clampUnit(section.linkSpacing || 8);
          node.itemSpacing = spacing != null ? spacing : 8;
        }
      }
    }, context).node;
    var linkNodes = [];
    var linkPaths = [];
    links.forEach(function (link, index) {
      var label = null;
      if (isObject(link)) {
        if (typeof link.label === 'string' && typeof link.href === 'string') {
          label = ''.concat(link.label, ' · ').concat(link.href);
        } else if (typeof link.label === 'string') {
          label = link.label;
        } else if (typeof link.href === 'string') {
          label = link.href;
        }
      } else if (typeof link === 'string') {
        label = link;
      }
      if (!label) {
        label = 'Link '.concat(index + 1);
      }
      var linkPath = ''.concat(listPath, '[').concat(index, ']');
      linkNodes.push(ensureTextNode(listFrame, linkPath, 'Footer Link '.concat(index + 1), label, context, {
        fontSize: 14,
        fillColor: textColor,
        tokenContext: { type: section.type, role: 'link', index: index }
      }));
      linkPaths.push(linkPath);
    });
    reorderBuilderChildren(listFrame, linkNodes);
    cleanupBuilderChildren(listFrame, linkPaths, context);
    nodes.push(listFrame);
    paths.push(listPath);
  }

  reorderBuilderChildren(frame, nodes);
  cleanupBuilderChildren(frame, paths, context);
  return { nodes: nodes, paths: paths };
}

function buildCustomSection(frame, section, basePath, context) {
  var nodes = [];
  var paths = [];
  var textColor = resolveTokenColor(context ? context.tokens : null, 'text');
  var title = section.title || section.name || null;
  if (title) {
    var titlePath = ''.concat(basePath, '/title');
    nodes.push(ensureTextNode(frame, titlePath, 'Section Title', title, context, {
      fontSize: 28,
      fillColor: textColor,
      tokenContext: { type: section.type || 'custom', role: 'title', name: section.name }
    }));
    paths.push(titlePath);
  }
  var contentText = null;
  if (typeof section.content === 'string') {
    contentText = section.content;
  } else if (Array.isArray(section.content)) {
    contentText = section.content.join('\n');
  } else if (isObject(section.content) && typeof section.content.body === 'string') {
    contentText = section.content.body;
  }
  if (!contentText && typeof section.description === 'string') {
    contentText = section.description;
  }
  if (contentText) {
    var contentPath = ''.concat(basePath, '/content');
    nodes.push(ensureTextNode(frame, contentPath, 'Section Content', contentText, context, {
      fontSize: 16,
      fillColor: textColor,
      tokenContext: { type: section.type || 'custom', role: 'content', name: section.name }
    }));
    paths.push(contentPath);
  }
  reorderBuilderChildren(frame, nodes);
  cleanupBuilderChildren(frame, paths, context);
  return { nodes: nodes, paths: paths };
}

function syncSectionContent(frame, spec, section, index, context, gridResult) {
  var basePath = "sections[".concat(index, "]");
  var result;
  switch (section.type) {
    case 'hero':
      result = buildHeroSection(frame, section, basePath, context);
      break;
    case 'features':
      result = buildFeaturesSection(frame, section, basePath, context, gridResult);
      break;
    case 'cta':
      result = buildCTASection(frame, section, basePath, context);
      break;
    case 'footer':
      result = buildFooterSection(frame, section, basePath, context);
      break;
    default:
      result = buildCustomSection(frame, section, basePath, context);
      break;
  }
  if (!result) {
    return { nodes: [], paths: [] };
  }
  return result;
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
      var width = clampUnit(w);
      var height = clampUnit(h);
      if (width != null && height != null) {
        frame.resizeWithoutConstraints(width, height);
        log("Adjusted root frame size to ".concat(width, "\xD7").concat(height));
      }
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
  safeSetPluginData(frame, BUILDER_PATH_KEY, 'root');
  if (isObject(spec === null || spec === void 0 ? void 0 : spec.grid) && Number.isFinite(spec.grid.container) && typeof frame.resizeWithoutConstraints === 'function') {
    var containerWidth = clampUnit(spec.grid.container);
    if (containerWidth != null) {
      var fallbackHeight = isObject(spec.target) && isObject(spec.target.frameSize) && Number.isFinite(spec.target.frameSize.h) ? spec.target.frameSize.h : 10;
      var nextHeight = Math.max(1, Math.round(frame.height || fallbackHeight));
      try {
        frame.resizeWithoutConstraints(containerWidth, nextHeight);
      } catch (e) {}
    }
  }
  if ('counterAxisSizingMode' in frame) {
    frame.counterAxisSizingMode = 'FIXED';
  }
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

function ensureGridStructure(sectionNode, section, spec, log, context, basePath) {
  var gridInfo = resolveSectionGrid(section, spec);
  if (!gridInfo) return;
  var columns = gridInfo.columns,gap = gridInfo.gap;
  if (isObject(section === null || section === void 0 ? void 0 : section.grid) && Number.isFinite(section.grid.gap)) {
    gap = section.grid.gap;
  }
  var targetColumns = columns;
  if ((section === null || section === void 0 ? void 0 : section.type) !== 'gallery' && Array.isArray(section === null || section === void 0 ? void 0 : section.items) && section.items.length > columns) {
    targetColumns = section.items.length;
  }

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
    log("Created grid container for section \u201C".concat(sectionNode.name, "\u201D with ").concat(targetColumns, " columns"));
  }
  ensureFrameAutoLayout(container, 'HORIZONTAL');
  container.counterAxisSizingMode = 'AUTO';
  container.layoutGrow = 1;
  if ('layoutAlign' in container) {
    container.layoutAlign = 'STRETCH';
  }
  var spacing = clampUnit(gap);
  container.itemSpacing = spacing != null ? spacing : 0;
  applyPadding(container, normalizePadding(0));
  if ('fills' in container) {
    container.fills = [];
  }
  if (isObject(spec === null || spec === void 0 ? void 0 : spec.grid) && Number.isFinite(spec.grid.container) && typeof container.resizeWithoutConstraints === 'function') {
    var width = clampUnit(spec.grid.container);
    if (width != null) {
      var height = Math.max(1, Math.round(container.height || 10));
      try {
        container.resizeWithoutConstraints(width, height);
      } catch (e) {}
    }
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
    if (basePath) {
      safeSetPluginData(column, BUILDER_PATH_KEY, "".concat(basePath, "/column[").concat(i, "]"));
    }
    desiredColumns.push(column);
  };for (var i = 0; i < targetColumns; i += 1) {_loop(i);}

  desiredColumns.forEach(function (column, index) {
    if (column.parent === container) {
      container.insertChild(index, column);
    }
  });

  var toRemove = container.children.filter(function (child) {return !desiredColumns.includes(child);});var _iterator2 = _createForOfIteratorHelper(
      toRemove),_step2;try {for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {var extra = _step2.value;
      try {
        extra.remove();
        if (context && context.report) {
          context.report.removed += 1;
        }
      } catch (e) {}
    }} catch (err) {_iterator2.e(err);} finally {_iterator2.f();}

  if (basePath) {
    safeSetPluginData(container, BUILDER_PATH_KEY, "".concat(basePath));
  }

  return { container: container, columns: desiredColumns };
}

function ensureSectionFrame(rootFrame, spec, section, log, index, context) {
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
  var basePath = "sections[".concat(index, "]");
  safeSetPluginData(frame, BUILDER_PATH_KEY, basePath);
  applyTokensToNode(frame, spec.tokens, {
    type: section.type,
    name: sectionName,
    section: section
  });
  if (isObject(spec === null || spec === void 0 ? void 0 : spec.grid) && Number.isFinite(spec.grid.container) && typeof frame.resizeWithoutConstraints === 'function') {
    var targetWidth = clampUnit(spec.grid.container);
    if (targetWidth != null) {
      var height = Math.max(1, Math.round(frame.height || 10));
      try {
        frame.resizeWithoutConstraints(targetWidth, height);
      } catch (e) {}
    }
  }
  var gridResult = ensureGridStructure(frame, section, spec, log, context, "".concat(basePath, "/grid")) || null;
  var contentResult = syncSectionContent(frame, spec, section, index, context, gridResult);
  return { frame: frame, grid: gridResult, content: contentResult };
}function

runBuild(_x) {return _runBuild.apply(this, arguments);}function _runBuild() {_runBuild = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(spec) {var logs, log, page, rootFrame, buildContext, fontInfo, sections, sectionNodes, _iterator4, _step4, _step4$value, section, index, sectionResult, timestamp;return _regenerator().w(function (_context2) {while (1) switch (_context2.n) {case 0:
          logs = [];
          log = function log(message) {var level = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'info';var meta = arguments.length > 2 ? arguments[2] : undefined;
            var entry = { ts: new Date().toISOString(), level: level, message: message };
            if (isObject(meta)) Object.assign(entry, meta);
            logs.push(JSON.stringify(entry));
          };if (!(
          !isObject(spec.meta) || !isObject(spec.target))) {_context2.n = 1;break;}throw (
            new Error('TaskSpec meta/target are required'));case 1:

          page = ensurePage(spec.target.pageName, log);
          rootFrame = ensureRootFrame(page, spec, log);
          buildContext = {
            tokens: spec.tokens,
            log: log,
            report: { created: 0, updated: 0, removed: 0, warnings: [] },
            fontName: null
          };
          _context2.n = 2;return (
            ensureFontsForSpec(spec));case 2:fontInfo = _context2.v;

          if (fontInfo) {
            if (fontInfo.fontName) {
              buildContext.fontName = fontInfo.fontName;
            }
            if (Array.isArray(fontInfo.warnings)) {
              fontInfo.warnings.forEach(function (warning) {
                addBuildWarning(buildContext, warning);
              });
            }
          }
          sections = Array.isArray(spec.sections) ? spec.sections : [];
          sectionNodes = [];
          _iterator4 = _createForOfIteratorHelper(
            sections.entries());_context2.f(3);case 5:_context2.s();case 6:if ((_step4 = _context2.n()).done) {_context2.n = 13;break;}_step4$value = _slicedToArray(_step4.value, 2);section = _step4$value[1];index = _step4$value[0];
          sectionResult = ensureSectionFrame(rootFrame, spec, section, log, index, buildContext);
          if (section && section.type === 'gallery') {
            try {
              sectionResult.content = buildGallerySection(sectionResult.frame, section, "sections[".concat(index, "]"), buildContext, sectionResult.grid);
            } catch (error) {
              log(String(error && error.message ? error.message : error), 'error', { section: section && section.name ? section.name : section && section.type ? section.type : 'gallery' });
            }
          }
          sectionNodes.push(sectionResult.frame);_context2.n = 11;break;case 8:_context2.p = 8;_context2.t0 = _context2.v;

          log(String(_context2.t0 || 'Section build failed'), 'error');case 11:_context2.n = 6;break;case 13:_context2.f(3);case 14:
          sectionNodes.forEach(function (frame, position) {
            if (frame.parent === rootFrame) {
              rootFrame.insertChild(position, frame);
            }
          });
          log('Processed sections', 'info', { count: sectionNodes.length, created: buildContext.report.created, updated: buildContext.report.updated, removed: buildContext.report.removed });
          timestamp = new Date().toISOString();
          try {
            rootFrame.setPluginData('relay:lastBuildAt', timestamp);
          } catch (e) {}return _context2.a(3,
          {
            page: page,
            rootFrame: rootFrame,
            sections: sectionNodes,
            logs: logs,
            report: buildContext.report
          });case 17:case "end":return _context2.stop();}}, null, null, [[5, 8, 11, 13]]);
        }))();



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

function readBasicAutoLayoutValue(source, key) {
  if (!isObject(source)) {
    return null;
  }

  if (Number.isFinite(source[key])) {
    return source[key];
  }

  if (!key || key.indexOf('padding') !== 0) {
    return null;
  }

  var side = key.slice('padding'.length);
  if (!side) {
    return null;
  }

  var normalizedSide = side.charAt(0).toLowerCase() + side.slice(1);
  var paddingSource = source.padding;

  if (Number.isFinite(paddingSource)) {
    return paddingSource;
  }

  if (isObject(paddingSource)) {
    if (Number.isFinite(paddingSource[normalizedSide])) {
      return paddingSource[normalizedSide];
    }
    if (Number.isFinite(paddingSource[side])) {
      return paddingSource[side];
    }
  }

  return null;
}

function computeBasicDeviations(expected, actual, tolerancePx) {
  var tolerance = Number.isFinite(tolerancePx) ? Math.max(0, Math.abs(tolerancePx)) : 2;
  var properties = ['itemSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'gridGap', 'layoutMode'];
  var result = [];

  for (var i = 0; i < properties.length; i++) {var property = properties[i];
    if (property === 'layoutMode') {
      var expectedLayout = isObject(expected) && typeof expected.layoutMode === 'string' ? expected.layoutMode : null;
      if (!expectedLayout) {
        continue;
      }

      var actualLayout = isObject(actual) && typeof actual.layoutMode === 'string' ? actual.layoutMode : null;
      if (expectedLayout !== actualLayout) {
        result.push({ property: property, expected: expectedLayout, actual: actualLayout, delta: null });
      }
      continue;
    }

    var expectedValue = readBasicAutoLayoutValue(expected, property);
    var actualValue = readBasicAutoLayoutValue(actual, property);

    if (!Number.isFinite(expectedValue) || !Number.isFinite(actualValue)) {
      continue;
    }

    var delta = actualValue - expectedValue;
    if (Math.abs(delta) > tolerance) {
      result.push({ property: property, expected: expectedValue, actual: actualValue, delta: delta });
    }
  }

  return result;
}

function formatDeviationProperty(property) {
  var map = {
    itemSpacing: 'item spacing',
    paddingTop: 'padding top',
    paddingRight: 'padding right',
    paddingBottom: 'padding bottom',
    paddingLeft: 'padding left',
    gridGap: 'grid gap',
    layoutMode: 'layout mode'
  };
  return map[property] || property;
}

function formatDeviationDelta(delta) {
  if (!Number.isFinite(delta)) {
    return '';
  }

  var normalized = Math.round(delta * 100) / 100;
  if (Object.is(normalized, -0)) {
    normalized = 0;
  }
  var str = normalized.toFixed(2).replace(/\.?0+$/, '');
  if (normalized > 0) {
    return "+".concat(str, "px");
  }
  return "".concat(str, "px");
}

function computeDeviationSummary(spec, rootFrame, logs) {var _spec$acceptance, _spec$acceptance2;
  var toleranceSource = (_spec$acceptance = spec.acceptance) === null || _spec$acceptance === void 0 ? void 0 : _spec$acceptance.maxSpacingDeviation;
  var tolerance = Number.isFinite(toleranceSource) ? Math.max(0, Math.abs(toleranceSource)) : 2;
  var deviations = [];
  var warnings = [];

  if (!rootFrame) {
    return { deviations: deviations, warnings: warnings };
  }

  if ((_spec$acceptance2 = spec.acceptance) !== null && _spec$acceptance2 !== void 0 && _spec$acceptance2.checkAutoLayout && rootFrame.layoutMode !== 'VERTICAL') {
    warnings.push('Root frame is not using VERTICAL auto layout');
  }

  var addEntries = function addEntries(scope, label, meta, entries) {
    if (!Array.isArray(entries) || !entries.length) {
      return;
    }

    var baseMeta = isObject(meta) ? meta : {};
    for (var idx = 0; idx < entries.length; idx++) {
      var entry = entries[idx];
      if (!entry) continue;
      deviations.push(_objectSpread(_objectSpread({ scope: scope }, baseMeta), entry));
      var propertyLabel = formatDeviationProperty(entry.property);
      var detail = formatDeviationDelta(entry.delta);
      var message = '';

      if (entry.property === 'layoutMode') {
        var expectedLayout = typeof entry.expected === 'string' && entry.expected ? entry.expected : 'unspecified';
        var actualLayout = typeof entry.actual === 'string' && entry.actual ? entry.actual : 'unspecified';
        message = "".concat(label, ": ").concat(propertyLabel, " expected ").concat(expectedLayout, ", actual ").concat(actualLayout);
      } else if (detail) {
        message = "".concat(label, ": ").concat(propertyLabel, " ").concat(detail);
      } else {
        message = "".concat(label, ": ").concat(propertyLabel);
      }

      warnings.push(message);
    }
  };

  var rootPadding = {
    top: Number.isFinite(rootFrame.paddingTop) ? rootFrame.paddingTop : undefined,
    right: Number.isFinite(rootFrame.paddingRight) ? rootFrame.paddingRight : undefined,
    bottom: Number.isFinite(rootFrame.paddingBottom) ? rootFrame.paddingBottom : undefined,
    left: Number.isFinite(rootFrame.paddingLeft) ? rootFrame.paddingLeft : undefined
  };
  var rootActual = {
    itemSpacing: Number.isFinite(rootFrame.itemSpacing) ? rootFrame.itemSpacing : undefined,
    padding: rootPadding,
    layoutMode: typeof rootFrame.layoutMode === 'string' ? rootFrame.layoutMode : undefined
  };
  var rootExpected = resolveRootAutoLayout(spec) || {};
  var rootDeviations = computeBasicDeviations(rootExpected, rootActual, tolerance);
  addEntries('root', 'Root frame', null, rootDeviations);

  var sections = Array.isArray(spec.sections) ? spec.sections : [];
  var childFrames = Array.isArray(rootFrame.children) ? rootFrame.children.filter(function (node) {return node && node.type === 'FRAME';}) : [];

  for (var index = 0; index < sections.length; index++) {
    var section = sections[index];
    if (!isObject(section)) {
      continue;
    }

    var rawName = typeof section.name === 'string' ? section.name : '';
    var sectionName = rawName && rawName.trim() ? rawName.trim() : null;
    var sectionLabel = sectionName ? "Section \u201C".concat(sectionName, "\u201D") : "Section #".concat(index + 1);
    var sectionNode = null;

    for (var childIndex = 0; childIndex < childFrames.length; childIndex++) {
      var candidate = childFrames[childIndex];
      if (!candidate || candidate.type !== 'FRAME') continue;
      if (sectionName && candidate.name === sectionName) {
        sectionNode = candidate;
        break;
      }
      if (!sectionName && sectionNode == null && childIndex === index) {
        sectionNode = candidate;
      }
    }

    if (!sectionNode) {
      warnings.push("".concat(sectionLabel, ": matching frame not found (skipped)"));
      continue;
    }

    var sectionPadding = {
      top: Number.isFinite(sectionNode.paddingTop) ? sectionNode.paddingTop : undefined,
      right: Number.isFinite(sectionNode.paddingRight) ? sectionNode.paddingRight : undefined,
      bottom: Number.isFinite(sectionNode.paddingBottom) ? sectionNode.paddingBottom : undefined,
      left: Number.isFinite(sectionNode.paddingLeft) ? sectionNode.paddingLeft : undefined
    };
    var sectionActual = {
      itemSpacing: Number.isFinite(sectionNode.itemSpacing) ? sectionNode.itemSpacing : undefined,
      padding: sectionPadding,
      layoutMode: typeof sectionNode.layoutMode === 'string' ? sectionNode.layoutMode : undefined
    };
    var sectionExpected = resolveSectionAutoLayout(spec, section) || {};
    var gridInfo = resolveSectionGrid(section, spec);
    if (gridInfo && Number.isFinite(gridInfo.gap)) {
      sectionExpected.gridGap = gridInfo.gap;
      var gridContainer = null;
      if (Array.isArray(sectionNode.children)) {
        for (var childIndex2 = 0; childIndex2 < sectionNode.children.length; childIndex2++) {
          var gridCandidate = sectionNode.children[childIndex2];
          if (!gridCandidate || gridCandidate.type !== 'FRAME') continue;
          if (typeof gridCandidate.getPluginData !== 'function') continue;
          try {
            if (gridCandidate.getPluginData('relay:gridContainer') === '1') {
              gridContainer = gridCandidate;
              break;
            }
          } catch (error) {}
        }
      }
      if (gridContainer && Number.isFinite(gridContainer.itemSpacing)) {
        sectionActual.gridGap = gridContainer.itemSpacing;
      }
    }
    var sectionDeviations = computeBasicDeviations(sectionExpected, sectionActual, tolerance);

    if (sectionDeviations.length) {
      addEntries('section', sectionLabel, { section: sectionName || null, sectionIndex: index }, sectionDeviations);
    }
  }

  if (deviations.length) {
    logs.push("[export] Detected ".concat(deviations.length, " layout deviations"));
  }

  return { deviations: deviations, warnings: warnings };
}

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


figma.ui.onmessage = /*#__PURE__*/function () {var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(msg) {var spec, validationResult, _spec, _yield$runBuild, page, rootFrame, sections, logs, _spec2, _yield$runExport, exportSpec, _logs, previewResult, previewPayload, previewError, _t;return _regenerator().w(function (_context) {while (1) switch (_context.p = _context.n) {case 0:_context.p = 0;if (!(

          msg.type === 'validate')) {_context.n = 3;break;}
          spec = safeParseJSON(msg.taskSpec);if (
          spec) {_context.n = 1;break;}return _context.a(2,
          figma.ui.postMessage({ type: 'validate:error', error: 'Invalid JSON' }));case 1:
          validationResult = validateTaskSpecSchema(spec);if (!(validationResult.valid)) {_context.n = 2;break;}return _context.a(2,
          figma.ui.postMessage({ type: 'validate:error', error: 'TaskSpec не проходит проверку схемы', errors: validationResult.errors }));case 2:

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
            logs: logs,
            report: _yield$runBuild.report
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

var _originalUiOnMessage = figma.ui.onmessage;

figma.ui.onmessage = function (msg) {
  if (msg && msg.type === 'import:selection') {
    return handleImportFromSelectionMessage();
  }
  if (typeof _originalUiOnMessage === 'function') {
    return _originalUiOnMessage(msg);
  }
};

figma.on('selectionchange', function () {
  notifySelectionState();
});

figma.on('currentpagechange', function () {
  notifySelectionState();
});

notifySelectionState();
