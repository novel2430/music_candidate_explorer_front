import { createTask } from '../api/tasksApi.js';
import { getSpace } from '../api/spacesApi.js';
import { uiText } from '../config/uiText.js';
import { useExplorerStore } from '../store/useExplorerStore.js';
import { normalizeWeights } from '../utils/mixingGeometry.js';
import { pollTaskUntilDone } from './taskPollingService.js';

export async function generateCandidateMix(options = {}) {
  const store = useExplorerStore.getState();
  const candidateIds = store.mixingCandidateIds.slice(0, 3);
  const weights = normalizeWeights(store.mixingWeights.slice(0, candidateIds.length));
  const outputBars = Number(options.outputBars) || 4;
  const targetBpm = Number(options.targetBpm) || 100;
  const chordProgression = options.chordProgression?.length ? options.chordProgression : ['C', 'Am', 'F', 'G'];

  if (candidateIds.length < 2) {
    store.setMixError(uiText.errors.mixNeedsTwo);
    return;
  }
  if (!store.workspaceId || !store.currentSpaceId) {
    store.setMixError(uiText.errors.missingMixContext);
    return;
  }

  try {
    const task = await createTask({
      workspace_id: store.workspaceId,
      kind: 'mix_candidates',
      input: {
        space_id: store.currentSpaceId,
        candidate_ids: candidateIds,
      },
      params: {
        engine: 'accomontage_mix_service',
        mix_weights: weights,
        output_bars: outputBars,
        target_bpm: targetBpm,
        chord_progression: chordProgression,
        blend_method: 'weighted_lerp',
        keep_chord: true,
        align: 'repeat',
        render_audio: true,
        add_to_space: true,
        position_policy: 'weighted_interpolate',
      },
    });

    store.setMixGenerating(true, task.task_id);
    store.logUserEvent('mixing.task.created', { taskId: task.task_id, candidateIds, weights, outputBars, targetBpm, chordProgression });

    const completedTask = await pollTaskUntilDone(task.task_id, {
      intervalMs: store.pollingInterval,
    });
    const generatedCandidateId = completedTask.outputs?.generated_candidate_id;
    const space = await getSpace(store.currentSpaceId);
    useExplorerStore.getState().setSpace(space);
    useExplorerStore.getState().setMixGenerating(false, task.task_id);

    if (generatedCandidateId) {
      useExplorerStore.getState().selectCandidate(generatedCandidateId);
      useExplorerStore.getState().setCandidateHudCollapsed(false);
      useExplorerStore.getState().logUserEvent('mixing.generated', { taskId: task.task_id, generatedCandidateId });
    }
  } catch (error) {
    useExplorerStore.getState().setMixError(error.message || uiText.errors.mixFailed);
  }
}
