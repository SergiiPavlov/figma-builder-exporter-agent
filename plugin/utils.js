(function (global, factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory();
  } else {
    const result = factory();
    global.PluginUtils = Object.assign({}, global.PluginUtils || {}, result);
  }
})(
  typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : global,
  function () {
    const isObject = (value) => value !== null && typeof value === "object";

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

    const determineSectionType = (section, index, total) => {
      const name = ensureString(section && section.name);
      const normalizedName = name ? name.toLowerCase() : "";
      const layoutMode = ensureString(section && section.layoutMode);
      const grid = section && isObject(section.grid) ? section.grid : null;
      if (grid && Number.isFinite(grid.columns) && grid.columns >= 2) {
        const columns = Math.max(2, Math.round(grid.columns));
        return {
          type: "features",
          layout: `grid-${columns}`,
          confidence: 0.9,
          columns,
        };
      }
      const byName = (keywords) => keywords.some((keyword) => normalizedName.includes(keyword));
      if (byName(["hero", "header", "top", "intro"])) {
        return {
          type: "hero",
          layout: layoutMode && layoutMode.toUpperCase() === "HORIZONTAL" ? "row" : "stack",
          confidence: 0.9,
        };
      }
      if (byName(["cta", "call to action", "call-to-action", "signup", "button"])) {
        return {
          type: "cta",
          layout: "stack",
          confidence: 0.8,
        };
      }
      if (byName(["footer", "подвал", "contacts", "contact"])) {
        return {
          type: "footer",
          layout: "stack",
          confidence: 0.9,
        };
      }
      if (byName(["feature", "benefit", "service", "услуг", "преимущ", "advantages"])) {
        return {
          type: "features",
          layout: "stack",
          confidence: 0.6,
          warning: "Секция помечена как features по названию, проверьте layout.",
        };
      }
      if (index === 0) {
        return {
          type: "hero",
          layout: layoutMode && layoutMode.toUpperCase() === "HORIZONTAL" ? "row" : "stack",
          confidence: 0.6,
          warning: "Первая секция классифицирована как hero по позиции.",
        };
      }
      if (total > 1 && index === total - 1) {
        return {
          type: "footer",
          layout: "stack",
          confidence: 0.6,
          warning: "Последняя секция классифицирована как footer по позиции.",
        };
      }
      return {
        type: "custom",
        layout: "stack",
        confidence: 0.4,
        warning: "Тип секции не распознан, используется custom.",
      };
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
      const selectTextColor = () => {
        if (!colorEntries.length) return null;
        const textCandidates = colorEntries
          .filter((entry) => entry.sources.has("text"))
          .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.luminance - b.luminance;
          });
        if (textCandidates.length) {
          return textCandidates[0];
        }
        const darkest = colorEntries
          .slice()
          .sort((a, b) => {
            if (a.luminance !== b.luminance) return a.luminance - b.luminance;
            return b.count - a.count;
          });
        if (darkest.length) {
          pushWarning("Цвет текста определён эвристикой по самому тёмному цвету.");
          return darkest[0];
        }
        return null;
      };

      const textColor = selectTextColor();
      if (!textColor) {
        pushWarning("Не удалось определить цвет текста. Добавьте его вручную в tokens.colors.text.");
      }

      const selectPrimaryColor = () => {
        if (!colorEntries.length) return null;
        const candidates = colorEntries
          .filter((entry) => !textColor || entry.hex !== textColor.hex)
          .map((entry) => {
            const contrast = textColor
              ? computeContrastRatio(entry.luminance, textColor.luminance)
              : 1;
            const hasSection = entry.sources.has("section") || entry.sources.has("frame");
            return { entry, contrast, hasSection };
          })
          .sort((a, b) => {
            if (a.hasSection !== b.hasSection) return a.hasSection ? -1 : 1;
            if (b.contrast !== a.contrast) return b.contrast - a.contrast;
            if (b.entry.count !== a.entry.count) return b.entry.count - a.entry.count;
            return b.entry.luminance - a.entry.luminance;
          });
        if (candidates.length && candidates[0].contrast >= 2) {
          return candidates[0].entry;
        }
        return candidates.length ? candidates[0].entry : null;
      };

      const primaryColor = selectPrimaryColor();
      if (!primaryColor) {
        pushWarning("Не удалось определить основной цвет. Добавьте tokens.colors.primary вручную.");
      }

      const selectNeutralColor = () => {
        if (!colorEntries.length) return null;
        const candidates = colorEntries
          .filter((entry) => !textColor || entry.hex !== textColor.hex)
          .sort((a, b) => {
            if (b.luminance !== a.luminance) return b.luminance - a.luminance;
            return b.count - a.count;
          });
        return candidates.length ? candidates[0] : null;
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
        if (detection.warning) {
          sectionWarnings.push(detection.warning);
          pushWarning(detection.warning);
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
      if (primaryColor) colorTokens.primary = primaryColor.hex;
      if (textColor) colorTokens.text = textColor.hex;
      if (neutralColor) colorTokens.neutral = neutralColor.hex;

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
          maxSpacingDeviation: Math.max(2, Math.round(gap * 0.1) || 2),
          checkAutoLayout: true,
        },
      };

      if (Object.keys(tokens).length) {
        taskSpec.tokens = tokens;
      }

      const uniqueWarnings = Array.from(warningSet.values());
      if (uniqueWarnings.length) {
        taskSpec.warnings = uniqueWarnings;
      }

      return { taskSpec, warnings: uniqueWarnings };
    };

    return {
      parseServerError,
      createRaceGuard,
      createPersistentState,
      normalizeSchemaErrors,
      validateTaskSpecSchema,
      sanitizeFilename,
      inferTaskSpecFromExportSpec,
    };
  },
);
