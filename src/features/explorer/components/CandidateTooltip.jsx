import { uiText } from '../../../config/uiText.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { worldToScreen } from '../../../utils/scales.js';
import { SemanticTagPills } from './SemanticTagPills.jsx';

export function CandidateTooltip({ bounds }) {
  const state = useExplorerStore();
  const candidate = state.candidates.find((item) => item.candidate_id === state.hoveredCandidateId);
  if (!candidate) return null;
  const isGenerated = candidate.source?.type === 'generated_artifact';
  const point = worldToScreen(candidate, bounds, { cameraX: state.cameraX, cameraY: state.cameraY, zoom: state.zoom }, { width: state.viewportWidth || 1, height: state.viewportHeight || 1 });

  return (
    <div className="candidate-tooltip" style={{ left: point.x + 14, top: point.y - 12 }}>
      <strong>{isGenerated ? uiText.candidate.offspringTitle(candidate.rank) : uiText.candidate.title(candidate.rank)}</strong>
      <SemanticTagPills tags={candidate.semantic_tags} compact />
      <small>{uiText.candidate.tooltipHint}</small>
    </div>
  );
}
