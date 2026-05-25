import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { worldToScreen } from '../../../utils/scales.js';

export function CandidateTooltip({ bounds }) {
  const state = useExplorerStore();
  const candidate = state.candidates.find((item) => item.candidate_id === state.hoveredCandidateId);
  if (!candidate) return null;
  const point = worldToScreen(candidate, bounds, { cameraX: state.cameraX, cameraY: state.cameraY, zoom: state.zoom }, { width: state.viewportWidth || 1, height: state.viewportHeight || 1 });

  return (
    <div className="candidate-tooltip" style={{ left: point.x + 14, top: point.y - 12 }}>
      <strong>Candidate #{candidate.rank}</strong>
      <span>{candidate.semantic_tags?.join(' / ') || 'untagged'}</span>
      <small>click to inspect</small>
    </div>
  );
}
