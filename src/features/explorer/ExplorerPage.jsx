import { TopBanner } from './components/TopBanner.jsx';
import { MapArea } from './components/MapArea.jsx';
import { AdvancedPanel } from './components/AdvancedPanel.jsx';
import { DebugPanel } from './components/DebugPanel.jsx';
import { ThemePanel } from './components/ThemePanel.jsx';
import { useExplorerStore } from '../../store/useExplorerStore.js';

export function ExplorerPage() {
  const activePanel = useExplorerStore((state) => state.activePanel);

  return (
    <main className="explorer-page">
      <TopBanner />
      <MapArea />
      {activePanel === 'advanced' && <AdvancedPanel />}
      {activePanel === 'debug' && <DebugPanel />}
      {activePanel === 'theme' && <ThemePanel />}
    </main>
  );
}
