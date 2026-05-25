import { useExplorerStore } from '../../../store/useExplorerStore.js';

export function WaterSurfaceFilter() {
  const selectionPulseId = useExplorerStore((state) => state.selectionPulseId);

  return (
    <svg className="water-filter-svg" width="0" height="0" aria-hidden="true" key={selectionPulseId}>
      <filter id="water-surface-filter" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.006 0.01" numOctaves="2" seed={selectionPulseId || 1} result="waterNoise">
          <animate attributeName="baseFrequency" values="0.005 0.009;0.009 0.015;0.006 0.011" dur="1.5s" repeatCount="1" fill="freeze" />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="waterNoise" scale="0" xChannelSelector="R" yChannelSelector="G">
          <animate attributeName="scale" values="0;8;5;2;0" keyTimes="0;0.22;0.48;0.76;1" dur="1.5s" repeatCount="1" fill="freeze" />
        </feDisplacementMap>
      </filter>
    </svg>
  );
}
