#!/usr/bin/env node
'use strict';

const fsp = require('node:fs/promises');
const path = require('node:path');

const assert = require('./assert');
const { createHttpClient } = require('./http');
const { readZipEntries } = require('./zip');

async function main() {
  const args = new Set(process.argv.slice(2));
  const isCi = args.has('--ci');

  const relayUrl = process.env.RELAY_URL || 'http://localhost:3000';
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('API_KEY environment variable is required to run e2e tests.');
    return 1;
  }
  const previewLimit = Number(process.env.PREVIEW_MAX_BYTES) || 2_000_000;

  const artifactsDir = path.join(__dirname, 'artifacts');
  await fsp.mkdir(artifactsDir, { recursive: true });
  const logFile = path.join(artifactsDir, 'e2e.log');
  const diffHtmlFile = path.join(artifactsDir, 'e2e-diff.html');
  const diffZipFile = path.join(artifactsDir, 'e2e-diff.zip');

  const logLines = [];
  const log = (...parts) => {
    const message = parts
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part == null) return '';
        try {
          return JSON.stringify(part);
        } catch {
          return String(part);
        }
      })
      .join(' ')
      .trim();
    const line = message || '';
    logLines.push(line);
    console.log(line);
  };

  const client = createHttpClient({ baseUrl: relayUrl, apiKey, timeoutMs: isCi ? 20000 : 15000, logger: log });
  const startTime = Date.now();

  try {
    log('▶️ Checking relay health...');
    const health = await client.getJson('/health');
    assert.equal(health.status, 200, 'Health check status');
    assert.ok(health.body && health.body.ok === true, 'Health response ok flag');

    const taskSpecBase = {
      meta: { specVersion: '1.0.0', id: `spec-${Date.now()}` },
      target: {
        fileId: 'file-123',
        pageName: 'Landing Page',
        frameName: 'Hero Frame',
        frameSize: { w: 1200, h: 800 },
      },
      grid: { container: 1200, columns: 12, gap: 24, margins: 16 },
      sections: [
        { type: 'hero', name: 'Top Section' },
        { type: 'features', name: 'Feature Blocks' },
      ],
      acceptance: { maxSpacingDeviation: 2, checkAutoLayout: false },
    };

    log('▶️ Creating tasks...');
    const taskOneSpec = {
      ...taskSpecBase,
      meta: { ...taskSpecBase.meta, id: `${taskSpecBase.meta.id}-a` },
      sections: [...taskSpecBase.sections, { type: 'cta', name: 'Call to action' }],
    };
    const taskTwoSpec = {
      ...taskSpecBase,
      meta: { ...taskSpecBase.meta, id: `${taskSpecBase.meta.id}-b` },
      sections: [...taskSpecBase.sections, { type: 'gallery', name: 'Screenshots' }],
    };

    const createOne = await client.postJson('/tasks', { taskSpec: taskOneSpec });
    assert.equal(createOne.status, 200, 'Create first task status');
    assert.ok(createOne.body && createOne.body.taskId, 'Create first task payload');
    const taskOneId = createOne.body.taskId;

    const createTwo = await client.postJson('/tasks', { taskSpec: taskTwoSpec });
    assert.equal(createTwo.status, 200, 'Create second task status');
    assert.ok(createTwo.body && createTwo.body.taskId, 'Create second task payload');
    const taskTwoId = createTwo.body.taskId;
    log('Task IDs', { taskOneId, taskTwoId });

    const sseEvents = [];
    let statusReceived = false;
    let logEvents = 0;
    let resultReceived = false;

    const watchPromise = client.streamSse(`/tasks/${taskOneId}/watch`, {
      timeout: isCi ? 25000 : 20000,
      onEvent: ({ event, data }) => {
        sseEvents.push({ event, data });
        if (event === 'status') {
          statusReceived = true;
        }
        if (event === 'log') {
          logEvents += 1;
        }
        if (event === 'result') {
          resultReceived = true;
        }
        if (event === 'preview') {
          log('Received preview event');
        }
        if (statusReceived && logEvents >= 2 && resultReceived) {
          return 'stop';
        }
        return true;
      },
    });

    const logMessages = ['Processing layout', 'Assembling components'];
    log('▶️ Writing task logs...');
    for (const message of logMessages) {
      const res = await client.postJson(`/tasks/${taskOneId}/log`, { message });
      assert.equal(res.status, 200, 'Log post status');
      assert.ok(res.body && res.body.ok === true, 'Log post payload');
    }

    const exportSpecOne = {
      meta: { version: 1, generatedAt: new Date().toISOString() },
      target: { id: taskOneId, variant: 'primary' },
      summary: { sections: taskOneSpec.sections.length, notes: 'First export' },
    };
    const exportSpecTwo = {
      meta: { version: 2, generatedAt: new Date().toISOString() },
      target: { id: taskTwoId, variant: 'secondary' },
      summary: { sections: taskTwoSpec.sections.length + 1, notes: 'Second export variant' },
    };

    log('▶️ Finalizing task results...');
    const resultOne = await client.postJson(`/tasks/${taskOneId}/result`, { result: exportSpecOne });
    assert.equal(resultOne.status, 200, 'Result first task status');
    assert.ok(resultOne.body && resultOne.body.ok === true, 'Result first task payload');

    const resultTwo = await client.postJson(`/tasks/${taskTwoId}/result`, { result: exportSpecTwo });
    assert.equal(resultTwo.status, 200, 'Result second task status');
    assert.ok(resultTwo.body && resultTwo.body.ok === true, 'Result second task payload');

    log('▶️ Waiting for task stream events...');
    await watchPromise;
    assert.ok(statusReceived, 'SSE status event received');
    assert.greaterOrEqual(logEvents, 2, 'SSE log events received');
    assert.ok(resultReceived, 'SSE result event received');

    log('▶️ Fetching task artifact JSON...');
    const artifactJson = await client.getJson(`/tasks/${taskOneId}/artifact`);
    assert.equal(artifactJson.status, 200, 'Artifact JSON status');
    assert.deepEqual(artifactJson.body, exportSpecOne, 'Artifact JSON matches export spec');

    log('▶️ Fetching task artifact ZIP...');
    const artifactZip = await client.getBuffer(`/tasks/${taskOneId}/package.zip`, {
      expectJson: false,
    });
    assert.equal(artifactZip.status, 200, 'Artifact ZIP status');
    assert.greaterThan(artifactZip.body.length, 0, 'Artifact ZIP non-empty');
    const artifactEntries = await readZipEntries(artifactZip.body);
    assert.ok(artifactEntries['exportSpec.json'], 'Artifact ZIP contains exportSpec.json');

    log('▶️ Uploading preview...');
    const tinyPngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PnOQgAAAAABJRU5ErkJggg';
    const previewResponse = await client.postJson(`/tasks/${taskOneId}/preview`, {
      contentType: 'image/png',
      base64: tinyPngBase64,
    });
    if (previewResponse.status === 404) {
      log('Preview endpoint disabled, skipping preview checks');
    } else {
      assert.equal(previewResponse.status, 200, 'Preview upload status');
      assert.ok(previewResponse.body && previewResponse.body.ok, 'Preview upload ok');
      assert.lessOrEqual(previewResponse.body.size, previewLimit, 'Preview respects size limit');

      const previewFetch = await client.getBuffer(`/tasks/${taskOneId}/preview.png`, {
        expectJson: false,
      });
      assert.equal(previewFetch.status, 200, 'Preview PNG status');
      const type = previewFetch.headers['content-type'];
      assert.equal(type, 'image/png', 'Preview PNG content type');
      assert.greaterThan(previewFetch.body.length, 0, 'Preview PNG content');
    }

    log('▶️ Creating share token...');
    const shareResponse = await client.postJson(`/tasks/${taskOneId}/share`, { type: 'json', ttlMin: 30 });
    assert.equal(shareResponse.status, 200, 'Share creation status');
    assert.ok(shareResponse.body && shareResponse.body.url, 'Share URL present');
    const shareUrl = shareResponse.body.url;
    const token = shareUrl.split('/').pop();
    assert.ok(token, 'Share token extracted');

    const shared = await client.getJson(`/shared/${token}`, { authenticated: false });
    assert.equal(shared.status, 200, 'Shared artifact status');
    assert.deepEqual(shared.body, exportSpecOne, 'Shared artifact JSON matches');

    log('▶️ Comparing artifacts...');
    const compareResponse = await client.postJson('/artifacts/compare', {
      leftId: taskOneId,
      rightId: taskTwoId,
    });
    assert.equal(compareResponse.status, 200, 'Compare API status');
    assert.ok(compareResponse.body && compareResponse.body.summary, 'Compare summary present');
    const diffPayload = compareResponse.body.diff;
    assert.ok(diffPayload && Object.keys(diffPayload).length > 0, 'Compare diff not empty');

    const compareHtml = await client.getText(
      `/artifacts/compare.html?leftId=${encodeURIComponent(taskOneId)}&rightId=${encodeURIComponent(taskTwoId)}`,
      {
        expectJson: false,
      },
    );
    assert.equal(compareHtml.status, 200, 'Compare HTML status');
    const htmlHeaders = compareHtml.headers;
    assert.equal(htmlHeaders['content-type'], 'text/html; charset=utf-8', 'Compare HTML content type');
    assert.ok(htmlHeaders['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options set');
    assert.ok(htmlHeaders['referrer-policy'] === 'no-referrer', 'Referrer-Policy set');
    assert.ok(htmlHeaders['x-frame-options'] === 'DENY', 'X-Frame-Options set');
    assert.ok(htmlHeaders['content-security-policy'], 'Content-Security-Policy set');
    assert.ok(!compareHtml.body.includes('apiKey='), 'Compare HTML sanitized');
    await fsp.writeFile(diffHtmlFile, compareHtml.body, 'utf8');

    const compareZip = await client.getBuffer(
      `/artifacts/compare.zip?leftId=${encodeURIComponent(taskOneId)}&rightId=${encodeURIComponent(taskTwoId)}`,
      {
        expectJson: false,
      },
    );
    assert.equal(compareZip.status, 200, 'Compare ZIP status');
    assert.equal(compareZip.headers['content-type'], 'application/zip', 'Compare ZIP content type');
    assert.greaterThan(compareZip.body.length, 0, 'Compare ZIP non-empty');
    await fsp.writeFile(diffZipFile, compareZip.body);
    const compareEntries = await readZipEntries(compareZip.body);
    assert.ok(compareEntries['diff.json'], 'Compare ZIP contains diff.json');
    assert.ok(compareEntries['diff.html'], 'Compare ZIP contains diff.html');
    assert.ok(!compareEntries['diff.html'].includes('apiKey='), 'Compare ZIP HTML sanitized');

    log('▶️ Checking unauthorized access...');
    const unauthorized = await client.getJson(`/tasks/${taskOneId}`, { authenticated: false });
    assert.equal(unauthorized.status, 401, 'Unauthorized status');
    assert.ok(
      unauthorized.body && unauthorized.body.error && unauthorized.body.error.code === 401,
      'Unauthorized error payload',
    );

    log('▶️ Checking payload limit enforcement...');
    const hugePayload = 'x'.repeat(1_200_000);
    const tooLarge = await client.post('/tasks', JSON.stringify({ note: hugePayload }), {
      authenticated: true,
      headers: { 'Content-Type': 'application/json' },
      expectJson: true,
      responseType: 'json',
    });
    assert.equal(tooLarge.status, 413, 'Payload limit status');
    assert.ok(tooLarge.body && tooLarge.body.error && tooLarge.body.error.code === 413, 'Payload limit body');
    assert.equal(tooLarge.body.error.message, 'Payload too large', 'Payload limit message');

    log('✅ All E2E checks passed');
    const durationMs = Date.now() - startTime;
    log(`⏱️ Duration: ${durationMs}ms`);
    return 0;
  } catch (err) {
    log('❌ E2E checks failed');
    log(err && err.stack ? err.stack : String(err));
    return 1;
  } finally {
    try {
      await fsp.writeFile(logFile, `${logLines.join('\n')}\n`, 'utf8');
    } catch (err) {
      console.error('Failed to write e2e log file:', err);
    }
  }
}

main()
  .then((code) => {
    process.exitCode = typeof code === 'number' ? code : 0;
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
