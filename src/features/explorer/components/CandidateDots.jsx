import { uiText } from '../../../config/uiText.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { worldToScreen } from '../../../utils/scales.js';

export function CandidateDots({ bounds }) {
  const {
    candidates,
    cameraX,
    cameraY,
    zoom,
    viewportWidth,
    viewportHeight,
    selectedCandidateId,
    hoveredCandidateId,
    playingCandidateId,
    mixingCandidateIds,
    isPlaying,
    candidateMarks,
    selectCandidate,
    toggleMixingCandidate,
    hoverCandidate,
  } = useExplorerStore();

  const viewport = { width: viewportWidth || 1, height: viewportHeight || 1 };
  const camera = { cameraX, cameraY, zoom };

  return (
    <div className="candidate-layer">
      {candidates.map((candidate, index) => {
        const point = worldToScreen(candidate, bounds, camera, viewport);
        const mark = candidateMarks[candidate.candidate_id];
        const mixingIndex = mixingCandidateIds.indexOf(candidate.candidate_id);
        const isMixing = mixingIndex >= 0;
        const isGenerated = candidate.source?.type === 'generated_artifact';
        const classes = [
          'candidate-dot',
          selectedCandidateId === candidate.candidate_id ? 'is-selected' : '',
          isMixing ? 'is-mixing-selected' : '',
          isGenerated ? 'is-generated' : '',
          hoveredCandidateId === candidate.candidate_id ? 'is-hovered' : '',
          isPlaying && playingCandidateId === candidate.candidate_id ? 'is-playing' : '',
          mark ? `is-${mark}` : '',
        ].join(' ');
        return (
          <button
            className={classes}
            style={{ left: point.x, top: point.y, animationDelay: `${Math.min(index * 10, 600)}ms` }}
            key={candidate.candidate_id}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              if (event.ctrlKey || event.metaKey) {
                toggleMixingCandidate(candidate.candidate_id);
                return;
              }
              selectCandidate(candidate.candidate_id);
            }}
            onMouseEnter={() => hoverCandidate(candidate.candidate_id)}
            onMouseLeave={() => hoverCandidate(null)}
            aria-label={isGenerated ? uiText.candidate.offspringAriaLabel(candidate.rank) : uiText.candidate.ariaLabel(candidate.rank)}
          >
            {isMixing && <span className="mixing-badge">{mixingIndex + 1}</span>}
          </button>
        );
      })}
    </div>
  );
}
