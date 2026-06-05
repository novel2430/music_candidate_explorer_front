import { Dna, Pause, Play, X } from 'lucide-react';
import { useEffect } from 'react';
import { getGeneProfile } from '../../../api/geneProfilesApi.js';
import { uiText } from '../../../config/uiText.js';
import { pause, togglePlay } from '../../../services/audioController.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { buildCandidateGeneLoci, formatProfileNumber } from '../../../utils/geneProfile.js';
import { chordList, chordListForCandidate, userChordProgressionForCandidate } from '../../../utils/lineageChords.js';
import { GeneDnaVisualization } from './GeneDnaVisualization.jsx';
import { SemanticTagPills } from './SemanticTagPills.jsx';

function candidateTitle(candidate) {
  return candidate?.rank != null ? uiText.gene.subtitle(candidate.rank) : candidate?.candidate_id;
}

function truncateHash(value) {
  return value ? String(value).slice(0, 10) : '-';
}

function displayValue(value) {
  if (Array.isArray(value)) return `[${value.join(', ')}]`;
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return String(formatProfileNumber(value));
  return value ?? '-';
}

function ProfileStatus({ geneProfileId, profile, status, error }) {
  if (!geneProfileId) return <p className="gene-profile-status">No gene profile id. Showing summary-level genome.</p>;
  if (status === 'loading') return <p className="gene-profile-status is-loading">Loading detailed profile...</p>;
  if (status === 'error') return <p className="gene-profile-status is-error" title={error}>Could not load detailed profile. Showing summary-level genome.</p>;
  if (status === 'loaded') {
    return (
      <div className="gene-profile-status is-loaded">
        <strong>Detailed profile loaded · {profile?.analysis_version || 'unknown version'}</strong>
        <span>midi: {truncateHash(profile?.midi_sha256)} · config: {truncateHash(profile?.analyzer_config_hash)}</span>
      </div>
    );
  }
  return <p className="gene-profile-status">Summary preview only.</p>;
}

function BasicInfo({ basic, warnings }) {
  if (!basic) return null;
  const rows = [
    ['Duration', `${displayValue(basic.duration_sec)} sec`],
    ['Tempo', `${displayValue(basic.tempo_bpm)} BPM`],
    ['Meter', displayValue(basic.time_signature)],
    ['Bars', displayValue(basic.estimated_bars)],
    ['Tracks', displayValue(basic.num_tracks)],
    ['Programs', displayValue(basic.programs)],
    ['Pitched notes', displayValue(basic.num_pitched_notes)],
    ['Drums', displayValue(basic.has_drums)],
  ];

  return (
    <section className="gene-section gene-basic-card">
      <div className="gene-section-head"><h3>{uiText.gene.basicTitle}</h3></div>
      {rows.map(([key, value]) => <div className="gene-feature-row" key={key}><span>{key}</span><strong>{value}</strong></div>)}
      {!!warnings?.length && <small className="gene-warnings" title={warnings.slice(0, 3).join('\n')}>{warnings.length} warning(s)</small>}
    </section>
  );
}

