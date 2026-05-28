import { CircleHelp } from 'lucide-react';

export function AxisNameFrame({ position, axis }) {
  const title = [axis?.axisExplanation, axis?.negativeDescription, axis?.positiveDescription].filter(Boolean).join('\n\n');

  return (
    <div className={`axis-frame axis-frame-${position}`} title={title}>
      <span>{axis?.uiName}</span>
      {axis?.axisExplanation && <CircleHelp size={14} aria-hidden="true" />}
    </div>
  );
}
