import { AxisNameFrame } from './AxisNameFrame.jsx';
import { MapViewport } from './MapViewport.jsx';
import { useExplorerStore } from '../../../store/useExplorerStore.js';

export function MapArea() {
  const axisLabels = useExplorerStore((state) => state.axisLabels);
  return (
    <section className="map-area">
      <AxisNameFrame position="left" label={axisLabels?.y?.ui_name || '張力感'} />
      <MapViewport />
      <AxisNameFrame position="bottom" label={axisLabels?.x?.ui_name || '明亮感'} />
    </section>
  );
}
