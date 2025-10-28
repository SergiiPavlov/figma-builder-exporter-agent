const fs = require('fs');
const os = require('os');
const path = require('path');
const supertest = require('supertest');

const { createApp } = require('../app');

const SAMPLE_TASK_SPEC = {
  meta: { specVersion: '0.1', id: 'timings-task' },
  target: {
    fileId: 'FILE',
    pageName: 'Page',
    frameName: 'Frame',
    frameSize: { w: 800, h: 600 },
  },
  grid: { container: 960, columns: 12, gap: 24, margins: 24 },
  sections: [{ type: 'hero', name: 'Hero' }],
};

const SAMPLE_EXPORT_SPEC = {
  meta: { generatedAt: new Date().toISOString() },
  summary: { sections: 1 },
};

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'relay-timings-'));
}

function cleanupDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('task timings', () => {
  const originalNow = Date.now;
  let dataDir;
  let app;
  let request;

  beforeEach(() => {
    dataDir = createTempDir();
    app = createApp({ dataDir });
    request = supertest(app);
  });

  afterEach(async () => {
    Date.now = originalNow;
    if (app && typeof app.__webhooksIdle === 'function') {
      await app.__webhooksIdle();
    }
    app = null;
    if (dataDir) {
      cleanupDir(dataDir);
      dataDir = null;
    }
  });

  test('startedAt reflects actual pull time with positive queue latency', async () => {
    const createdAt = 1_700_000_000_000;
    const pulledAt = createdAt + 5_000;
    const finishedAt = pulledAt + 2_000;

    Date.now = () => createdAt;
    const createRes = await request.post('/tasks').send({ taskSpec: SAMPLE_TASK_SPEC });
    expect(createRes.status).toBe(200);
    const { taskId } = createRes.body;
    expect(createRes.body.createdAt).toBe(createdAt);

    Date.now = () => pulledAt;
    const pullRes = await request.get('/tasks/pull').query({ limit: 1, pluginId: 'runner-auto' });
    expect(pullRes.status).toBe(200);
    expect(pullRes.body.pulled).toBe(1);
    expect(pullRes.body.taskId).toBe(taskId);

    const taskRes = await request.get(`/tasks/${taskId}`);
    expect(taskRes.status).toBe(200);
    expect(taskRes.body.createdAt).toBe(createdAt);
    expect(taskRes.body.startedAt).toBe(pulledAt);
    expect(taskRes.body.startedAt).toBeGreaterThan(taskRes.body.createdAt);

    Date.now = () => finishedAt;
    const logs = ['build started', 'export completed'];
    const resultRes = await request
      .post('/results')
      .send({ taskId, exportSpec: SAMPLE_EXPORT_SPEC, logs });
    expect(resultRes.status).toBe(200);
    expect(resultRes.body).toEqual({ ok: true });

    const doneRes = await request.get(`/tasks/${taskId}`);
    expect(doneRes.status).toBe(200);
    expect(doneRes.body.finishedAt).toBe(finishedAt);
    expect(doneRes.body.finishedAt - doneRes.body.startedAt).toBeGreaterThan(0);
  });
});
