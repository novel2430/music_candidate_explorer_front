import { useEffect, useState } from 'react';
import { uiText } from '../../../../config/uiText.js';

const VIEWBOX = { width: 360, height: 250 };
const CENTER_X = 196;
const BASE_HALF_WIDTH = 70;
const TOP = 36;
const STEP = 28;
const PHASE_STEP = 0.58;

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
    const speed = isActive ? 0.00088 : 0.00046;

    function tick(time) {
      const delta = time - lastTime;
      lastTime = time;
      setPhase((current) => (current + delta * speed) % (Math.PI * 2));
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, isActive]);

  return phase;
}

function contributionBadge(contribution) {
  const parents = contribution?.dominantParents || [];
  if (contribution?.dominantType === 'balanced') return 'balance';
  return parents.join('+') || '?';
}

function contributionBreakdown(contribution) {
  const scores = contribution?.scores || [];
  if (!scores.length) return contribution?.label || 'balanced';
  return scores
    .map((score) => `${score.parentKey || score.name}(${Math.round(score.normalizedScore * 100)}%)`)
    .join(' - ');
}

function contributionPercent(contribution, parentKey) {
  const score = contribution?.scores?.find((entry) => (entry.parentKey || entry.name) === parentKey);
  return score ? `${Math.round(score.normalizedScore * 100)}%` : '0%';
}

function contributionTitle(locus) {
  const lines = [
    locus.label,
    `Expected: ${Number(locus.value).toFixed(2)}`,
    ...(locus.contribution?.scores || []).map((score) => (
      `${score.parentKey || score.name}: value ${Number(score.value).toFixed(2)} · weight ${Math.round(score.weight * 100)}% · score ${Number(score.score).toFixed(3)} · normalized ${Math.round(score.normalizedScore * 100)}%`
    )),
    `Result: ${locus.contribution?.label || 'balanced'}`,
  ];
  return lines.join('\n');
}

function compactGeneLabel(locus) {
  if (locus.id === 'x-axis' || locus.id === 'y-axis') {
    return String(locus.label || '').replace(/axis character|axis|基因/gi, '').trim() || '性格';
  }

  const labels = {
    density: '密度',
    rhythm_activity: '节奏',
    dynamic_level: '力度',
    register: '音区',
    polyphony: '织体',
    pitch_range: '音域',
  };
  return labels[locus.id] || locus.label.replace('基因', '');
}

