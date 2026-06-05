import { TopBanner } from './components/TopBanner.jsx';
import { MapArea } from './components/MapArea.jsx';
import { AdvancedPanel } from './components/AdvancedPanel.jsx';
import { DebugPanel } from './components/DebugPanel.jsx';
import { GenePanel } from './components/GenePanel.jsx';
import { MixingPanel } from './components/MixingPanel.jsx';
import { ThemePanel } from './components/ThemePanel.jsx';
import { CreativeBasketPanel } from './components/CreativeBasketPanel.jsx';
import { useExplorerStore } from '../../store/useExplorerStore.js';

export function ExplorerPage() {
  const activePanel = useExplorerStore((state) => state.activePanel);

  return (
    <main className="explorer-page">
      <TopBanner />
      <MapArea />
      {activePanel === 'advanced' && <AdvancedPanel />}
      {activePanel === 'debug' && <DebugPanel />}
      {activePanel === 'creative-basket' && <CreativeBasketPanel />}
      {activePanel === 'gene' && <GenePanel />}
      {activePanel === 'mixing' && <MixingPanel />}
      {activePanel === 'theme' && <ThemePanel />}
    </main>
  );
}
