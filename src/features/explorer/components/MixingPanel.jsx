import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { getGeneProfile } from '../../../api/geneProfilesApi.js';
import { uiText } from '../../../config/uiText.js';
import { generateCandidateMix } from '../../../services/mixingWorkflow.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { validateChordProgression } from '../../../utils/chords.js';
import { MIX_PARENT_NAMES, buildExpectedGenomeLoci, buildMixingParentGenomes } from '../../../utils/mixingGenome.js';
import { computeBarycentricWeights, computeLineWeights, pointFromWeights } from '../../../utils/mixingGeometry.js';
import { ExpectedGenomePreview } from './mixing/ExpectedGenomePreview.jsx';
import { ParentGenomeCard } from './mixing/ParentGenomeCard.jsx';

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

function candidateGeometryLabel(candidate, fallbackIndex) {
  const parentName = MIX_PARENT_NAMES[fallbackIndex] || String(fallbackIndex + 1);
  const candidateName = candidate?.rank ? `#${candidate.rank}` : `#${fallbackIndex + 1}`;
  return `${parentName} · ${candidateName}`;
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
  const [chords, setChords] = useState(uiText.mixing.defaultChordProgression);
  const [geometryZoom, setGeometryZoom] = useState(1);
  const [isAdjustingWeights, setIsAdjustingWeights] = useState(false);
  const state = useExplorerStore();
  const selectedCandidates = useMemo(
    () => state.mixingCandidateIds
      .map((candidateId) => state.candidates.find((candidate) => candidate.candidate_id === candidateId))
      .filter(Boolean),
    [state.candidates, state.mixingCandidateIds],
  );
  useEffect(() => {
    selectedCandidates.forEach((candidate) => {
      const geneProfileId = candidate?.gene_profile_id;
      if (!geneProfileId) return;
      const status = state.geneProfileStatusById[geneProfileId];
      if (status === 'loaded' || status === 'loading' || status === 'error') return;

      state.setGeneProfileLoading(geneProfileId);
      getGeneProfile(geneProfileId)
        .then((profile) => state.setGeneProfileLoaded(geneProfileId, profile))
        .catch((error) => state.setGeneProfileError(geneProfileId, error?.message || String(error)));
    });
  }, [selectedCandidates, state.geneProfileStatusById]);
  const weights = state.mixingWeights.length === selectedCandidates.length
    ? state.mixingWeights
    : selectedCandidates.map(() => 1 / Math.max(selectedCandidates.length, 1));
  const parentGenomes = useMemo(
    () => buildMixingParentGenomes({
      parents: selectedCandidates,
      weights,
      currentSpace: state.currentSpace,
      candidates: state.candidates,
      profilesById: state.geneProfilesById,
      lineages: state.creativeLineages,
    }).map((parent) => ({
      ...parent,
      profileStatus: parent.candidate?.gene_profile_id
        ? state.geneProfileStatusById[parent.candidate.gene_profile_id] || 'idle'
        : 'summary',
    })),
    [selectedCandidates, weights, state.currentSpace, state.candidates, state.geneProfilesById, state.geneProfileStatusById, state.creativeLineages],
  );
  const expectedLoci = useMemo(
    () => buildExpectedGenomeLoci({ parentGenomes, weights }),
    [parentGenomes, weights],
  );
  const geometryAnchors = useMemo(() => mapCandidatesToPanelAnchors(selectedCandidates), [selectedCandidates]);
  const geometryCenter = { x: GEOMETRY_VIEWBOX.width / 2, y: GEOMETRY_VIEWBOX.height / 2 };
  const visibleAnchors = geometryAnchors.map((point) => ({
    x: geometryCenter.x + (point.x - geometryCenter.x) * geometryZoom,
    y: geometryCenter.y + (point.y - geometryCenter.y) * geometryZoom,
  }));
  const mixPoint = pointFromWeights(weights, visibleAnchors);
  const chordValidation = validateChordProgression(chords.join(', '), outputBars);
  const bpmError = Number(targetBpm) < 40 || Number(targetBpm) > 240 ? uiText.mixing.bpmError : null;
  const canGenerate = selectedCandidates.length >= 2
    && selectedCandidates.length <= 3
    && !state.isMixGenerating
    && !chordValidation.error
    && !bpmError;

  function updateOutputBars(nextOutputBars) {
    setOutputBars(nextOutputBars);
    setChords((current) => Array.from({ length: nextOutputBars }, (_, index) => current[index % current.length] || uiText.mixing.defaultChordProgression[0]));
  }

  function updateChord(index, value) {
    setChords((current) => current.map((chord, chordIndex) => (chordIndex === index ? value : chord)));
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
    setIsAdjustingWeights(true);
    updateWeights(event);
  }

  function stopDrag(event) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsAdjustingWeights(false);
  }

  function zoomGeometry(event) {
    event.preventDefault();
    setGeometryZoom((current) => {
      const next = current * (event.deltaY < 0 ? 1.12 : 0.88);
      return Math.min(3, Math.max(0.65, next));
    });
  }

  function retryFailedParentProfiles() {
    selectedCandidates.forEach((candidate) => {
      const geneProfileId = candidate?.gene_profile_id;
      if (!geneProfileId || state.geneProfileStatusById[geneProfileId] !== 'error') return;

      state.setGeneProfileLoading(geneProfileId);
      getGeneProfile(geneProfileId)
        .then((profile) => state.setGeneProfileLoaded(geneProfileId, profile))
        .catch((error) => state.setGeneProfileError(geneProfileId, error?.message || String(error)));
    });
  }

  return (
    <div className="panel-backdrop" onMouseDown={() => state.setActivePanel(null)}>
      <aside className="mixing-panel-large" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mixing-panel-head">
          <div>
            <h2>{uiText.mixing.title}</h2>
            <p>{uiText.mixing.emptyHint}</p>
          </div>
          <button onClick={() => state.setActivePanel(null)} title={uiText.panels.close}><X size={17} /></button>
        </div>

        <div className="mixing-panel-grid">
          <div className="mixing-panel-sidebar">
            <section className="mix-section">
              <div className="mix-section-head">
                <h3>{uiText.mixing.sources}</h3>
              </div>
              <div className="mix-source-list">
                {parentGenomes.map((parentGenome) => (
                  <ParentGenomeCard
                    key={parentGenome.candidate.candidate_id}
                    parentGenome={parentGenome}
                    isPlaying={state.isPlaying && state.playingCandidateId === parentGenome.candidate.candidate_id}
                    onOpenGene={() => {
                      state.selectCandidate(parentGenome.candidate.candidate_id);
                      state.setActivePanel('gene');
                    }}
                    onRemove={() => state.removeMixingCandidate(parentGenome.candidate.candidate_id)}
                  />
                ))}
              </div>
            </section>

            {state.mixError && <div className="audio-error">{state.mixError}</div>}
            <div className="panel-actions mix-actions">
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
          </div>

          <div className="mixing-panel-main">
            <section className="mix-section mix-geometry-section">
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
                  onPointerUp={stopDrag}
                  onPointerCancel={stopDrag}
                  onPointerLeave={() => setIsAdjustingWeights(false)}
                >
                  {selectedCandidates.length === 3 ? (
                    <>
                      <polygon className="mix-panel-fill" points={visibleAnchors.map((point) => `${point.x},${point.y}`).join(' ')} />
                      <polygon className="mix-panel-line" points={visibleAnchors.map((point) => `${point.x},${point.y}`).join(' ')} />
                      {visibleAnchors.map((point, index) => (
                        <line
                          className="mix-panel-spoke"
                          x1={mixPoint.x}
                          y1={mixPoint.y}
                          x2={point.x}
                          y2={point.y}
                          key={`spoke-${selectedCandidates[index]?.candidate_id || index}`}
                        />
                      ))}
                      {visibleAnchors.map((point, index) => (
                        <g key={selectedCandidates[index]?.candidate_id || index}>
                          <circle className="mix-panel-anchor" cx={point.x} cy={point.y} r="3" />
                          <text className="mix-panel-anchor-label" x={point.x} y={point.y - 14}>{candidateGeometryLabel(selectedCandidates[index], index)}</text>
                        </g>
                      ))}
                    </>
                  ) : (
                    <>
                      <line className="mix-panel-line" x1={visibleAnchors[0].x} y1={visibleAnchors[0].y} x2={visibleAnchors[1].x} y2={visibleAnchors[1].y} />
                      {visibleAnchors.map((point, index) => (
                        <g key={selectedCandidates[index]?.candidate_id || index}>
                          <circle className="mix-panel-anchor" cx={point.x} cy={point.y} r="3" />
                          <text className="mix-panel-anchor-label" x={point.x} y={point.y - 14}>{candidateGeometryLabel(selectedCandidates[index], index)}</text>
                        </g>
                      ))}
                    </>
                  )}
                  {selectedCandidates.length >= 2 && <circle className="mix-panel-point" cx={mixPoint.x} cy={mixPoint.y} r="3.5" />}
                </svg>
              </div>
            </section>

          </div>

          <div className="mixing-panel-synthesis">
            <ExpectedGenomePreview
              parentGenomes={parentGenomes}
              expectedLoci={expectedLoci}
              isActive={isAdjustingWeights}
              onRetryFailedProfiles={retryFailedParentProfiles}
            />
          </div>

          <section className="mix-section mix-settings-section">
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
                <div className="chord-grid">
                  {chords.map((chord, index) => (
                    <label className="chord-cell" key={index}>
                      <span>{index + 1}</span>
                      <input className="mix-input" value={chord} onChange={(event) => updateChord(index, event.target.value)} />
                    </label>
                  ))}
                </div>
              </label>
              <small className={chordValidation.error || bpmError ? 'mix-validation is-invalid' : 'mix-validation'}>
                {chordValidation.error || bpmError || uiText.mixing.chordValid}
              </small>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
