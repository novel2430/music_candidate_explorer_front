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
    isPlaying,
    candidateMarks,
    selectCandidate,
    hoverCandidate,
  } = useExplorerStore();

  const viewport = { width: viewportWidth || 1, height: viewportHeight || 1 };
  const camera = { cameraX, cameraY, zoom };

  return (
    <div className="candidate-layer">
      {candidates.map((candidate, index) => {
        const point = worldToScreen(candidate, bounds, camera, viewport);
        const mark = candidateMarks[candidate.candidate_id];
        const classes = [
          'candidate-dot',
          selectedCandidateId === candidate.candidate_id ? 'is-selected' : '',
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
              selectCandidate(candidate.candidate_id);
            }}
            onMouseEnter={() => hoverCandidate(candidate.candidate_id)}
            onMouseLeave={() => hoverCandidate(null)}
            aria-label={`Candidate ${candidate.rank}`}
          />
        );
      })}
    </div>
  );
}
