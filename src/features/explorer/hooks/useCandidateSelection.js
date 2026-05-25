import { useMemo } from 'react';
import { useExplorerStore } from '../../../store/useExplorerStore.js';

export function useCandidateSelection() {
  const candidates = useExplorerStore((state) => state.candidates);
  const selectedCandidateId = useExplorerStore((state) => state.selectedCandidateId);
  const selectCandidate = useExplorerStore((state) => state.selectCandidate);

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.candidate_id === selectedCandidateId) || null,
    [candidates, selectedCandidateId],
  );

  function selectByOffset(offset) {
    if (!candidates.length) return;
    const index = Math.max(0, candidates.findIndex((candidate) => candidate.candidate_id === selectedCandidateId));
    const next = candidates[(index + offset + candidates.length) % candidates.length];
    selectCandidate(next.candidate_id);
  }

  return { selectedCandidate, selectByOffset };
}
