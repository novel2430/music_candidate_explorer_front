import { Info, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CandidateDots } from './CandidateDots.jsx';
import { EndpointLabels } from './EndpointLabels.jsx';
import { MiniMap } from './MiniMap.jsx';
import { CandidateHud } from './CandidateHud.jsx';
import { CandidateTooltip } from './CandidateTooltip.jsx';
import { HudButton } from './HudButton.jsx';
import { CoordinateGrid } from './CoordinateGrid.jsx';
import { OriginAxes } from './OriginAxes.jsx';
import { SelectionRipple } from './SelectionRipple.jsx';
import { WaterSurfaceFilter } from './WaterSurfaceFilter.jsx';
import { uiText } from '../../../config/uiText.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation.js';
import { useMapCamera } from '../hooks/useMapCamera.js';
import { useWheelZoom } from '../hooks/useWheelZoom.js';
import { normalizeBounds } from '../../../utils/geometry.js';
import { worldToScreen } from '../../../utils/scales.js';

export function MapViewport() {
  const [showAxisNote, setShowAxisNote] = useState(false);
  const candidates = useExplorerStore((state) => state.candidates);
  const taskStatus = useExplorerStore((state) => state.taskStatus);
  const taskError = useExplorerStore((state) => state.taskError);
  const displayAxisLabels = useExplorerStore((state) => state.displayAxisLabels);
  const hudVisible = useExplorerStore((state) => state.hudVisible);
  const selectedCandidateId = useExplorerStore((state) => state.selectedCandidateId);
  const selectionPulseId = useExplorerStore((state) => state.selectionPulseId);
  const cameraX = useExplorerStore((state) => state.cameraX);
  const cameraY = useExplorerStore((state) => state.cameraY);
  const zoom = useExplorerStore((state) => state.zoom);
  const viewportWidth = useExplorerStore((state) => state.viewportWidth);
  const viewportHeight = useExplorerStore((state) => state.viewportHeight);
  const { ref, handlers } = useMapCamera();
  const onWheel = useWheelZoom();
  useKeyboardNavigation(true);
  const bounds = useMemo(() => normalizeBounds(candidates), [candidates]);
  const isLoading = ['queued', 'running'].includes(taskStatus);
  const loadingText = taskStatus === 'queued' ? uiText.map.loadingQueued : uiText.map.loadingRunning;
  const axisGlobalNote = displayAxisLabels?.globalNote;

  useEffect(() => {
    setShowAxisNote(false);
  }, [axisGlobalNote]);

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.candidate_id === selectedCandidateId),
    [candidates, selectedCandidateId],
  );
  const rippleOrigin = selectedCandidate
    ? worldToScreen(selectedCandidate, bounds, { cameraX, cameraY, zoom }, { width: viewportWidth || 1, height: viewportHeight || 1 })
    : { x: (viewportWidth || 1) / 2, y: (viewportHeight || 1) / 2 };

  return (
    <div ref={ref} className={`map-viewport ${isLoading ? 'is-loading' : ''}`} onWheel={onWheel} {...handlers}>
      <WaterSurfaceFilter />
      <div
        className={`map-surface ${selectionPulseId ? 'is-water-rippling' : ''}`}
        style={{
          '--ripple-origin-x': `${rippleOrigin.x}px`,
          '--ripple-origin-y': `${rippleOrigin.y}px`,
        }}
      >
        <div className="map-glow" />
        <CoordinateGrid bounds={bounds} />
        <OriginAxes bounds={bounds} />
        <SelectionRipple bounds={bounds} />
        <CandidateDots bounds={bounds} />
      </div>
      {hudVisible && <EndpointLabels />}
      {axisGlobalNote && (
        <div className="axis-note-control" onMouseDown={(event) => event.stopPropagation()}>
          <button
            className={`axis-note-toggle ${showAxisNote ? 'is-active' : ''}`}
            type="button"
            title={showAxisNote ? uiText.map.hideAxisNote : uiText.map.showAxisNote}
            aria-label={showAxisNote ? uiText.map.hideAxisNote : uiText.map.showAxisNote}
            aria-expanded={showAxisNote}
            onClick={() => setShowAxisNote((current) => !current)}
          >
            {showAxisNote ? <X size={16} /> : <Info size={16} />}
          </button>
          {showAxisNote && <div className="axis-global-note">{axisGlobalNote}</div>}
        </div>
      )}
      {isLoading && <div className="loading-state">{loadingText}</div>}
      {!candidates.length && !isLoading && (
        <div className="empty-state">
          <strong>{uiText.map.emptyTitle}</strong>
          <span>{uiText.map.emptyHint}</span>
        </div>
      )}
      {taskError && <div className="error-state">{taskError}</div>}
      {hudVisible ? (
        <>
          <MiniMap bounds={bounds} />
          <CandidateHud />
          <CandidateTooltip bounds={bounds} />
        </>
      ) : (
        <HudButton />
      )}
    </div>
  );
}
