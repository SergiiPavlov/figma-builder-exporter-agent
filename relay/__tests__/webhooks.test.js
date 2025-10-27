const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const supertest = require('supertest');

const { createApp } = require('../app');

function createTempDataDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'relay-webhook-data-'));
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function startWebhookReceiver(responder) {
  const received = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString('utf8');
    });
    req.on('end', () => {
      let parsed = null;
      if (body) {
        try {
          parsed = JSON.parse(body);
        } catch (err) {
          parsed = { parseError: err.message, raw: body };
        }
      }
      received.push({ method: req.method, url: req.url, body: parsed, headers: req.headers });
      if (typeof responder === 'function') {
        responder(req, res, parsed);
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{}');
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      resolve({
        port: address.port,
        received,
        close: () =>
          new Promise((resolveClose) => {
            server.close(resolveClose);
          }),
      });
    });
  });
}

async function waitForCondition(predicate, { timeout = 4000, interval = 50 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (predicate()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error('Condition not met within timeout');
}

describe('Relay webhook notifications', () => {
  let dataDir;
  let app;

  beforeEach(() => {
    dataDir = createTempDataDir();
  });

  afterEach(async () => {
    if (app && typeof app.__webhooksIdle === 'function') {
      await app.__webhooksIdle();
    }
    app = null;
    if (dataDir) {
      removeDir(dataDir);
      dataDir = null;
    }
    jest.restoreAllMocks();
  });

  test('sends task.done webhook after result submission', async () => {
    const receiver = await startWebhookReceiver();
    try {
      const webhookUrl = `http://127.0.0.1:${receiver.port}/hook`;

      app = createApp({
        dataDir,
        webhookUrl,
        webhookTimeoutMs: 1000,
      });
      const request = supertest(app);

      const createRes = await request.post('/tasks').send({
        taskSpec: {
          meta: { id: 'webhook-task', specVersion: '0.1' },
          target: { fileId: 'FILE', pageName: 'Page', frameName: 'Frame', frameSize: { w: 100, h: 100 } },
          grid: { container: 600, columns: 12, gap: 24, margins: 24 },
          sections: [],
        },
      });
      const { taskId } = createRes.body;

      await request.post(`/tasks/${taskId}/result`).send({ result: { ok: true, finished: true } });

      await waitForCondition(() => receiver.received.length > 0);
      expect(receiver.received[0].body).toEqual(
        expect.objectContaining({
          event: 'task.done',
          taskId,
          status: 'done',
          artifact: {
            json: `/tasks/${taskId}/artifact`,
            zip: `/tasks/${taskId}/package.zip`,
          },
          summary: {
            artifactSize: expect.any(Number),
          },
        }),
      );
    } finally {
      await receiver.close();
    }
  });

  test('markTaskError triggers task.error webhook with message', async () => {
    const receiver = await startWebhookReceiver();
    try {
      const webhookUrl = `http://127.0.0.1:${receiver.port}/fail`;

      app = createApp({ dataDir, webhookUrl, webhookTimeoutMs: 1000 });
      const request = supertest(app);

      const createRes = await request.post('/tasks').send({ taskSpec: { meta: { id: 'err', specVersion: '0.1' } } });
      const { taskId } = createRes.body;

      const ok = app.locals.markTaskError(taskId, 'Runner crashed');
      expect(ok).toBe(true);

      await waitForCondition(() => receiver.received.length > 0);
      expect(receiver.received[0].body).toEqual(
        expect.objectContaining({
          event: 'task.error',
          taskId,
          status: 'error',
          errorMessage: 'Runner crashed',
        }),
      );
    } finally {
      await receiver.close();
    }
  });

  test('no webhook is sent when webhookUrl is not configured', async () => {
    const receiver = await startWebhookReceiver();
    try {
      app = createApp({ dataDir });
      const request = supertest(app);

      const createRes = await request.post('/tasks').send({ taskSpec: { meta: { id: 'no-hook', specVersion: '0.1' } } });
      const { taskId } = createRes.body;

      await request.post(`/tasks/${taskId}/result`).send({ result: { ok: true } });

      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(receiver.received.length).toBe(0);
    } finally {
      await receiver.close();
    }
  });

  test('retries failed webhook deliveries up to configured limit', async () => {
    const attempts = [];
    const receiver = await startWebhookReceiver((_, res, body) => {
      attempts.push(body);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false }));
    });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const webhookUrl = `http://127.0.0.1:${receiver.port}/retry`;

      app = createApp({
        dataDir,
        webhookUrl,
        webhookRetries: 3,
        webhookTimeoutMs: 500,
      });
      const request = supertest(app);

      const createRes = await request.post('/tasks').send({ taskSpec: { meta: { id: 'retry', specVersion: '0.1' } } });
      const { taskId } = createRes.body;

      await request.post(`/tasks/${taskId}/result`).send({ result: { ok: true } });

      await waitForCondition(() => attempts.length === 3, { timeout: 7000, interval: 50 });
      expect(attempts.length).toBe(3);
      expect(errorSpy).toHaveBeenCalled();
    } finally {
      await receiver.close();
    }
  });
});
