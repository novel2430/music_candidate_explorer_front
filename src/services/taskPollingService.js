import { getTask } from '../api/tasksApi.js';
import { uiText } from '../config/uiText.js';
import { useExplorerStore } from '../store/useExplorerStore.js';

export async function pollTaskUntilDone(taskId, options = {}) {
  const intervalMs = options.intervalMs || 1400;
  const maxAttempts = options.maxAttempts || 180;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const task = await getTask(taskId);
    useExplorerStore.getState().setTask(task);

    if (task.status === 'done') {
      useExplorerStore.getState().logUserEvent('task.done', { taskId });
      return task;
    }
    if (task.status === 'failed') {
      const message = task.error || uiText.errors.taskFailed;
      useExplorerStore.getState().logUserEvent('task.failed', { taskId, error: message });
      throw new Error(message);
    }

    await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
  }

  throw new Error(uiText.errors.taskPollingTimeout(maxAttempts));
}
