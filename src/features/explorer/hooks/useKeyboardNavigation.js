import { useEffect } from 'react';
import { useExplorerStore } from '../../../store/useExplorerStore.js';

export function useKeyboardNavigation(enabled = true) {
  const panCamera = useExplorerStore((state) => state.panCamera);
  const zoom = useExplorerStore((state) => state.zoom);

  useEffect(() => {
    if (!enabled) return undefined;
    function onKeyDown(event) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
      const step = 34 / zoom;
      const key = event.key.toLowerCase();
      if (key === 'w' || event.key === 'ArrowUp') {
        panCamera(0, -step);
        event.preventDefault();
      }
      if (key === 's' || event.key === 'ArrowDown') {
        panCamera(0, step);
        event.preventDefault();
      }
      if (key === 'a' || event.key === 'ArrowLeft') {
        panCamera(-step, 0);
        event.preventDefault();
      }
      if (key === 'd' || event.key === 'ArrowRight') {
        panCamera(step, 0);
        event.preventDefault();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, panCamera, zoom]);
}
