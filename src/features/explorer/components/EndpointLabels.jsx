import { useExplorerStore } from '../../../store/useExplorerStore.js';

export function EndpointLabels() {
  const axis = useExplorerStore((state) => state.axisLabels);
  return (
    <div className="endpoint-labels">
      <span className="endpoint endpoint-top">{axis?.y?.positive || '緊張強烈'}</span>
      <span className="endpoint endpoint-bottom">{axis?.y?.negative || '柔和治癒'}</span>
      <span className="endpoint endpoint-left">{axis?.x?.negative || '陰暗厚重'}</span>
      <span className="endpoint endpoint-right">{axis?.x?.positive || '明亮輕盈'}</span>
    </div>
  );
}
