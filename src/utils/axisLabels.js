export function getDisplayAxis(space, axis) {
  const polished =
    space?.polished_axis_labels?.status === 'ok'
      ? space.polished_axis_labels.data?.[axis]
      : null;

  const rule = space?.axis_labels?.[axis];

  if (polished) {
    return {
      pc: polished.pc,
      uiName: polished.ui_name,
      negative: polished.negative_label,
      positive: polished.positive_label,
      negativeDescription: polished.negative_description,
      positiveDescription: polished.positive_description,
      axisExplanation: polished.axis_explanation,
      source: 'llm',
    };
  }

  return {
    pc: rule?.pc,
    uiName: rule?.ui_name ?? '',
    negative: rule?.negative ?? '',
    positive: rule?.positive ?? '',
    negativeDescription: rule?.negative_description ?? '',
    positiveDescription: rule?.positive_description ?? '',
    axisExplanation: rule?.axis_explanation ?? '',
    source: 'rule',
  };
}

export function getDisplayAxisLabels(space) {
  return {
    x: getDisplayAxis(space, 'x'),
    y: getDisplayAxis(space, 'y'),
    globalNote:
      space?.polished_axis_labels?.status === 'ok'
        ? space.polished_axis_labels.data?.global_note ?? ''
        : '',
  };
}
