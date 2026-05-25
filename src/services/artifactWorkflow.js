import { getArtifactContent, getArtifactMetadata } from '../api/artifactsApi.js';
import { useExplorerStore } from '../store/useExplorerStore.js';

export async function loadArtifactMetadata(artifactId) {
  const metadata = await getArtifactMetadata(artifactId);
  useExplorerStore.getState().setArtifactMetadata(artifactId, metadata);
  useExplorerStore.getState().logUserEvent('artifact.open', { artifactId, type: 'metadata' });
  return metadata;
}

export async function loadArtifactContent(artifactId) {
  const content = await getArtifactContent(artifactId);
  useExplorerStore.getState().setArtifactContent(artifactId, content);
  useExplorerStore.getState().logUserEvent('artifact.open', { artifactId, type: 'content' });
  return content;
}
