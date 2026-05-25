import { useEffect, useRef } from 'react';
import { useExplorerStore } from '../../../store/useExplorerStore.js';

export function useKeyboardNavigation(enabled = true) {
  const panCamera = useExplorerStore((state) => state.panCamera);
  const logUserEvent = useExplorerStore((state) => state.logUserEvent);
  const zoom = useExplorerStore((state) => state.zoom);
  const pressedRef = useRef(new Set());
  const frameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const zoomRef = useRef(zoom);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    if (!enabled) return undefined;
    const keys = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
    const speedPxPerSecond = 430;

    function stopLoopIfIdle() {
      if (pressedRef.current.size || frameRef.current == null) return;
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastTimeRef.current = 0;
      logUserEvent('map.pan', { source: 'keyboard' });
    }

    function tick(now) {
      const last = lastTimeRef.current || now;
      const dt = Math.min((now - last) / 1000, 0.05);
      lastTimeRef.current = now;

      let x = 0;
      let y = 0;
      const pressed = pressedRef.current;
      if (pressed.has('a') || pressed.has('arrowleft')) x -= 1;
      if (pressed.has('d') || pressed.has('arrowright')) x += 1;
      if (pressed.has('w') || pressed.has('arrowup')) y -= 1;
      if (pressed.has('s') || pressed.has('arrowdown')) y += 1;

      if (x || y) {
        const length = Math.hypot(x, y) || 1;
        const distance = (speedPxPerSecond * dt) / zoomRef.current;
        panCamera((x / length) * distance, (y / length) * distance);
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
        lastTimeRef.current = 0;
      }
    }

    function ensureLoop() {
      if (frameRef.current != null) return;
      frameRef.current = requestAnimationFrame(tick);
    }

    function onKeyDown(event) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
      const key = event.key.toLowerCase();
      if (!keys.has(key)) return;
      pressedRef.current.add(key);
      ensureLoop();
      event.preventDefault();
    }

    function onKeyUp(event) {
      const key = event.key.toLowerCase();
      if (!keys.has(key)) return;
      pressedRef.current.delete(key);
      stopLoopIfIdle();
      event.preventDefault();
    }

    function onBlur() {
      pressedRef.current.clear();
      stopLoopIfIdle();
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      pressedRef.current.clear();
    };
  }, [enabled, panCamera, logUserEvent]);
}
