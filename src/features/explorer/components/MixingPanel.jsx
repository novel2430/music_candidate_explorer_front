import { Pause, Play, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { uiText } from '../../../config/uiText.js';
import { pause, togglePlay } from '../../../services/audioController.js';
import { generateCandidateMix } from '../../../services/mixingWorkflow.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { parseChordProgression, validateChordProgression } from '../../../utils/chords.js';
import { computeBarycentricWeights, computeLineWeights, pointFromWeights } from '../../../utils/mixingGeometry.js';
import { PanelShell } from './PanelShell.jsx';

const LINE_ANCHORS = [{ x: 42, y: 110 }, { x: 278, y: 110 }];
const TRIANGLE_ANCHORS = [{ x: 160, y: 34 }, { x: 44, y: 206 }, { x: 276, y: 206 }];

function getSvgPoint(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 320,
    y: ((event.clientY - rect.top) / rect.height) * 240,
  };
}

function candidateLabel(candidate) {
  return candidate?.rank ? `#${candidate.rank}` : candidate?.candidate_id;
}

export function MixingPanel() {
  const [outputBars, setOutputBars] = useState(4);
  const [targetBpm, setTargetBpm] = useState(100);
  const [chordText, setChordText] = useState('C, Am, F, G');
  const state = useExplorerStore();
  const selectedCandidates = useMemo(
    () => state.mixingCandidateIds
      .map((candidateId) => state.candidates.find((candidate) => candidate.candidate_id === candidateId))
      .filter(Boolean),
    [state.candidates, state.mixingCandidateIds],
  );
  const weights = state.mixingWeights.length === selectedCandidates.length
    ? state.mixingWeights
    : selectedCandidates.map(() => 1 / Math.max(selectedCandidates.length, 1));
  const geometryAnchors = selectedCandidates.length === 3 ? TRIANGLE_ANCHORS : LINE_ANCHORS;
  const mixPoint = pointFromWeights(weights, geometryAnchors);
  const chordValidation = validateChordProgression(chordText, outputBars);
  const bpmError = Number(targetBpm) < 40 || Number(targetBpm) > 240 ? uiText.mixing.bpmError : null;
  const canGenerate = selectedCandidates.length >= 2
    && selectedCandidates.length <= 3
    && !state.isMixGenerating
    && !chordValidation.error
    && !bpmError;

  function updateOutputBars(nextOutputBars) {
    setOutputBars(nextOutputBars);
    const chords = parseChordProgression(chordText);
    if (chords.length === outputBars) {
      const repeated = Array.from({ length: nextOutputBars }, (_, index) => chords[index % chords.length]);
      setChordText(repeated.join(', '));
    }
  }

  function updateWeights(event) {
    if (selectedCandidates.length < 2) return;
    const point = getSvgPoint(event);
    const nextWeights = selectedCandidates.length === 3
      ? computeBarycentricWeights(point, TRIANGLE_ANCHORS[0], TRIANGLE_ANCHORS[1], TRIANGLE_ANCHORS[2])
      : computeLineWeights(point, LINE_ANCHORS[0], LINE_ANCHORS[1]);
    state.setMixingWeights(nextWeights);
  }

  function startDrag(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateWeights(event);
  }

  return (
    <PanelShell title={uiText.mixing.title}>
      <p className="panel-note">{uiText.mixing.emptyHint}</p>

      <section className="mix-section">
        <div className="mix-section-head">
          <h3>{uiText.mixing.sources}</h3>
        </div>
        <div className="mix-source-list">
        {selectedCandidates.map((candidate, index) => {
          const playingThis = state.isPlaying && state.playingCandidateId === candidate.candidate_id;
          return (
            <article key={candidate.candidate_id} className="mix-source-row">
              <div>
                <strong>{candidateLabel(candidate)}</strong>
                <small>{candidate.candidate_id}</small>
              </div>
              <span>{Math.round((weights[index] || 0) * 100)}%</span>
              <button title={uiText.candidate.playPause} onClick={() => (playingThis ? pause() : togglePlay(candidate))}>
                {playingThis ? <Pause size={15} /> : <Play size={15} />}
              </button>
              <button title={uiText.mixing.remove} onClick={() => state.removeMixingCandidate(candidate.candidate_id)}><Trash2 size={15} /></button>
            </article>
          );
        })}
        </div>
      </section>

      <section className="mix-section">
        <div className="mix-section-head">
          <h3>{uiText.mixing.geometry}</h3>
          <span>{uiText.mixing.geometryHint}</span>
        </div>
        <div className="mix-geometry">
          <svg
            viewBox="0 0 320 240"
            onPointerDown={startDrag}
            onPointerMove={(event) => {
              if (event.buttons === 1) updateWeights(event);
            }}
          >
            {selectedCandidates.length === 3 ? (
              <>
                <polygon className="mix-panel-fill" points={TRIANGLE_ANCHORS.map((point) => `${point.x},${point.y}`).join(' ')} />
                <polygon className="mix-panel-line" points={TRIANGLE_ANCHORS.map((point) => `${point.x},${point.y}`).join(' ')} />
                {TRIANGLE_ANCHORS.map((point, index) => <circle className="mix-panel-anchor" cx={point.x} cy={point.y} r="7" key={index} />)}
              </>
            ) : (
              <>
                <line className="mix-panel-line" x1={LINE_ANCHORS[0].x} y1={LINE_ANCHORS[0].y} x2={LINE_ANCHORS[1].x} y2={LINE_ANCHORS[1].y} />
                {LINE_ANCHORS.map((point, index) => <circle className="mix-panel-anchor" cx={point.x} cy={point.y} r="7" key={index} />)}
              </>
            )}
            {selectedCandidates.length >= 2 && <circle className="mix-panel-point" cx={mixPoint.x} cy={mixPoint.y} r="10" />}
          </svg>
        </div>
      </section>

      <section className="mix-section">
        <div className="mix-section-head">
          <h3>{uiText.mixing.weights}</h3>
        </div>
        <div className="mix-weight-list">
          {selectedCandidates.map((candidate, index) => (
            <div key={candidate.candidate_id}>
              <span>{candidateLabel(candidate)}</span>
              <strong>{Math.round((weights[index] || 0) * 100)}%</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="mix-section">
        <div className="mix-section-head">
          <h3>{uiText.mixing.settings}</h3>
        </div>
        <div className="mix-form">
          <label>
            {uiText.mixing.outputBars}
            <div className="segmented-control">
              {[4, 8, 16].map((value) => (
                <button
                  className={outputBars === value ? 'is-active' : ''}
                  type="button"
                  key={value}
                  onClick={() => updateOutputBars(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </label>
          <label>
            {uiText.mixing.targetBpm}
            <input className="mix-input" type="number" min="40" max="240" value={targetBpm} onChange={(event) => setTargetBpm(event.target.value)} />
          </label>
          <label>
            {uiText.mixing.chordProgression}
            <textarea className="mix-input" rows="3" value={chordText} onChange={(event) => setChordText(event.target.value)} />
          </label>
          <small className={chordValidation.error || bpmError ? 'mix-validation is-invalid' : 'mix-validation'}>
            {chordValidation.error || bpmError || uiText.mixing.chordValid}
          </small>
        </div>
      </section>

      {state.mixError && <div className="audio-error">{state.mixError}</div>}
      <div className="panel-actions">
        <button
          className="primary-button"
          disabled={!canGenerate}
          onClick={() => generateCandidateMix({
            outputBars,
            targetBpm,
            chordProgression: chordValidation.chords,
          })}
        >
          {state.isMixGenerating ? uiText.mixing.generating : uiText.mixing.generate}
        </button>
        <button onClick={state.clearMixingSelection} disabled={state.isMixGenerating}>{uiText.mixing.clear}</button>
      </div>
    </PanelShell>
  );
}
