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
const GEOMETRY_VIEWBOX = { width: 320, height: 240, paddingX: 42, paddingY: 34 };

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

function fallbackAnchors(count) {
  if (count === 3) return TRIANGLE_ANCHORS;
  return LINE_ANCHORS;
}

function mapCandidatesToPanelAnchors(candidates) {
  if (candidates.length < 2) return fallbackAnchors(candidates.length);

  const rawPoints = candidates.map((candidate) => ({
    x: Number(candidate.x),
    y: -Number(candidate.y),
  }));
  if (rawPoints.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
    return fallbackAnchors(candidates.length);
  }

  const minX = Math.min(...rawPoints.map((point) => point.x));
  const maxX = Math.max(...rawPoints.map((point) => point.x));
  const minY = Math.min(...rawPoints.map((point) => point.y));
  const maxY = Math.max(...rawPoints.map((point) => point.y));
  const spanX = maxX - minX;
  const spanY = maxY - minY;

  if (spanX < 0.000001 && spanY < 0.000001) return fallbackAnchors(candidates.length);

  const drawableWidth = GEOMETRY_VIEWBOX.width - GEOMETRY_VIEWBOX.paddingX * 2;
  const drawableHeight = GEOMETRY_VIEWBOX.height - GEOMETRY_VIEWBOX.paddingY * 2;
  const scale = Math.min(
    spanX > 0 ? drawableWidth / spanX : Number.POSITIVE_INFINITY,
    spanY > 0 ? drawableHeight / spanY : Number.POSITIVE_INFINITY,
  );
  const safeScale = Number.isFinite(scale) ? scale : Math.max(drawableWidth, drawableHeight);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return rawPoints.map((point) => ({
    x: GEOMETRY_VIEWBOX.width / 2 + (point.x - centerX) * safeScale,
    y: GEOMETRY_VIEWBOX.height / 2 + (point.y - centerY) * safeScale,
  }));
}

export function MixingPanel() {
  const [outputBars, setOutputBars] = useState(4);
  const [targetBpm, setTargetBpm] = useState(100);
  const [chordText, setChordText] = useState('C, Am, F, G');
  const [geometryZoom, setGeometryZoom] = useState(1);
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
  const geometryAnchors = useMemo(() => mapCandidatesToPanelAnchors(selectedCandidates), [selectedCandidates]);
  const geometryCenter = { x: GEOMETRY_VIEWBOX.width / 2, y: GEOMETRY_VIEWBOX.height / 2 };
  const visibleAnchors = geometryAnchors.map((point) => ({
    x: geometryCenter.x + (point.x - geometryCenter.x) * geometryZoom,
    y: geometryCenter.y + (point.y - geometryCenter.y) * geometryZoom,
  }));
  const mixPoint = pointFromWeights(weights, visibleAnchors);
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
      ? computeBarycentricWeights(point, visibleAnchors[0], visibleAnchors[1], visibleAnchors[2])
      : computeLineWeights(point, visibleAnchors[0], visibleAnchors[1]);
    state.setMixingWeights(nextWeights);
  }

  function startDrag(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateWeights(event);
  }

  function updateWeightPercent(index, value) {
    const next = weights.map((weight) => weight * 100);
    next[index] = Number(value);
    const normalized = next.map((weight) => (Number.isFinite(weight) ? Math.max(0, weight) : 0));
    const sum = normalized.reduce((total, weight) => total + weight, 0);
    if (sum <= 0) return;
    state.setMixingWeights(normalized.map((weight) => weight / sum));
  }

  function zoomGeometry(event) {
    event.preventDefault();
    setGeometryZoom((current) => {
      const next = current * (event.deltaY < 0 ? 1.12 : 0.88);
      return Math.min(3, Math.max(0.65, next));
    });
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
          <span>{uiText.mixing.geometryHint} · {Math.round(geometryZoom * 100)}%</span>
        </div>
        <div className="mix-geometry">
          <svg
            viewBox="0 0 320 240"
            onWheel={zoomGeometry}
            onPointerDown={startDrag}
            onPointerMove={(event) => {
              if (event.buttons === 1) updateWeights(event);
            }}
          >
            {selectedCandidates.length === 3 ? (
              <>
                <polygon className="mix-panel-fill" points={visibleAnchors.map((point) => `${point.x},${point.y}`).join(' ')} />
                <polygon className="mix-panel-line" points={visibleAnchors.map((point) => `${point.x},${point.y}`).join(' ')} />
                {visibleAnchors.map((point, index) => (
                  <g key={selectedCandidates[index]?.candidate_id || index}>
                    <circle className="mix-panel-anchor" cx={point.x} cy={point.y} r="7" />
                    <text className="mix-panel-anchor-label" x={point.x} y={point.y - 14}>{index + 1}</text>
                  </g>
                ))}
              </>
            ) : (
              <>
                <line className="mix-panel-line" x1={visibleAnchors[0].x} y1={visibleAnchors[0].y} x2={visibleAnchors[1].x} y2={visibleAnchors[1].y} />
                {visibleAnchors.map((point, index) => (
                  <g key={selectedCandidates[index]?.candidate_id || index}>
                    <circle className="mix-panel-anchor" cx={point.x} cy={point.y} r="7" />
                    <text className="mix-panel-anchor-label" x={point.x} y={point.y - 14}>{index + 1}</text>
                  </g>
                ))}
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
              <label className="mix-weight-input">
                <input
                  className="mix-input"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round((weights[index] || 0) * 100)}
                  onChange={(event) => updateWeightPercent(index, event.target.value)}
                />
                <span>%</span>
              </label>
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
