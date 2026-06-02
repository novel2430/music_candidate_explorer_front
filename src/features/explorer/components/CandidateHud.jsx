import { ChevronDown, ChevronUp, Download, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { resolveUrl } from '../../../api/httpClient.js';
import { uiText } from '../../../config/uiText.js';
import { pause, setVolume, togglePlay } from '../../../services/audioController.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { formatTime } from '../../../utils/formatters.js';
import { useCandidateSelection } from '../hooks/useCandidateSelection.js';
import { SemanticTagPills } from './SemanticTagPills.jsx';

export function CandidateHud() {
  const state = useExplorerStore();
  const { selectedCandidate, selectByOffset } = useCandidateSelection();
  if (!selectedCandidate) return null;
  const collapsed = state.candidateHudCollapsed;
  const playingThis = state.isPlaying && state.playingCandidateId === selectedCandidate.candidate_id;
  const mark = state.candidateMarks[selectedCandidate.candidate_id];
  const midiUrl = selectedCandidate.midi_url ? resolveUrl(selectedCandidate.midi_url) : '#';
  const isGenerated = selectedCandidate.source?.type === 'generated_artifact';
  const volumePercent = Math.round(state.volume * 100);
  const VolumeIcon = volumePercent === 0 ? VolumeX : Volume2;

  function updateVolume(value) {
    setVolume(Number(value) / 100);
  }

  return (
    <section className={`candidate-hud ${collapsed ? 'is-collapsed' : ''}`} onPointerDown={(event) => event.stopPropagation()}>
      <div className="hud-head">
        <div>
          <div className="hud-kicker">{uiText.candidate.title(selectedCandidate.rank)}</div>
          {isGenerated && <div className="generated-kicker">{uiText.candidate.generatedMix}</div>}
          <SemanticTagPills tags={selectedCandidate.semantic_tags} />
        </div>
        <button title={uiText.candidate.details} onClick={() => state.setCandidateHudCollapsed(!collapsed)}>
          {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <div className="hud-controls">
        <button onClick={() => selectByOffset(-1)} title={uiText.candidate.previous}><SkipBack size={16} /></button>
        <button className="play-button" onClick={() => (playingThis ? pause() : togglePlay(selectedCandidate))} title={uiText.candidate.playPause}>
          {playingThis ? <Pause size={17} /> : <Play size={17} />}
        </button>
        <button onClick={() => selectByOffset(1)} title={uiText.candidate.next}><SkipForward size={16} /></button>
        <button className={mark === 'good' ? 'mark-active good' : ''} onClick={() => state.markCandidate(selectedCandidate.candidate_id, 'good')}>{uiText.candidate.marks.good}</button>
        <button className={mark === 'bad' ? 'mark-active bad' : ''} onClick={() => state.markCandidate(selectedCandidate.candidate_id, 'bad')}>{uiText.candidate.marks.bad}</button>
        <button className={mark === 'interesting' ? 'mark-active interesting' : ''} onClick={() => state.markCandidate(selectedCandidate.candidate_id, 'interesting')}>{uiText.candidate.marks.interesting}</button>
        <a className="icon-link" href={midiUrl} download title={uiText.candidate.downloadMidi}><Download size={16} /> {uiText.candidate.midi}</a>
      </div>

      <div className="time-row">
        <span>{formatTime(state.currentTime)}</span>
        <div><span style={{ width: `${state.duration ? (state.currentTime / state.duration) * 100 : 0}%` }} /></div>
        <span>{formatTime(state.duration)}</span>
      </div>

      <div className="candidate-volume">
        <VolumeIcon size={16} />
        <input
          className="candidate-volume-slider"
          type="range"
          min="0"
          max="100"
          step="1"
          value={volumePercent}
          onChange={(event) => updateVolume(event.target.value)}
          aria-label={uiText.candidate.volume}
          style={{ '--volume-level': `${volumePercent}%` }}
        />
        <span>{volumePercent}%</span>
      </div>
      {state.audioError && <div className="audio-error">{state.audioError}</div>}

      {!collapsed && (
        <dl className="candidate-details">
          <dt>{uiText.candidate.fields.candidateId}</dt><dd>{selectedCandidate.candidate_id}</dd>
          <dt>{uiText.candidate.fields.rank}</dt><dd>{selectedCandidate.rank}</dd>
          <dt>{uiText.candidate.fields.searchScore}</dt><dd>{selectedCandidate.search_score ?? '-'}</dd>
          <dt>{uiText.candidate.fields.poolId}</dt><dd>{selectedCandidate.source?.pool_id || '-'}</dd>
          <dt>{uiText.candidate.fields.embeddingIndex}</dt><dd>{selectedCandidate.source?.embedding_index ?? '-'}</dd>
          <dt>{uiText.candidate.fields.pcValues}</dt><dd><code>{JSON.stringify(selectedCandidate.pc_values || {})}</code></dd>
          <dt>{uiText.candidate.fields.audioUrl}</dt><dd>{selectedCandidate.audio_url || '-'}</dd>
          <dt>{uiText.candidate.fields.midiUrl}</dt><dd>{selectedCandidate.midi_url || '-'}</dd>
          {isGenerated && (
            <>
              <dt>{uiText.candidate.fields.parentCandidateIds}</dt><dd><code>{JSON.stringify(selectedCandidate.source?.parent_candidate_ids || selectedCandidate.parent_candidate_ids || [])}</code></dd>
              <dt>{uiText.candidate.fields.mixId}</dt><dd>{selectedCandidate.source?.mix_id || selectedCandidate.mix_id || '-'}</dd>
              <dt>{uiText.candidate.fields.createdByTaskId}</dt><dd>{selectedCandidate.source?.created_by_task_id || selectedCandidate.created_by_task_id || '-'}</dd>
            </>
          )}
        </dl>
      )}
    </section>
  );
}
