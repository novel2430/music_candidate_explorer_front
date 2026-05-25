import { X } from 'lucide-react';
import { useExplorerStore } from '../../../store/useExplorerStore.js';

export function PanelShell({ title, children }) {
  const setActivePanel = useExplorerStore((state) => state.setActivePanel);
  return (
    <div className="panel-backdrop" onMouseDown={() => setActivePanel(null)}>
      <aside className="side-panel" onMouseDown={(event) => event.stopPropagation()}>
        <div className="panel-head">
          <h2>{title}</h2>
          <button onClick={() => setActivePanel(null)} title="Close"><X size={17} /></button>
        </div>
        <div className="panel-body">{children}</div>
      </aside>
    </div>
  );
}
