import { useMemo } from 'react';
import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { niceStep, rangeLines } from '../../../utils/grid.js';
import { screenPointToWorld, worldPointToScreen } from '../../../utils/scales.js';

export function CoordinateGrid({ bounds }) {
  const { cameraX, cameraY, zoom, viewportWidth, viewportHeight } = useExplorerStore();
  const viewport = { width: viewportWidth || 1, height: viewportHeight || 1 };
  const camera = { cameraX, cameraY, zoom };

  const grid = useMemo(() => {
    const topLeft = screenPointToWorld(0, 0, bounds, camera, viewport);
    const bottomRight = screenPointToWorld(viewport.width, viewport.height, bounds, camera, viewport);
    const xPxPerUnit = (viewport.width / bounds.spanX) * zoom;
    const yPxPerUnit = (viewport.height / bounds.spanY) * zoom;
    const targetWorldStep = 78 / Math.max(Math.min(xPxPerUnit, yPxPerUnit), 0.0001);
    const step = niceStep(targetWorldStep);
    const xLines = rangeLines(Math.min(topLeft.x, bottomRight.x), Math.max(topLeft.x, bottomRight.x), step);
    const yLines = rangeLines(Math.min(topLeft.y, bottomRight.y), Math.max(topLeft.y, bottomRight.y), step);
    return { xLines, yLines };
  }, [bounds, cameraX, cameraY, zoom, viewport.width, viewport.height]);

  return (
    <div className="coordinate-grid" aria-hidden="true">
      {grid.xLines.map((x) => {
        const point = worldPointToScreen(x, 0, bounds, camera, viewport);
        return <span className="coord-line coord-line-y" style={{ left: point.x }} key={`x-${x}`} />;
      })}
      {grid.yLines.map((y) => {
        const point = worldPointToScreen(0, y, bounds, camera, viewport);
        return <span className="coord-line coord-line-x" style={{ top: point.y }} key={`y-${y}`} />;
      })}
    </div>
  );
}
