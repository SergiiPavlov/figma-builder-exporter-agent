const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const url = require("node:url");
const vm = require("node:vm");

const {
  parseServerError,
  createRaceGuard,
  createPersistentState,
  normalizeSchemaErrors,
  computeBasicDeviations,
  validateTaskSpecSchema,
  proposeTaskSpecFromExport,
} = require("../utils.js");

describe("parseServerError", () => {
  test("returns formatted code and message", () => {
    const message = parseServerError({ error: { code: "E401", message: "Unauthorized" } });
    assert.equal(message, "E401: Unauthorized");
  });

  test("falls back to message string", () => {
    const message = parseServerError({ message: "Too large" }, "fallback");
    assert.equal(message, "Too large");
  });
});

describe("createRaceGuard", () => {
  test("only latest token remains active", async () => {
    const guard = createRaceGuard();
    const first = guard.start();
    assert.ok(guard.isActive(first.token));

    const second = guard.start();
    assert.ok(!guard.isActive(first.token));
    assert.ok(guard.isActive(second.token));

    guard.finish(second.token);
    assert.ok(guard.isActive(second.token));
  });
});

describe("createPersistentState", () => {
  let storage;

  beforeEach(() => {
    const map = new Map();
    storage = {
      getItem: (key) => (map.has(key) ? map.get(key) : null),
      setItem: (key, value) => {
        map.set(key, value);
      },
      removeItem: (key) => {
        map.delete(key);
      },
    };
  });

  test("stores and retrieves json values", () => {
    const state = createPersistentState("demo", { storage });
    state.write({ order: "asc" });
    assert.deepEqual(state.read(), { order: "asc" });
  });
});

describe("normalizeSchemaErrors", () => {
  test("maps ajv style errors to path/message pairs", () => {
    const normalized = normalizeSchemaErrors([
      { instancePath: "/meta/id", message: "must be string" },
      { dataPath: "/grid/columns", message: "must be >= 1" },
      { path: "", message: "root" },
    ]);

    assert.deepEqual(normalized, [
      { path: "/meta/id", message: "must be string" },
      { path: "/grid/columns", message: "must be >= 1" },
      { path: "/", message: "root" },
    ]);
  });

  test("handles non-array inputs", () => {
    assert.deepEqual(normalizeSchemaErrors(null), []);
  });
});

describe("computeBasicDeviations", () => {
  test("detects deviations above tolerance", () => {
    const deviations = computeBasicDeviations(
      { itemSpacing: 16, padding: { top: 24, left: 32 } },
      { itemSpacing: 20, paddingTop: 28, paddingLeft: 27 },
      2,
    );

    assert.deepEqual(deviations, [
      { property: "itemSpacing", expected: 16, actual: 20, delta: 4 },
      { property: "paddingTop", expected: 24, actual: 28, delta: 4 },
      { property: "paddingLeft", expected: 32, actual: 27, delta: -5 },
    ]);
  });

  test("respects custom tolerance", () => {
    const deviations = computeBasicDeviations(
      { padding: { right: 24 } },
      { paddingRight: 27 },
      4,
    );

    assert.deepEqual(deviations, []);
  });

  test("ignores deviations at tolerance threshold", () => {
    const deviations = computeBasicDeviations(
      { padding: { top: 20 } },
      { paddingTop: 22 },
      2,
    );

    assert.deepEqual(deviations, []);
  });

  test("ignores missing or non-finite values", () => {
    const deviations = computeBasicDeviations(
      { itemSpacing: 12, padding: { bottom: 16 } },
      { itemSpacing: null, paddingBottom: "auto" },
    );

    assert.deepEqual(deviations, []);
  });

  test("detects grid gap deviations", () => {
    const deviations = computeBasicDeviations(
      { gridGap: 24 },
      { gridGap: 32 },
      2,
    );

    assert.deepEqual(deviations, [
      { property: "gridGap", expected: 24, actual: 32, delta: 8 },
    ]);
  });

  test("detects layout mode mismatches", () => {
    const deviations = computeBasicDeviations(
      { layoutMode: "VERTICAL" },
      { layoutMode: "HORIZONTAL" },
    );

    assert.deepEqual(deviations, [
      { property: "layoutMode", expected: "VERTICAL", actual: "HORIZONTAL", delta: null },
    ]);
  });
});

