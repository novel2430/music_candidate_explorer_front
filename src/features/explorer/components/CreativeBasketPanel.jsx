import { Pause, Play, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { uiText } from '../../../config/uiText.js';
import { pause, togglePlay } from '../../../services/audioController.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { chordSummaryForCandidate } from '../../../utils/lineageChords.js';

function shortCandidateId(candidateId) {
  return candidateId ? String(candidateId).slice(0, 8) : '-';
}

function candidateLabel(candidate) {
  const isGenerated = candidate?.source?.type === 'generated_artifact';
  if (candidate?.rank != null) return isGenerated ? uiText.candidate.offspringTitle(candidate.rank) : uiText.candidate.title(candidate.rank);
  return isGenerated ? uiText.candidate.offspringShortTitle(shortCandidateId(candidate?.candidate_id)) : uiText.candidate.shortTitle(shortCandidateId(candidate?.candidate_id));
}

function summaryRows(candidate, lineages = []) {
  const summary = candidate?.music_summary || {};
  const rows = [
    [uiText.creativeBasket.summaryLabels.density, summary.density],
    [uiText.creativeBasket.summaryLabels.register, summary.register],
    [uiText.creativeBasket.summaryLabels.rhythm, summary.rhythm_activity],
    [uiText.creativeBasket.summaryLabels.dynamic, summary.dynamic_level],
    [uiText.creativeBasket.summaryLabels.chords, chordSummaryForCandidate({ candidate, lineages })],
  ];
  return rows.filter(([, value]) => value);
}

function markBadges(sectionKey, mark, isInMix) {
  const badges = [];
  if (sectionKey === 'interesting' || mark === 'interesting') badges.push({ key: 'interesting', label: uiText.creativeBasket.badges.interesting });
  if (sectionKey === 'good' || mark === 'good') badges.push({ key: 'good', label: uiText.creativeBasket.badges.good });
  if (sectionKey === 'mix' || isInMix) badges.push({ key: 'mix', label: uiText.creativeBasket.badges.mix });
  return badges;
}

function BasketCard({ candidate, sectionKey, lineages, isInMix, isPlaying, isSelected, onSelect, onTogglePlay, onToggleMix, onRemoveMark }) {
  const generated = candidate?.source?.type === 'generated_artifact';
  const badges = markBadges(sectionKey, candidate?.mark, isInMix);
  const rows = summaryRows(candidate, lineages);

  return (
    <article
      className={`creative-basket-card ${isSelected ? 'is-selected' : ''} ${isPlaying ? 'is-playing' : ''}`}
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
      <div className="creative-basket-card-head">
        <div>
          <strong>{candidateLabel(candidate)}</strong>
          <small>{candidate?.candidate_id || shortCandidateId(candidate?.candidate_id)}</small>
        </div>
        <div className="creative-basket-badges">
          {badges.map((badge) => <span key={badge.key} className={`creative-basket-badge is-${badge.key}`}>{badge.label}</span>)}
          {generated && <span className="creative-basket-badge is-generated">{uiText.creativeBasket.badges.generated}</span>}
          {isSelected && <span className="creative-basket-badge is-selected">{uiText.creativeBasket.badges.selected}</span>}
          {isPlaying && <span className="creative-basket-badge is-playing">{uiText.creativeBasket.badges.playing}</span>}
        </div>
      </div>

      <div className={`creative-basket-summary ${rows.length ? '' : 'is-empty'}`}>
        {rows.length
          ? rows.map(([label, value]) => (
            <span key={label}>
              <small>{label}</small>
              <strong>{value}</strong>
            </span>
          ))
          : <p>{uiText.creativeBasket.summaryEmpty}</p>}
      </div>

      <div className="creative-basket-actions">
        <button
          className="play-button"
          onClick={(event) => {
            event.stopPropagation();
            onTogglePlay();
          }}
          title={isPlaying ? uiText.creativeBasket.actions.pause : uiText.creativeBasket.actions.play}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isPlaying ? uiText.creativeBasket.actions.pause : uiText.creativeBasket.actions.play}
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onToggleMix();
          }}
        >
          {isInMix ? <X size={14} /> : <Plus size={14} />}
          {isInMix ? uiText.creativeBasket.actions.removeFromMix : uiText.creativeBasket.actions.addToMix}
        </button>
        {sectionKey !== 'mix' && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onRemoveMark();
            }}
          >
            <X size={14} />
            {uiText.creativeBasket.actions.removeMark}
          </button>
        )}
      </div>
    </article>
  );
}

