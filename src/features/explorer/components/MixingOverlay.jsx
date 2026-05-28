import { useMemo } from 'react';
import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { worldToScreen } from '../../../utils/scales.js';

export function MixingOverlay({ bounds }) {
  const {
    candidates,
    mixingCandidateIds,
    cameraX,
    cameraY,
    zoom,
    viewportWidth,
    viewportHeight,
  } = useExplorerStore();

  const points = useMemo(() => {
    const viewport = { width: viewportWidth || 1, height: viewportHeight || 1 };
    const camera = { cameraX, cameraY, zoom };
    return mixingCandidateIds
      .map((candidateId) => {
        const candidate = candidates.find((item) => item.candidate_id === candidateId);
        if (!candidate) return null;
        return worldToScreen(candidate, bounds, camera, viewport);
      })
      .filter(Boolean);
  }, [bounds, candidates, cameraX, cameraY, mixingCandidateIds, viewportHeight, viewportWidth, zoom]);

  if (points.length < 2) return null;

  const linePoints = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <svg className="mixing-map-overlay" width={viewportWidth || 1} height={viewportHeight || 1} aria-hidden="true">
      {points.length === 2 && <line className="mixing-map-line" x1={points[0].x} y1={points[0].y} x2={points[1].x} y2={points[1].y} />}
      {points.length === 3 && (
        <>
          <polygon className="mixing-map-fill" points={linePoints} />
          <polygon className="mixing-map-line" points={linePoints} />
        </>
      )}
    </svg>
  );
}
