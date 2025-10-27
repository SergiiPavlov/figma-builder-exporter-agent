'use strict';

const { AssertionError } = require('node:assert');

function formatMessage(message, details) {
  if (!message && !details) {
    return undefined;
  }
  if (!details) {
    return message;
  }
  const suffix = typeof details === 'string' ? details : JSON.stringify(details);
  return message ? `${message}: ${suffix}` : suffix;
}

function fail(message, details) {
  throw new AssertionError({ message: formatMessage(message, details) });
}

function ok(value, message, details) {
  if (!value) {
    fail(message || 'Expected value to be truthy', details);
  }
}

function equal(actual, expected, message) {
  if (actual !== expected) {
    fail(message || `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
  }
}

function notEqual(actual, expected, message) {
  if (actual === expected) {
    fail(message || `Expected ${JSON.stringify(actual)} to differ from ${JSON.stringify(expected)}`);
  }
}

function deepEqual(actual, expected, message) {
  const aJson = JSON.stringify(actual);
  const bJson = JSON.stringify(expected);
  if (aJson !== bJson) {
    fail(message || 'Expected values to be deeply equal', { actual, expected });
  }
}

function includes(haystack, needle, message) {
  if (typeof haystack === 'string') {
    if (!haystack.includes(needle)) {
      fail(message || `Expected string to include ${needle}`);
    }
    return;
  }
  if (Array.isArray(haystack)) {
    if (!haystack.includes(needle)) {
      fail(message || `Expected array to include ${needle}`);
    }
    return;
  }
  fail(message || 'Unsupported haystack for includes');
}

function greaterThan(value, min, message) {
  if (!(Number(value) > min)) {
    fail(message || `Expected ${value} to be greater than ${min}`);
  }
}

function greaterOrEqual(value, min, message) {
  if (!(Number(value) >= min)) {
    fail(message || `Expected ${value} to be >= ${min}`);
  }
}

function lessOrEqual(value, max, message) {
  if (!(Number(value) <= max)) {
    fail(message || `Expected ${value} to be <= ${max}`);
  }
}

module.exports = {
  ok,
  fail,
  equal,
  notEqual,
  deepEqual,
  includes,
  greaterThan,
  greaterOrEqual,
  lessOrEqual,
};
