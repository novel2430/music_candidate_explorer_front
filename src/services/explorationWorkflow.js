import { createWorkspace } from '../api/workspacesApi.js';
import { createTask } from '../api/tasksApi.js';
import { getSpace } from '../api/spacesApi.js';
import { useExplorerStore } from '../store/useExplorerStore.js';
import { pollTaskUntilDone } from './taskPollingService.js';

export async function startExploration({ query, poolId, topK, selectN, axes, endpointNList, title }) {
  const cleanQuery = query.trim();
  if (!cleanQuery) return;

  const store = useExplorerStore.getState();
  store.logUserEvent('query.submit', { query: cleanQuery });
  store.setWorkflowStart({ query: cleanQuery });

  try {
    const workspace = await createWorkspace({
      title: title || `${cleanQuery.slice(0, 48)} exploration`,
      root_query: cleanQuery,
    });
    store.setWorkspace(workspace.workspace_id);

    const task = await createTask({
      workspace_id: workspace.workspace_id,
      kind: 'create_exploration_space',
      input: {
        query: cleanQuery,
        pool_id: poolId,
      },
      params: {
        top_k: Number(topK),
        select_n: Number(selectN),
        axes,
        endpoint_n_list: endpointNList,
      },
    });

    useExplorerStore.getState().setTask(task);
    useExplorerStore.getState().logUserEvent('task.created', { taskId: task.task_id });

    const completedTask = await pollTaskUntilDone(task.task_id, {
      intervalMs: useExplorerStore.getState().pollingInterval,
    });
    const spaceId = completedTask.outputs?.space_id;
    if (!spaceId) throw new Error('Task finished without outputs.space_id');

    const space = await getSpace(spaceId);
    useExplorerStore.getState().setSpace(space);
    useExplorerStore.getState().logUserEvent('space.loaded', {
      spaceId,
      candidateCount: space.candidates?.length || 0,
    });
  } catch (error) {
    useExplorerStore.getState().setTaskError(error.message);
  }
}
