import { ChevronDown, ChevronUp, Download, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { resolveUrl } from '../../../api/httpClient.js';
import { pause, togglePlay } from '../../../services/audioController.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { formatTime } from '../../../utils/formatters.js';
import { useCandidateSelection } from '../hooks/useCandidateSelection.js';

export function CandidateHud() {
  const state = useExplorerStore();
  const { selectedCandidate, selectByOffset } = useCandidateSelection();
  if (!selectedCandidate) return null;
  const collapsed = state.candidateHudCollapsed;
  const playingThis = state.isPlaying && state.playingCandidateId === selectedCandidate.candidate_id;
  const mark = state.candidateMarks[selectedCandidate.candidate_id];
  const midiUrl = selectedCandidate.midi_url ? resolveUrl(selectedCandidate.midi_url) : '#';

  return (
    <section className={`candidate-hud ${collapsed ? 'is-collapsed' : ''}`} onPointerDown={(event) => event.stopPropagation()}>
      <div className="hud-head">
        <div>
          <div className="hud-kicker">Candidate #{selectedCandidate.rank}</div>
          <strong>{selectedCandidate.semantic_tags?.join(' / ') || 'untagged'}</strong>
        </div>
        <button title="Details" onClick={() => state.setCandidateHudCollapsed(!collapsed)}>
          {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <div className="hud-controls">
        <button onClick={() => selectByOffset(-1)} title="Previous"><SkipBack size={16} /></button>
        <button className="play-button" onClick={() => (playingThis ? pause() : togglePlay(selectedCandidate))} title="Play or pause">
          {playingThis ? <Pause size={17} /> : <Play size={17} />}
        </button>
        <button onClick={() => selectByOffset(1)} title="Next"><SkipForward size={16} /></button>
        <button className={mark === 'good' ? 'mark-active good' : ''} onClick={() => state.markCandidate(selectedCandidate.candidate_id, 'good')}>Good</button>
        <button className={mark === 'bad' ? 'mark-active bad' : ''} onClick={() => state.markCandidate(selectedCandidate.candidate_id, 'bad')}>Bad</button>
        <button className={mark === 'interesting' ? 'mark-active interesting' : ''} onClick={() => state.markCandidate(selectedCandidate.candidate_id, 'interesting')}>Interesting</button>
        <a className="icon-link" href={midiUrl} download title="Download MIDI"><Download size={16} /> MIDI</a>
      </div>

      <div className="time-row">
        <span>{formatTime(state.currentTime)}</span>
        <div><span style={{ width: `${state.duration ? (state.currentTime / state.duration) * 100 : 0}%` }} /></div>
        <span>{formatTime(state.duration)}</span>
      </div>
      {state.audioError && <div className="audio-error">{state.audioError}</div>}

      {!collapsed && (
        <dl className="candidate-details">
          <dt>candidate_id</dt><dd>{selectedCandidate.candidate_id}</dd>
          <dt>rank</dt><dd>{selectedCandidate.rank}</dd>
          <dt>search_score</dt><dd>{selectedCandidate.search_score ?? '-'}</dd>
          <dt>pool_id</dt><dd>{selectedCandidate.source?.pool_id || '-'}</dd>
          <dt>embedding_index</dt><dd>{selectedCandidate.source?.embedding_index ?? '-'}</dd>
          <dt>pc_values</dt><dd><code>{JSON.stringify(selectedCandidate.pc_values || {})}</code></dd>
          <dt>audio_url</dt><dd>{selectedCandidate.audio_url || '-'}</dd>
          <dt>midi_url</dt><dd>{selectedCandidate.midi_url || '-'}</dd>
        </dl>
      )}
    </section>
  );
}
