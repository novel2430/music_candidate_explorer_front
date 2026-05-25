import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import './styles/globals.css';
import './styles/themes.css';
import './styles/layout.css';
import './styles/map.css';
import './styles/hud.css';
import './styles/panels.css';
import './styles/animations.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
