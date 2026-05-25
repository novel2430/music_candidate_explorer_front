import { PanelShell } from './PanelShell.jsx';
import { useExplorerStore } from '../../../store/useExplorerStore.js';

const themes = [
  { id: 'theme-nord', label: 'Nord Frost' },
  { id: 'theme-dark', label: 'Deep Dark' },
  { id: 'theme-minimal', label: 'Minimal Ice' },
];

export function ThemePanel() {
  const themeName = useExplorerStore((state) => state.themeName);
  const setThemeName = useExplorerStore((state) => state.setThemeName);
  return (
    <PanelShell title="Theme">
      <div className="theme-options">
        {themes.map((theme) => (
          <button className={themeName === theme.id ? 'is-active' : ''} onClick={() => setThemeName(theme.id)} key={theme.id}>
            <span className={`theme-swatch ${theme.id}`} />
            {theme.label}
          </button>
        ))}
      </div>
    </PanelShell>
  );
}
