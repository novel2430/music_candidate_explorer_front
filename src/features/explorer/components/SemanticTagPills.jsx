import { uiText } from '../../../config/uiText.js';

export function SemanticTagPills({ tags, compact = false }) {
  const safeTags = tags?.length ? tags : [uiText.candidate.untagged];

  return (
    <div className={`semantic-tags ${compact ? 'is-compact' : ''}`}>
      {safeTags.map((tag) => (
        <span className="semantic-tag" key={tag}>{tag}</span>
      ))}
    </div>
  );
}