function backbonePath(points) {
  if (!points.length) return '';
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const midY = (previous.y + point.y) / 2;
    return `${path} C ${previous.x} ${midY}, ${point.x} ${midY}, ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}

function profileStatus(parentGenomes) {
  const withIds = parentGenomes.filter((parent) => parent.candidate?.gene_profile_id);
  if (!withIds.length) return { label: 'Summary-level genome preview.', state: 'summary', hasError: false };
  const loaded = withIds.filter((parent) => parent.profileStatus === 'loaded').length;
  const loading = withIds.some((parent) => parent.profileStatus === 'loading');
  const errored = withIds.some((parent) => parent.profileStatus === 'error');
  if (errored) return { label: 'Some profiles failed. Showing best available genome data.', state: 'error', hasError: true };
  if (loaded === withIds.length) return { label: 'Detailed parent genomes loaded.', state: 'loaded', hasError: false };
  if (loading) return { label: `Loading detailed parent genomes... ${loaded} / ${withIds.length} ready.`, state: 'loading', hasError: false };
  if (loaded > 0) return { label: `Detailed genomes partially loaded · ${loaded} / ${withIds.length} ready.`, state: 'partial', hasError: false };
  return { label: 'Summary-level genome preview.', state: 'summary', hasError: false };
}

export function ExpectedGenomePreview({ parentGenomes, expectedLoci, isActive = false, onRetryFailedProfiles }) {
  const reducedMotion = usePrefersReducedMotion();
  const phase = useSynthesisPhase(!reducedMotion, isActive);
  const status = profileStatus(parentGenomes);
  const flowTargets = parentGenomes.map((parent, index) => ({
    name: parent.name,
    y: 48 + index * 52,
    weight: parent.weight,
  }));
  const locusLayouts = expectedLoci.map((locus, index) => {
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
    return {
      locus,
      y,
      x1,
      x2,
      markerX,
      leftDepth,
      rightDepth,
      markerDepth,
      dominantType: locus.contribution?.dominantType || 'balanced',
      title: contributionTitle(locus),
    };
  });
  const firstLayout = locusLayouts[0];
  const lastLayout = locusLayouts[locusLayouts.length - 1];
  const leftBackbone = firstLayout && lastLayout
    ? backbonePath([
      { x: firstLayout.x1, y: 20 },
      ...locusLayouts.map((layout) => ({ x: layout.x1, y: layout.y })),
      { x: lastLayout.x1, y: 230 },
    ])
    : '';
  const rightBackbone = firstLayout && lastLayout
    ? backbonePath([
      { x: firstLayout.x2, y: 20 },
      ...locusLayouts.map((layout) => ({ x: layout.x2, y: layout.y })),
      { x: lastLayout.x2, y: 230 },
    ])
    : '';

  return (
    <section className={`mix-synthesis ${isActive ? 'is-active' : ''}`}>
      <div className="mix-section-head">
        <h3>{uiText.mixing.geneSynthesisTitle}</h3>
        <span>{uiText.mixing.expectedGenomeTitle}</span>
      </div>
      <div className={`mix-synthesis-status is-${status.state}`}>
        <span>{status.label}</span>
        {status.hasError && (
          <button type="button" onClick={onRetryFailedProfiles}>
            Retry
          </button>
        )}
      </div>
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
        {leftBackbone && <path className="mix-synthesis-backbone" d={leftBackbone} />}
        {rightBackbone && <path className="mix-synthesis-backbone" d={rightBackbone} />}
        {locusLayouts.map((layout) => {
          const { locus, y, x1, x2, markerX, leftDepth, rightDepth, markerDepth, dominantType, title } = layout;
          return (
            <g className={`mix-synthesis-locus source-${dominantType}`} key={locus.id}>
              <title>{title}</title>
              <text className="mix-synthesis-gene-label" x={294} y={y + 3}>{compactGeneLabel(locus)}</text>
              <line className="mix-synthesis-key" x1={x1} y1={y} x2={x2} y2={y} />
              <circle className="mix-synthesis-joint" cx={x1} cy={y} r={3 + leftDepth * 2.2} opacity={0.5 + leftDepth * 0.5} />
              <circle className="mix-synthesis-joint" cx={x2} cy={y} r={3 + rightDepth * 2.2} opacity={0.5 + rightDepth * 0.5} />
              <circle className="mix-synthesis-marker" cx={markerX} cy={y} r={5 + markerDepth * (isActive ? 2.2 : 1.4)} />
              <text className="mix-synthesis-source-label" x={CENTER_X} y={y - 8}>{contributionBadge(locus.contribution)}</text>
            </g>
          );
        })}
      </svg>
      <div className="mix-synthesis-contributions" role="table" aria-label="Expected child genome contribution table">
        <div className="mix-synthesis-contribution-head" role="row">
          <span role="columnheader">Gene</span>
          <span role="columnheader">Source</span>
          {parentGenomes.map((parent) => (
            <span role="columnheader" key={parent.name}>{parent.name}</span>
          ))}
        </div>
        {expectedLoci.map((locus) => (
          <div className={`mix-synthesis-contribution-row source-${locus.contribution?.dominantType || 'balanced'}`} key={locus.id} role="row" title={contributionTitle(locus)}>
            <span>{locus.label.replace('基因', '')}</span>
            <strong title={contributionBreakdown(locus.contribution)}>
              <em>[{contributionBadge(locus.contribution)}]</em>
            </strong>
            {parentGenomes.map((parent) => (
              <b key={parent.name}>{contributionPercent(locus.contribution, parent.name)}</b>
            ))}
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
