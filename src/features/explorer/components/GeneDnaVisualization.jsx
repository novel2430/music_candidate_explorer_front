import { useEffect, useState } from 'react';

const VIEWBOX = { width: 680, height: 500 };
const LABEL_WIDTH = 124;
const DNA_LEFT = 180;
const DNA_RIGHT = 500;
const CENTER_X = (DNA_LEFT + DNA_RIGHT) / 2;
const TOP = 54;
const BOTTOM = 446;
const BACKBONE_PHASE_SCALE = 0.72;
const BACKBONE_AMPLITUDE = 100;

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return undefined;

    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  return reduced;
}

function useAnimationPhase({ enabled = true, speed = 0.00072 }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setPhase(0);
      return undefined;
    }

    let rafId = 0;
    let lastTime = performance.now();

    function tick(time) {
      const delta = time - lastTime;
      lastTime = time;
      setPhase((current) => current + delta * speed);
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, speed]);

  return phase;
}

function twistPhase(y, phase = 0) {
  return (y / 74) + phase * BACKBONE_PHASE_SCALE;
}

function curveX(y, strandPhase = 0, phase = 0) {
  return CENTER_X + Math.sin(twistPhase(y, phase) + strandPhase) * BACKBONE_AMPLITUDE;
}

export function GeneDnaVisualization({ loci, isPlaying = false }) {
  const reducedMotion = usePrefersReducedMotion();
  const phase = useAnimationPhase({
    enabled: !reducedMotion,
    speed: isPlaying ? 0.00115 : 0.00072,
  });
  const step = loci.length > 1 ? (BOTTOM - TOP) / (loci.length - 1) : 0;
  const backbonePoints = Array.from({ length: 36 }, (_, index) => {
    const y = 22 + index * ((VIEWBOX.height - 44) / 35);
    return { y, leftX: curveX(y, 0, phase), rightX: curveX(y, Math.PI, phase) };
  });
  const leftPath = backbonePoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.leftX} ${point.y}`).join(' ');
  const rightPath = backbonePoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.rightX} ${point.y}`).join(' ');
  const playingBoost = isPlaying ? 1.12 : 1;

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
        const localPhase = twistPhase(y, phase);
        const strandAX = curveX(y, 0, phase);
        const strandBX = curveX(y, Math.PI, phase);
        const x1 = Math.min(strandAX, strandBX);
        const x2 = Math.max(strandAX, strandBX);
        const locusValue = clamp01(locus.value);
        const markerX = x1 + (x2 - x1) * locusValue;
        const strandADepth = (Math.cos(localPhase) + 1) / 2;
        const strandBDepth = 1 - strandADepth;
        const leftDepth = strandAX <= strandBX ? strandADepth : strandBDepth;
        const rightDepth = strandAX <= strandBX ? strandBDepth : strandADepth;
        const leftRadius = 3.2 + leftDepth * 5.2;
        const rightRadius = 3.2 + rightDepth * 5.2;
        const leftOpacity = 0.48 + leftDepth * 0.52;
        const rightOpacity = 0.48 + rightDepth * 0.52;
        const markerDepth = leftDepth * (1 - locusValue) + rightDepth * locusValue;
        const markerRadius = (5.2 + markerDepth * 2) * playingBoost;
        const markerOpacity = locus.isNumeric ? 0.78 + markerDepth * 0.22 : 0.55 + markerDepth * 0.2;
        const title = [
          locus.label,
          locus.valueLabel,
          locus.rawLabel && locus.rawValue != null
            ? `${locus.rawLabel}: ${locus.rawValue}${locus.unit ? ` ${locus.unit}` : ''}`
            : null,
          `source: ${locus.source}`,
        ].filter(Boolean).join(' · ');

        return (
          <g
            className={`gene-dna-locus ${locus.isNumeric ? 'is-numeric' : 'is-summary'}`}
            key={locus.id}
            style={{ '--gene-depth': markerDepth }}
          >
            <title>{title}</title>
            <text className="gene-dna-label is-left" x={LABEL_WIDTH} y={y}>{locus.leftLabel}</text>
            <text className="gene-dna-label is-right" x={VIEWBOX.width - LABEL_WIDTH} y={y}>{locus.rightLabel}</text>
            <line className="gene-dna-guide" x1={LABEL_WIDTH + 12} y1={y} x2={x1 - 7} y2={y} />
            <line className="gene-dna-key" x1={x1} y1={y} x2={x2} y2={y} />
            <line className="gene-dna-guide" x1={x2 + 7} y1={y} x2={VIEWBOX.width - LABEL_WIDTH - 12} y2={y} />
            <circle className="gene-dna-joint is-left" cx={x1} cy={y} r={leftRadius} opacity={leftOpacity} />
            <circle className="gene-dna-joint is-right" cx={x2} cy={y} r={rightRadius} opacity={rightOpacity} />
            <circle className="gene-dna-marker" cx={markerX} cy={y} r={markerRadius} opacity={markerOpacity} />
          </g>
        );
      })}
    </svg>
  );
}
