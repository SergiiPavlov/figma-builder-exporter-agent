const PluginUtils = (() => {
  const isObject = (value) => value !== null && typeof value === "object";

  const clampUnit = (value) => {
    if (!Number.isFinite(value)) return null;
    const rounded = Math.round(value);
    if (rounded < -10000) return -10000;
    if (rounded > 10000) return 10000;
    return rounded;
  };

  const normalizeSectionPadding = (raw) => {
    if (typeof raw === "number") {
      const normalized = clampUnit(raw);
      if (normalized == null) return null;
      return { top: normalized, right: normalized, bottom: normalized, left: normalized };
    }
    if (Array.isArray(raw)) {
      const values = raw.map((value) => clampUnit(value));
      if (values.length === 2) {
        const [vertical, horizontal] = values;
        return {
          top: vertical != null ? vertical : 0,
          right: horizontal != null ? horizontal : 0,
          bottom: vertical != null ? vertical : 0,
          left: horizontal != null ? horizontal : 0,
        };
      }
      if (values.length === 4) {
        return {
          top: values[0] != null ? values[0] : 0,
          right: values[1] != null ? values[1] : 0,
          bottom: values[2] != null ? values[2] : 0,
          left: values[3] != null ? values[3] : 0,
        };
      }
      return null;
    }
    if (!isObject(raw)) return null;
    const aliases = {
      top: ["top", "t"],
      right: ["right", "r"],
      bottom: ["bottom", "b"],
      left: ["left", "l"],
    };
    const result = { top: null, right: null, bottom: null, left: null };
    for (const side of Object.keys(aliases)) {
      for (const key of aliases[side]) {
        if (Number.isFinite(raw[key])) {
          result[side] = clampUnit(raw[key]);
          break;
        }
      }
      if (result[side] == null) {
        result[side] = 0;
      }
    }
    if (Object.values(result).every((value) => value === 0)) {
      const hasSource = Object.keys(raw).some((key) => Number.isFinite(raw[key]));
      if (!hasSource) {
        return null;
      }
    }
    return result;
  };

  const normalizeSectionSpec = (section) => {
    if (!isObject(section)) return section;
    const content = isObject(section.content) ? section.content : null;
    if (content) {
      const mapping = {
        headline: "headline",
        subheading: "subheading",
        primaryAction: "primaryAction",
        secondaryAction: "secondaryAction",
        items: "items",
        title: "title",
        subtitle: "subtitle",
        ctaText: "ctaText",
        caption: "caption",
        links: "links",
        text: "text",
        button: "button",
        body: "body",
        description: "description",
      };
      for (const [key, targetKey] of Object.entries(mapping)) {
        if ((section[targetKey] === undefined || section[targetKey] === null) && content[key] != null) {
          section[targetKey] = content[key];
        }
      }
    }
    const normalizedPadding = normalizeSectionPadding(section.padding);
    if (normalizedPadding) {
      section.padding = normalizedPadding;
    }
    return section;
  };

  const normalizeTaskSpecInput = (spec) => {
    if (!isObject(spec)) return spec;
    if (Array.isArray(spec.sections)) {
      spec.sections.forEach((section, index) => {
        if (isObject(section)) {
          spec.sections[index] = normalizeSectionSpec(section);
        }
      });
    }
    return spec;
  };

    const parseServerError = (payload, fallback = "Request failed") => {
      if (payload instanceof Error) {
        return payload.message || fallback;
      }
      if (typeof payload === "string") {
        const trimmed = payload.trim();
        return trimmed || fallback;
      }
      const tryExtract = (data) => {
        if (!data) return null;
        if (typeof data.message === "string") {
          const code = typeof data.code === "string" || typeof data.code === "number" ? data.code : null;
          if (code != null && data.message) {
            return `${code}: ${data.message}`;
          }
          return data.message;
        }
        if (typeof data.error === "string" && data.error.trim()) {
          return data.error.trim();
        }
        return null;
      };

      if (isObject(payload) && isObject(payload.error)) {
        const nested = tryExtract(payload.error) || tryExtract(payload.error.error);
        if (nested) return nested;
        const code = payload.error.code;
        const message = payload.error.message;
        if (code || message) {
          return [code, message].filter(Boolean).join(": ") || fallback;
        }
      }

      if (isObject(payload)) {
        const direct = tryExtract(payload);
        if (direct) return direct;
      }

      return fallback;
    };

    const createRaceGuard = () => {
      let activeToken = 0;
      let abortController = null;

      const start = () => {
        activeToken += 1;
        if (abortController) {
          try {
            abortController.abort();
          } catch (_) {}
        }
        abortController = typeof AbortController !== "undefined" ? new AbortController() : null;
        return {
          token: activeToken,
          signal: abortController ? abortController.signal : undefined,
        };
      };

      const isActive = (token) => token === activeToken;

      const finish = (token) => {
        if (token === activeToken) {
          abortController = null;
        }
      };

      return {
        start,
        isActive,
        finish,
        get signal() {
          return abortController ? abortController.signal : undefined;
        },
      };
    };

    const createPersistentState = (key, options = {}) => {
      const {
        storage = typeof window !== "undefined" && window.localStorage ? window.localStorage : null,
        parser = (value) => JSON.parse(value),
        serializer = (value) => JSON.stringify(value),
        fallback,
      } = options;

      const read = (defaultValue = fallback) => {
        if (!storage) return defaultValue;
        try {
          const raw = storage.getItem(key);
          if (raw == null) return defaultValue;
          return parser(raw);
        } catch (_) {
          return defaultValue;
        }
      };

      const write = (value) => {
        if (!storage) return false;
        try {
          if (value === undefined) {
            storage.removeItem(key);
            return true;
          }
          storage.setItem(key, serializer(value));
          return true;
        } catch (_) {
          return false;
        }
      };

      return { read, write };
    };

    const readBasicAutoLayoutValue = (source, key) => {
      if (!isObject(source)) {
        return null;
      }

      if (Number.isFinite(source[key])) {
        return source[key];
      }

      if (!key || !key.startsWith("padding")) {
        return null;
      }

      const side = key.slice("padding".length);
      if (!side) {
        return null;
      }

      const normalizedSide = side.charAt(0).toLowerCase() + side.slice(1);
      const paddingSource = source.padding;

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
    };

    const computeBasicDeviations = (expected, actual, tolerancePx) => {
      const tolerance = Number.isFinite(tolerancePx) ? Math.max(0, Math.abs(tolerancePx)) : 2;
      const properties = [
        "itemSpacing",
        "paddingTop",
        "paddingRight",
        "paddingBottom",
        "paddingLeft",
        "gridGap",
        "layoutMode",
      ];

      const result = [];

      for (const property of properties) {
        if (property === "layoutMode") {
          const expectedLayout =
            isObject(expected) && typeof expected.layoutMode === "string" ? expected.layoutMode : null;
          if (!expectedLayout) {
            continue;
          }

          const actualLayout =
            isObject(actual) && typeof actual.layoutMode === "string" ? actual.layoutMode : null;
          if (expectedLayout !== actualLayout) {
            result.push({ property, expected: expectedLayout, actual: actualLayout, delta: null });
          }
          continue;
        }

        const expectedValue = readBasicAutoLayoutValue(expected, property);
        const actualValue = readBasicAutoLayoutValue(actual, property);

        if (!Number.isFinite(expectedValue) || !Number.isFinite(actualValue)) {
          continue;
        }

        const delta = actualValue - expectedValue;
        if (Math.abs(delta) > tolerance) {
          result.push({ property, expected: expectedValue, actual: actualValue, delta });
        }
      }

      return result;
    };

    const normalizeSchemaErrors = (errors) => {
      if (!Array.isArray(errors)) return [];
      return errors
        .map((entry) => {
          if (!entry) return null;
          const pathCandidates = [
            typeof entry.path === "string" ? entry.path : null,
            typeof entry.instancePath === "string" ? entry.instancePath : null,
            typeof entry.dataPath === "string" ? entry.dataPath : null,
          ];
          const path = pathCandidates.find((value) => value && value.length) || "/";
          const message =
            entry && typeof entry.message === "string" && entry.message.trim()
              ? entry.message.trim()
              : "Invalid value";
          return { path, message };
        })
        .filter(Boolean);
    };

    const sanitizeFilename = (input, fallback = "ExportSpec") => {
      const fallbackName =
        typeof fallback === "string" && fallback.trim() ? fallback.trim() : "ExportSpec";
      if (typeof input !== "string") return fallbackName;
      const trimmed = input.trim();
      if (!trimmed) return fallbackName;
      const replaced = trimmed.replace(/[\\/:*?"<>|]+/g, "_");
      const collapsed = replaced.replace(/\s+/g, " ").trim();
      const withoutDots = collapsed.replace(/\.+$/, "");
      const limited = withoutDots.slice(0, 120);
      return limited || fallbackName;
    };

    const stringifyJson = (value, fallback = "") => {
      if (value === undefined) return typeof fallback === "string" ? fallback : "";
      try {
        return JSON.stringify(value, null, 2);
      } catch (error) {
        if (value == null) {
          return typeof fallback === "string" ? fallback : "";
        }
        try {
          return String(value);
        } catch (_) {
          return typeof fallback === "string" ? fallback : "";
        }
      }
    };

    const validateTaskSpecSchema = (value) => {
      const errors = [];
      const addError = (path, message) => {
        errors.push({ path, message });
      };

      const isFiniteNumber = (input) => typeof input === "number" && Number.isFinite(input);

      if (!isObject(value)) {
        addError("/", "TaskSpec must be an object");
        return { valid: false, errors };
      }

      const { meta, target, grid, sections, acceptance } = value;

      if (!isObject(meta)) {
        addError("/meta", "meta must be an object");
      } else {
        if (typeof meta.specVersion !== "string") {
          addError("/meta/specVersion", "specVersion must be a string");
        }
        if (typeof meta.id !== "string") {
          addError("/meta/id", "id must be a string");
        }
        if (
          Object.prototype.hasOwnProperty.call(meta, "inferred") &&
          typeof meta.inferred !== "boolean"
        ) {
          addError("/meta/inferred", "inferred must be a boolean");
        }
      }

      if (!isObject(target)) {
        addError("/target", "target must be an object");
      } else {
        if (typeof target.fileId !== "string") {
          addError("/target/fileId", "fileId must be a string");
        }
        if (typeof target.pageName !== "string") {
          addError("/target/pageName", "pageName must be a string");
        }
        if (typeof target.frameName !== "string") {
          addError("/target/frameName", "frameName must be a string");
        }
        if (!isObject(target.frameSize)) {
          addError("/target/frameSize", "frameSize must be an object");
        } else {
          const frameSize = target.frameSize;
          if (!isFiniteNumber(frameSize.w) || frameSize.w < 1) {
            addError("/target/frameSize/w", "w must be a number ≥ 1");
          }
          if (!isFiniteNumber(frameSize.h) || frameSize.h < 1) {
            addError("/target/frameSize/h", "h must be a number ≥ 1");
          }
          const allowedKeys = new Set(["w", "h"]);
          Object.keys(frameSize).forEach((key) => {
            if (!allowedKeys.has(key)) {
              addError(`/target/frameSize/${key}`, "Unknown property");
            }
          });
        }
      }

      if (!isObject(grid)) {
        addError("/grid", "grid must be an object");
      } else {
        if (!isFiniteNumber(grid.container) || grid.container < 1) {
          addError("/grid/container", "container must be a number ≥ 1");
        }
        if (!Number.isInteger(grid.columns) || grid.columns < 1) {
          addError("/grid/columns", "columns must be an integer ≥ 1");
        }
        if (!isFiniteNumber(grid.gap) || grid.gap < 0) {
          addError("/grid/gap", "gap must be a number ≥ 0");
        }
        if (!isFiniteNumber(grid.margins) || grid.margins < 0) {
          addError("/grid/margins", "margins must be a number ≥ 0");
        }
      }

      if (!Array.isArray(sections)) {
        addError("/sections", "sections must be an array");
      } else if (sections.length === 0) {
        addError("/sections", "sections must contain at least one item");
      } else {
        const allowedTypes = new Set(["hero", "features", "gallery", "cta", "footer", "custom"]);
        sections.forEach((section, index) => {
          const basePath = `/sections/${index}`;
          if (!isObject(section)) {
            addError(basePath, "section must be an object");
            return;
          }
          if (typeof section.type !== "string" || !allowedTypes.has(section.type)) {
            addError(
              `${basePath}/type`,
              "type must be one of hero, features, gallery, cta, footer, custom",
            );
          }
          if (typeof section.name !== "string") {
            addError(`${basePath}/name`, "name must be a string");
          }
        });
      }

      if (acceptance != null) {
        if (!isObject(acceptance)) {
          addError("/acceptance", "acceptance must be an object");
        } else {
          if (
            Object.prototype.hasOwnProperty.call(acceptance, "maxSpacingDeviation") &&
            !isFiniteNumber(acceptance.maxSpacingDeviation)
          ) {
            addError("/acceptance/maxSpacingDeviation", "maxSpacingDeviation must be a number");
          }
          if (
            Object.prototype.hasOwnProperty.call(acceptance, "checkAutoLayout") &&
            typeof acceptance.checkAutoLayout !== "boolean"
          ) {
            addError("/acceptance/checkAutoLayout", "checkAutoLayout must be a boolean");
          }
        }
      }

      return { valid: errors.length === 0, errors };
    };

    const normalizeHexColor = (input) => {
      if (typeof input !== "string") return null;
      const trimmed = input.trim();
      if (!trimmed) return null;
      const prefixed = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
      const upper = prefixed.toUpperCase();
      if (!/^#([0-9A-F]{6}|[0-9A-F]{8})$/.test(upper)) {
        return null;
      }
      if (upper.length === 9 && upper.endsWith("FF")) {
        return upper.slice(0, 7);
      }
      return upper;
    };

    const parseHexColor = (hex) => {
      const normalized = normalizeHexColor(hex);
      if (!normalized) return null;
      const value = normalized.slice(1);
      const hasAlpha = value.length === 8;
      const r = parseInt(value.slice(0, 2), 16);
      const g = parseInt(value.slice(2, 4), 16);
      const b = parseInt(value.slice(4, 6), 16);
      const a = hasAlpha ? parseInt(value.slice(6, 8), 16) / 255 : 1;
      return { r, g, b, a };
    };

    const srgbChannelToLinear = (value) => {
      const channel = value / 255;
      if (channel <= 0.04045) {
        return channel / 12.92;
      }
      return Math.pow((channel + 0.055) / 1.055, 2.4);
    };

    const computeRelativeLuminance = (color) => {
      if (!color) return 0;
      const r = srgbChannelToLinear(color.r);
      const g = srgbChannelToLinear(color.g);
      const b = srgbChannelToLinear(color.b);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const computeContrastRatio = (lumA, lumB) => {
      const [L1, L2] = lumA >= lumB ? [lumA, lumB] : [lumB, lumA];
      return (L1 + 0.05) / (L2 + 0.05);
    };

    const median = (values) => {
      if (!Array.isArray(values) || values.length === 0) return null;
      const sorted = values
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => a - b);
      if (!sorted.length) return null;
      const mid = Math.floor(sorted.length / 2);
      if (sorted.length % 2 === 1) {
        return sorted[mid];
      }
      return (sorted[mid - 1] + sorted[mid]) / 2;
    };

    const slugify = (value, fallback = "item") => {
      if (typeof value !== "string") return fallback;
      const trimmed = value.trim().toLowerCase();
      if (!trimmed) return fallback;
      const normalized = trimmed
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return normalized || fallback;
    };

    const toInt = (value) => {
      if (!Number.isFinite(value)) return null;
      const rounded = Math.round(value);
      return Number.isFinite(rounded) ? rounded : null;
    };

    const normalizeFrameSize = (input) => {
      if (!isObject(input)) return null;
      const width = toInt(input.width != null ? input.width : input.w);
      const height = toInt(input.height != null ? input.height : input.h);
      if (width == null || height == null || width <= 0 || height <= 0) {
        return null;
      }
      return { w: width, h: height };
    };

    const ensureString = (value) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed || null;
      }
      return null;
    };

    const normalizeSectionKey = (value) => {
      const normalized = ensureString(value);
      return normalized ? normalized.toLowerCase() : null;
    };

    const collectSectionDocumentNodes = (exportSpec) => {
      const map = new Map();
      if (!isObject(exportSpec)) return map;
      const document = isObject(exportSpec.document) ? exportSpec.document : null;
      const nodes = document && Array.isArray(document.nodes) ? document.nodes : [];
      nodes.forEach((node) => {
        if (!isObject(node)) return;
        const key = normalizeSectionKey(node.section);
        if (!key) return;
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key).push(node);
      });
      return map;
    };

    const normalizePadding = (input) => {
      if (!isObject(input)) return null;
      const result = {};
      [
        ["top", "top"],
        ["right", "right"],
        ["bottom", "bottom"],
        ["left", "left"],
      ].forEach(([key, alias]) => {
        const value = toInt(input[key] != null ? input[key] : input[alias]);
        if (value != null) {
          result[key] = value;
        }
      });
      return Object.keys(result).length ? result : null;
    };

    const collectTextSamples = (section) => {
      if (!section || !Array.isArray(section.texts)) return [];
      return section.texts
        .map((text) => {
          if (!text || typeof text !== "object") return null;
          const characters = ensureString(text.characters);
          if (!characters) return null;
          return {
            characters,
            fontFamily: ensureString(text.fontFamily),
            fontStyle: ensureString(text.fontStyle),
            fontSize: toInt(text.fontSize),
            fill: normalizeHexColor(text.fill && text.fill.hex ? text.fill.hex : null),
          };
        })
        .filter(Boolean);
    };

    const ACTION_WORD_PATTERN =
      /\b(get|start|try|join|learn|book|buy|shop|download|sign|contact|discover|explore|view|see|request|schedule|create|launch|build|watch|order|upgrade|subscribe)\b/i;

    const collectDraftTextInsights = (section) => {
      const samples = collectTextSamples(section);
      const entries = samples
        .map((sample) => {
          const characters = ensureString(sample && sample.characters);
          if (!characters) return null;
          const fontSize = toInt(sample.fontSize);
          const words = characters.trim().split(/\s+/).filter(Boolean);
          return {
            characters,
            fontSize: Number.isFinite(fontSize) ? fontSize : null,
            length: characters.length,
            wordCount: words.length,
            hasAction: ACTION_WORD_PATTERN.test(characters),
          };
        })
        .filter(Boolean);
      const fontSizes = entries
        .map((entry) => entry.fontSize)
        .filter((value) => value != null && Number.isFinite(value));
      const maxFontSize = fontSizes.length ? Math.max(...fontSizes) : null;
      const mediumContentCount = entries.filter(
        (entry) => entry.wordCount >= 4 || entry.length >= 16,
      ).length;
      const hasActionWord = entries.some((entry) => entry.hasAction);
      return { entries, maxFontSize, mediumContentCount, hasActionWord };
    };

    const isHeroDraftCandidate = (section, index) => {
      if (!section) return false;
      if (index > 1) return false;
      const insights = collectDraftTextInsights(section);
      if (!insights.entries.length) return false;
      if (insights.maxFontSize == null || insights.maxFontSize < 34) return false;
      if (insights.mediumContentCount === 0 && !insights.hasActionWord) {
        return false;
      }
      return true;
    };

    const isFeaturesDraftCandidate = (section) => {
      if (!section) return false;
      const grid = isObject(section.grid) ? section.grid : null;
      if (!grid || !Number.isFinite(grid.columns) || grid.columns < 2) {
        return false;
      }
      const samples = collectTextSamples(section);
      if (!samples.length) return false;
      const uniqueTexts = new Set(
        samples
          .map((sample) => ensureString(sample && sample.characters))
          .filter(Boolean)
          .map((text) => text.trim())
          .filter(Boolean),
      );
      return uniqueTexts.size >= Math.min(grid.columns, 2);
    };

    const detectGalleryDraft = (section, sectionNodes) => {
      const grid = isObject(section && section.grid) ? section.grid : null;
      const columns = grid && Number.isFinite(grid.columns) ? grid.columns : null;
      if (!columns || columns < 2) {
        return { match: false, warning: null };
      }

      const textCount = Array.isArray(sectionNodes)
        ? sectionNodes.filter((node) => node && node.type === "TEXT").length
        : 0;
      if (textCount > 3) {
        return { match: false, warning: null };
      }

      if (!Array.isArray(sectionNodes) || !sectionNodes.length) {
        return { match: false, warning: null };
      }

      const sectionWidth = isObject(section) && isObject(section.size)
        ? toInt(
            section.size.width != null
              ? section.size.width
              : section.size.w,
          )
        : null;

      const rectangleWidths = sectionNodes
        .filter((node) => node && node.type === "RECTANGLE")
        .map((node) => {
          const bounds = isObject(node.absBounds) ? node.absBounds : null;
          if (!bounds || !Number.isFinite(bounds.w)) return null;
          const width = Math.round(bounds.w);
          if (width < 24) return null;
          if (sectionWidth && width >= sectionWidth - 4) return null;
          return width;
        })
        .filter((value) => Number.isFinite(value));

      if (!rectangleWidths.length) {
        return { match: false, warning: null };
      }

      const minItems = columns >= 3 ? columns + 1 : Math.max(columns, 4);
      if (rectangleWidths.length < minItems) {
        return { match: false, warning: null };
      }

      const columnWidth = Number.isFinite(grid.columnWidth) ? Math.round(grid.columnWidth) : null;
      const widthMedian = rectangleWidths.length ? Math.round(median(rectangleWidths)) : null;
      const baseWidth = columnWidth != null ? columnWidth : widthMedian;
      const tolerance = Math.max(4, baseWidth != null ? Math.round(Math.abs(baseWidth) * 0.08) : 6);

      const groups = [];
      rectangleWidths.forEach((width) => {
        let match = null;
        for (let i = 0; i < groups.length; i += 1) {
          const candidate = groups[i];
          if (Math.abs(candidate.avg - width) <= tolerance) {
            match = candidate;
            break;
          }
        }
        if (match) {
          match.sum += width;
          match.count += 1;
          match.avg = match.sum / match.count;
          match.min = Math.min(match.min, width);
          match.max = Math.max(match.max, width);
        } else {
          groups.push({ sum: width, count: 1, avg: width, min: width, max: width });
        }
      });

      if (!groups.length) {
        return {
          match: false,
          warning: "Секция похожа на галерею (grid), но повторяющиеся элементы не обнаружены — проверьте вручную.",
        };
      }

      const dominant = groups.reduce((best, group) => (group.count > (best ? best.count : 0) ? group : best), null);
      if (!dominant) {
        return {
          match: false,
          warning: "Секция похожа на галерею (grid), но анализ размеров не удался — проверьте вручную.",
        };
      }

      if (dominant.count < Math.max(3, columns)) {
        return {
          match: false,
          warning: "Сетка изображений найдена, но элементов недостаточно для уверенности — проверьте вручную.",
        };
      }

      const uniformRatio = dominant.count / rectangleWidths.length;
      if (uniformRatio < 0.7) {
        return {
          match: false,
          warning: "Изображения в сетке сильно отличаются по ширине — проверьте вручную.",
        };
      }

      if (columnWidth != null) {
        const diff = Math.abs(dominant.avg - columnWidth);
        const allowed = Math.max(tolerance * 2, Math.max(8, Math.abs(columnWidth) * 0.12));
        if (diff > allowed) {
          return {
            match: false,
            warning: "Ширина изображений не совпадает с колонками сетки — проверьте вручную.",
          };
        }
      }

      if (dominant.max - dominant.min > Math.max(tolerance, 12)) {
        return {
          match: false,
          warning: "Изображения в сетке различаются по размеру больше допустимого — проверьте вручную.",
        };
      }

      return { match: true, warning: null };
    };

    const determineDraftSectionType = (section, index, context = {}) => {
      const sectionNodes = Array.isArray(context.sectionNodes) ? context.sectionNodes : [];
      if (isHeroDraftCandidate(section, index)) {
        return { type: "hero" };
      }
      const galleryDetection = detectGalleryDraft(section, sectionNodes);
      if (galleryDetection.match) {
        return { type: "gallery" };
      }
      if (isFeaturesDraftCandidate(section)) {
        return { type: "features" };
      }
      if (galleryDetection.warning) {
        return { type: "custom", warning: galleryDetection.warning };
      }
      if (index === 0) {
        return {
          type: "custom",
          warning: "Первая секция не распознана автоматически. Проверьте вручную.",
        };
      }
      return { type: "custom" };
    };

    const clamp01 = (value) => {
      if (!Number.isFinite(value)) return 0;
      if (value < 0) return 0;
      if (value > 1) return 1;
      return value;
    };

    const determineSectionType = (section, index, total) => {
      const name = ensureString(section && section.name);
      const normalizedName = name ? name.toLowerCase() : "";
      const layoutMode = ensureString(section && section.layoutMode);
      const upperLayout = layoutMode ? layoutMode.toUpperCase() : null;
      const grid = section && isObject(section.grid) ? section.grid : null;
      const texts = collectTextSamples(section);
      const fontSizes = texts
        .map((sample) => (Number.isFinite(sample.fontSize) ? sample.fontSize : null))
        .filter((value) => value != null && value > 0);
      const maxFontSize = fontSizes.length ? Math.max(...fontSizes) : null;
      const minFontSize = fontSizes.length ? Math.min(...fontSizes) : null;
      const avgFontSize = fontSizes.length
        ? fontSizes.reduce((sum, value) => sum + value, 0) / fontSizes.length
        : null;
      const largeTextCount = fontSizes.filter((value) => value >= 36).length;
      const mediumTextCount = fontSizes.filter((value) => value >= 24).length;
      const shortTextCount = texts.filter(
        (sample) => sample.characters && sample.characters.length <= 24,
      ).length;
      const longTextCount = texts.filter(
        (sample) => sample.characters && sample.characters.length >= 60,
      ).length;
      const normalizedTexts = texts.map((sample) => sample.characters.toLowerCase());

      const backgroundHex = normalizeHexColor(section && section.fill && section.fill.hex);
      const backgroundColor = backgroundHex ? parseHexColor(backgroundHex) : null;
      const backgroundLuminance = backgroundColor
        ? computeRelativeLuminance(backgroundColor)
        : null;
      let maxContrast = null;
      if (backgroundLuminance != null) {
        normalizedTexts.forEach((_, idx) => {
          const sample = texts[idx];
          const textHex = normalizeHexColor(sample.fill);
          if (!textHex) return;
          const textColor = parseHexColor(textHex);
          if (!textColor) return;
          const luminance = computeRelativeLuminance(textColor);
          const ratio = computeContrastRatio(luminance, backgroundLuminance);
          if (!Number.isFinite(ratio)) return;
          if (maxContrast == null || ratio > maxContrast) {
            maxContrast = ratio;
          }
        });
      }
      const hasHighContrast = maxContrast != null && maxContrast >= 4.5;
      const hasMediumContrast = maxContrast != null && maxContrast >= 3;

      const actionWords = [
        "sign",
        "start",
        "join",
        "buy",
        "try",
        "book",
        "order",
        "contact",
        "talk",
        "get",
        "learn",
        "download",
        "subscribe",
        "регист",
        "купи",
        "закаж",
        "узна",
        "начни",
        "начать",
        "присоед",
        "подпиш",
        "связ",
        "оформ",
        "получ",
        "запиш",
      ];
      const hasActionWord = normalizedTexts.some((text) =>
        actionWords.some((word) => text.includes(word)),
      );

      const footerWords = [
        "privacy",
        "terms",
        "policy",
        "контакт",
        "связь",
        "адрес",
        "почта",
        "email",
        "тел",
        "copyright",
        "©",
        "faq",
      ];
      const hasFooterWord = normalizedTexts.some((text) =>
        footerWords.some((word) => text.includes(word)),
      );

      const byName = (keywords) => keywords.some((keyword) => normalizedName.includes(keyword));

      const heroNameMatch = byName(["hero", "header", "top", "intro", "главная"]);
      const featuresNameMatch = byName([
        "feature",
        "benefit",
        "service",
        "услуг",
        "преимущ",
        "advantages",
      ]);
      const ctaNameMatch = byName([
        "cta",
        "call to action",
        "call-to-action",
        "signup",
        "button",
        "призыв",
      ]);
      const footerNameMatch = byName([
        "footer",
        "подвал",
        "contacts",
        "contact",
        "support",
      ]);

      const heroLayout = upperLayout === "HORIZONTAL" ? "row" : "stack";
      const candidates = [];

      if (grid && Number.isFinite(grid.columns) && grid.columns >= 2) {
        const columns = Math.max(2, Math.round(grid.columns));
        let featuresConfidence = 0.65 + Math.min(0.25, (columns - 2) * 0.05);
        if (upperLayout === "HORIZONTAL") {
          featuresConfidence += 0.05;
        }
        if (avgFontSize != null && avgFontSize <= 24) {
          featuresConfidence += 0.03;
        }
        if (featuresNameMatch) {
          featuresConfidence = Math.max(featuresConfidence, 0.75);
        }
        candidates.push({
          type: "features",
          layout: `grid-${columns}`,
          confidence: clamp01(featuresConfidence),
        });
      } else if (featuresNameMatch) {
        candidates.push({
          type: "features",
          layout: "stack",
          confidence: 0.55,
        });
      }

      let heroConfidence = 0;
      if (index === 0 || heroNameMatch) {
        heroConfidence = index === 0 ? 0.4 : 0.25;
        if (maxFontSize != null && maxFontSize >= 44) {
          heroConfidence += 0.25;
        } else if (maxFontSize != null && maxFontSize >= 34) {
          heroConfidence += 0.18;
        }
        if (mediumTextCount >= 2 || longTextCount > 0) {
          heroConfidence += 0.1;
        }
        if (hasActionWord) {
          heroConfidence += 0.1;
        }
        if (upperLayout === "HORIZONTAL") {
          heroConfidence += 0.05;
        }
        if (heroNameMatch) {
          heroConfidence = Math.max(heroConfidence, 0.7);
        }
        heroConfidence = clamp01(heroConfidence);
        candidates.push({ type: "hero", layout: heroLayout, confidence: heroConfidence });
      }

      let ctaConfidence = 0;
      if (hasActionWord || ctaNameMatch) {
        ctaConfidence = hasActionWord ? 0.45 : 0.35;
        if (maxFontSize != null && maxFontSize >= 26) {
          ctaConfidence += 0.12;
        }
        if (mediumTextCount <= 2) {
          ctaConfidence += 0.05;
        }
        if (texts.length <= 3) {
          ctaConfidence += 0.05;
        }
        if (hasHighContrast) {
          ctaConfidence += 0.15;
        } else if (hasMediumContrast) {
          ctaConfidence += 0.05;
        }
        if (ctaNameMatch) {
          ctaConfidence = Math.max(ctaConfidence, 0.65);
        }
        ctaConfidence = clamp01(ctaConfidence);
        candidates.push({ type: "cta", layout: "stack", confidence: ctaConfidence });
      }

      let footerConfidence = 0;
      if ((total > 1 && index === total - 1) || footerNameMatch || hasFooterWord) {
        footerConfidence = total > 1 && index === total - 1 ? 0.45 : 0.3;
        if (maxFontSize != null && maxFontSize <= 16) {
          footerConfidence += 0.18;
        }
        if (minFontSize != null && minFontSize <= 13) {
          footerConfidence += 0.05;
        }
        if (shortTextCount >= 2) {
          footerConfidence += 0.05;
        }
        if (hasFooterWord) {
          footerConfidence += 0.15;
        }
        if (footerNameMatch) {
          footerConfidence = Math.max(footerConfidence, 0.7);
        }
        footerConfidence = clamp01(footerConfidence);
        candidates.push({ type: "footer", layout: "stack", confidence: footerConfidence });
      }

      if (!candidates.length) {
        return {
          type: "custom",
          layout: "stack",
          confidence: 0.35,
          warnings: ["Тип секции не распознан автоматически — проверьте вручную."],
        };
      }

      candidates.sort((a, b) => b.confidence - a.confidence);
      const best = candidates[0];
      const warnings = [];
      if (best.type === "features" && (!grid || !Number.isFinite(grid.columns))) {
        warnings.push("Секция отмечена как features по названию. Убедитесь, что layout корректен.");
      }

      if (best.confidence < 0.6 && best.type !== "custom") {
        warnings.push(
          `Секция распознана как ${best.type}, но уверенность низкая — проверьте вручную.`,
        );
        return {
          type: "custom",
          layout: best.layout || "stack",
          confidence: clamp01(best.confidence),
          warnings,
        };
      }

      return {
        type: best.type,
        layout: best.layout || "stack",
        confidence: clamp01(best.confidence),
        warnings,
      };
    };

    const proposeTaskSpecFromExport = (exportSpec, options = {}) => {
      const { specVersion = "0.1", fallbackFileId = "REPLACE_WITH_FILE_ID" } = options;
      const warningSet = new Set();
      const pushWarning = (message) => {
        const normalized = ensureString(message);
        if (!normalized) return;
        if (warningSet.has(normalized)) return;
        warningSet.add(normalized);
      };

      if (!isObject(exportSpec)) {
        pushWarning("ExportSpec отсутствует. Сначала выполните Import.");
        return { taskSpec: null, warnings: Array.from(warningSet.values()) };
      }

      const meta = isObject(exportSpec.meta) ? exportSpec.meta : {};
      const target = isObject(exportSpec.target) ? exportSpec.target : {};
      const sectionsRaw = Array.isArray(exportSpec.sections)
        ? exportSpec.sections.filter((item) => isObject(item))
        : [];
      const sectionNodesMap = collectSectionDocumentNodes(exportSpec);

      const pageName = ensureString(target.pageName) || ensureString(meta.pageName) || null;
      const frameName = ensureString(target.frameName) || ensureString(meta.frameName) || null;
      const pageId = ensureString(target.pageId) || null;
      const frameId = ensureString(target.frameId) || ensureString(meta.frameId) || null;
      const fileId = ensureString(target.fileId) || fallbackFileId;

      if (!pageName) {
        pushWarning("target.pageName не найден в ExportSpec. Заполните вручную.");
      }
      if (!frameName) {
        pushWarning("target.frameName не найден в ExportSpec. Заполните вручную.");
      }
      if (!ensureString(target.fileId)) {
        pushWarning("target.fileId не найден. Заполните вручную.");
      }

      const frameSizeRaw = isObject(meta.frameSize) ? meta.frameSize : target.frameSize;
      const frameSize = normalizeFrameSize(frameSizeRaw);
      let finalFrameSize = frameSize;
      if (!frameSize) {
        finalFrameSize = { w: 1440, h: 900 };
        pushWarning("Размер фрейма не найден. Используются значения по умолчанию 1440×900.");
      }

      const idBase = [pageName, frameName].filter(Boolean).join("-") || "selection";
      const specId = slugify(idBase);

      const spacingCandidates = sectionsRaw
        .map((section) => toInt(section.itemSpacing))
        .filter((value) => Number.isFinite(value) && value >= 0);
      const draftGap = spacingCandidates.length ? median(spacingCandidates) : 24;
      const normalizedGap = Number.isFinite(draftGap) ? Math.max(0, Math.round(draftGap)) : 24;
      const normalizedContainer = finalFrameSize && Number.isFinite(finalFrameSize.w)
        ? Math.max(320, Math.round(finalFrameSize.w))
        : 1200;

      const taskSpec = {
        meta: {
          specVersion,
          id: specId ? `${specId}-draft` : "selection-draft",
          proposed: true,
          source: "propose-task-spec",
          frameId: frameId || undefined,
          pageId: pageId || undefined,
        },
        target: {
          fileId,
          pageName: pageName || "REPLACE_PAGE_NAME",
          frameName: frameName || "REPLACE_FRAME_NAME",
          frameSize: finalFrameSize,
        },
        grid: {
          container: normalizedContainer,
          columns: 12,
          gap: normalizedGap,
          margins: 24,
        },
        sections: [],
      };

      sectionsRaw.forEach((section, index) => {
        const rawName = ensureString(section.name);
        const name = rawName || `Section ${index + 1}`;
        const layoutMode = ensureString(section.layoutMode);
        const layout = layoutMode && layoutMode.toUpperCase() === "HORIZONTAL" ? "row" : "stack";
        const padding = normalizePadding(section.padding);
        const spacing = toInt(section.itemSpacing);
        const sectionKey = normalizeSectionKey(rawName);
        const sectionNodes = sectionKey ? sectionNodesMap.get(sectionKey) || [] : [];
        const detection = determineDraftSectionType(section, index, { sectionNodes });
        if (detection.warning) {
          pushWarning(detection.warning);
        }
        const textSamples = collectTextSamples(section)
          .map((sample) => ensureString(sample.characters))
          .filter(Boolean)
          .slice(0, 6);

        const specSection = {
          type: detection.type,
          name,
          layout,
        };
        if (spacing != null && Number.isFinite(spacing)) {
          specSection.spacing = spacing;
        }
        if (padding) {
          specSection.padding = padding;
        }
        if (textSamples.length) {
          specSection.textSamples = textSamples;
        }
        const sectionMeta = { proposed: true };
        const sourceId = ensureString(section.id);
        if (sourceId) {
          sectionMeta.sourceId = sourceId;
        }
        if (layoutMode) {
          sectionMeta.layoutMode = layoutMode;
        }
        if (Object.keys(sectionMeta).length) {
          specSection.meta = sectionMeta;
        }
        taskSpec.sections.push(specSection);
      });

      if (!taskSpec.sections.length) {
        pushWarning("Секции не распознаны автоматически. Добавьте их вручную.");
      }

      return { taskSpec, warnings: Array.from(warningSet.values()) };
    };

    const inferTaskSpecFromExportSpec = (exportSpec, options = {}) => {
      const {
        specVersion = "0.1",
        fallbackFileId = "REPLACE_WITH_FILE_ID",
        defaultColumns = 12,
        defaultGap = 24,
      } = options;

      const warnings = [];
      const warningSet = new Set();
      const pushWarning = (message) => {
        const normalized = ensureString(message);
        if (!normalized) return;
        if (warningSet.has(normalized)) return;
        warningSet.add(normalized);
        warnings.push(normalized);
      };

      if (!isObject(exportSpec)) {
        pushWarning("ExportSpec отсутствует или имеет неверный формат.");
        return { taskSpec: null, warnings };
      }

      const meta = isObject(exportSpec.meta) ? exportSpec.meta : {};
      const target = isObject(exportSpec.target) ? exportSpec.target : {};
      const sectionsRaw = Array.isArray(exportSpec.sections)
        ? exportSpec.sections.filter((item) => isObject(item))
        : [];

      const summaryWarnings = [];
      const directWarnings = Array.isArray(exportSpec.warnings) ? exportSpec.warnings : [];
      const summary = isObject(exportSpec.summary) ? exportSpec.summary : {};
      if (Array.isArray(summary.warnings)) {
        summaryWarnings.push(...summary.warnings);
      }
      summaryWarnings.push(...directWarnings);
      summaryWarnings.forEach((warning) => {
        pushWarning(warning);
      });

      const frameSize =
        normalizeFrameSize(meta.frameSize) || normalizeFrameSize(target.frameSize) || null;
      const fallbackFrameSize = { w: 1200, h: 800 };
      const finalFrameSize = frameSize || fallbackFrameSize;
      if (!frameSize) {
        pushWarning("Размер фрейма не найден в ExportSpec. Используется значение 1200×800 по умолчанию.");
      }

      const containerWidth = finalFrameSize.w;

      const spacingValues = sectionsRaw
        .map((section) => toInt(section.itemSpacing))
        .filter((value) => value != null && value >= 0);
      let gap = spacingValues.length ? median(spacingValues) : null;
      if (gap == null) {
        gap = defaultGap;
        pushWarning(`Не удалось определить gap сетки. Используется значение ${defaultGap}.`);
      }
      gap = Math.max(0, Math.round(gap));

      const columnCandidates = [];
      const columnWidthCandidates = [];
      sectionsRaw.forEach((section) => {
        const grid = section && isObject(section.grid) ? section.grid : null;
        if (!grid) return;
        if (Number.isFinite(grid.columns) && grid.columns >= 1) {
          const columns = Math.max(1, Math.round(grid.columns));
          columnCandidates.push(columns);
          if (Number.isFinite(grid.columnWidth) && grid.columnWidth > 0) {
            columnWidthCandidates.push({ columns, columnWidth: Math.round(grid.columnWidth) });
          }
        }
      });

      let columns = null;
      if (columnCandidates.length) {
        const counts = new Map();
        columnCandidates.forEach((value) => {
          const current = counts.get(value) || 0;
          counts.set(value, current + 1);
        });
        const sorted = Array.from(counts.entries()).sort((a, b) => {
          if (b[1] !== a[1]) return b[1] - a[1];
          return b[0] - a[0];
        });
        columns = sorted.length ? sorted[0][0] : null;
      }
      if (!Number.isInteger(columns) || columns < 1) {
        columns = defaultColumns;
        pushWarning(`Количество колонок сетки не распознано. Используется значение ${defaultColumns}.`);
      }

      const marginCandidates = [];
      sectionsRaw.forEach((section) => {
        const padding = normalizePadding(section && section.padding);
        if (!padding) return;
        if (padding.left != null) marginCandidates.push(padding.left);
        if (padding.right != null) marginCandidates.push(padding.right);
      });
      let margins = marginCandidates.length ? median(marginCandidates) : null;
      if (margins == null && columnWidthCandidates.length) {
        const entry =
          columnWidthCandidates.find((candidate) => candidate.columns === columns) ||
          columnWidthCandidates[0];
        if (entry && entry.columnWidth > 0 && Number.isFinite(containerWidth)) {
          const totalContentWidth = entry.columnWidth * columns + (columns - 1) * gap;
          const computed = Math.round((containerWidth - totalContentWidth) / 2);
          if (Number.isFinite(computed) && computed >= 0) {
            margins = computed;
          }
        }
      }
      if (margins == null) {
        margins = Math.max(0, Math.round(gap));
        pushWarning("Отступы сетки не распознаны. Используется значение, равное gap.");
      }

      const colorStats = new Map();
      const trackColor = (hex, source) => {
        const normalized = normalizeHexColor(hex);
        if (!normalized) return;
        let entry = colorStats.get(normalized);
        if (!entry) {
          const parsed = parseHexColor(normalized);
          entry = {
            hex: normalized,
            count: 0,
            luminance: computeRelativeLuminance(parsed),
            sources: new Set(),
          };
          colorStats.set(normalized, entry);
        }
        entry.count += 1;
        if (source) entry.sources.add(source);
      };

      if (meta && meta.fill && meta.fill.hex) {
        trackColor(meta.fill.hex, "frame");
      }
      sectionsRaw.forEach((section) => {
        if (section && section.fill && section.fill.hex) {
          trackColor(section.fill.hex, "section");
        }
        const textSamples = collectTextSamples(section);
        textSamples.forEach((sample) => {
          trackColor(sample.fill, "text");
        });
      });

      const colorEntries = Array.from(colorStats.values());
      const byCountDescDarkestFirst = (entries) =>
        entries.slice().sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          if (a.luminance !== b.luminance) return a.luminance - b.luminance;
          return a.hex.localeCompare(b.hex);
        });
      const byLightnessDesc = (entries) =>
        entries.slice().sort((a, b) => {
          if (b.luminance !== a.luminance) return b.luminance - a.luminance;
          if (b.count !== a.count) return b.count - a.count;
          return a.hex.localeCompare(b.hex);
        });

      const selectTextColor = () => {
        if (!colorEntries.length) return null;
        const textSources = colorEntries.filter((entry) => entry.sources.has("text"));
        const pool = textSources.length ? textSources : colorEntries;
        const sortedByCount = byCountDescDarkestFirst(pool);
        const topCount = sortedByCount.length ? sortedByCount[0].count : null;
        if (topCount == null) return null;
        const topByCount = sortedByCount.filter((entry) => entry.count === topCount);
        const darkest = topByCount.sort((a, b) => {
          if (a.luminance !== b.luminance) return a.luminance - b.luminance;
          return a.hex.localeCompare(b.hex);
        });
        return darkest.length ? darkest[0] : null;
      };

      const textColor = selectTextColor();
      if (!textColor) {
        pushWarning("Не удалось определить цвет текста. Добавьте его вручную в tokens.colors.text.");
      }

      const selectPrimaryColor = () => {
        if (!colorEntries.length) return null;
        const pool = colorEntries.filter((entry) => !textColor || entry.hex !== textColor.hex);
        if (!pool.length) return null;
        const sorted = byCountDescDarkestFirst(pool);
        return sorted.length ? sorted[0] : null;
      };

      const primaryColor = selectPrimaryColor();
      if (!primaryColor) {
        pushWarning("Не удалось определить основной цвет. Добавьте tokens.colors.primary вручную.");
      }

      const selectNeutralColor = () => {
        if (!colorEntries.length) return null;
        const pool = colorEntries.filter((entry) => !textColor || entry.hex !== textColor.hex);
        if (!pool.length) return null;
        const sorted = byLightnessDesc(pool);
        if (!sorted.length) return null;
        const [first] = sorted;
        if (
          primaryColor &&
          primaryColor.hex === first.hex &&
          sorted.length > 1
        ) {
          const alternative = sorted.find((entry) => entry.hex !== primaryColor.hex);
          if (alternative) {
            return alternative;
          }
        }
        return first;
      };

      const neutralColor = selectNeutralColor();

      if (!neutralColor) {
        pushWarning("Не удалось определить нейтральный цвет. Проверьте tokens.colors.neutral.");
      }

      const fontFamilies = new Map();
      sectionsRaw.forEach((section) => {
        const samples = collectTextSamples(section);
        samples.forEach((sample) => {
          const family = ensureString(sample.fontFamily);
          if (!family) return;
          const current = fontFamilies.get(family) || 0;
          fontFamilies.set(family, current + 1);
        });
      });
      const sortedFamilies = Array.from(fontFamilies.entries()).sort((a, b) => b[1] - a[1]);
      const fontFamily = sortedFamilies.length ? sortedFamilies[0][0] : null;
      if (!fontFamily) {
        pushWarning("Не удалось определить основной шрифт. Заполните tokens.fontFamily вручную.");
      }

      const sections = [];
      sectionsRaw.forEach((section, index) => {
        const total = sectionsRaw.length;
        const detection = determineSectionType(section, index, total);
        const name = ensureString(section.name) || `Section ${index + 1}`;
        const sectionWarnings = [];
        if (Array.isArray(detection.warnings)) {
          detection.warnings.forEach((warning) => {
            const normalized = ensureString(warning);
            if (!normalized) return;
            sectionWarnings.push(normalized);
            pushWarning(normalized);
          });
        }
        const padding = normalizePadding(section.padding);
        const spacing = toInt(section.itemSpacing);
        const textSamples = collectTextSamples(section);
        const specSection = {
          type: detection.type,
          name,
          layout: detection.layout || "stack",
          spacing: spacing != null ? spacing : undefined,
          padding: padding || undefined,
          background: normalizeHexColor(section.fill && section.fill.hex ? section.fill.hex : null) || undefined,
          textSamples: textSamples.map((sample) => sample.characters).filter(Boolean),
          meta: {
            inferred: true,
            sourceId: ensureString(section.id),
            layoutMode: ensureString(section.layoutMode),
            typeConfidence: detection.confidence,
          },
        };
        if (specSection.textSamples && specSection.textSamples.length === 0) {
          delete specSection.textSamples;
        }
        if (specSection.spacing === undefined) {
          delete specSection.spacing;
        }
        if (!specSection.padding) {
          delete specSection.padding;
        }
        if (!specSection.background) {
          delete specSection.background;
        }
        if (sectionWarnings.length) {
          specSection.warnings = sectionWarnings;
        }
        sections.push(specSection);
      });

      if (!sections.length) {
        const fallbackName = ensureString(target.frameName) || "Main";
        pushWarning("ExportSpec не содержит секций. Добавлена заглушка custom.");
        sections.push({
          type: "custom",
          name: fallbackName,
          layout: "stack",
          meta: { inferred: true, typeConfidence: 0 },
          warnings: ["Секция создана автоматически. Замените её вручную."],
        });
      }

      const normalizedPageName = ensureString(target.pageName);
      const normalizedFrameName = ensureString(target.frameName) || ensureString(meta.frameName);
      const normalizedFileId = ensureString(target.fileId);

      if (!normalizedFileId) {
        pushWarning("target.fileId не найден. Замените значение REPLACE_WITH_FILE_ID вручную.");
      }
      if (!normalizedPageName) {
        pushWarning("Имя страницы не найдено в ExportSpec. Заполните target.pageName вручную.");
      }
      if (!normalizedFrameName) {
        pushWarning("Имя фрейма не найдено в ExportSpec. Заполните target.frameName вручную.");
      }

      const pageSlug = slugify(normalizedPageName || "page");
      const frameSlug = slugify(normalizedFrameName || "frame");
      const inferredId = `${pageSlug}-${frameSlug}-draft`;

      const colorTokens = {};
      if (textColor && textColor.hex) {
        colorTokens.text = textColor.hex;
        pushWarning("tokens.colors.text выбрано эвристикой: самый тёмный частотный цвет.");
      }
      if (primaryColor && primaryColor.hex) {
        colorTokens.primary = primaryColor.hex;
        pushWarning(
          "tokens.colors.primary выбрано эвристикой: наиболее частый цвет, отличный от текста.",
        );
      }
      if (neutralColor && neutralColor.hex) {
        colorTokens.neutral = neutralColor.hex;
        pushWarning("tokens.colors.neutral выбрано эвристикой: самый светлый доступный цвет.");
      }

      const tokens = {};
      if (fontFamily) tokens.fontFamily = fontFamily;
      if (Object.keys(colorTokens).length) tokens.colors = colorTokens;

      const taskSpec = {
        meta: {
          specVersion,
          id: inferredId,
          inferred: true,
          source: ensureString(meta.source) || "export-spec",
          frameId: ensureString(target.frameId) || ensureString(meta.frameId) || undefined,
          pageId: ensureString(target.pageId) || undefined,
        },
        target: {
          fileId: normalizedFileId || fallbackFileId,
          pageName: normalizedPageName || "REPLACE_PAGE_NAME",
          frameName: normalizedFrameName || "REPLACE_FRAME_NAME",
          frameSize: finalFrameSize,
        },
        grid: {
          container: containerWidth,
          columns,
          gap,
          margins,
        },
        sections,
        acceptance: {
          maxSpacingDeviation: Math.max(2, Math.round(gap * 0.1)),
          checkAutoLayout: true,
        },
      };

      if (Object.keys(tokens).length) {
        taskSpec.tokens = tokens;
      }

      const uniqueWarnings = Array.from(warningSet.values());
      if (uniqueWarnings.length) {
        taskSpec.meta.warnings = uniqueWarnings;
        taskSpec.warnings = uniqueWarnings;
      }

      return { taskSpec, warnings: uniqueWarnings };
    };

  return {
    parseServerError,
    createRaceGuard,
    createPersistentState,
    normalizeSchemaErrors,
    computeBasicDeviations,
    normalizeTaskSpecInput,
    validateTaskSpecSchema,
    sanitizeFilename,
    stringifyJson,
    proposeTaskSpecFromExport,
    inferTaskSpecFromExportSpec,
  };
})();

if (typeof module === "object" && typeof module.exports === "object") {
  module.exports = PluginUtils;
  module.exports.default = PluginUtils;
}

if (typeof window !== "undefined") {
  window.PluginUtils = PluginUtils;
}

if (typeof globalThis !== "undefined") {
  globalThis.PluginUtils = PluginUtils;
}

if (typeof exports === "object" && exports) {
  exports.default = PluginUtils;
}
