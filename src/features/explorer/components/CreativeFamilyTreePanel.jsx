import { Pause, Play, Plus, X } from 'lucide-react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { uiText } from '../../../config/uiText.js';
import { pause, togglePlay } from '../../../services/audioController.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';

function shortCandidateId(candidateId) {
  return candidateId ? String(candidateId).slice(0, 8) : '-';
}

function candidateTitle(candidateId, candidate, isGenerated) {
  if (candidate?.rank != null) return `${isGenerated ? 'Generated' : 'Candidate'} #${candidate.rank}`;
  return `${isGenerated ? 'Generated' : 'Candidate'} ${shortCandidateId(candidateId)}`;
}

function chordSymbol(chord) {
  if (typeof chord === 'string') return chord;
  return chord?.display_symbol || chord?.simple_symbol || chord?.symbol || chord?.chord || null;
}

function chordSummary(chords) {
  const list = (Array.isArray(chords) ? chords : chords ? [chords] : []).map(chordSymbol).filter(Boolean);
  return list.slice(0, 4).join(' - ');
}

function sourceSummary(candidate) {
  const summary = candidate?.music_summary || {};
  return [
    [uiText.familyTree.labels.density, summary.density],
    [uiText.familyTree.labels.register, summary.register],
    [uiText.familyTree.labels.rhythm, summary.rhythm_activity],
    [uiText.familyTree.labels.dynamic, summary.dynamic_level],
    [uiText.familyTree.labels.chords, chordSummary(summary.main_chords)],
  ].filter(([, value]) => value);
}

function generatedSummary(lineage) {
  const settings = lineage?.settings || {};
  return [
    [uiText.familyTree.labels.bars, settings.bars],
    [uiText.familyTree.labels.bpm, settings.bpm],
    [uiText.familyTree.labels.chords, chordSummary(settings.chordProgression)],
  ].filter(([, value]) => value);
}

function buildDepthMap(lineages) {
  const byChildId = new Map(lineages.map((lineage) => [lineage.childCandidateId, lineage]));
  const memo = new Map();
  const visiting = new Set();

  function depthOf(candidateId) {
    if (!candidateId) return 0;
    if (memo.has(candidateId)) return memo.get(candidateId);
    if (visiting.has(candidateId)) return 0;

    const lineage = byChildId.get(candidateId);
    if (!lineage) {
      memo.set(candidateId, 0);
      return 0;
    }

    visiting.add(candidateId);
    const depth = Math.max(0, ...lineage.parentCandidateIds.map((parentId) => depthOf(parentId))) + 1;
    visiting.delete(candidateId);
    memo.set(candidateId, depth);
    return depth;
  }

  const candidateIds = new Set();
  lineages.forEach((lineage) => {
    lineage.parentCandidateIds.forEach((candidateId) => candidateIds.add(candidateId));
    candidateIds.add(lineage.childCandidateId);
  });
  candidateIds.forEach((candidateId) => depthOf(candidateId));
  return memo;
}

function buildColumns({ lineages, candidates, candidateMarks }) {
  const candidatesById = new Map(candidates.map((candidate) => [candidate.candidate_id, candidate]));
  const childLineageById = new Map(lineages.map((lineage, index) => [lineage.childCandidateId, { ...lineage, mixIndex: index + 1 }]));
  const generatedIds = new Set(lineages.map((lineage) => lineage.childCandidateId));
  const depthMap = buildDepthMap(lineages);
  const nodesByDepth = new Map();

  depthMap.forEach((depth, candidateId) => {
    const candidate = candidatesById.get(candidateId) || null;
    const childLineage = childLineageById.get(candidateId) || null;
    const bucket = nodesByDepth.get(depth) || [];
    bucket.push({
      candidateId,
      candidate,
      depth,
      mark: candidateMarks[candidateId] || null,
      lineage: childLineage,
      isGenerated: generatedIds.has(candidateId),
      sortKey: childLineage?.createdAt || candidate?.rank || 0,
    });
    nodesByDepth.set(depth, bucket);
  });

  return Array.from(nodesByDepth.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([depth, nodes]) => ({
      depth,
      nodes: nodes.sort((a, b) => {
        if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
        return String(a.candidateId).localeCompare(String(b.candidateId));
      }),
    }));
}

