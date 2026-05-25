import { resolveUrl } from './httpClient.js';

export const getMidiUrl = (poolId, embeddingIndex) => resolveUrl(`/pools/${poolId}/items/by-index/${embeddingIndex}/midi`);
export const getAudioUrl = (poolId, embeddingIndex) => resolveUrl(`/pools/${poolId}/items/by-index/${embeddingIndex}/audio`);
