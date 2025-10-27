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

    return { parseServerError, createRaceGuard, createPersistentState };
  },
);
