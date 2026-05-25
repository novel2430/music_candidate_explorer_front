export function worldToScreen(candidate, bounds, camera, viewport) {
  return worldPointToScreen(candidate.x, candidate.y, bounds, camera, viewport);
}

export function worldPointToScreen(xValue, yValue, bounds, camera, viewport) {
  const baseX = ((xValue - bounds.minX) / bounds.spanX - 0.5) * viewport.width;
  const baseY = (0.5 - (yValue - bounds.minY) / bounds.spanY) * viewport.height;
  return {
    x: viewport.width / 2 + (baseX - camera.cameraX) * camera.zoom,
    y: viewport.height / 2 + (baseY - camera.cameraY) * camera.zoom,
  };
}

export function screenToWorldDelta(deltaX, deltaY, camera) {
  return {
    x: deltaX / camera.zoom,
    y: deltaY / camera.zoom,
  };
}

export function screenPointToWorld(screenX, screenY, bounds, camera, viewport) {
  const baseX = (screenX - viewport.width / 2) / camera.zoom + camera.cameraX;
  const baseY = (screenY - viewport.height / 2) / camera.zoom + camera.cameraY;
  return {
    x: bounds.minX + (baseX / viewport.width + 0.5) * bounds.spanX,
    y: bounds.minY + (0.5 - baseY / viewport.height) * bounds.spanY,
  };
}

export function minimapPoint(candidate, bounds, size) {
  return {
    x: ((candidate.x - bounds.minX) / bounds.spanX) * size.width,
    y: (1 - (candidate.y - bounds.minY) / bounds.spanY) * size.height,
  };
}
