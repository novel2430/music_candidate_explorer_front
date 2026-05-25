export function formatMs(ms) {
  if (ms == null) return '-';
  return `${Math.round(ms)}ms`;
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export function compactJson(value) {
  if (!value) return '';
  return JSON.stringify(value, null, 2);
}

export function parseCsvNumbers(value, fallback) {
  const parsed = String(value)
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
  return parsed.length ? parsed : fallback;
}

export function parseCsvStrings(value, fallback) {
  const parsed = String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return parsed.length ? parsed : fallback;
}
