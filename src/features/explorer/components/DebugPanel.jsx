import { useState } from 'react';
import { uiText } from '../../../config/uiText.js';
import { loadArtifactContent, loadArtifactMetadata } from '../../../services/artifactWorkflow.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { compactJson, formatMs } from '../../../utils/formatters.js';
import { PanelShell } from './PanelShell.jsx';

export function DebugPanel() {
  const store = useExplorerStore();
  const [activeTab, setActiveTab] = useState('task');
  const tabs = Object.entries(uiText.debug.tabs);

  return (
    <PanelShell title={uiText.panels.debugTitle}>
      <div className="tabs">
        {tabs.map(([tab, label]) => (
          <button className={activeTab === tab ? 'is-active' : ''} onClick={() => setActiveTab(tab)} key={tab}>{label}</button>
        ))}
      </div>
      {activeTab === 'task' && <pre>{compactJson(store.currentTask) || uiText.debug.emptyTask}</pre>}
      {activeTab === 'space' && <pre>{compactJson(store.currentSpace) || uiText.debug.emptySpace}</pre>}
      {activeTab === 'artifacts' && (
        <div className="artifact-list">
          {!store.artifacts.length && <p>{uiText.debug.emptyArtifacts}</p>}
          {store.artifacts.map((artifact) => (
            <article key={artifact.artifact_id}>
              <strong>{artifact.kind}</strong>
              <small>{artifact.artifact_id}</small>
              <div className="panel-actions">
                <button onClick={() => loadArtifactMetadata(artifact.artifact_id)}>{uiText.debug.metadata}</button>
                <button onClick={() => loadArtifactContent(artifact.artifact_id)}>{uiText.debug.content}</button>
              </div>
              <pre>{compactJson(store.artifactMetadataById[artifact.artifact_id])}</pre>
              <pre>{typeof store.artifactContentById[artifact.artifact_id] === 'string' ? store.artifactContentById[artifact.artifact_id] : compactJson(store.artifactContentById[artifact.artifact_id])}</pre>
            </article>
          ))}
        </div>
      )}
      {activeTab === 'requests' && (
        <div className="history-list">
          {store.requestHistory.map((request) => (
            <article key={request.requestId}>
              <strong>{request.method} {request.endpoint}</strong>
              <span>{request.status} · {formatMs(request.durationMs)}</span>
              {request.error && <em>{request.error}</em>}
            </article>
          ))}
        </div>
      )}
      {activeTab === 'events' && (
        <div className="history-list">
          {store.userEventLog.map((event) => (
            <article key={event.id}>
              <strong>{event.type}</strong>
              <span>{event.at}</span>
              <small>{compactJson(event.payload)}</small>
            </article>
          ))}
        </div>
      )}
    </PanelShell>
  );
}
