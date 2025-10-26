const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { once } = require('node:events');
const { Readable } = require('node:stream');

const { startRelayServer } = require('../server');

const SAMPLE_TASK_SPEC = {
  meta: { specVersion: '0.1', id: 'zip-test' },
  target: {
    fileId: 'F',
    pageName: 'Page',
    frameName: 'Frame',
    frameSize: { w: 100, h: 100 },
  },
  grid: { container: 100, columns: 4, gap: 8, margins: 8 },
  sections: [{ type: 'hero', name: 'Hero' }],
};

async function startServer(t) {
  const server = startRelayServer(0);
  await once(server, 'listening');
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });
  const address = server.address();
  assert.ok(address && typeof address.port === 'number');
  const baseUrl = `http://127.0.0.1:${address.port}`;
  return { server, baseUrl };
}

async function createCompletedTask(baseUrl) {
  const taskRes = await fetch(`${baseUrl}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskSpec: SAMPLE_TASK_SPEC }),
  });
  assert.equal(taskRes.status, 200);
  const taskData = await taskRes.json();
  assert.ok(taskData.taskId);
  const taskId = taskData.taskId;

  const resultRes = await fetch(`${baseUrl}/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskId,
      exportSpec: { ok: true },
      logs: ['build started', 'build done'],
    }),
  });
  assert.equal(resultRes.status, 200);
  const resultData = await resultRes.json();
  assert.deepEqual(resultData, { ok: true });
  return taskId;
}

function getArtifactPath(taskId) {
  return path.join(__dirname, '..', 'data', 'results', `${taskId}.json`);
}

test('package.zip responds with 5xx when artifact disappears mid-stream', async (t) => {
  const { baseUrl } = await startServer(t);
  const taskId = await createCompletedTask(baseUrl);
  const artifactPath = getArtifactPath(taskId);
  const backupPath = `${artifactPath}.bak-test`;
  await fs.promises.rename(artifactPath, backupPath);
  t.after(async () => {
    try {
      await fs.promises.rename(backupPath, artifactPath);
    } catch (_) {}
  });

  const originalExistsSync = fs.existsSync;
  fs.existsSync = (filePath) => {
    if (filePath === artifactPath) return true;
    return originalExistsSync.call(fs, filePath);
  };
  t.after(() => {
    fs.existsSync = originalExistsSync;
  });

  const zipRes = await fetch(`${baseUrl}/tasks/${taskId}/package.zip`);
  assert.equal(zipRes.status, 500);
  const body = await zipRes.json();
  assert.equal(body.error, 'Artifact read error');

  const healthRes = await fetch(`${baseUrl}/health`);
  assert.equal(healthRes.status, 200);
  await healthRes.json();
});

test('package.zip handles fs.createReadStream errors gracefully', async (t) => {
  const { baseUrl } = await startServer(t);
  const taskId = await createCompletedTask(baseUrl);
  const artifactPath = getArtifactPath(taskId);

  const originalCreateReadStream = fs.createReadStream;
  fs.createReadStream = (filePath, options) => {
    if (filePath === artifactPath) {
      const stream = new Readable({
        read() {
          this.destroy(new Error('forced read error'));
        },
      });
      process.nextTick(() => {
        stream.emit('error', new Error('forced read error'));
      });
      return stream;
    }
    return originalCreateReadStream.call(fs, filePath, options);
  };
  t.after(() => {
    fs.createReadStream = originalCreateReadStream;
  });

  const zipRes = await fetch(`${baseUrl}/tasks/${taskId}/package.zip`);
  assert.equal(zipRes.status, 500);
  const body = await zipRes.json();
  assert.equal(body.error, 'Artifact read error');

  const healthRes = await fetch(`${baseUrl}/health`);
  assert.equal(healthRes.status, 200);
  await healthRes.json();
});
