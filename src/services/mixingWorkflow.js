import { createTask } from '../api/tasksApi.js';
import { getSpace } from '../api/spacesApi.js';
import { uiText } from '../config/uiText.js';
import { useExplorerStore } from '../store/useExplorerStore.js';
import { normalizeWeights } from '../utils/mixingGeometry.js';
import { pollTaskUntilDone } from './taskPollingService.js';

function resolveGeneratedCandidate({ completedTask, taskId, previousCandidateIds, nextCandidates }) {
  const directId = completedTask.outputs?.generated_candidate_id;
  if (directId) return nextCandidates.find((candidate) => candidate.candidate_id === directId) || null;

  return nextCandidates.find((candidate) => {
    const candidateId = candidate?.candidate_id;
    if (!candidateId || previousCandidateIds.has(candidateId)) return false;
    return candidate?.source?.created_by_task_id === taskId || candidate?.created_by_task_id === taskId;
  }) || null;
}

export async function generateCandidateMix(options = {}) {
  const store = useExplorerStore.getState();
  const candidateIds = store.mixingCandidateIds.slice(0, 3);
  const weights = normalizeWeights(store.mixingWeights.slice(0, candidateIds.length));
  const outputBars = Number(options.outputBars) || 4;
  const targetBpm = Number(options.targetBpm) || 100;
  const chordProgression = options.chordProgression?.length ? options.chordProgression : uiText.mixing.defaultChordProgression;
  const renderAudio = options.renderAudio ?? true;
  const previousCandidateIds = new Set(store.candidates.map((candidate) => candidate.candidate_id));

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
        render_audio: renderAudio,
        add_to_space: true,
        position_policy: 'weighted_interpolate',
      },
    });

    store.setMixGenerating(true, task.task_id);
    store.logUserEvent('mixing.task.created', { taskId: task.task_id, candidateIds, weights, outputBars, targetBpm, chordProgression });

    const completedTask = await pollTaskUntilDone(task.task_id, {
      intervalMs: store.pollingInterval,
    });
    const space = await getSpace(store.currentSpaceId);
    const generatedCandidate = resolveGeneratedCandidate({
      completedTask,
      taskId: task.task_id,
      previousCandidateIds,
      nextCandidates: space?.candidates || [],
    });
    useExplorerStore.getState().setSpace(space);
    useExplorerStore.getState().setMixGenerating(false, task.task_id);

    if (generatedCandidate?.candidate_id) {
      useExplorerStore.getState().addCreativeLineage({
        id: `lineage-${Date.now()}-${generatedCandidate.candidate_id}`,
        mixId: generatedCandidate.source?.mix_id || generatedCandidate.mix_id || completedTask.outputs?.mix_id || task.task_id,
        parentCandidateIds: candidateIds,
        parentWeights: weights,
        childCandidateId: generatedCandidate.candidate_id,
        settings: {
          bars: outputBars,
          bpm: targetBpm,
          chordProgression,
          renderAudio,
        },
        createdAt: Date.now(),
      });
      useExplorerStore.getState().selectCandidate(generatedCandidate.candidate_id);
      useExplorerStore.getState().setCandidateHudCollapsed(false);
      useExplorerStore.getState().logUserEvent('mixing.generated', { taskId: task.task_id, generatedCandidateId: generatedCandidate.candidate_id });
    }
  } catch (error) {
    useExplorerStore.getState().setMixError(error.message || uiText.errors.mixFailed);
  }
}
