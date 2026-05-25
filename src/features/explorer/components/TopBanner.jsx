import { Bug, Eye, EyeOff, Gauge, Palette, RotateCcw, Search } from 'lucide-react';
import { useState } from 'react';
import { uiText } from '../../../config/uiText.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { useExplorationActions } from '../hooks/useExplorationActions.js';

export function TopBanner() {
  const [query, setQuery] = useState(uiText.topBanner.defaultQuery);
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
        <div className="brand-title">{uiText.topBanner.title}</div>
        <div className="brand-subtitle">{uiText.topBanner.subtitle}</div>
      </div>

      <form className="search-strip" onSubmit={runSearch}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={uiText.topBanner.queryPlaceholder} list="recent-queries" />
        <datalist id="recent-queries">
          {state.recentQueries.map((item) => <option value={item} key={item} />)}
        </datalist>
        <button className="primary-button" type="submit" disabled={busy}>
          <Search size={16} /> {uiText.topBanner.search}
        </button>
      </form>

      <div className="status-cluster">
        <span className={`status-dot ${busy ? 'is-busy' : ''}`} />
        <span>{state.taskStatus}</span>
        <span>{uiText.topBanner.candidateCount(state.candidates.length)}</span>
        <span>{state.selectedPair?.length ? state.selectedPair.join(' + ') : uiText.topBanner.noPair}</span>
        <span className="current-query">{state.currentQuery || uiText.topBanner.noQuery}</span>
      </div>

      <nav className="banner-actions">
        <button title={uiText.topBanner.resetView} onClick={state.resetCamera}><RotateCcw size={16} /></button>
        <button title={uiText.topBanner.toggleHud} onClick={() => state.setHudVisible(!state.hudVisible)}>{state.hudVisible ? <Eye size={16} /> : <EyeOff size={16} />}</button>
        <button title={uiText.topBanner.advanced} onClick={() => state.setActivePanel('advanced')}><Gauge size={16} /> {uiText.topBanner.advanced}</button>
        <button title={uiText.topBanner.theme} onClick={() => state.setActivePanel('theme')}><Palette size={16} /> {uiText.topBanner.theme}</button>
        <button title={uiText.topBanner.debug} onClick={() => state.setActivePanel('debug')}><Bug size={16} /> {uiText.topBanner.debug}</button>
      </nav>
    </header>
  );
}
