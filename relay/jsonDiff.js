'use strict';

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function deepEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (typeof a !== typeof b) {
    return false;
  }
  if (a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
      return false;
    }
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) {
        return false;
      }
      if (!deepEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function formatPath(base, key, { isIndex = false } = {}) {
  const segment = String(key);
  if (isIndex) {
    if (!base) {
      return `[${segment}]`;
    }
    return `${base}[${segment}]`;
  }
  if (!base) {
    return segment;
  }
  return `${base}.${segment}`;
}

function normalizeDiffValue(value) {
  return value === undefined ? null : value;
}

function compareValues(left, right, path, summary, diff, options) {
  if (left === undefined && right === undefined) {
    return;
  }
  if (left === undefined) {
    summary.added += 1;
    diff.push({
      path,
      type: 'added',
      left: null,
      right: normalizeDiffValue(right),
    });
    return;
  }
  if (right === undefined) {
    summary.removed += 1;
    diff.push({
      path,
      type: 'removed',
      left: normalizeDiffValue(left),
      right: null,
    });
    return;
  }

  if (deepEqual(left, right)) {
    summary.unchanged += 1;
    if (options.includeUnchanged) {
      diff.push({
        path,
        type: 'unchanged',
        left: normalizeDiffValue(left),
        right: normalizeDiffValue(right),
      });
    }
    return;
  }

  const leftArray = Array.isArray(left);
  const rightArray = Array.isArray(right);
  if (leftArray && rightArray) {
    const maxLength = Math.max(left.length, right.length);
    for (let i = 0; i < maxLength; i += 1) {
      const childPath = formatPath(path, i, { isIndex: true });
      compareValues(left[i], right[i], childPath, summary, diff, options);
    }
    return;
  }

  const leftObject = isPlainObject(left);
  const rightObject = isPlainObject(right);
  if (leftObject && rightObject) {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    for (const key of keys) {
      const childPath = formatPath(path, key);
      compareValues(left[key], right[key], childPath, summary, diff, options);
    }
    return;
  }

  summary.changed += 1;
  diff.push({
    path,
    type: 'changed',
    left: normalizeDiffValue(left),
    right: normalizeDiffValue(right),
  });
}

function diffExportSpecs(left, right, { includeUnchanged = false } = {}) {
  const summary = { added: 0, removed: 0, changed: 0, unchanged: 0 };
  const diff = [];
  compareValues(left, right, '', summary, diff, { includeUnchanged });
  return { summary, diff };
}

module.exports = {
  diffExportSpecs,
};