function buildEdges(lineages, depthMap) {
  return lineages.flatMap((lineage, lineageIndex) => lineage.parentCandidateIds.map((parentCandidateId, parentIndex) => ({
    id: `${lineage.id}-${parentCandidateId}`,
    parentCandidateId,
    childCandidateId: lineage.childCandidateId,
    weight: lineage.parentWeights?.[parentIndex] ?? null,
    depth: depthMap.get(lineage.childCandidateId) || 0,
    lineageIndex: lineageIndex + 1,
  })));
}

function FamilyTreeNodeCard({ node, isPlaying, isSelected, isInMix, onSelect, onTogglePlay, onToggleMix }) {
  const summaryRows = node.isGenerated ? generatedSummary(node.lineage) : sourceSummary(node.candidate);

  return (
    <article
      className={`family-tree-node ${node.isGenerated ? 'is-generated' : 'is-source'} ${isSelected ? 'is-selected' : ''} ${isPlaying ? 'is-playing' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="family-tree-node-head">
        <div>
          <strong>{candidateTitle(node.candidateId, node.candidate, node.isGenerated)}</strong>
          <small>{node.candidate?.candidate_id || node.candidateId}</small>
        </div>
        <div className="family-tree-node-badges">
          <span className={`family-tree-badge ${node.isGenerated ? 'is-generated' : 'is-source'}`}>
            {node.isGenerated ? uiText.familyTree.badges.generated : uiText.familyTree.badges.source}
          </span>
          {node.lineage && <span className="family-tree-badge is-mix">{uiText.familyTree.badges.mix(node.lineage.mixIndex)}</span>}
          {node.mark === 'interesting' && <span className="family-tree-badge is-interesting">{uiText.familyTree.badges.interesting}</span>}
          {node.mark === 'good' && <span className="family-tree-badge is-good">{uiText.familyTree.badges.good}</span>}
          {isSelected && <span className="family-tree-badge is-selected">{uiText.familyTree.badges.selected}</span>}
          {isPlaying && <span className="family-tree-badge is-playing">{uiText.familyTree.badges.playing}</span>}
        </div>
      </div>

      <div className={`family-tree-node-summary ${summaryRows.length ? '' : 'is-empty'}`}>
        {summaryRows.length
          ? summaryRows.map(([label, value]) => (
            <span key={`${node.candidateId}-${label}`}>
              <small>{label}</small>
              <strong>{value}</strong>
            </span>
          ))
          : <p>{uiText.creativeBasket.summaryEmpty}</p>}
      </div>

      <div className="family-tree-node-actions">
        <button
          className="play-button"
          onClick={(event) => {
            event.stopPropagation();
            onTogglePlay();
          }}
          title={isPlaying ? uiText.familyTree.actions.pause : uiText.familyTree.actions.play}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isPlaying ? uiText.familyTree.actions.pause : uiText.familyTree.actions.play}
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onToggleMix();
          }}
        >
          {isInMix ? <X size={14} /> : <Plus size={14} />}
          {isInMix ? uiText.familyTree.actions.removeFromMix : uiText.familyTree.actions.addToMix}
        </button>
      </div>
    </article>
  );
}

export function CreativeFamilyTreePanel() {
  const state = useExplorerStore();
  const canvasRef = useRef(null);
  const nodeRefs = useRef(new Map());
  const [edgeLayout, setEdgeLayout] = useState({ width: 0, height: 0, edges: [] });

  const columns = useMemo(
    () => buildColumns({
      lineages: state.creativeLineages,
      candidates: state.candidates,
      candidateMarks: state.candidateMarks,
    }),
    [state.creativeLineages, state.candidates, state.candidateMarks],
  );
  const depthMap = useMemo(() => buildDepthMap(state.creativeLineages), [state.creativeLineages]);
  const edges = useMemo(() => buildEdges(state.creativeLineages, depthMap), [state.creativeLineages, depthMap]);

  useLayoutEffect(() => {
    const measure = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const canvasRect = canvas.getBoundingClientRect();
      const nextEdges = edges.map((edge) => {
        const parentNode = nodeRefs.current.get(edge.parentCandidateId);
        const childNode = nodeRefs.current.get(edge.childCandidateId);
        if (!parentNode || !childNode) return null;
        const parentRect = parentNode.getBoundingClientRect();
        const childRect = childNode.getBoundingClientRect();
        const x1 = parentRect.right - canvasRect.left;
        const y1 = parentRect.top - canvasRect.top + parentRect.height / 2;
        const x2 = childRect.left - canvasRect.left;
        const y2 = childRect.top - canvasRect.top + childRect.height / 2;
        const delta = Math.max(40, (x2 - x1) * 0.38);
        return {
          ...edge,
          path: `M ${x1} ${y1} C ${x1 + delta} ${y1}, ${x2 - delta} ${y2}, ${x2} ${y2}`,
          labelX: x1 + (x2 - x1) * 0.52,
          labelY: y1 + (y2 - y1) * 0.5 - 8,
        };
      }).filter(Boolean);

      setEdgeLayout({
        width: canvas.scrollWidth,
        height: canvas.scrollHeight,
        edges: nextEdges,
      });
    };

    const frame = requestAnimationFrame(measure);
    const resizeObserver = new ResizeObserver(() => measure());
    if (canvasRef.current) resizeObserver.observe(canvasRef.current);
    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [columns, edges, state.selectedCandidateId, state.playingCandidateId, state.mixingCandidateIds, state.themeName]);

  function closePanel() {
    state.setActivePanel(null);
  }

  return (
    <div className="panel-backdrop" onMouseDown={closePanel}>
      <aside className="family-tree-panel" onMouseDown={(event) => event.stopPropagation()}>
        <header className="family-tree-head">
          <div>
            <h2>{uiText.familyTree.title}</h2>
            <p>{uiText.familyTree.subtitle}</p>
          </div>
          <div className="family-tree-head-actions">
            <button onClick={state.clearCreativeLineages} disabled={!state.creativeLineages.length}>{uiText.familyTree.actions.clear}</button>
            <button onClick={closePanel} title={uiText.panels.close}><X size={17} /></button>
          </div>
        </header>

        {!state.creativeLineages.length ? (
          <section className="mix-section family-tree-empty">
            <h3>{uiText.familyTree.emptyTitle}</h3>
            <p>{uiText.familyTree.emptyHint}</p>
          </section>
        ) : (
          <div className="family-tree-scroll">
            <div className="family-tree-canvas" ref={canvasRef}>
              <svg
                className="family-tree-edges"
                width={Math.max(edgeLayout.width, 1)}
                height={Math.max(edgeLayout.height, 1)}
                viewBox={`0 0 ${Math.max(edgeLayout.width, 1)} ${Math.max(edgeLayout.height, 1)}`}
                preserveAspectRatio="none"
              >
                {edgeLayout.edges.map((edge) => (
                  <g key={edge.id} className="family-tree-edge">
                    <path d={edge.path} />
                    {edge.weight != null && (
                      <>
                        <rect x={edge.labelX - 17} y={edge.labelY - 10} rx="999" ry="999" width="34" height="18" />
                        <text x={edge.labelX} y={edge.labelY + 3}>{Math.round(edge.weight * 100)}%</text>
                      </>
                    )}
                  </g>
                ))}
              </svg>

              <div className="family-tree-columns">
                {columns.map((column) => (
                  <section className="family-tree-column" key={column.depth}>
                    <header className="family-tree-column-head">{uiText.familyTree.generation(column.depth)}</header>
                    <div className="family-tree-column-body">
                      {column.nodes.map((node) => {
                        const candidate = node.candidate;
                        const isPlaying = state.isPlaying && state.playingCandidateId === node.candidateId;
                        const isSelected = state.selectedCandidateId === node.candidateId;
                        const isInMix = state.mixingCandidateIds.includes(node.candidateId);

                        return (
                          <div
                            className="family-tree-node-wrap"
                            key={node.candidateId}
                            ref={(element) => {
                              if (element) nodeRefs.current.set(node.candidateId, element);
                              else nodeRefs.current.delete(node.candidateId);
                            }}
                          >
                            <FamilyTreeNodeCard
                              node={node}
                              isPlaying={isPlaying}
                              isSelected={isSelected}
                              isInMix={isInMix}
                              onSelect={() => state.selectCandidate(node.candidateId)}
                              onTogglePlay={() => {
                                if (!candidate?.audio_url) {
                                  state.setAudioState({ audioError: uiText.errors.missingAudioUrl });
                                  return;
                                }
                                if (isPlaying) pause();
                                else togglePlay(candidate);
                              }}
                              onToggleMix={() => state.toggleMixingCandidate(node.candidateId)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
