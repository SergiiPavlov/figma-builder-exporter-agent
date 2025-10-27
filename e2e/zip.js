'use strict';

const path = require('node:path');
const { createRequire } = require('node:module');

function loadJsZip() {
  const candidates = [
    () => require('jszip'),
    () => {
      const requireFromRelay = createRequire(path.join(__dirname, '..', 'relay', 'package.json'));
      return requireFromRelay('jszip');
    },
  ];
  const errors = [];
  for (const loader of candidates) {
    try {
      const mod = loader();
      if (mod) {
        return mod;
      }
    } catch (err) {
      errors.push(err);
    }
  }
  const message = ['Failed to load jszip module required for E2E tests.'];
  for (const err of errors) {
    message.push(String(err && err.message ? err.message : err));
  }
  throw new Error(message.join('\n'));
}

const JSZip = loadJsZip();

async function readZipEntries(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('Expected buffer for readZipEntries');
  }
  const zip = await JSZip.loadAsync(buffer);
  const entries = {};
  await Promise.all(
    Object.keys(zip.files).map(async (name) => {
      const entry = zip.files[name];
      if (!entry || entry.dir) {
        return;
      }
      entries[name] = await entry.async('string');
    }),
  );
  return entries;
}

module.exports = { readZipEntries };
