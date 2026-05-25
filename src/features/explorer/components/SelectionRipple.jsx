import { useMemo } from 'react';
import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { worldToScreen } from '../../../utils/scales.js';

export function SelectionRipple({ bounds }) {
  const {
    candidates,
    selectedCandidateId,
    selectionPulseId,
    cameraX,
    cameraY,
    zoom,
    viewportWidth,
    viewportHeight,
  } = useExplorerStore();

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.candidate_id === selectedCandidateId),
    [candidates, selectedCandidateId],
  );

  if (!selectedCandidate || !selectionPulseId) return null;

  const viewport = { width: viewportWidth || 1, height: viewportHeight || 1 };
  const point = worldToScreen(selectedCandidate, bounds, { cameraX, cameraY, zoom }, viewport);
  const rippleSize = Math.ceil(Math.min(Math.max(viewport.width, viewport.height) * 0.82, 720));
  const safeRippleSize = Math.max(rippleSize, 320);

  return (
    <div
      className="selection-ripple"
      key={selectionPulseId}
      style={{
        left: point.x,
        top: point.y,
        width: safeRippleSize,
        height: safeRippleSize,
      }}
      aria-hidden="true"
    />
  );
}
