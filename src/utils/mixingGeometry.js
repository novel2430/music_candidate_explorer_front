function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeWeights(weights) {
  const clean = weights.map((weight) => (Number.isFinite(weight) ? Math.max(0, weight) : 0));
  const sum = clean.reduce((total, weight) => total + weight, 0);
  if (sum <= 0) return weights.map(() => 1 / weights.length);
  return clean.map((weight) => weight / sum);
}

export function computeLineWeights(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq <= 0) return [0.5, 0.5];
  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq, 0, 1);
  return normalizeWeights([1 - t, t]);
}

function closestPointOnSegment(point, a, b) {
  const weights = computeLineWeights(point, a, b);
  return {
    x: a.x * weights[0] + b.x * weights[1],
    y: a.y * weights[0] + b.y * weights[1],
  };
}

function distanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function computeBarycentricWeights(point, a, b, c) {
  const denominator = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
  if (Math.abs(denominator) < 0.000001) return [1 / 3, 1 / 3, 1 / 3];

  const wA = ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) / denominator;
  const wB = ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) / denominator;
  const wC = 1 - wA - wB;

  if (wA >= 0 && wB >= 0 && wC >= 0) return normalizeWeights([wA, wB, wC]);

  const edgePoints = [
    closestPointOnSegment(point, a, b),
    closestPointOnSegment(point, b, c),
    closestPointOnSegment(point, c, a),
  ];
  const nearest = edgePoints.reduce((best, current) => (distanceSq(point, current) < distanceSq(point, best) ? current : best));
  return computeBarycentricWeights(nearest, a, b, c);
}

export function pointFromWeights(weights, anchors) {
  return anchors.reduce(
    (point, anchor, index) => ({
      x: point.x + anchor.x * (weights[index] ?? 0),
      y: point.y + anchor.y * (weights[index] ?? 0),
    }),
    { x: 0, y: 0 },
  );
}
