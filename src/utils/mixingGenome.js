import { buildCandidateGeneLoci } from './geneProfile.js';

export const MIX_PARENT_NAMES = ['A', 'B', 'C'];
export const MIX_SYNTHESIS_LOCUS_IDS = ['x-axis', 'y-axis', 'density', 'rhythm_activity', 'dynamic_level', 'register', 'polyphony'];

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

export function normalizeMixWeights(weights, count) {
  const safe = Array.from({ length: count }, (_, index) => Math.max(0, Number(weights[index]) || 0));
  const total = safe.reduce((sum, value) => sum + value, 0);
  return total > 0 ? safe.map((value) => value / total) : safe.map(() => 1 / Math.max(count, 1));
}

function valueLabel(locus, value) {
  if (value < 0.36) return `偏${locus.leftLabel}`;
  if (value > 0.64) return `偏${locus.rightLabel}`;
  return `${locus.leftLabel} / ${locus.rightLabel} blend`;
}

function describeContribution(parentLoci, weights) {
  if (parentLoci.length === 0) return 'balanced';
  const scores = parentLoci.map((entry, index) => ({
    name: MIX_PARENT_NAMES[index] || String(index + 1),
    score: weights[index] || 0,
  })).sort((a, b) => b.score - a.score);

  if (scores.length >= 3 && scores[0].score - scores[2].score < 0.12) return 'balanced';
  if (scores.length >= 2 && scores[0].score - scores[1].score < 0.12) return `${scores[0].name} + ${scores[1].name} blend`;
  if (scores[0].score >= 0.55 || scores.length === 2) return `mostly ${scores[0].name}`;
  return `${scores[0].name} + ${scores[1]?.name || scores[0].name} blend`;
}

function chordSymbol(chord) {
  if (typeof chord === 'string') return chord;
  return chord?.display_symbol || chord?.simple_symbol || chord?.symbol || chord?.chord || null;
}

export function chordListFromCandidate(candidate, profile) {
  const harmony = profile?.features?.harmony;
  const source = harmony?.bar_progression?.length
    ? harmony.bar_progression
    : profile?.summary?.main_chords?.length
      ? profile.summary.main_chords
      : candidate?.music_summary?.main_chords;
  return (Array.isArray(source) ? source : source ? [source] : []).map(chordSymbol).filter(Boolean);
}

export function buildMixingParentGenomes({ parents, weights, currentSpace, candidates, profilesById }) {
  const normalizedWeights = normalizeMixWeights(weights, parents.length);
  return parents.map((candidate, index) => {
    const profile = candidate?.gene_profile_id ? profilesById?.[candidate.gene_profile_id] : null;
    return {
      candidate,
      index,
      name: MIX_PARENT_NAMES[index] || String(index + 1),
      weight: normalizedWeights[index] || 0,
      loci: buildCandidateGeneLoci(candidate, currentSpace, candidates, profile),
      chords: chordListFromCandidate(candidate, profile),
    };
  });
}

export function buildExpectedGenomeLoci({ parentGenomes, weights }) {
  const normalizedWeights = normalizeMixWeights(weights, parentGenomes.length);

  return MIX_SYNTHESIS_LOCUS_IDS.map((locusId) => {
    const parentLoci = parentGenomes.map((parent) => parent.loci.find((locus) => locus.id === locusId)).filter(Boolean);
    const base = parentLoci[0];
    if (!base) return null;
    const value = clamp01(parentLoci.reduce((sum, locus, index) => sum + locus.value * (normalizedWeights[index] || 0), 0));
    const contribution = describeContribution(parentLoci, normalizedWeights);

    return {
      ...base,
      value,
      valueLabel: valueLabel(base, value),
      summaryLabel: contribution,
      source: 'weighted parent genome',
      sourceType: 'expected_child',
      isNumeric: parentLoci.some((locus) => locus.isNumeric),
      contribution,
      parentValues: parentLoci.map((locus, index) => ({
        name: MIX_PARENT_NAMES[index] || String(index + 1),
        value: locus.value,
        weight: normalizedWeights[index] || 0,
      })),
    };
  }).filter(Boolean);
}
