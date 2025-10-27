const fs = require('fs');
const os = require('os');
const path = require('path');
const supertest = require('supertest');

const { createApp } = require('../app');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'relay-compare-'));
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const BASE_TASK_SPEC = {
  meta: { specVersion: '0.1', id: 'base-task' },
  target: {
    fileId: 'FILE',
    pageName: 'Page',
    frameName: 'Frame',
    frameSize: { w: 800, h: 600 },
  },
  sections: [{ type: 'hero', name: 'Hero' }],
};

function buildTaskSpec(id) {
  return {
    ...BASE_TASK_SPEC,
    meta: { ...BASE_TASK_SPEC.meta, id },
  };
}

describe('Artifacts compare endpoint', () => {
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
      removeDir(dataDir);
      dataDir = null;
    }
  });

  async function createTaskWithResult(id, exportSpec) {
    const createRes = await request.post('/tasks').send({ taskSpec: buildTaskSpec(id) });
    expect(createRes.status).toBe(200);
    const { taskId } = createRes.body;
    expect(taskId).toBeTruthy();
    const resultsRes = await request.post('/results').send({ taskId, exportSpec });
    expect(resultsRes.status).toBe(200);
    expect(resultsRes.body).toEqual({ ok: true });
    return taskId;
  }

  test('returns summary and diff for different artifacts', async () => {
    const leftSpec = {
      meta: { version: '1.0' },
      sections: [{ type: 'hero', name: 'Hero' }],
      grid: { columns: 12 },
    };
    const rightSpec = {
      meta: { version: '1.1' },
      sections: [
        { type: 'hero', name: 'Hero v2', flags: { new: true } },
        { type: 'footer', name: 'Footer' },
      ],
      grid: { columns: 16 },
    };

    const leftId = await createTaskWithResult('left-task', leftSpec);
    const rightId = await createTaskWithResult('right-task', rightSpec);

    const res = await request
      .post('/artifacts/compare')
      .send({ leftId, rightId, mode: 'full' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      leftId,
      rightId,
      summary: {
        added: expect.any(Number),
        removed: expect.any(Number),
        changed: expect.any(Number),
        unchanged: expect.any(Number),
      },
    });
    expect(Array.isArray(res.body.diff)).toBe(true);
    expect(res.body.diff.length).toBeGreaterThan(0);
    const paths = res.body.diff.map((entry) => entry.path);
    expect(paths).toEqual(expect.arrayContaining(['meta.version', 'sections[0].name', 'grid.columns']));
  });

  test('identical artifacts report unchanged entries only in summary', async () => {
    const exportSpec = {
      meta: { version: '2.0' },
      sections: [{ type: 'hero', name: 'Hero' }],
      grid: { columns: 12 },
    };

    const leftId = await createTaskWithResult('same-left', exportSpec);
    const rightId = await createTaskWithResult('same-right', exportSpec);

    const res = await request.post('/artifacts/compare').send({ leftId, rightId });

    expect(res.status).toBe(200);
    expect(res.body.summary).toMatchObject({ added: 0, removed: 0, changed: 0 });
    expect(res.body.summary.unchanged).toBeGreaterThan(0);
    expect(Array.isArray(res.body.diff)).toBe(true);
    expect(res.body.diff.length).toBe(0);
  });

  test('serves HTML report with summary and changes', async () => {
    const leftSpec = {
      meta: { version: '1.0' },
      hero: { headline: 'Hello' },
    };
    const rightSpec = {
      meta: { version: '1.1' },
      hero: { headline: 'Hello world', cta: 'Buy' },
    };

    const leftId = await createTaskWithResult('html-left', leftSpec);
    const rightId = await createTaskWithResult('html-right', rightSpec);

    const res = await request.get(
      `/artifacts/compare.html?leftId=${encodeURIComponent(leftId)}&rightId=${encodeURIComponent(
        rightId,
      )}&mode=full`,
    );

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<section id="summary">');
    expect(res.text).toContain('<section id="changes">');
    expect(res.text).toContain('Download JSON diff');
    expect(res.text).toMatch(/change-item/);
    expect(res.text).toMatch(/hero\.headline/);
  });

  test('returns 404 for HTML report when artifact is missing', async () => {
    const exportSpec = { hero: { headline: 'Exists' } };
    const leftId = await createTaskWithResult('html-missing-left', exportSpec);

    const res = await request.get(
      `/artifacts/compare.html?leftId=${encodeURIComponent(leftId)}&rightId=missing-html`,
    );

    expect(res.status).toBe(404);
  });

  test('returns 413 for HTML report when artifact exceeds size limit', async () => {
    const largeString = 'x'.repeat(6 * 1024 * 1024);
    const bigSpec = { payload: largeString };
    const smallSpec = { payload: 'small' };

    const leftId = await createTaskWithResult('html-large', smallSpec);
    const rightId = await createTaskWithResult('html-small', smallSpec);

    const artifactPath = path.join(dataDir, 'results', `${rightId}.json`);
    fs.writeFileSync(artifactPath, JSON.stringify(bigSpec, null, 2), 'utf8');

    const res = await request.get(
      `/artifacts/compare.html?leftId=${encodeURIComponent(leftId)}&rightId=${encodeURIComponent(
        rightId,
      )}`,
    );

    expect(res.status).toBe(413);
  });

  test('returns 404 when artifact is missing', async () => {
    const exportSpec = { sections: [{ type: 'hero', name: 'Hero' }] };
    const leftId = await createTaskWithResult('exists', exportSpec);

    const res = await request
      .post('/artifacts/compare')
      .send({ leftId, rightId: 'missing-id' });

    expect(res.status).toBe(404);
  });

  test('returns 413 when artifact exceeds size limit', async () => {
    const largeString = 'x'.repeat(6 * 1024 * 1024);
    const bigSpec = { payload: largeString };
    const smallSpec = { payload: 'small' };

    const leftId = await createTaskWithResult('large', smallSpec);
    const rightId = await createTaskWithResult('small', smallSpec);

    const artifactPath = path.join(dataDir, 'results', `${leftId}.json`);
    fs.writeFileSync(artifactPath, JSON.stringify(bigSpec, null, 2), 'utf8');

    const res = await request.post('/artifacts/compare').send({ leftId, rightId });

    expect(res.status).toBe(413);
  });
});
