/* Minimal Relay server for M2
 * Endpoints:
 *  POST /tasks            -> { taskSpec } => { taskId }
 *  GET  /tasks/:id        -> { status, taskSpec?, result? }
 *  POST /tasks/:id/result -> { exportSpec } => { ok:true }
 *  GET  /tasks/:id/result -> { status, exportSpec, logs, error }
 *  POST /tasks/:id/log    -> { message } => { ok:true }
 *  GET  /health           -> { ok:true }
 */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.jsonl');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(TASKS_FILE)) fs.writeFileSync(TASKS_FILE, '', 'utf8');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const clientsByTask = new Map();
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const KEEPALIVE_INTERVAL_MS = 30 * 1000;

function normalizeLogs(logs) {
  if (!Array.isArray(logs)) return [];
  return logs.map((entry) => {
    if (entry && typeof entry === 'object' && 'message' in entry) {
      return entry;
    }
    return { message: String(entry), ts: null };
  });
}

function registerClient(taskId, req, res) {
  let set = clientsByTask.get(taskId);
  if (!set) {
    set = new Set();
    clientsByTask.set(taskId, set);
  }
  const client = {
    res,
    taskId,
    closed: false,
    inactivityTimer: null,
    keepAliveTimer: null,
    cleanup: () => {},
  };

  const cleanup = () => {
    if (client.closed) return;
    client.closed = true;
    clearTimeout(client.inactivityTimer);
    clearInterval(client.keepAliveTimer);
    set.delete(client);
    if (set.size === 0) {
      clientsByTask.delete(taskId);
    }
    try {
      res.end();
    } catch (_) {}
  };

  client.resetInactivity = () => {
    clearTimeout(client.inactivityTimer);
    client.inactivityTimer = setTimeout(() => {
      cleanup();
    }, INACTIVITY_TIMEOUT_MS);
  };

  client.send = (event, payload) => {
    if (client.closed) return;
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
      client.resetInactivity();
    } catch (_) {
      cleanup();
    }
  };

  client.keepAliveTimer = setInterval(() => {
    if (client.closed) return;
    try {
      res.write(`: keep-alive ${Date.now()}\n\n`);
    } catch (_) {
      cleanup();
    }
  }, KEEPALIVE_INTERVAL_MS);

  client.resetInactivity();
  client.cleanup = cleanup;
  req.on('close', cleanup);
  req.on('error', cleanup);
  set.add(client);
  return client;
}

function broadcastTaskEvent(taskId, event, payload, { closeAfterMs } = {}) {
  const set = clientsByTask.get(taskId);
  if (!set || set.size === 0) return;
  for (const client of Array.from(set)) {
    client.send(event, payload);
    if (typeof closeAfterMs === 'number' && closeAfterMs >= 0) {
      setTimeout(() => {
        client.cleanup();
      }, closeAfterMs);
    }
  }
}

function readOne(id) {
  const byId = readAll();
  return byId.get(id);
}

const ajv = new Ajv({ allErrors: true, strict: false });
const taskSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'schemas', 'taskSpec.schema.json'), 'utf8')
);
const exportSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'schemas', 'exportSpec.schema.json'), 'utf8')
);
const validateTask = ajv.compile(taskSchema);
const validateExport = ajv.compile(exportSchema);

function appendJSONL(file, obj) {
  fs.appendFileSync(file, JSON.stringify(obj) + '\n', 'utf8');
}

function writeOne(task) {
  appendJSONL(TASKS_FILE, task);
}

function readAll() {
  const txt = fs.readFileSync(TASKS_FILE, 'utf8');
  const lines = txt ? txt.split('\n').filter(Boolean) : [];
  const byId = new Map();
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      byId.set(obj.id, obj); // last write wins
    } catch (_) {}
  }
  return byId;
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/validate/taskSpec', (req, res) => {
  const taskSpec = req.body && req.body.taskSpec;
  const valid = validateTask(taskSpec);
  if (valid) return res.json({ valid: true, errors: [] });
  res.json({
    valid: false,
    errors: (validateTask.errors || []).map((e) => ({
      instancePath: e.instancePath,
      message: e.message,
    })),
  });
});

