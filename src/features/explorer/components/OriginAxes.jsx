import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { worldPointToScreen } from '../../../utils/scales.js';

export function OriginAxes({ bounds }) {
  const { cameraX, cameraY, zoom, viewportWidth, viewportHeight } = useExplorerStore();
  const viewport = { width: viewportWidth || 1, height: viewportHeight || 1 };
  const origin = worldPointToScreen(0, 0, bounds, { cameraX, cameraY, zoom }, viewport);

  return (
    <div className="origin-axes" aria-hidden="true">
      <span className="origin-axis origin-axis-y" style={{ left: origin.x }} />
      <span className="origin-axis origin-axis-x" style={{ top: origin.y }} />
      <span className="origin-cross" style={{ left: origin.x, top: origin.y }} />
    </div>
  );
}
