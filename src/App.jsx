import { ExplorerPage } from './features/explorer/ExplorerPage.jsx';
import { useExplorerStore } from './store/useExplorerStore.js';

export default function App() {
  const themeName = useExplorerStore((state) => state.themeName);
  return (
    <div className={`app-shell ${themeName}`}>
      <ExplorerPage />
    </div>
  );
}