export function GenePanel() {
  const state = useExplorerStore();
  const candidate = state.candidates.find((item) => item.candidate_id === state.selectedCandidateId);
  const geneProfileId = candidate?.gene_profile_id;
  const profile = geneProfileId ? state.geneProfilesById[geneProfileId] : null;
  const status = geneProfileId ? state.geneProfileStatusById[geneProfileId] || 'idle' : 'idle';
  const error = geneProfileId ? state.geneProfileErrorById[geneProfileId] : null;

  useEffect(() => {
    if (!geneProfileId || status === 'loaded' || status === 'loading' || status === 'error') return;
    state.setGeneProfileLoading(geneProfileId);
    getGeneProfile(geneProfileId)
      .then((nextProfile) => state.setGeneProfileLoaded(geneProfileId, nextProfile))
      .catch((requestError) => state.setGeneProfileError(geneProfileId, requestError?.message || String(requestError)));
  }, [geneProfileId, status]);

  if (!candidate) {
    return (
      <div className="panel-backdrop" onMouseDown={() => state.setActivePanel(null)}>
        <aside className="gene-panel-large" onMouseDown={(event) => event.stopPropagation()}>
          <div className="gene-panel-head">
            <div><h2><Dna size={19} /> {uiText.gene.title}</h2><p>{uiText.gene.empty}</p></div>
            <button onClick={() => state.setActivePanel(null)} title={uiText.panels.close}><X size={17} /></button>
          </div>
        </aside>
      </div>
    );
  }

  const loci = buildCandidateGeneLoci(candidate, state.currentSpace, state.candidates, profile);
  const playingThis = state.isPlaying && state.playingCandidateId === candidate.candidate_id;
  const harmony = profile?.features?.harmony;
  const userChords = userChordProgressionForCandidate(candidate.candidate_id, state.creativeLineages);
  const chords = chordListForCandidate({ candidate, profile, lineages: state.creativeLineages });
  const barChords = userChords.length ? [] : chordList(harmony?.bar_chords).slice(0, 8);

  return (
    <div className="panel-backdrop" onMouseDown={() => state.setActivePanel(null)}>
      <aside className="gene-panel-large" onMouseDown={(event) => event.stopPropagation()}>
        <header className="gene-panel-head">
          <div>
            <h2><Dna size={19} /> {uiText.gene.title}</h2>
            <p>{candidateTitle(candidate)} · {geneProfileId || uiText.gene.geneIdPending}</p>
            <ProfileStatus geneProfileId={geneProfileId} profile={profile} status={status} error={error} />
          </div>
          <div className="gene-panel-head-actions">
            <button className="play-button" onClick={() => (playingThis ? pause() : togglePlay(candidate))} title={uiText.candidate.playPause}>
              {playingThis ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button onClick={() => state.setActivePanel(null)} title={uiText.panels.close}><X size={17} /></button>
          </div>
        </header>

        <section className="gene-tags"><h3>{uiText.gene.moodTags}</h3><SemanticTagPills tags={candidate.semantic_tags} /></section>

        <div className="gene-panel-grid">
          <div className="gene-panel-main">
            <section className="gene-section gene-dna-section">
              <div className="gene-section-head"><h3>{uiText.gene.dnaTitle}</h3><span>{uiText.gene.dnaHint}</span></div>
              <GeneDnaVisualization loci={loci} isPlaying={playingThis} />
            </section>
            <section className="gene-section">
              <div className="gene-section-head"><h3>{uiText.gene.harmonyTitle}</h3></div>
              <div className="gene-harmony-chain">
                {chords.length ? chords.map((chord, index) => <span key={`${chord}-${index}`}><strong>{chord}</strong>{index < chords.length - 1 && <i>→</i>}</span>) : <small>{uiText.gene.noChords}</small>}
              </div>
              {userChords.length ? <p className="gene-harmony-meta">source: mix settings chord progression</p> : harmony && <p className="gene-harmony-meta">provider: {harmony.provider || '-'} · status: {harmony.status || '-'} · unique chords: {harmony.unique_chord_count ?? '-'} · unknown: {harmony.unknown_chord_ratio != null ? `${formatProfileNumber(harmony.unknown_chord_ratio * 100)}%` : '-'}</p>}
              {!!barChords.length && <div className="gene-bar-chords">{barChords.map((chord, index) => <span key={`${chord}-${index}`}><small>Bar {index + 1}</small><strong>{chord || '-'}</strong></span>)}</div>}
            </section>
          </div>

          <div className="gene-panel-sidebar">
            <BasicInfo basic={profile?.features?.basic} warnings={profile?.metadata?.warnings} />
            <section className="gene-section gene-loci-section">
              <div className="gene-section-head"><h3>{uiText.gene.lociTitle}</h3></div>
              <div className="gene-loci-list">
                {loci.map((locus) => (
                  <article key={locus.id}>
                    <div className="gene-locus-head"><strong>{locus.label}</strong><small className={`gene-locus-source ${locus.isNumeric ? 'is-numeric' : 'is-summary'}`}>{locus.isNumeric ? locus.sourceType : 'summary fallback'}</small></div>
                    <span>{locus.valueLabel}</span>
                    <small className="gene-locus-raw">source: {locus.source}</small>
                    <div className="gene-locus-meter"><i style={{ width: `${locus.value * 100}%` }} /></div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </aside>
    </div>
  );
}
