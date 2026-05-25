import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { minimapPoint } from '../../../utils/scales.js';
import { clamp } from '../../../utils/geometry.js';

export function MiniMap({ bounds }) {
  const state = useExplorerStore();
  const size = { width: 178, height: 126 };
  const viewportW = clamp(size.width / state.zoom, 24, size.width);
  const viewportH = clamp(size.height / state.zoom, 18, size.height);
  const viewportX = clamp(size.width / 2 + (state.cameraX / Math.max(state.viewportWidth, 1)) * size.width - viewportW / 2, 0, size.width - viewportW);
  const viewportY = clamp(size.height / 2 + (state.cameraY / Math.max(state.viewportHeight, 1)) * size.height - viewportH / 2, 0, size.height - viewportH);
  const origin = minimapPoint({ x: 0, y: 0 }, bounds, size);

  return (
    <aside className="mini-map" onPointerDown={(event) => event.stopPropagation()}>
      <div className="mini-map-title">MiniMap</div>
      <svg viewBox={`0 0 ${size.width} ${size.height}`} role="img" aria-label="Candidate minimap">
        <rect className="mini-bg" width={size.width} height={size.height} rx="8" />
        <line className="mini-origin-axis" x1={origin.x} y1="0" x2={origin.x} y2={size.height} />
        <line className="mini-origin-axis" x1="0" y1={origin.y} x2={size.width} y2={origin.y} />
        {state.candidates.map((candidate) => {
          const point = minimapPoint(candidate, bounds, size);
          const isSelected = candidate.candidate_id === state.selectedCandidateId;
          const isPlaying = state.isPlaying && candidate.candidate_id === state.playingCandidateId;
          return <circle key={candidate.candidate_id} className={`mini-dot ${isSelected ? 'mini-selected' : ''} ${isPlaying ? 'mini-playing' : ''}`} cx={point.x} cy={point.y} r={isSelected ? 3 : 1.7} />;
        })}
        <rect className="mini-viewport" x={viewportX} y={viewportY} width={viewportW} height={viewportH} rx="3" />
      </svg>
    </aside>
  );
}