describe("validateTaskSpecSchema", () => {
  const baseSpec = {
    meta: { specVersion: "0.1", id: "demo" },
    target: {
      fileId: "file",
      pageName: "Page",
      frameName: "Frame",
      frameSize: { w: 100, h: 100 },
    },
    grid: { container: 1200, columns: 12, gap: 24, margins: 24 },
    sections: [{ type: "hero", name: "Hero" }],
  };

  test("accepts valid spec", () => {
    const result = validateTaskSpecSchema(baseSpec);
    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
  });

  test("reports missing required structures", () => {
    const result = validateTaskSpecSchema({});
    assert.equal(result.valid, false);
    const paths = result.errors.map((err) => err.path);
    assert.ok(paths.includes("/meta"));
    assert.ok(paths.includes("/target"));
    assert.ok(paths.includes("/grid"));
    assert.ok(paths.includes("/sections"));
  });

  test("validates section type enum", () => {
    const spec = {
      ...baseSpec,
      sections: [{ type: "unknown", name: "Hero" }],
    };
    const result = validateTaskSpecSchema(spec);
    assert.equal(result.valid, false);
    assert.deepEqual(result.errors[0], {
      path: "/sections/0/type",
      message: "type must be one of hero, features, gallery, cta, footer, custom",
    });
  });
});

describe("proposeTaskSpecFromExport", () => {
  test("detects gallery sections", () => {
    const rectangles = Array.from({ length: 6 }).map((_, index) => ({
      id: `rect-${index + 1}`,
      name: `Item ${index + 1}`,
      type: "RECTANGLE",
      section: "Gallery",
      absBounds: { x: index * 10, y: 0, w: 320, h: 200 },
    }));

    const exportSpec = {
      meta: {
        frameId: "1:1",
        frameName: "Frame",
        frameSize: { width: 1200, height: 800 },
      },
      target: {
        fileId: "FILE123",
        pageName: "Marketing",
        frameName: "Frame",
        frameSize: { width: 1200, height: 800 },
      },
      sections: [
        {
          id: "10:1",
          name: "Gallery",
          layoutMode: "VERTICAL",
          itemSpacing: 24,
          padding: { top: 32, right: 32, bottom: 32, left: 32 },
          grid: { columns: 3, gap: 24, columnWidth: 320 },
          size: { width: 1024, height: 768 },
          texts: [],
        },
      ],
      document: {
        nodes: [
          ...rectangles,
          {
            id: "text-1",
            name: "Caption",
            type: "TEXT",
            section: "Gallery",
            absBounds: { x: 0, y: 210, w: 200, h: 24 },
          },
          {
            id: "text-2",
            name: "Subcaption",
            type: "TEXT",
            section: "Gallery",
            absBounds: { x: 0, y: 240, w: 220, h: 24 },
          },
        ],
      },
    };

    const { taskSpec, warnings } = proposeTaskSpecFromExport(exportSpec, {
      fallbackFileId: "FILE123",
    });

    assert.ok(taskSpec);
    assert.equal(Array.isArray(taskSpec.sections), true);
    assert.equal(taskSpec.sections[0].type, "gallery");
    assert.equal(taskSpec.sections[0].name, "Gallery");
    assert.equal(taskSpec.sections[0].layout, "stack");
    assert.equal(Array.isArray(warnings) && warnings.length, 0);
  });
});

describe("PluginUtils UMD exports", () => {
  test("default import returns object", async () => {
    const moduleUrl = url.pathToFileURL(path.resolve(__dirname, "../utils.js"));
    const imported = await import(moduleUrl);
    assert.equal(typeof imported.default, "object");
    assert.ok(imported.default);
    assert.equal(typeof imported.default.parseServerError, "function");
  });

  test("exposes PluginUtils on window when evaluated globally", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../utils.js"), "utf8");
    const context = {
      window: {},
      globalThis: {},
    };
    vm.runInNewContext(source, context);
    assert.equal(typeof context.window.PluginUtils, "object");
    assert.equal(typeof context.window.PluginUtils.parseServerError, "function");
  });
});