export function CreativeBasketPanel() {
  const [activeTab, setActiveTab] = useState('interesting');
  const state = useExplorerStore();

  useEffect(() => {
    useExplorerStore.getState().logUserEvent('open_creative_basket');
    return () => useExplorerStore.getState().logUserEvent('close_creative_basket');
  }, []);

  const interestingCandidates = useMemo(
    () => state.candidates
      .filter((candidate) => state.candidateMarks[candidate.candidate_id] === 'interesting')
      .map((candidate) => ({ ...candidate, mark: 'interesting' })),
    [state.candidates, state.candidateMarks],
  );
  const goodCandidates = useMemo(
    () => state.candidates
      .filter((candidate) => state.candidateMarks[candidate.candidate_id] === 'good')
      .map((candidate) => ({ ...candidate, mark: 'good' })),
    [state.candidates, state.candidateMarks],
  );
  const mixCandidates = useMemo(
    () => state.mixingCandidateIds
      .map((candidateId) => {
        const candidate = state.candidates.find((item) => item.candidate_id === candidateId);
        if (!candidate) return null;
        return { ...candidate, mark: state.candidateMarks[candidateId] || null };
      })
      .filter(Boolean),
    [state.candidates, state.candidateMarks, state.mixingCandidateIds],
  );

  const sections = [
    {
      key: 'interesting',
      title: uiText.creativeBasket.sectionTitles.interesting,
      empty: uiText.creativeBasket.empty.interesting,
      candidates: interestingCandidates,
    },
    {
      key: 'good',
      title: uiText.creativeBasket.sectionTitles.good,
      empty: uiText.creativeBasket.empty.good,
      candidates: goodCandidates,
    },
    {
      key: 'mix',
      title: uiText.creativeBasket.sectionTitles.mix,
      empty: uiText.creativeBasket.empty.mix,
      candidates: mixCandidates,
    },
  ];

  function closePanel() {
    state.setActivePanel(null);
  }

  const activeSection = sections.find((section) => section.key === activeTab) || sections[0];

  return (
    <div className="panel-backdrop creative-basket-backdrop" onMouseDown={closePanel}>
      <aside className="creative-basket-panel" onMouseDown={(event) => event.stopPropagation()}>
        <header className="creative-basket-head">
          <div>
            <h2>{uiText.creativeBasket.title}</h2>
            <p>{uiText.creativeBasket.subtitle}</p>
          </div>
          <button onClick={closePanel} title={uiText.panels.close}><X size={17} /></button>
        </header>

        <div className="creative-basket-body">
          <div className="creative-basket-tabs" role="tablist" aria-label={uiText.creativeBasket.title}>
            {sections.map((section) => (
              <button
                key={section.key}
                className={`creative-basket-tab ${activeSection.key === section.key ? 'is-active' : ''}`}
                onClick={() => setActiveTab(section.key)}
                role="tab"
                aria-selected={activeSection.key === section.key}
                aria-controls={`creative-basket-panel-${section.key}`}
                id={`creative-basket-tab-${section.key}`}
              >
                <span>{section.title}</span>
                <small>{section.candidates.length}</small>
              </button>
            ))}
          </div>

          <section
            className="mix-section creative-basket-section creative-basket-tabpanel"
            role="tabpanel"
            id={`creative-basket-panel-${activeSection.key}`}
            aria-labelledby={`creative-basket-tab-${activeSection.key}`}
          >
            <div className="creative-basket-section-heading">
              <strong>{activeSection.title}</strong>
              <small>{activeSection.candidates.length}</small>
            </div>

            <div className="creative-basket-list">
              {activeSection.candidates.length ? (
                activeSection.candidates.map((candidate) => {
                  const isPlaying = state.isPlaying && state.playingCandidateId === candidate.candidate_id;
                  const isSelected = state.selectedCandidateId === candidate.candidate_id;
                  const isInMix = state.mixingCandidateIds.includes(candidate.candidate_id);

                  return (
                    <BasketCard
                      key={`${activeSection.key}-${candidate.candidate_id}`}
                      candidate={candidate}
                      sectionKey={activeSection.key}
                      lineages={state.creativeLineages}
                      isInMix={isInMix}
                      isPlaying={isPlaying}
                      isSelected={isSelected}
                      onSelect={() => {
                        state.selectCandidate(candidate.candidate_id);
                        state.logUserEvent('creative_basket_select_candidate', { candidateId: candidate.candidate_id, section: activeSection.key });
                      }}
                      onTogglePlay={() => {
                        if (isPlaying) pause();
                        else togglePlay(candidate);
                      }}
                      onToggleMix={() => {
                        if (isInMix) {
                          state.removeMixingCandidate(candidate.candidate_id);
                          state.logUserEvent('creative_basket_remove_from_mix', { candidateId: candidate.candidate_id, section: activeSection.key });
                          return;
                        }
                        state.toggleMixingCandidate(candidate.candidate_id);
                        state.logUserEvent('creative_basket_add_to_mix', { candidateId: candidate.candidate_id, section: activeSection.key });
                      }}
                      onRemoveMark={() => {
                        state.markCandidate(candidate.candidate_id, null);
                        state.logUserEvent('creative_basket_remove_mark', { candidateId: candidate.candidate_id, section: activeSection.key });
                      }}
                    />
                  );
                })
              ) : (
                <p className="creative-basket-empty">{activeSection.empty}</p>
              )}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
