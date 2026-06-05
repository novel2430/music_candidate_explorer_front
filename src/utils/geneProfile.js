const ENUM_VALUES = {
  density: { low: 0.2, medium: 0.5, high: 0.85 },
  polyphony: { sparse: 0.2, medium: 0.5, dense: 0.85 },
  rhythm_activity: { sparse: 0.2, moderate: 0.5, active: 0.85 },
  dynamic_level: { soft: 0.2, medium: 0.5, strong: 0.85 },
  register: { low: 0.2, mid: 0.5, mid_high: 0.68, high: 0.85 },
  pitch_range: { narrow: 0.2, medium: 0.5, wide: 0.85 },
};

const clamp01 = (value) => Math.max(0, Math.min(1, value));

function normalizeRange(rawValue, min, max) {
  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric) || max <= min) return null;
  return clamp01((numeric - min) / (max - min));
}

function enumValue(value, mapping, fallback = 0.5) {
  return mapping[String(value || '').toLowerCase()] ?? fallback;
}

function formatNumber(value, digits = 2) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Number(numeric.toFixed(digits));
}

function normalizeAcrossCandidates(value, candidates, key) {
  const values = (candidates || []).map((item) => Number(item?.[key])).filter(Number.isFinite);
  if (!values.length) return 0.5;
  return normalizeRange(value, Math.min(...values), Math.max(...values)) ?? 0.5;
}

function axisData(currentSpace, axis) {
  return currentSpace?.polished_axis_labels?.data?.[axis]
    || currentSpace?.axis_labels?.[axis]
    || currentSpace?.displayAxisLabels?.[axis]
    || {};
}

function axisLocus(candidate, currentSpace, candidates, axis) {
  const data = axisData(currentSpace, axis);
  const leftLabel = data.negative_label || data.negative || 'negative';
  const rightLabel = data.positive_label || data.positive || 'positive';
  const value = normalizeAcrossCandidates(candidate?.[axis], candidates, axis);
  const valueLabel = value < 0.36 ? `偏${leftLabel}` : value > 0.64 ? `偏${rightLabel}` : `${leftLabel} / ${rightLabel} 均衡`;

  return {
    id: `${axis}-axis`,
    label: data.ui_name || data.uiName || data.name || data.label || `${axis.toUpperCase()} axis character`,
    leftLabel,
    rightLabel,
    value,
    valueLabel,
    summaryLabel: valueLabel,
    rawValue: formatNumber(candidate?.[axis]),
    rawLabel: axis,
    unit: null,
    source: `axis.${axis}`,
    sourceType: 'axis',
    isNumeric: true,
    description: `Normalized position on the current seed space ${axis.toUpperCase()} axis.`,
  };
}

function buildNumericLocus({
  id,
  label,
  leftLabel,
  rightLabel,
  summaryLabel,
  rawValue,
  rawLabel,
  unit,
  source,
  min,
  max,
  fallbackValue,
  fallbackSource,
  description,
}) {
  const normalized = normalizeRange(rawValue, min, max);
  if (normalized != null) {
    const formatted = formatNumber(rawValue);
    return {
      id,
      label,
      leftLabel,
      rightLabel,
      value: normalized,
      valueLabel: summaryLabel ? `${summaryLabel} · ${formatted}${unit ? ` ${unit}` : ''}` : `${formatted}${unit ? ` ${unit}` : ''}`,
      summaryLabel: summaryLabel || 'unknown',
      rawValue: formatted,
      rawLabel,
      unit,
      source,
      sourceType: 'profile.features',
      isNumeric: true,
      description,
    };
  }

  return {
    id,
    label,
    leftLabel,
    rightLabel,
    value: fallbackValue,
    valueLabel: summaryLabel || 'unknown',
    summaryLabel: summaryLabel || 'unknown',
    rawValue: null,
    rawLabel: null,
    unit: null,
    source: fallbackSource,
    sourceType: 'music_summary',
    isNumeric: false,
    description,
  };
}

