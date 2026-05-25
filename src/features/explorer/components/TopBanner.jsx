import { Bug, Eye, EyeOff, Gauge, Palette, RotateCcw, Search } from 'lucide-react';
import { useState } from 'react';
import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { useExplorationActions } from '../hooks/useExplorationActions.js';

export function TopBanner() {
  const [query, setQuery] = useState('quiet dreamy piano loop');
  const { submitQuery, isSubmitting } = useExplorationActions();
  const state = useExplorerStore();
  const busy = ['queued', 'running'].includes(state.taskStatus) || isSubmitting;

  function runSearch(event) {
    event.preventDefault();
    submitQuery(query);
  }

  return (
    <header className="top-banner">
      <div className="brand-block">
        <div className="brand-title">Music Candidate Space</div>
        <div className="brand-subtitle">map-first exploration HUD</div>
      </div>

      <form className="search-strip" onSubmit={runSearch}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Describe a music idea..." list="recent-queries" />
        <datalist id="recent-queries">
          {state.recentQueries.map((item) => <option value={item} key={item} />)}
        </datalist>
        <button className="primary-button" type="submit" disabled={busy}>
          <Search size={16} /> Search
        </button>
      </form>

      <div className="status-cluster">
        <span className={`status-dot ${busy ? 'is-busy' : ''}`} />
        <span>{state.taskStatus}</span>
        <span>{state.candidates.length} candidates</span>
        <span>{state.selectedPair?.length ? state.selectedPair.join(' + ') : 'no pair'}</span>
        <span className="current-query">{state.currentQuery || 'no query'}</span>
      </div>

      <nav className="banner-actions">
        <button title="Reset view" onClick={state.resetCamera}><RotateCcw size={16} /></button>
        <button title="Toggle HUD" onClick={() => state.setHudVisible(!state.hudVisible)}>{state.hudVisible ? <Eye size={16} /> : <EyeOff size={16} />}</button>
        <button title="Advanced" onClick={() => state.setActivePanel('advanced')}><Gauge size={16} /> Advanced</button>
        <button title="Theme" onClick={() => state.setActivePanel('theme')}><Palette size={16} /> Theme</button>
        <button title="Debug" onClick={() => state.setActivePanel('debug')}><Bug size={16} /> Debug</button>
      </nav>
    </header>
  );
}
