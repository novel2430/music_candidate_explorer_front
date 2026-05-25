import { httpClient } from './httpClient.js';

export const getArtifactMetadata = (artifactId) => httpClient.get(`/tasks/artifacts/${artifactId}`);
export const getArtifactContent = (artifactId) => httpClient.get(`/tasks/artifacts/content/${artifactId}`);
