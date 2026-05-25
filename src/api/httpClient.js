import { useExplorerStore } from '../store/useExplorerStore.js';
import { createId } from '../utils/ids.js';

export function resolveUrl(pathOrUrl) {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const baseUrl = useExplorerStore.getState().baseUrl.replace(/\/+$/, '');
  const path = String(pathOrUrl).startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${baseUrl}${path}`;
}

async function request(method, endpoint, payload, options = {}) {
  const store = useExplorerStore.getState();
  const requestId = createId('req');
  const startedAt = new Date().toISOString();
  const url = resolveUrl(endpoint);
  store.addRequestHistory({ requestId, method, endpoint, payload, status: 'pending', startedAt, finishedAt: null, durationMs: null, error: null });

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 30000;
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();

  try {
    const response = await fetch(url, {
      method,
      headers: payload instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
      body: payload == null ? undefined : JSON.stringify(payload),
      signal: controller.signal,
    });
    const text = await response.text();
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') && text ? JSON.parse(text) : text;
    if (!response.ok) {
      const message = typeof data === 'string' ? data : data?.detail || data?.message || response.statusText;
      throw new Error(`${response.status} ${message}`);
    }
    useExplorerStore.getState().updateRequestHistory(requestId, {
      status: response.status,
      finishedAt: new Date().toISOString(),
      durationMs: performance.now() - started,
    });
    return data;
  } catch (error) {
    useExplorerStore.getState().updateRequestHistory(requestId, {
      status: 'error',
      finishedAt: new Date().toISOString(),
      durationMs: performance.now() - started,
      error: error.message,
    });
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export const httpClient = {
  get: (endpoint, options) => request('GET', endpoint, null, options),
  post: (endpoint, payload, options) => request('POST', endpoint, payload, options),
};
