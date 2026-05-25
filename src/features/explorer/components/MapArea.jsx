import { AxisNameFrame } from './AxisNameFrame.jsx';
import { MapViewport } from './MapViewport.jsx';
import { useExplorerStore } from '../../../store/useExplorerStore.js';

export function MapArea() {
  const axisLabels = useExplorerStore((state) => state.axisLabels);
  const showAxisFrames = useExplorerStore((state) => state.showAxisFrames);
  return (
    <section className={`map-area ${showAxisFrames ? 'has-axis-frames' : 'no-axis-frames'}`}>
      {showAxisFrames && <AxisNameFrame position="left" label={axisLabels?.y?.ui_name || '張力感'} />}
      <MapViewport />
      {showAxisFrames && <AxisNameFrame position="bottom" label={axisLabels?.x?.ui_name || '明亮感'} />}
    </section>
  );
}
