import { resolveUrl } from '../api/httpClient.js';
import { uiText } from '../config/uiText.js';
import { useExplorerStore } from '../store/useExplorerStore.js';

let audio = null;

function ensureAudio() {
  if (audio) return audio;
  audio = new Audio();
  audio.volume = useExplorerStore.getState().volume;
  audio.addEventListener('timeupdate', () => {
    useExplorerStore.getState().setAudioState({ currentTime: audio.currentTime, duration: audio.duration || 0 });
  });
  audio.addEventListener('ended', () => {
    useExplorerStore.getState().setAudioState({ isPlaying: false, currentTime: 0 });
  });
  audio.addEventListener('error', () => {
    useExplorerStore.getState().setAudioState({ isPlaying: false, audioError: uiText.errors.audioUnavailable });
  });
  return audio;
}

export async function playCandidate(candidate) {
  if (!candidate?.audio_url) {
    useExplorerStore.getState().setAudioState({ audioError: uiText.errors.missingAudioUrl });
    return;
  }

  const player = ensureAudio();
  const source = resolveUrl(candidate.audio_url);
  if (player.src !== source) {
    player.src = source;
    player.currentTime = 0;
  }

  try {
    await player.play();
    useExplorerStore.getState().setAudioState({
      playingCandidateId: candidate.candidate_id,
      isPlaying: true,
      audioError: null,
      duration: player.duration || 0,
    });
    useExplorerStore.getState().logUserEvent('candidate.play', { candidateId: candidate.candidate_id });
  } catch (error) {
    useExplorerStore.getState().setAudioState({ isPlaying: false, audioError: error.message || uiText.errors.audioPlayFailed });
  }
}

export function pause() {
  if (audio) audio.pause();
  useExplorerStore.getState().setAudioState({ isPlaying: false });
  useExplorerStore.getState().logUserEvent('candidate.pause', { candidateId: useExplorerStore.getState().playingCandidateId });
}

export function togglePlay(candidate) {
  const state = useExplorerStore.getState();
  if (state.isPlaying && state.playingCandidateId === candidate?.candidate_id) pause();
  else playCandidate(candidate);
}

export function setVolume(volume) {
  const safeVolume = Math.min(1, Math.max(0, Number(volume) || 0));
  if (audio) audio.volume = safeVolume;
  useExplorerStore.getState().setAudioState({ volume: safeVolume });
}
