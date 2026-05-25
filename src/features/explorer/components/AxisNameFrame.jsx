export function AxisNameFrame({ position, label }) {
  return <div className={`axis-frame axis-frame-${position}`}>{label}</div>;
}