app.post('/validate/exportSpec', (req, res) => {
  const exportSpec = req.body && req.body.exportSpec;
  const valid = validateExport(exportSpec);
  if (valid) return res.json({ valid: true, errors: [] });
  res.json({
    valid: false,
    errors: (validateExport.errors || []).map((e) => ({
      instancePath: e.instancePath,
      message: e.message,
    })),
  });
});

app.post('/tasks', (req, res) => {
  const { taskSpec } = req.body || {};
  if (!taskSpec) return res.status(400).json({ error: 'taskSpec required' });
  const id = uuidv4();
  const rec = {
    id,
    status: 'pending',
    taskSpec,
    createdAt: Date.now(),
    logs: [],
    error: null,
  };
  writeOne(rec);
  res.json({ taskId: id });
});

app.get('/tasks/:id', (req, res) => {
  const id = req.params.id;
  const rec = readOne(id);
  if (!rec) return res.status(404).json({ error: 'not found' });
  res.json({
    ...rec,
    logs: normalizeLogs(rec.logs).map((l) => l.message),
  });
});

app.post('/tasks/:id/result', (req, res) => {
  const id = req.params.id;
  const rec = readOne(id);
  if (!rec) return res.status(404).json({ error: 'not found' });
  const result = req.body && req.body.result;
  if (!result) return res.status(400).json({ error: 'result required' });
  const updated = {
    ...rec,
    status: 'done',
    result,
    finishedAt: Date.now(),
    error: null,
  };
  writeOne(updated);
  broadcastTaskEvent(id, 'result', {
    status: 'done',
    exportSpec: result,
  }, { closeAfterMs: 3000 });
  res.json({ ok: true });
});

app.get('/tasks/:id/result', (req, res) => {
  const t = readOne(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json({
    status: t.status,
    exportSpec: t.result ?? null,
    logs: normalizeLogs(t.logs).map((l) => l.message),
    error: t.error ?? null,
  });
});

app.post('/tasks/:id/log', (req, res) => {
  const { message } = req.body || {};
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message required' });
  }
  const t = readOne(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  const logs = normalizeLogs(t.logs);
  const entry = {
    message: message.trim(),
    ts: new Date().toISOString(),
  };
  logs.push(entry);
  const updated = { ...t, logs };
  writeOne(updated);
  broadcastTaskEvent(req.params.id, 'log', entry);
  res.json({ ok: true });
});

app.get('/tasks/:id/watch', (req, res) => {
  const id = req.params.id;
  const task = readOne(id);
  if (!task) {
    return res.status(404).json({ error: 'not found' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
  if (req.socket) {
    req.socket.setKeepAlive(true);
    req.socket.setNoDelay(true);
    req.socket.setTimeout(0);
  }

  const client = registerClient(id, req, res);
  try {
    client.send('status', {
      status: task.status || 'pending',
      logs: normalizeLogs(task.logs),
      exportSpec: task.result ?? null,
    });
  } catch (_) {
    client.cleanup();
  }
});

// GET /tasks/latest?status=pending|done (default: pending)
app.get('/tasks/latest', (req, res) => {
  const status = String(req.query.status || 'pending');
  const byId = readAll();
  const arr = Array.from(byId.values()).filter((t) => t.status === status);
  if (arr.length === 0) {
    return res.status(404).json({ error: `No ${status} tasks` });
  }
  arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const t = arr[0];
  res.json({
    id: t.id,
    status: t.status,
    createdAt: t.createdAt,
    taskSpec: t.taskSpec,
  });
});

app.listen(PORT, () => {
  console.log(`Relay listening on http://localhost:${PORT}`);
});