export function buildCandidateGeneLoci(candidate, currentSpace, candidates = [], profile = null) {
  if (!candidate) return [];
  const summary = { ...(candidate.music_summary || {}), ...(profile?.summary || {}) };
  const features = profile?.features || {};

  return [
    axisLocus(candidate, currentSpace, candidates, 'x'),
    axisLocus(candidate, currentSpace, candidates, 'y'),
    buildNumericLocus({
      id: 'density', label: '密度基因', leftLabel: '稀疏', rightLabel: '密集',
      summaryLabel: summary.density, rawValue: features.density?.notes_per_bar, rawLabel: 'notes_per_bar',
      unit: 'notes/bar', source: 'features.density.notes_per_bar', min: 0, max: 32,
      fallbackValue: enumValue(summary.density, ENUM_VALUES.density), fallbackSource: 'candidate.music_summary.density',
      description: 'Average note density per bar.',
    }),
    buildNumericLocus({
      id: 'polyphony', label: '织体基因', leftLabel: '单薄', rightLabel: '稠密',
      summaryLabel: summary.polyphony, rawValue: features.texture?.polyphony_mean, rawLabel: 'polyphony_mean',
      unit: 'avg voices', source: 'features.texture.polyphony_mean', min: 1, max: 6,
      fallbackValue: enumValue(summary.polyphony, ENUM_VALUES.polyphony), fallbackSource: 'candidate.music_summary.polyphony',
      description: 'Average number of concurrent pitched notes.',
    }),
    buildNumericLocus({
      id: 'rhythm_activity', label: '节奏活跃度', leftLabel: '稀疏', rightLabel: '活跃',
      summaryLabel: summary.rhythm_activity, rawValue: features.density?.onsets_per_bar, rawLabel: 'onsets_per_bar',
      unit: 'onsets/bar', source: 'features.density.onsets_per_bar', min: 0, max: 16,
      fallbackValue: enumValue(summary.rhythm_activity, ENUM_VALUES.rhythm_activity), fallbackSource: 'candidate.music_summary.rhythm_activity',
      description: 'Average number of note onsets per bar.',
    }),
    buildNumericLocus({
      id: 'dynamic_level', label: '力度基因', leftLabel: '柔和', rightLabel: '强烈',
      summaryLabel: summary.dynamic_level, rawValue: features.velocity?.mean_velocity, rawLabel: 'mean_velocity',
      unit: 'velocity', source: 'features.velocity.mean_velocity', min: 1, max: 127,
      fallbackValue: enumValue(summary.dynamic_level, ENUM_VALUES.dynamic_level), fallbackSource: 'candidate.music_summary.dynamic_level',
      description: 'Average MIDI note velocity.',
    }),
    buildNumericLocus({
      id: 'register', label: '音区基因', leftLabel: '低音', rightLabel: '高音',
      summaryLabel: summary.register, rawValue: features.pitch?.mean_pitch, rawLabel: 'mean_pitch',
      unit: 'mean pitch', source: 'features.pitch.mean_pitch', min: 36, max: 84,
      fallbackValue: enumValue(summary.register, ENUM_VALUES.register), fallbackSource: 'candidate.music_summary.register',
      description: 'Average MIDI pitch position.',
    }),
    buildNumericLocus({
      id: 'pitch_range', label: '音域基因', leftLabel: '窄', rightLabel: '宽',
      summaryLabel: summary.pitch_range, rawValue: features.pitch?.pitch_range, rawLabel: 'pitch_range',
      unit: 'semitones', source: 'features.pitch.pitch_range', min: 0, max: 48,
      fallbackValue: enumValue(summary.pitch_range, ENUM_VALUES.pitch_range), fallbackSource: 'candidate.music_summary.pitch_range',
      description: 'Distance between the lowest and highest pitches.',
    }),
  ];
}

export function formatProfileNumber(value, digits = 2) {
  return formatNumber(value, digits);
}
