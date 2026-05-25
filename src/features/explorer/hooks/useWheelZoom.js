import { useCallback } from 'react';
import { clamp } from '../../../utils/geometry.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';

export function useWheelZoom() {
  const { zoom, minZoom, maxZoom, setCamera, logUserEvent } = useExplorerStore();

  return useCallback(
    (event) => {
      event.preventDefault();
      const nextZoom = clamp(zoom * (event.deltaY > 0 ? 0.9 : 1.1), minZoom, maxZoom);
      setCamera({ zoom: nextZoom });
      logUserEvent('map.zoom', { zoom: nextZoom });
    },
    [zoom, minZoom, maxZoom, setCamera, logUserEvent],
  );
}
