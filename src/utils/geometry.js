export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeBounds(candidates) {
  if (!candidates.length) {
    return { minX: -1, maxX: 1, minY: -1, maxY: 1, spanX: 2, spanY: 2 };
  }
  const xs = candidates.map((candidate) => Number(candidate.x) || 0);
  const ys = candidates.map((candidate) => Number(candidate.y) || 0);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rawSpanX = maxX - minX;
  const rawSpanY = maxY - minY;
  const fallbackSpanX = Math.max(Math.abs(minX), Math.abs(maxX), 1) * 0.12;
  const fallbackSpanY = Math.max(Math.abs(minY), Math.abs(maxY), 1) * 0.12;
  const fitSpanX = rawSpanX || fallbackSpanX;
  const fitSpanY = rawSpanY || fallbackSpanY;
  const padX = fitSpanX * 0.04;
  const padY = fitSpanY * 0.04;
  return {
    minX: minX - padX,
    maxX: maxX + padX,
    minY: minY - padY,
    maxY: maxY + padY,
    spanX: fitSpanX + padX * 2,
    spanY: fitSpanY + padY * 2,
  };
}
