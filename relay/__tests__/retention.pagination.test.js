const fs = require('fs');
const os = require('os');
const path = require('path');
const supertest = require('supertest');

const { createApp } = require('../app');

function createTempDataDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'relay-data-'));
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function buildTaskSpec(index) {
  return {
    meta: {
      specVersion: '0.1',
      id: `task-${index}`,
    },
    target: {
      fileId: 'FILE',
      pageName: 'Page',
      frameName: `Frame-${index}`,
      frameSize: { w: 1440, h: 900 },
    },
    grid: {
      container: 1200,
      columns: 12,
      gap: 24,
      margins: 24,
    },
    sections: [
      { type: 'hero', name: `Hero-${index}` },
    ],
  };
}

function buildExportSpec(index) {
  return {
    meta: {
      generatedAt: new Date().toISOString(),
      index,
    },
    result: {
      ok: true,
    },
  };
}

async function createTaskWithResult(request, index, options = {}) {
  const useCustomNow = typeof options.createdAtMs === 'number';
  const originalNow = Date.now;
  if (useCustomNow) {
    Date.now = () => options.createdAtMs;
  }
  try {
    const taskSpec = buildTaskSpec(index);
    const createRes = await request.post('/tasks').send({ taskSpec });
    if (createRes.status !== 200) {
      throw new Error(`Failed to create task: ${createRes.status}`);
    }
    const { taskId } = createRes.body;
    const exportSpec = buildExportSpec(index);
    const logs = [`log-${index}`];
    await request.post('/results').send({ taskId, exportSpec, logs });
    return taskId;
  } finally {
    if (useCustomNow) {
      Date.now = originalNow;
    }
  }
}

describe('Artifacts retention and pagination', () => {
  let dataDir;
  let app;
  let request;

  afterEach(() => {
    if (dataDir) {
      removeDir(dataDir);
      dataDir = null;
    }
    app = null;
    request = null;
  });

  test('paginates artifacts list', async () => {
    dataDir = createTempDataDir();
    app = createApp({ dataDir });
    request = supertest(app);

    const totalTasks = 65;
    for (let i = 0; i < totalTasks; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await createTaskWithResult(request, i);
    }

    const pageOne = await request.get('/artifacts').query({ limit: 50 });
    expect(pageOne.status).toBe(200);
    expect(pageOne.body.items).toHaveLength(50);
    expect(pageOne.body.total).toBeGreaterThanOrEqual(totalTasks);

    const firstPageCreated = pageOne.body.items.map((item) => item.createdAt);
    const sortedFirst = [...firstPageCreated].sort((a, b) => b - a);
    expect(firstPageCreated).toEqual(sortedFirst);

    const pageTwo = await request.get('/artifacts').query({ offset: 50, limit: 50 });
    expect(pageTwo.status).toBe(200);
    expect(pageTwo.body.total).toBe(pageOne.body.total);
    const expectedRemainder = Math.max(pageOne.body.total - 50, 0);
    expect(pageTwo.body.items.length).toBe(expectedRemainder);
    if (expectedRemainder > 0) {
      expect(expectedRemainder).toBeGreaterThanOrEqual(10);
    }

    const secondPageCreated = pageTwo.body.items.map((item) => item.createdAt);
    const sortedSecond = [...secondPageCreated].sort((a, b) => b - a);
    expect(secondPageCreated).toEqual(sortedSecond);

    const firstIds = new Set(pageOne.body.items.map((item) => item.id));
    for (const item of pageTwo.body.items) {
      expect(firstIds.has(item.id)).toBe(false);
    }

    const ascPage = await request.get('/artifacts').query({ limit: 5, order: 'asc' });
    expect(ascPage.status).toBe(200);
    const ascCreated = ascPage.body.items.map((item) => item.createdAt);
    const sortedAsc = [...ascCreated].sort((a, b) => a - b);
    expect(ascCreated).toEqual(sortedAsc);
  });

  test('enforces MAX_ARTIFACTS limit', async () => {
    dataDir = createTempDataDir();
    const maxArtifacts = 30;
    app = createApp({ dataDir, maxArtifacts });
    request = supertest(app);

    const createdIds = [];
    for (let i = 0; i < 45; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      createdIds.push(await createTaskWithResult(request, i));
    }

    const artifactsRes = await request.get('/artifacts');
    expect(artifactsRes.status).toBe(200);
    expect(artifactsRes.body.total).toBeLessThanOrEqual(maxArtifacts);
    expect(artifactsRes.body.items.length).toBeLessThanOrEqual(maxArtifacts);

    const remainingIds = new Set(artifactsRes.body.items.map((item) => item.id));
    const removedIds = createdIds.slice(0, createdIds.length - artifactsRes.body.total);
    for (const id of removedIds) {
      expect(remainingIds.has(id)).toBe(false);
    }
  });

  test('removes artifacts older than TTL_DAYS', async () => {
    dataDir = createTempDataDir();
    const ttlDays = 1;
    app = createApp({ dataDir, ttlDays });
    request = supertest(app);

    const now = Date.now();
    const olderThanTtl = now - 3 * 24 * 60 * 60 * 1000;

    const oldTaskId = await createTaskWithResult(request, 'old', { createdAtMs: olderThanTtl });
    const recentTaskId = await createTaskWithResult(request, 'recent');

    const artifactsRes = await request.get('/artifacts');
    expect(artifactsRes.status).toBe(200);
    const ids = artifactsRes.body.items.map((item) => item.id);
    expect(ids).toContain(recentTaskId);
    expect(ids).not.toContain(oldTaskId);

    const oldTaskRes = await request.get(`/tasks/${oldTaskId}`);
    expect(oldTaskRes.status).toBe(404);
  });
});
