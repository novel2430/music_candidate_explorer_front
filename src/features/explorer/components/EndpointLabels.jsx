import { uiText } from '../../../config/uiText.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';

export function EndpointLabels() {
  const axis = useExplorerStore((state) => state.axisLabels);
  return (
    <div className="endpoint-labels">
      <span className="endpoint endpoint-top">{axis?.y?.positive || uiText.axisFallbacks.yPositive}</span>
      <span className="endpoint endpoint-bottom">{axis?.y?.negative || uiText.axisFallbacks.yNegative}</span>
      <span className="endpoint endpoint-left">{axis?.x?.negative || uiText.axisFallbacks.xNegative}</span>
      <span className="endpoint endpoint-right">{axis?.x?.positive || uiText.axisFallbacks.xPositive}</span>
    </div>
  );
}
