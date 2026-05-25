import { Eye } from 'lucide-react';
import { uiText } from '../../../config/uiText.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';

export function HudButton() {
  const setHudVisible = useExplorerStore((state) => state.setHudVisible);
  return (
    <button className="show-hud-button" onClick={() => setHudVisible(true)}>
      <Eye size={16} /> {uiText.map.showHud}
    </button>
  );
}
