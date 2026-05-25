import { httpClient } from './httpClient.js';

export const createWorkspace = (payload) => httpClient.post('/workspaces', payload);
export const getWorkspace = (workspaceId) => httpClient.get(`/workspaces/${workspaceId}`);
