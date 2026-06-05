import { useEffect, useState } from 'react';
import { uiText } from '../../../../config/uiText.js';

const VIEWBOX = { width: 360, height: 250 };
const CENTER_X = 196;
const BASE_HALF_WIDTH = 70;
const TOP = 36;
const STEP = 28;
const PHASE_STEP = 0.72;

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

function useSynthesisPhase(enabled, isActive) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let rafId = 0;
    let lastTime = performance.now();
    const speed = isActive ? 0.0014 : 0.00078;

    function tick(time) {
      const delta = time - lastTime;
      lastTime = time;
      setPhase((current) => current + delta * speed);
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, isActive]);

  return phase;
}

function contributionBadge(contribution) {
  const parents = contribution?.dominantParents || [];
  if (contribution?.dominantType === 'balanced') return '=';
  return parents.join('+') || '?';
}

function profileStatus(parentGenomes) {
  const withIds = parentGenomes.filter((parent) => parent.candidate?.gene_profile_id);
  if (!withIds.length) return 'Summary-level genomes only.';
  const loaded = withIds.filter((parent) => parent.profileStatus === 'loaded').length;
  const loading = withIds.some((parent) => parent.profileStatus === 'loading');
  const errored = withIds.some((parent) => parent.profileStatus === 'error');
  if (errored) return 'Some parent profiles could not be loaded. Showing best available genome data.';
  if (loaded === withIds.length) return 'Detailed parent genomes loaded.';
  if (loading) return `Detailed genomes loading: ${loaded} / ${withIds.length} ready.`;
  return 'Loading detailed parent genomes...';
}

export function ExpectedGenomePreview({ parentGenomes, expectedLoci, isActive = false }) {
  const reducedMotion = usePrefersReducedMotion();
  const phase = useSynthesisPhase(!reducedMotion, isActive);
  const flowTargets = parentGenomes.map((parent, index) => ({
    name: parent.name,
    y: 48 + index * 52,
    weight: parent.weight,
  }));

  return (
    <section className={`mix-synthesis ${isActive ? 'is-active' : ''}`}>
      <div className="mix-section-head">
        <h3>{uiText.mixing.geneSynthesisTitle}</h3>
        <span>{uiText.mixing.expectedGenomeTitle}</span>
      </div>
      <p className="mix-synthesis-status">{profileStatus(parentGenomes)}</p>
      <svg className="mix-synthesis-svg" viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} role="img" aria-label={uiText.mixing.expectedGenomeTitle}>
        {flowTargets.map((target) => (
          <path
            className="mix-synthesis-flow"
            d={`M 24 ${target.y} C 76 ${target.y}, 76 126, ${CENTER_X - BASE_HALF_WIDTH - 18} 126`}
            key={target.name}
            style={{
              '--flow-opacity': 0.18 + target.weight * 0.62,
              '--flow-width': 1 + target.weight * 5,
            }}
          />
        ))}
        {flowTargets.map((target) => (
          <g className={`mix-synthesis-parent-node source-${target.name.toLowerCase()}`} key={`node-${target.name}`}>
            <circle cx="24" cy={target.y} r={5 + target.weight * 7} />
            <text x="24" y={target.y + 22}>{target.name}</text>
          </g>
        ))}
        <path className="mix-synthesis-backbone" d={`M ${CENTER_X - BASE_HALF_WIDTH} 20 C ${CENTER_X - BASE_HALF_WIDTH - 18} 82, ${CENTER_X - BASE_HALF_WIDTH + 18} 166, ${CENTER_X - BASE_HALF_WIDTH} 230`} />
        <path className="mix-synthesis-backbone" d={`M ${CENTER_X + BASE_HALF_WIDTH} 20 C ${CENTER_X + BASE_HALF_WIDTH + 18} 82, ${CENTER_X + BASE_HALF_WIDTH - 18} 166, ${CENTER_X + BASE_HALF_WIDTH} 230`} />
        {expectedLoci.map((locus, index) => {
          const y = TOP + index * STEP;
          const localPhase = phase + index * PHASE_STEP;
          const widthFactor = 0.82 + Math.abs(Math.sin(localPhase)) * 0.18;
          const halfWidth = BASE_HALF_WIDTH * widthFactor;
          const x1 = CENTER_X - halfWidth;
          const x2 = CENTER_X + halfWidth;
          const markerX = x1 + (x2 - x1) * locus.value;
          const leftDepth = (Math.cos(localPhase) + 1) / 2;
          const rightDepth = 1 - leftDepth;
          const markerDepth = leftDepth * (1 - locus.value) + rightDepth * locus.value;
          const dominantType = locus.contribution?.dominantType || 'balanced';

          return (
            <g className={`mix-synthesis-locus source-${dominantType}`} key={locus.id}>
              <title>{`${locus.label}: ${locus.valueLabel} · ${locus.contribution?.label || 'balanced'}`}</title>
              <line x1={x1} y1={y} x2={x2} y2={y} />
              <circle className="mix-synthesis-joint" cx={x1} cy={y} r={3 + leftDepth * 2.2} opacity={0.5 + leftDepth * 0.5} />
              <circle className="mix-synthesis-joint" cx={x2} cy={y} r={3 + rightDepth * 2.2} opacity={0.5 + rightDepth * 0.5} />
              <circle className="mix-synthesis-marker" cx={markerX} cy={y} r={5 + markerDepth * (isActive ? 2.2 : 1.4)} />
              <text className="mix-synthesis-source-label" x={CENTER_X} y={y - 8}>{contributionBadge(locus.contribution)}</text>
            </g>
          );
        })}
      </svg>
      <div className="mix-synthesis-contributions">
        {expectedLoci.map((locus) => (
          <div className={`source-${locus.contribution?.dominantType || 'balanced'}`} key={locus.id}>
            <span>{locus.label.replace('基因', '')}</span>
            <strong><em>{contributionBadge(locus.contribution)}</em>{locus.contribution?.label || 'balanced'}</strong>
          </div>
        ))}
      </div>
      <section className="mix-harmony-sources">
        <h4>{uiText.mixing.harmonySourcesTitle}</h4>
        {parentGenomes.map((parent) => (
          <p className={parent.weight >= 0.45 ? 'is-emphasized' : ''} key={parent.name}>
            <strong>{parent.name}</strong>: {parent.chords.length ? parent.chords.join(' → ') : uiText.gene.noChords}
          </p>
        ))}
        <small>{uiText.mixing.harmonyPreviewHint}</small>
      </section>
    </section>
  );
}
