import { Eye } from 'lucide-react';
import { useExplorerStore } from '../../../store/useExplorerStore.js';

export function HudButton() {
  const setHudVisible = useExplorerStore((state) => state.setHudVisible);
  return (
    <button className="show-hud-button" onClick={() => setHudVisible(true)}>
      <Eye size={16} /> HUD
    </button>
  );
}
