const VIEWBOX = { width: 680, height: 500 };
const LABEL_WIDTH = 124;
const DNA_LEFT = 180;
const DNA_RIGHT = 500;
const TOP = 54;
const BOTTOM = 446;

function curveX(y, phase = 0) {
  return (DNA_LEFT + DNA_RIGHT) / 2 + Math.sin((y / 74) + phase) * 116;
}

export function GeneDnaVisualization({ loci, isPlaying = false }) {
  const step = loci.length > 1 ? (BOTTOM - TOP) / (loci.length - 1) : 0;
  const backbonePoints = Array.from({ length: 36 }, (_, index) => {
    const y = 22 + index * ((VIEWBOX.height - 44) / 35);
    return { y, leftX: curveX(y), rightX: curveX(y, Math.PI) };
  });
  const leftPath = backbonePoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.leftX} ${point.y}`).join(' ');
  const rightPath = backbonePoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.rightX} ${point.y}`).join(' ');

  return (
    <svg
      className={`gene-dna ${isPlaying ? 'is-playing' : ''}`}
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      role="img"
      aria-label="Music genome DNA keys"
    >
      <path className="gene-dna-backbone" d={leftPath} />
      <path className="gene-dna-backbone" d={rightPath} />
      {loci.map((locus, index) => {
        const y = TOP + step * index;
        const sideA = curveX(y);
        const sideB = curveX(y, Math.PI);
        const x1 = Math.min(sideA, sideB);
        const x2 = Math.max(sideA, sideB);
        const markerX = x1 + (x2 - x1) * locus.value;
        const title = [
          locus.label,
          locus.valueLabel,
          locus.rawLabel && locus.rawValue != null
            ? `${locus.rawLabel}: ${locus.rawValue}${locus.unit ? ` ${locus.unit}` : ''}`
            : null,
          `source: ${locus.source}`,
        ].filter(Boolean).join(' · ');

        return (
          <g className={`gene-dna-locus ${locus.isNumeric ? 'is-numeric' : 'is-summary'}`} key={locus.id}>
            <title>{title}</title>
            <text className="gene-dna-label is-left" x={LABEL_WIDTH} y={y}>{locus.leftLabel}</text>
            <text className="gene-dna-label is-right" x={VIEWBOX.width - LABEL_WIDTH} y={y}>{locus.rightLabel}</text>
            <line className="gene-dna-guide" x1={LABEL_WIDTH + 12} y1={y} x2={x1 - 7} y2={y} />
            <line className="gene-dna-key" x1={x1} y1={y} x2={x2} y2={y} />
            <line className="gene-dna-guide" x1={x2 + 7} y1={y} x2={VIEWBOX.width - LABEL_WIDTH - 12} y2={y} />
            <circle className="gene-dna-joint" cx={x1} cy={y} r="3.5" />
            <circle className="gene-dna-joint" cx={x2} cy={y} r="3.5" />
            <circle className="gene-dna-marker" cx={markerX} cy={y} r="6" />
          </g>
        );
      })}
    </svg>
  );
}
