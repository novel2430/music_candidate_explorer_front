import { uiText } from '../../../config/uiText.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';

export function EndpointLabels() {
  const axis = useExplorerStore((state) => state.displayAxisLabels);
  return (
    <div className="endpoint-labels">
      <span className="endpoint endpoint-top" title={axis?.y?.positiveDescription}>{axis?.y?.positive || uiText.axisFallbacks.yPositive}</span>
      <span className="endpoint endpoint-bottom" title={axis?.y?.negativeDescription}>{axis?.y?.negative || uiText.axisFallbacks.yNegative}</span>
      <span className="endpoint endpoint-left" title={axis?.x?.negativeDescription}>{axis?.x?.negative || uiText.axisFallbacks.xNegative}</span>
      <span className="endpoint endpoint-right" title={axis?.x?.positiveDescription}>{axis?.x?.positive || uiText.axisFallbacks.xPositive}</span>
    </div>
  );
}
