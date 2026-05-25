import { useState } from 'react';
import { PanelShell } from './PanelShell.jsx';
import { useExplorerStore } from '../../../store/useExplorerStore.js';
import { parseCsvNumbers, parseCsvStrings } from '../../../utils/formatters.js';

export function AdvancedPanel() {
  const store = useExplorerStore();
  const [form, setForm] = useState({
    baseUrl: store.baseUrl,
    poolId: store.poolId,
    topK: store.topK,
    selectN: store.selectN,
    axes: store.axes.join(', '),
    endpointNList: store.endpointNList.join(', '),
    pollingInterval: store.pollingInterval,
    showAxisFrames: store.showAxisFrames,
  });

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function save() {
    store.setBaseUrl(form.baseUrl);
    store.setQueryParams({
      poolId: form.poolId,
      topK: Number(form.topK),
      selectN: Number(form.selectN),
      axes: parseCsvStrings(form.axes, ['pc1', 'pc2', 'pc3']),
      endpointNList: parseCsvNumbers(form.endpointNList, [5, 10, 20]),
      pollingInterval: Number(form.pollingInterval),
    });
    store.setShowAxisFrames(Boolean(form.showAxisFrames));
  }

  return (
    <PanelShell title="Advanced">
      <label>BASE_URL<input value={form.baseUrl} onChange={(event) => update('baseUrl', event.target.value)} /></label>
      <label>pool_id<input value={form.poolId} onChange={(event) => update('poolId', event.target.value)} /></label>
      <div className="field-grid">
        <label>top_k<input type="number" value={form.topK} onChange={(event) => update('topK', event.target.value)} /></label>
        <label>select_n<input type="number" value={form.selectN} onChange={(event) => update('selectN', event.target.value)} /></label>
      </div>
      <label>axes<input value={form.axes} onChange={(event) => update('axes', event.target.value)} /></label>
      <label>endpoint_n_list<input value={form.endpointNList} onChange={(event) => update('endpointNList', event.target.value)} /></label>
      <label>polling interval ms<input type="number" value={form.pollingInterval} onChange={(event) => update('pollingInterval', event.target.value)} /></label>
      <label className="checkbox-field">
        <input type="checkbox" checked={form.showAxisFrames} onChange={(event) => update('showAxisFrames', event.target.checked)} />
        Show X/Y axis labels outside map
      </label>
      <div className="panel-actions">
        <button className="primary-button" onClick={save}>Save</button>
        <button onClick={store.resetLocalState}>Reset local state</button>
      </div>
    </PanelShell>
  );
}
