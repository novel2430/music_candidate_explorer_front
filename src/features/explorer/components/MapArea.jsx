import { AxisNameFrame } from './AxisNameFrame.jsx';
import { MapViewport } from './MapViewport.jsx';
import { uiText } from '../../../config/uiText.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';

export function MapArea() {
  const axisLabels = useExplorerStore((state) => state.displayAxisLabels);
  const showAxisFrames = useExplorerStore((state) => state.showAxisFrames);
  const xAxis = { ...axisLabels?.x, uiName: axisLabels?.x?.uiName || uiText.axisFallbacks.xName };
  const yAxis = { ...axisLabels?.y, uiName: axisLabels?.y?.uiName || uiText.axisFallbacks.yName };
  return (
    <section className={`map-area ${showAxisFrames ? 'has-axis-frames' : 'no-axis-frames'}`}>
      {showAxisFrames && <AxisNameFrame position="left" axis={yAxis} />}
      <MapViewport />
      {showAxisFrames && <AxisNameFrame position="bottom" axis={xAxis} />}
    </section>
  );
}
