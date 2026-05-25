import { AxisNameFrame } from './AxisNameFrame.jsx';
import { MapViewport } from './MapViewport.jsx';
import { uiText } from '../../../config/uiText.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';

export function MapArea() {
  const axisLabels = useExplorerStore((state) => state.axisLabels);
  const showAxisFrames = useExplorerStore((state) => state.showAxisFrames);
  return (
    <section className={`map-area ${showAxisFrames ? 'has-axis-frames' : 'no-axis-frames'}`}>
      {showAxisFrames && <AxisNameFrame position="left" label={axisLabels?.y?.ui_name || uiText.axisFallbacks.yName} />}
      <MapViewport />
      {showAxisFrames && <AxisNameFrame position="bottom" label={axisLabels?.x?.ui_name || uiText.axisFallbacks.xName} />}
    </section>
  );
}
