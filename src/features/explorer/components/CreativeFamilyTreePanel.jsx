import { Pause, Play, Plus, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { uiText } from '../../../config/uiText.js';
import { pause, togglePlay } from '../../../services/audioController.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { chordList, chordSummaryForCandidate } from '../../../utils/lineageChords.js';

function shortCandidateId(candidateId) {
  return candidateId ? String(candidateId).slice(0, 8) : '-';
}

function candidateTitle(candidateId, candidate, isGenerated) {
  if (candidate?.rank != null) return isGenerated ? uiText.candidate.offspringTitle(candidate.rank) : uiText.candidate.title(candidate.rank);
  return isGenerated ? uiText.candidate.offspringShortTitle(shortCandidateId(candidateId)) : uiText.candidate.shortTitle(shortCandidateId(candidateId));
}

function chordSummary(chords) {
  return chordList(chords).slice(0, 4).join(' - ');
}

function sourceSummary(candidate, lineages = []) {
  const summary = candidate?.music_summary || {};
  return [
    [uiText.familyTree.labels.density, summary.density],
    [uiText.familyTree.labels.register, summary.register],
    [uiText.familyTree.labels.rhythm, summary.rhythm_activity],
    [uiText.familyTree.labels.dynamic, summary.dynamic_level],
    [uiText.familyTree.labels.chords, chordSummaryForCandidate({ candidate, lineages })],
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

function nodeSummary(node) {
  if (node.isGenerated && node.lineage) {
    const candidateRows = sourceSummary(node.candidate, [node.lineage])
      .filter(([label]) => label !== uiText.familyTree.labels.chords);
    return [
      ...candidateRows,
      ...generatedSummary(node.lineage),
    ];
  }
  const candidateRows = sourceSummary(node.candidate);
  if (candidateRows.length) return candidateRows;
  return node.isGenerated ? generatedSummary(node.lineage) : [];
}

function makeInstanceId({ treeId, lineageId, role, candidateId, gen, parentIndex = null }) {
  return [
    treeId,
    lineageId,
    role,
    candidateId,
    `gen_${gen}`,
    parentIndex == null ? null : `parent_${parentIndex}`,
  ].filter(Boolean).join('::');
}

function createTree(index) {
  return {
    treeId: `tree_${index}`,
    title: `Tree ${index}`,
    lineages: [],
    columnsByGen: new Map(),
    edges: [],
    generatedDepthById: new Map(),
    generatedNodeById: new Map(),
    candidateUseCount: new Map(),
    crossTreeLineageIds: new Set(),
  };
}

function addNodeToTree(tree, node) {
  const previousCount = tree.candidateUseCount.get(node.candidateId) || 0;
  const nextNode = {
    ...node,
    isRepeatedCandidate: previousCount > 0,
  };
  const column = tree.columnsByGen.get(nextNode.gen) || [];
  column.push(nextNode);
  tree.columnsByGen.set(nextNode.gen, column);
  tree.candidateUseCount.set(nextNode.candidateId, previousCount + 1);
  return nextNode;
}

function treeForLineage(lineage, childToTreeId, treesById) {
  const parentTrees = (lineage.parentCandidateIds || [])
    .map((parentId) => childToTreeId.get(parentId))
    .filter(Boolean);
  const uniqueTreeIds = [...new Set(parentTrees)];
  if (!uniqueTreeIds.length) return { tree: null, isCrossTree: false };
  const sorted = uniqueTreeIds
    .map((treeId) => {
      const tree = treesById.get(treeId);
      const maxParentGen = Math.max(
        0,
        ...(lineage.parentCandidateIds || []).map((parentId) => tree?.generatedDepthById.get(parentId) ?? -1),
      );
      return { tree, maxParentGen };
    })
    .filter((entry) => entry.tree)
    .sort((a, b) => b.maxParentGen - a.maxParentGen || Number(a.tree.treeId.replace('tree_', '')) - Number(b.tree.treeId.replace('tree_', '')));
  return { tree: sorted[0]?.tree || null, isCrossTree: uniqueTreeIds.length > 1 };
}

function buildFamilyTrees({ lineages, candidates, candidateMarks }) {
  const candidatesById = new Map(candidates.map((candidate) => [candidate.candidate_id, candidate]));
  const generatedIds = new Set(lineages.map((lineage) => lineage.childCandidateId));
  const childLineageById = new Map(lineages.map((lineage, index) => [lineage.childCandidateId, { ...lineage, mixIndex: index + 1 }]));
  const trees = [];
  const treesById = new Map();
  const childToTreeId = new Map();

  lineages.forEach((rawLineage, index) => {
    const lineage = { ...rawLineage, mixIndex: index + 1 };
    const match = treeForLineage(lineage, childToTreeId, treesById);
    const tree = match.tree || createTree(trees.length + 1);
    if (!match.tree) {
      trees.push(tree);
      treesById.set(tree.treeId, tree);
    }
    if (match.isCrossTree) tree.crossTreeLineageIds.add(lineage.id);

    const generatedParentGens = (lineage.parentCandidateIds || [])
      .map((parentId) => tree.generatedDepthById.get(parentId))
      .filter((gen) => Number.isFinite(gen));
    const parentGen = generatedParentGens.length ? Math.max(...generatedParentGens) : 0;
    const childGen = parentGen + 1;
    const parentNodes = (lineage.parentCandidateIds || []).map((candidateId, parentIndex) => {
      const existingGeneratedNode = tree.generatedNodeById.get(candidateId);
      if (existingGeneratedNode && tree.generatedDepthById.get(candidateId) === parentGen) {
        return existingGeneratedNode;
      }

      return addNodeToTree(tree, {
        instanceId: makeInstanceId({
          treeId: tree.treeId,
          lineageId: lineage.id,
          role: 'parent',
          candidateId,
          gen: parentGen,
          parentIndex,
        }),
        candidateId,
        candidate: candidatesById.get(candidateId) || null,
        treeId: tree.treeId,
        lineageId: lineage.id,
        lineage: childLineageById.get(candidateId) || null,
        role: 'parent',
        gen: parentGen,
        mark: candidateMarks[candidateId] || null,
        weight: lineage.parentWeights?.[parentIndex] ?? null,
        isGenerated: generatedIds.has(candidateId),
        isCrossTree: match.isCrossTree && childToTreeId.get(candidateId) && childToTreeId.get(candidateId) !== tree.treeId,
      });
    });
    const childNode = addNodeToTree(tree, {
      instanceId: makeInstanceId({
        treeId: tree.treeId,
        lineageId: lineage.id,
        role: 'child',
        candidateId: lineage.childCandidateId,
        gen: childGen,
      }),
      candidateId: lineage.childCandidateId,
      candidate: candidatesById.get(lineage.childCandidateId) || null,
      treeId: tree.treeId,
      lineageId: lineage.id,
      lineage,
      role: 'child',
      gen: childGen,
      mark: candidateMarks[lineage.childCandidateId] || null,
      weight: null,
      isGenerated: true,
      isCrossTree: match.isCrossTree,
    });

    parentNodes.forEach((parentNode, parentIndex) => {
      tree.edges.push({
        id: `${lineage.id}-${parentNode.instanceId}-${childNode.instanceId}`,
        fromInstanceId: parentNode.instanceId,
        toInstanceId: childNode.instanceId,
        weight: lineage.parentWeights?.[parentIndex] ?? null,
        lineageId: lineage.id,
      });
    });

    tree.lineages.push(lineage);
    tree.generatedDepthById.set(lineage.childCandidateId, childGen);
    tree.generatedNodeById.set(lineage.childCandidateId, childNode);
    childToTreeId.set(lineage.childCandidateId, tree.treeId);
  });

  return trees.map((tree) => ({
    treeId: tree.treeId,
    title: tree.title,
    lineages: tree.lineages,
    columns: Array.from(tree.columnsByGen.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([gen, nodes]) => ({
        gen,
        label: uiText.familyTree.generation(gen),
        nodes,
      })),
    edges: tree.edges,
    hasCrossTreeMix: tree.crossTreeLineageIds.size > 0,
  }));
}

function FamilyTreeTabs({ trees, activeTreeId, onSelect }) {
  if (!trees.length) return null;
  return (
    <div className="family-tree-tabs" role="tablist" aria-label={uiText.familyTree.tabs.ariaLabel}>
      {trees.map((tree) => (
        <button
          className={tree.treeId === activeTreeId ? 'is-active' : ''}
          key={tree.treeId}
          type="button"
          role="tab"
          aria-selected={tree.treeId === activeTreeId}
          onClick={() => onSelect(tree.treeId)}
        >
          <span>{tree.title}</span>
          <small>{uiText.familyTree.tabs.mixCount(tree.lineages.length)}</small>
          {tree.hasCrossTreeMix && <em>{uiText.familyTree.tabs.crossTree}</em>}
        </button>
      ))}
    </div>
  );
}

function FamilyTreeNodeCard({ node, isPlaying, isSelected, isInMix, onSelect, onTogglePlay, onToggleMix, onHoverStart, onHoverEnd }) {
  const summaryRows = nodeSummary(node);

  return (
    <article
      className={`family-tree-node ${node.isGenerated ? 'is-generated' : 'is-source'} ${node.role === 'child' ? 'is-child' : 'is-parent'} ${isSelected ? 'is-selected' : ''} ${isPlaying ? 'is-playing' : ''}`}
      onClick={onSelect}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
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
          {node.role === 'parent' && node.weight != null && <span className="family-tree-badge is-weight">{Math.round(node.weight * 100)}%</span>}
          {node.role === 'child' && node.lineage && <span className="family-tree-badge is-mix">{uiText.familyTree.badges.mix(node.lineage.mixIndex)}</span>}
          {node.isRepeatedCandidate && <span className="family-tree-badge is-reused">{uiText.familyTree.badges.reused}</span>}
          {node.isCrossTree && <span className="family-tree-badge is-cross-tree">{uiText.familyTree.badges.crossTree}</span>}
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
  const [activeTreeId, setActiveTreeId] = useState(null);
  const [hoveredInstanceId, setHoveredInstanceId] = useState(null);

  const trees = useMemo(
    () => buildFamilyTrees({
      lineages: state.creativeLineages,
      candidates: state.candidates,
      candidateMarks: state.candidateMarks,
    }),
    [state.creativeLineages, state.candidates, state.candidateMarks],
  );
  const activeTree = trees.find((tree) => tree.treeId === activeTreeId) || trees[0] || null;

  useEffect(() => {
    if (!trees.length) {
      setActiveTreeId(null);
      return;
    }
    if (!trees.some((tree) => tree.treeId === activeTreeId)) {
      setActiveTreeId(trees[0].treeId);
    }
  }, [activeTreeId, trees]);

  useLayoutEffect(() => {
    const measure = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const canvasRect = canvas.getBoundingClientRect();
      const nextEdges = (activeTree?.edges || []).map((edge) => {
        const parentNode = nodeRefs.current.get(edge.fromInstanceId);
        const childNode = nodeRefs.current.get(edge.toInstanceId);
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
          isHighlighted: hoveredInstanceId === edge.toInstanceId || hoveredInstanceId === edge.fromInstanceId,
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
  }, [activeTree, hoveredInstanceId, state.selectedCandidateId, state.playingCandidateId, state.mixingCandidateIds, state.themeName]);

  function closePanel() {
    state.setActivePanel(null);
  }

  function clearTree() {
    if (window.confirm(uiText.familyTree.actions.clearConfirm)) {
      state.clearCreativeLineages();
    }
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
            <button onClick={clearTree} disabled={!state.creativeLineages.length}>{uiText.familyTree.actions.clear}</button>
            <button onClick={closePanel} title={uiText.panels.close}><X size={17} /></button>
          </div>
        </header>

        {!state.creativeLineages.length ? (
          <section className="mix-section family-tree-empty">
            <h3>{uiText.familyTree.emptyTitle}</h3>
            <p>{uiText.familyTree.emptyHint}</p>
          </section>
        ) : (
          <>
            <FamilyTreeTabs trees={trees} activeTreeId={activeTree?.treeId} onSelect={setActiveTreeId} />
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
                    <g key={edge.id} className={`family-tree-edge ${edge.isHighlighted ? 'is-highlighted' : ''}`}>
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
                  {(activeTree?.columns || []).map((column) => (
                    <section className="family-tree-column" key={column.gen}>
                      <header className="family-tree-column-head">{column.label}</header>
                      <div className="family-tree-column-body">
                        {column.nodes.map((node) => {
                          const candidate = node.candidate;
                          const isPlaying = state.isPlaying && state.playingCandidateId === node.candidateId;
                          const isSelected = state.selectedCandidateId === node.candidateId;
                          const isInMix = state.mixingCandidateIds.includes(node.candidateId);

                          return (
                            <div
                              className="family-tree-node-wrap"
                              key={node.instanceId}
                              ref={(element) => {
                                if (element) nodeRefs.current.set(node.instanceId, element);
                                else nodeRefs.current.delete(node.instanceId);
                              }}
                            >
                              <FamilyTreeNodeCard
                                node={node}
                                isPlaying={isPlaying}
                                isSelected={isSelected}
                                isInMix={isInMix}
                                onHoverStart={() => setHoveredInstanceId(node.instanceId)}
                                onHoverEnd={() => setHoveredInstanceId(null)}
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
          </>
        )}
      </aside>
    </div>
  );
}
