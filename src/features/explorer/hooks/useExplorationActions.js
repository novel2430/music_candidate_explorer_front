import { useState } from 'react';
import { startExploration } from '../../../services/explorationWorkflow.js';
import { useExplorerStore } from '../../../store/useExplorerStore.js';

export function useExplorationActions() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { poolId, topK, selectN, axes, endpointNList } = useExplorerStore();

  async function submitQuery(query) {
    setIsSubmitting(true);
    await startExploration({ query, poolId, topK, selectN, axes, endpointNList });
    setIsSubmitting(false);
  }

  return { submitQuery, isSubmitting };
}
