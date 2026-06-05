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

function contributionType(parents) {
  if (parents.length === 1) return `mostly-${parents[0].toLowerCase()}`;
  if (parents.length === 2) return `blend-${parents.map((parent) => parent.toLowerCase()).sort().join('')}`;
  return 'balanced';
}

export function computeLocusContributions({ parentLociEntries, expectedValue }) {
  const rawScores = parentLociEntries.map((entry) => ({
    name: MIX_PARENT_NAMES[entry.parentIndex] || String(entry.parentIndex + 1),
    parentIndex: entry.parentIndex,
    rawScore: entry.weight * (0.5 + Math.abs(entry.locus.value - expectedValue)),
    value: entry.locus.value,
    weight: entry.weight,
  }));
  const total = rawScores.reduce((sum, entry) => sum + entry.rawScore, 0);
  const scores = rawScores
    .map((entry) => ({ ...entry, score: total > 0 ? entry.rawScore / total : 1 / Math.max(rawScores.length, 1) }))
    .sort((a, b) => b.score - a.score);

  if (!scores.length) {
    return { dominantType: 'balanced', label: 'balanced', dominantParents: [], scores: [] };
  }

  if (scores.length >= 3 && scores[0].score - scores[2].score < 0.12) {
    return { dominantType: 'balanced', label: 'balanced', dominantParents: scores.map((entry) => entry.name), scores };
  }

  if (scores.length >= 2 && scores[0].score - scores[1].score < 0.1 && scores[0].score + scores[1].score >= 0.72) {
    const parents = [scores[0].name, scores[1].name].sort();
    return { dominantType: contributionType(parents), label: `${parents[0]} + ${parents[1]} blend`, dominantParents: parents, scores };
  }

  if (scores[0].score >= 0.55 || scores.length === 1) {
    return { dominantType: contributionType([scores[0].name]), label: `mostly ${scores[0].name}`, dominantParents: [scores[0].name], scores };
  }

  if (scores.length === 2) {
    const parents = [scores[0].name, scores[1].name].sort();
    return { dominantType: contributionType(parents), label: `${parents[0]} + ${parents[1]} blend`, dominantParents: parents, scores };
  }

  return { dominantType: 'balanced', label: 'balanced', dominantParents: scores.map((entry) => entry.name), scores };
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
      profileStatus: candidate?.gene_profile_id && profile ? 'loaded' : 'summary',
      loci: buildCandidateGeneLoci(candidate, currentSpace, candidates, profile),
      chords: chordListFromCandidate(candidate, profile),
    };
  });
}

export function buildExpectedGenomeLoci({ parentGenomes, weights }) {
  const normalizedWeights = normalizeMixWeights(weights, parentGenomes.length);

  return MIX_SYNTHESIS_LOCUS_IDS.map((locusId) => {
    const parentLociEntries = parentGenomes
      .map((parent, parentIndex) => ({
        parent,
        parentIndex,
        weight: normalizedWeights[parentIndex] || 0,
        locus: parent.loci.find((locus) => locus.id === locusId),
      }))
      .filter((entry) => entry.locus);
    const base = parentLociEntries[0]?.locus;
    if (!base) return null;
    const value = clamp01(parentLociEntries.reduce((sum, entry) => sum + entry.locus.value * entry.weight, 0));
    const contribution = computeLocusContributions({ parentLociEntries, expectedValue: value });

    return {
      ...base,
      value,
      valueLabel: valueLabel(base, value),
      summaryLabel: contribution.label,
      source: 'weighted parent genome',
      sourceType: 'expected_child',
      isNumeric: parentLociEntries.some((entry) => entry.locus.isNumeric),
      contribution,
      parentValues: parentLociEntries.map((entry) => ({
        name: MIX_PARENT_NAMES[entry.parentIndex] || String(entry.parentIndex + 1),
        value: entry.locus.value,
        weight: entry.weight,
      })),
    };
  }).filter(Boolean);
}
