import { httpClient } from './httpClient.js';

export const createTask = (payload) => httpClient.post('/tasks', payload);
export const getTask = (taskId) => httpClient.get(`/tasks/${taskId}`);
