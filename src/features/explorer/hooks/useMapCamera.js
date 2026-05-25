import { useEffect, useRef } from 'react';
import { useExplorerStore } from '../../../store/useExplorerStore.js';

export function useMapCamera() {
  const ref = useRef(null);
  const setViewportSize = useExplorerStore((state) => state.setViewportSize);
  const panCamera = useExplorerStore((state) => state.panCamera);
  const setDragging = useExplorerStore((state) => state.setDragging);
  const logUserEvent = useExplorerStore((state) => state.logUserEvent);
  const dragRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setViewportSize(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [setViewportSize]);

  const handlers = {
    onPointerDown: (event) => {
      if (event.button !== 0) return;
      if (event.target.closest('button, a, input, textarea, select, .candidate-hud, .mini-map')) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = { x: event.clientX, y: event.clientY };
      setDragging(true);
    },
    onPointerMove: (event) => {
      if (!dragRef.current) return;
      const dx = event.clientX - dragRef.current.x;
      const dy = event.clientY - dragRef.current.y;
      dragRef.current = { x: event.clientX, y: event.clientY };
      panCamera(-dx, -dy);
    },
    onPointerUp: () => {
      if (dragRef.current) logUserEvent('map.pan');
      dragRef.current = null;
      setDragging(false);
    },
  };

  return { ref, handlers };
}
