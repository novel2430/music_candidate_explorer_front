import { httpClient } from './httpClient.js';

export const getGeneProfile = (geneProfileId) => (
  httpClient.get(`/gene-profiles/${encodeURIComponent(geneProfileId)}`, {
    timeoutMs: 30000,
  })
);
