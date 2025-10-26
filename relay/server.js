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
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.jsonl');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(TASKS_FILE)) fs.writeFileSync(TASKS_FILE, '', 'utf8');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

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
  const byId = readAll();
  const rec = byId.get(id);
  if (!rec) return res.status(404).json({ error: 'not found' });
  res.json(rec);
});

app.post('/tasks/:id/result', (req, res) => {
  const id = req.params.id;
  const byId = readAll();
  const rec = byId.get(id);
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
  res.json({ ok: true });
});

app.get('/tasks/:id/result', (req, res) => {
  const byId = readAll();
  const t = byId.get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json({
    status: t.status,
    exportSpec: t.result ?? null,
    logs: Array.isArray(t.logs) ? t.logs : [],
    error: t.error ?? null,
  });
});

app.post('/tasks/:id/log', (req, res) => {
  const { message } = req.body || {};
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message required' });
  }
  const byId = readAll();
  const t = byId.get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  const logs = Array.isArray(t.logs) ? [...t.logs] : [];
  logs.push(message);
  const updated = { ...t, logs };
  writeOne(updated);
  res.json({ ok: true });
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
