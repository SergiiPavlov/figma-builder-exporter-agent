const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const {
  parseServerError,
  createRaceGuard,
  createPersistentState,
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
