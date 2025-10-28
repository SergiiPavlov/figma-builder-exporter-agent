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
        const allowedTypes = new Set(["hero", "features", "gallery", "cta", "footer"]);
        sections.forEach((section, index) => {
          const basePath = `/sections/${index}`;
          if (!isObject(section)) {
            addError(basePath, "section must be an object");
            return;
          }
          if (typeof section.type !== "string" || !allowedTypes.has(section.type)) {
            addError(
              `${basePath}/type`,
              "type must be one of hero, features, gallery, cta, footer",
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

    return {
      parseServerError,
      createRaceGuard,
      createPersistentState,
      normalizeSchemaErrors,
      validateTaskSpecSchema,
      sanitizeFilename,
    };
  },
);
