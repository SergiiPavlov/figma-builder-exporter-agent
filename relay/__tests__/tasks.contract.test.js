const fs = require('fs');
const os = require('os');
const path = require('path');
const supertest = require('supertest');

const { createApp } = require('../app');

const SAMPLE_TASK_SPEC = {
  meta: { specVersion: '0.1', id: 'contract-task' },
  target: {
    fileId: 'FILE',
    pageName: 'Page',
    frameName: 'Frame',
    frameSize: { w: 1024, h: 768 },
  },
  grid: { container: 960, columns: 12, gap: 24, margins: 24 },
  sections: [{ type: 'hero', name: 'Hero' }],
};

const SAMPLE_EXPORT_SPEC = {
  meta: { generatedAt: new Date().toISOString() },
  summary: { sections: 1 },
};

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'relay-contracts-'));
}

function cleanupDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('task and result contracts', () => {
  let dataDir;
  let app;
  let request;

  beforeEach(() => {
    dataDir = createTempDir();
    app = createApp({ dataDir });
    request = supertest(app);
  });

  afterEach(async () => {
    if (app && typeof app.__webhooksIdle === 'function') {
      await app.__webhooksIdle();
    }
    app = null;
    if (dataDir) {
      cleanupDir(dataDir);
      dataDir = null;
    }
  });

  test('supports client-provided taskId with idempotent responses', async () => {
    const body = { taskSpec: SAMPLE_TASK_SPEC, taskId: 'custom-id-1' };
    const createRes = await request.post('/tasks').send(body);
    expect(createRes.status).toBe(200);
    expect(createRes.body).toMatchObject({
      taskId: 'custom-id-1',
      status: 'pending',
      createdAt: expect.any(Number),
    });

    const repeatRes = await request.post('/tasks').send(body);
    expect(repeatRes.status).toBe(200);
    expect(repeatRes.body).toMatchObject({
      taskId: 'custom-id-1',
      status: 'pending',
      createdAt: createRes.body.createdAt,
    });

    const taskRes = await request.get('/tasks/custom-id-1');
    expect(taskRes.status).toBe(200);
    expect(taskRes.body).toMatchObject({
      id: 'custom-id-1',
      status: 'pending',
      taskSpec: SAMPLE_TASK_SPEC,
    });
  });

  test('rejects invalid payloads for tasks and results endpoints', async () => {
    const missingSpec = await request.post('/tasks').send({});
    expect(missingSpec.status).toBe(400);
    expect(missingSpec.body).toEqual({ error: { code: 400, message: 'taskSpec required' } });

    const invalidId = await request
      .post('/tasks')
      .send({ taskSpec: SAMPLE_TASK_SPEC, taskId: 'with space' });
    expect(invalidId.status).toBe(400);
    expect(invalidId.body).toEqual({ error: { code: 400, message: 'Invalid task id' } });

    const okRes = await request.post('/tasks').send({ taskSpec: SAMPLE_TASK_SPEC });
    expect(okRes.status).toBe(200);
    const taskId = okRes.body.taskId;

    const missingExport = await request.post('/results').send({ taskId });
    expect(missingExport.status).toBe(400);
    expect(missingExport.body).toEqual({ error: { code: 400, message: 'exportSpec required' } });

    const missingTask = await request.post('/results').send({ taskId: 'no-task', exportSpec: {} });
    expect(missingTask.status).toBe(404);
    expect(missingTask.body).toEqual({ error: { code: 404, message: 'not found' } });
  });

  test('pull endpoint respects limit parameter and returns queue metadata', async () => {
    const ids = ['queue-a', 'queue-b', 'queue-c'];
    for (const id of ids) {
      const spec = { ...SAMPLE_TASK_SPEC, meta: { ...SAMPLE_TASK_SPEC.meta, id } };
      const res = await request.post('/tasks').send({ taskSpec: spec, taskId: id });
      expect(res.status).toBe(200);
      expect(res.body.taskId).toBe(id);
    }

    const firstPull = await request.get('/tasks/pull').query({ limit: 2, pluginId: 'runner-1' });
    expect(firstPull.status).toBe(200);
    expect(firstPull.body).toMatchObject({
      taskId: 'queue-a',
      pulled: 2,
      remaining: 1,
      hasMore: true,
    });
    expect(firstPull.body.items).toEqual([
      { taskId: 'queue-a', taskSpec: expect.any(Object) },
      { taskId: 'queue-b', taskSpec: expect.any(Object) },
    ]);

    const queueATask = await request.get('/tasks/queue-a');
    const queueBTask = await request.get('/tasks/queue-b');
    expect(queueATask.body.status).toBe('running');
    expect(queueATask.body.runnerPluginId).toBe('runner-1');
    expect(queueBTask.body.status).toBe('running');
    expect(queueBTask.body.runnerPluginId).toBe('runner-1');

    const secondPull = await request.get('/tasks/pull').query({ limit: 5 });
    expect(secondPull.status).toBe(200);
    expect(secondPull.body).toMatchObject({
      taskId: 'queue-c',
      pulled: 1,
      remaining: 0,
      hasMore: false,
    });
    expect(secondPull.body.items).toEqual([
      { taskId: 'queue-c', taskSpec: expect.any(Object) },
    ]);

    const noPull = await request.get('/tasks/pull').query({ limit: 0 });
    expect(noPull.status).toBe(200);
    expect(noPull.body).toMatchObject({
      taskId: null,
      pulled: 0,
      remaining: 0,
      hasMore: false,
      items: [],
    });
  });

  test('results endpoint accepts logs and exposes summary via GET /tasks/{id}/result', async () => {
    const createRes = await request.post('/tasks').send({ taskSpec: SAMPLE_TASK_SPEC });
    const taskId = createRes.body.taskId;

    const logs = ['build started', { message: 'build finished', ts: new Date().toISOString() }];
    const resultRes = await request.post('/results').send({
      taskId,
      exportSpec: SAMPLE_EXPORT_SPEC,
      logs,
    });
    expect(resultRes.status).toBe(200);
    expect(resultRes.body).toEqual({ ok: true });

    const resultGet = await request.get(`/tasks/${taskId}/result`);
    expect(resultGet.status).toBe(200);
    expect(resultGet.body).toMatchObject({
      taskId,
      status: 'done',
      exportSpec: SAMPLE_EXPORT_SPEC,
      logs: expect.arrayContaining(['build started', 'build finished']),
      artifactPath: expect.any(String),
      artifactSize: expect.any(Number),
    });
  });
});
