import { PanelShell } from './PanelShell.jsx';
import { uiText } from '../../../config/uiText.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';

export function ThemePanel() {
  const themeName = useExplorerStore((state) => state.themeName);
  const setThemeName = useExplorerStore((state) => state.setThemeName);
  return (
    <PanelShell title={uiText.panels.themeTitle}>
      <div className="theme-options">
        {uiText.theme.options.map((theme) => (
          <button className={themeName === theme.id ? 'is-active' : ''} onClick={() => setThemeName(theme.id)} key={theme.id}>
            <span className={`theme-swatch ${theme.id}`} />
            {theme.label}
          </button>
        ))}
      </div>
    </PanelShell>
  );
}
