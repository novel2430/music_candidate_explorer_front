import { httpClient } from './httpClient.js';

export const getSpace = (spaceId) => httpClient.get(`/spaces/${spaceId}`);
