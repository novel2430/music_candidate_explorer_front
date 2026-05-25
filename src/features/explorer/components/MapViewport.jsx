import { useMemo } from 'react';
import { CandidateDots } from './CandidateDots.jsx';
import { EndpointLabels } from './EndpointLabels.jsx';
import { MiniMap } from './MiniMap.jsx';
import { CandidateHud } from './CandidateHud.jsx';
import { CandidateTooltip } from './CandidateTooltip.jsx';
import { HudButton } from './HudButton.jsx';
import { CoordinateGrid } from './CoordinateGrid.jsx';
import { OriginAxes } from './OriginAxes.jsx';
import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation.js';
import { useMapCamera } from '../hooks/useMapCamera.js';
import { useWheelZoom } from '../hooks/useWheelZoom.js';
import { normalizeBounds } from '../../../utils/geometry.js';

export function MapViewport() {
  const candidates = useExplorerStore((state) => state.candidates);
  const taskStatus = useExplorerStore((state) => state.taskStatus);
  const taskError = useExplorerStore((state) => state.taskError);
  const hudVisible = useExplorerStore((state) => state.hudVisible);
  const { ref, handlers } = useMapCamera();
  const onWheel = useWheelZoom();
  useKeyboardNavigation(true);
  const bounds = useMemo(() => normalizeBounds(candidates), [candidates]);
  const isLoading = ['queued', 'running'].includes(taskStatus);

  return (
    <div ref={ref} className={`map-viewport ${isLoading ? 'is-loading' : ''}`} onWheel={onWheel} {...handlers}>
      <div className="map-glow" />
      <CoordinateGrid bounds={bounds} />
      <OriginAxes bounds={bounds} />
      {hudVisible && <EndpointLabels />}
      {!candidates.length && !isLoading && (
        <div className="empty-state">
          <strong>Enter a query to generate a candidate space.</strong>
          <span>WASD or arrow keys move the camera. Mouse wheel zooms.</span>
        </div>
      )}
      {taskError && <div className="error-state">{taskError}</div>}
      <CandidateDots bounds={bounds} />
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
