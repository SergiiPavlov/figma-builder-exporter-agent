'use strict';

const { URL } = require('node:url');
const { setTimeout: delay } = require('node:timers/promises');

const DEFAULT_TIMEOUT_MS = 15000;

function toHeaders(record) {
  const map = {};
  if (!record) {
    return map;
  }
  for (const [key, value] of Object.entries(record)) {
    if (value == null) continue;
    map[key.toLowerCase()] = value;
  }
  return map;
}

function normalizePath(input) {
  if (!input) {
    return '/';
  }
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }
  return input.startsWith('/') ? input : `/${input}`;
}

function createAbortController(timeoutMs) {
  const controller = new AbortController();
  let timeout;
  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    timeout = setTimeout(() => controller.abort(new Error('Request timeout')), timeoutMs);
  }
  return {
    signal: controller.signal,
    abort: (reason) => controller.abort(reason),
    clear: () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    },
  };
}

function buildUrl(baseUrl, path) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(normalized, baseUrl);
  return url.toString();
}

async function readResponseBody(res, responseType) {
  if (responseType === 'buffer') {
    const buf = Buffer.from(await res.arrayBuffer());
    return { body: buf, text: null };
  }
  if (responseType === 'stream') {
    return { body: res.body, text: null };
  }
  const text = await res.text();
  if (responseType === 'text') {
    return { body: text, text };
  }
  if (responseType === 'json') {
    if (!text) {
      return { body: null, text: '' };
    }
    try {
      return { body: JSON.parse(text), text };
    } catch (err) {
      throw new Error(`Failed to parse JSON response: ${err.message}\n${text}`);
    }
  }
  return { body: text, text };
}

function createHttpClient({ baseUrl, apiKey, timeoutMs = DEFAULT_TIMEOUT_MS, logger } = {}) {
  if (!baseUrl) {
    throw new Error('baseUrl is required');
  }
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const key = apiKey || null;

  async function request(method, path, options = {}) {
    const {
      headers: customHeaders,
      json,
      body,
      responseType = json != null ? 'json' : 'text',
      expectJson = json != null,
      authenticated = true,
      timeout = timeoutMs,
      retry = 0,
      retryDelayMs = 250,
    } = options;

    const headers = new Headers();
    if (authenticated && key) {
      headers.set('X-API-Key', key);
    }
    if (expectJson) {
      headers.set('Accept', 'application/json');
    }
    if (customHeaders) {
      for (const [headerKey, headerValue] of Object.entries(customHeaders)) {
        if (headerValue == null) continue;
        headers.set(headerKey, headerValue);
      }
    }

    let payload = body;
    if (json != null) {
      payload = JSON.stringify(json);
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    }

    const url = buildUrl(normalizedBase, normalizePath(path));

    const attemptRequest = async () => {
      const abort = createAbortController(timeout);
      try {
        const res = await fetch(url, {
          method,
          headers,
          body: payload,
          signal: abort.signal,
        });
        abort.clear();
        const responseHeaders = {};
        res.headers.forEach((value, name) => {
          responseHeaders[name.toLowerCase()] = value;
        });
        let type = responseType;
        if (type === 'json' && res.status === 204) {
          return {
            status: res.status,
            ok: res.ok,
            headers: responseHeaders,
            body: null,
            rawText: '',
          };
        }
        if (type === 'json' || expectJson) {
          type = 'json';
        }
        const { body: parsedBody, text } = await readResponseBody(res, type);
        if (type === 'json' && parsedBody == null && text) {
          try {
            const fallback = JSON.parse(text);
            return { status: res.status, ok: res.ok, headers: responseHeaders, body: fallback, rawText: text };
          } catch (err) {
            throw new Error(`Failed to parse JSON response: ${err.message}\n${text}`);
          }
        }
        return { status: res.status, ok: res.ok, headers: responseHeaders, body: parsedBody, rawText: text ?? null };
      } catch (err) {
        abort.clear();
        throw err;
      }
    };

    let lastError;
    for (let attempt = 0; attempt <= retry; attempt += 1) {
      try {
        return await attemptRequest();
      } catch (err) {
        lastError = err;
        if (attempt < retry) {
          if (logger) {
            logger(`Retrying ${method} ${url} after error: ${err.message}`);
          }
          await delay(retryDelayMs);
          continue;
        }
        throw err;
      }
    }
    throw lastError || new Error('Unknown request failure');
  }

  async function getJson(path, options = {}) {
    return request('GET', path, { ...options, responseType: 'json', expectJson: true });
  }

  async function getBuffer(path, options = {}) {
    return request('GET', path, { ...options, responseType: 'buffer', expectJson: false });
  }

  async function getText(path, options = {}) {
    return request('GET', path, { ...options, responseType: 'text', expectJson: false });
  }

  async function postJson(path, json, options = {}) {
    return request('POST', path, { ...options, json, responseType: 'json', expectJson: true });
  }

  async function post(path, payload, options = {}) {
    return request('POST', path, { ...options, body: payload, expectJson: false });
  }

  async function streamSse(path, { authenticated = true, onEvent, timeout = timeoutMs } = {}) {
    if (typeof onEvent !== 'function') {
      throw new Error('onEvent callback is required for streamSse');
    }
    const url = buildUrl(normalizedBase, normalizePath(path));
    const headers = new Headers();
    if (authenticated && key) {
      headers.set('X-API-Key', key);
    }
    headers.set('Accept', 'text/event-stream');
    const abort = createAbortController(timeout);
    let closed = false;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers,
        signal: abort.signal,
      });
      if (!res.ok) {
        abort.clear();
        const text = await res.text().catch(() => '');
        throw new Error(`SSE request failed with status ${res.status}: ${text}`);
      }
      const decoder = new TextDecoder();
      const reader = res.body.getReader();
      let buffer = '';
      let currentEvent = { event: null, data: '' };

      const dispatchEvent = () => {
        if (!currentEvent.event && !currentEvent.data) {
          return;
        }
        const eventName = currentEvent.event || 'message';
        const rawData = currentEvent.data.replace(/\n$/, '');
        let parsed = rawData;
        if (rawData) {
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = rawData;
          }
        } else {
          parsed = null;
        }
        const result = onEvent({ event: eventName, data: parsed, raw: rawData });
        currentEvent = { event: null, data: '' };
        if (result === false || result === 'stop') {
          closed = true;
          abort.abort(new Error('SSE stream stopped by callback'));
        }
      };

      while (!closed) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        while (true) {
          const newlineIndex = buffer.indexOf('\n');
          if (newlineIndex === -1) {
            break;
          }
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) {
            line = line.slice(0, -1);
          }
          if (line === '') {
            dispatchEvent();
            continue;
          }
          if (line.startsWith(':')) {
            continue;
          }
          if (line.startsWith('event:')) {
            currentEvent.event = line.slice(6).trim();
            continue;
          }
          if (line.startsWith('data:')) {
            const dataPart = line.slice(5).replace(/^\s*/, '');
            currentEvent.data += `${dataPart}\n`;
            continue;
          }
        }
      }
      if (buffer.trim()) {
        currentEvent.data += buffer.trim();
        dispatchEvent();
      }
      abort.clear();
    } catch (err) {
      abort.clear();
      if (closed) {
        return;
      }
      if (err.name === 'AbortError') {
        throw new Error('SSE stream aborted');
      }
      throw err;
    }
  }

  return {
    request,
    getJson,
    getBuffer,
    getText,
    postJson,
    post,
    streamSse,
  };
}

module.exports = { createHttpClient, toHeaders };
