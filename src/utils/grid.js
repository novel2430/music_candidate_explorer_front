export function niceStep(rawStep) {
  if (!Number.isFinite(rawStep) || rawStep <= 0) return 1;
  const exponent = Math.floor(Math.log10(rawStep));
  const fraction = rawStep / 10 ** exponent;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * 10 ** exponent;
}

export function rangeLines(min, max, step) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(step) || step <= 0) return [];
  const first = Math.ceil(min / step) * step;
  const lines = [];
  for (let value = first; value <= max + step * 0.5; value += step) {
    lines.push(Number(value.toFixed(8)));
    if (lines.length > 300) break;
  }
  return lines;
}
