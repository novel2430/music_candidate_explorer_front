import { Dna, Pause, Play, Trash2 } from 'lucide-react';
import { uiText } from '../../../../config/uiText.js';
import { pause, togglePlay } from '../../../../services/audioController.js';
import { SemanticTagPills } from '../SemanticTagPills.jsx';

const MINI_LOCI = ['density', 'rhythm_activity', 'register', 'polyphony'];

function candidateLabel(candidate) {
  return candidate?.rank ? `#${candidate.rank}` : candidate?.candidate_id;
}

export function ParentGenomeCard({ parentGenome, isPlaying, onOpenGene, onRemove }) {
  const { candidate, name, weight, loci } = parentGenome;
  const miniLoci = MINI_LOCI.map((id) => loci.find((locus) => locus.id === id)).filter(Boolean);

  return (
    <article className="mix-parent-card">
      <div className="mix-parent-head">
        <div>
          <strong>{name} · {candidateLabel(candidate)}</strong>
          <small>{candidate?.candidate_id}</small>
        </div>
        <span>{Math.round(weight * 100)}%</span>
      </div>
      <SemanticTagPills tags={(candidate?.semantic_tags || []).slice(0, 4)} compact />
      <div className="mix-parent-metrics">
        {miniLoci.map((locus) => (
          <div key={locus.id}>
            <span>{locus.label.replace('基因', '')}</span>
            <strong>{locus.summaryLabel || locus.valueLabel}</strong>
            <i><b style={{ width: `${locus.value * 100}%` }} /></i>
          </div>
        ))}
      </div>
      <div className="mix-parent-actions">
        <button title={uiText.candidate.playPause} onClick={() => (isPlaying ? pause() : togglePlay(candidate))}>
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button title={uiText.gene.open} onClick={onOpenGene}><Dna size={14} /> {uiText.gene.button}</button>
        <button title={uiText.mixing.remove} onClick={onRemove}><Trash2 size={14} /></button>
      </div>
    </article>
  );
}
