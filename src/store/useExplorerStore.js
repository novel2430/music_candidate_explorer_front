import { create } from 'zustand';
import { uiText } from '../config/uiText.js';
import { DEFAULT_BASE_URL } from '../config/env.js';
import { getDisplayAxisLabels } from '../utils/axisLabels.js';
import { readJson, removeStorage, writeJson } from '../utils/storage.js';

const STORAGE_KEYS = {
  baseUrl: 'mcse.baseUrl',
  themeName: 'mcse.themeName',
  recentQueries: 'mcse.recentQueries',
  userEventLog: 'mcse.userEventLog',
  requestHistory: 'mcse.requestHistory',
  candidateMarks: 'mcse.candidateMarks',
  queryParams: 'mcse.queryParams',
  showAxisFrames: 'mcse.showAxisFrames',
};

const savedParams = readJson(STORAGE_KEYS.queryParams, {});

const initialState = {
  baseUrl: readJson(STORAGE_KEYS.baseUrl, DEFAULT_BASE_URL),
  poolId: savedParams.poolId || 'xmidi_piano_pool_v1',
  topK: savedParams.topK || 300,
  selectN: savedParams.selectN || 100,
  axes: savedParams.axes || ['pc1', 'pc2', 'pc3'],
  endpointNList: savedParams.endpointNList || [5, 10, 20],
  pollingInterval: savedParams.pollingInterval || 1400,
  showAxisFrames: readJson(STORAGE_KEYS.showAxisFrames, false),
  recentQueries: readJson(STORAGE_KEYS.recentQueries, []),

  workspaceId: null,
  taskId: null,
  taskStatus: 'idle',
  taskError: null,
  currentTask: null,
  currentQuery: '',
  currentSpaceId: null,
  currentSpace: null,
  candidates: [],
  axisLabels: null,
  displayAxisLabels: null,
  selectedPair: [],
  artifacts: [],
  artifactMetadataById: {},
  artifactContentById: {},
  geneProfilesById: {},
  geneProfileStatusById: {},
  geneProfileErrorById: {},

  cameraX: 0,
  cameraY: 0,
  zoom: 1,
  minZoom: 1,
  maxZoom: 5,
  viewportWidth: 0,
  viewportHeight: 0,
  isDragging: false,

  selectedCandidateId: null,
  mixingCandidateIds: [],
  mixingWeights: [],
  isMixGenerating: false,
  mixTaskId: null,
  mixError: null,
  hoveredCandidateId: null,
  focusedCandidateId: null,
  selectionPulseId: 0,
  candidateMarks: readJson(STORAGE_KEYS.candidateMarks, {}),

  playingCandidateId: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  audioError: null,

  hudVisible: true,
  candidateHudCollapsed: true,
  activePanel: null,

  requestHistory: readJson(STORAGE_KEYS.requestHistory, []),
  userEventLog: readJson(STORAGE_KEYS.userEventLog, []),

  themeName: readJson(STORAGE_KEYS.themeName, 'theme-nord'),
};

function persistQueryParams(state) {
  writeJson(STORAGE_KEYS.queryParams, {
    poolId: state.poolId,
    topK: state.topK,
    selectN: state.selectN,
    axes: state.axes,
    endpointNList: state.endpointNList,
    pollingInterval: state.pollingInterval,
  });
}

export const useExplorerStore = create((set, get) => ({
  ...initialState,

  setBaseUrl: (baseUrl) => {
    const clean = baseUrl.trim().replace(/\/+$/, '');
    writeJson(STORAGE_KEYS.baseUrl, clean || DEFAULT_BASE_URL);
    set({ baseUrl: clean || DEFAULT_BASE_URL });
  },
  setQueryParams: (params) => {
    set((state) => {
      const next = { ...state, ...params };
      persistQueryParams(next);
      return params;
    });
  },
  setShowAxisFrames: (showAxisFrames) => {
    writeJson(STORAGE_KEYS.showAxisFrames, showAxisFrames);
    set({ showAxisFrames });
  },
  setThemeName: (themeName) => {
    writeJson(STORAGE_KEYS.themeName, themeName);
    set({ themeName });
    get().logUserEvent('theme.change', { themeName });
  },

  setWorkflowStart: ({ query }) => {
    const recent = [query, ...get().recentQueries.filter((item) => item !== query)].slice(0, 8);
    writeJson(STORAGE_KEYS.recentQueries, recent);
    set({
      currentQuery: query,
      recentQueries: recent,
      taskStatus: 'queued',
      taskError: null,
      workspaceId: null,
      taskId: null,
      currentTask: null,
      currentSpaceId: null,
      currentSpace: null,
      axisLabels: null,
      displayAxisLabels: null,
      candidates: [],
      selectedPair: [],
      selectedCandidateId: null,
      mixingCandidateIds: [],
      mixingWeights: [],
      isMixGenerating: false,
      mixTaskId: null,
      mixError: null,
      hoveredCandidateId: null,
      artifacts: [],
      artifactMetadataById: {},
      artifactContentById: {},
      geneProfilesById: {},
      geneProfileStatusById: {},
      geneProfileErrorById: {},
    });
  },
  setWorkspace: (workspaceId) => set({ workspaceId }),
  setTask: (task) =>
    set({
      taskId: task?.task_id || get().taskId,
      taskStatus: task?.status || get().taskStatus,
      currentTask: task,
      artifacts: task?.outputs?.artifacts || get().artifacts,
    }),
  setTaskError: (error) => set({ taskError: error, taskStatus: 'failed' }),
  setSpace: (space) =>
    set({
      currentSpaceId: space?.space_id || null,
      currentSpace: space,
      candidates: space?.candidates || [],
      axisLabels: space?.axis_labels || null,
      displayAxisLabels: getDisplayAxisLabels(space),
      selectedPair: space?.selected_pair || [],
      taskStatus: 'done',
      cameraX: 0,
      cameraY: 0,
      zoom: 5,
      selectedCandidateId: space?.candidates?.[0]?.candidate_id || null,
      geneProfilesById: {},
      geneProfileStatusById: {},
      geneProfileErrorById: {},
    }),

  setViewportSize: (viewportWidth, viewportHeight) =>
    set((state) => {
      const nextWidth = Math.round(viewportWidth);
      const nextHeight = Math.round(viewportHeight);
      if (state.viewportWidth === nextWidth && state.viewportHeight === nextHeight) return state;
      return { viewportWidth: nextWidth, viewportHeight: nextHeight };
    }),
  panCamera: (deltaX, deltaY) =>
    set((state) => ({ cameraX: state.cameraX + deltaX, cameraY: state.cameraY + deltaY })),
  setCamera: (camera) => set(camera),
  setDragging: (isDragging) => set({ isDragging }),
  resetCamera: () => {
    set({ cameraX: 0, cameraY: 0, zoom: 5 });
    get().logUserEvent('map.reset');
  },

  selectCandidate: (candidateId) => {
    set((state) => ({
      selectedCandidateId: candidateId,
      focusedCandidateId: candidateId,
      selectionPulseId: state.selectionPulseId + 1,
    }));
    get().logUserEvent('candidate.select', { candidateId });
  },
  toggleMixingCandidate: (candidateId) => {
    set((state) => {
      const exists = state.mixingCandidateIds.includes(candidateId);
      const nextIds = exists
        ? state.mixingCandidateIds.filter((id) => id !== candidateId)
        : [...state.mixingCandidateIds, candidateId].slice(0, 3);
      const nextWeights = nextIds.length ? nextIds.map(() => 1 / nextIds.length) : [];
      return {
        mixingCandidateIds: nextIds,
        mixingWeights: nextWeights,
        mixError: exists || state.mixingCandidateIds.length < 3 ? null : uiText.errors.maxMixCandidates,
      };
    });
    get().logUserEvent('mixing.toggle_candidate', { candidateId });
  },
  removeMixingCandidate: (candidateId) => {
    set((state) => {
      const nextIds = state.mixingCandidateIds.filter((id) => id !== candidateId);
      return {
        mixingCandidateIds: nextIds,
        mixingWeights: nextIds.length ? nextIds.map(() => 1 / nextIds.length) : [],
        mixError: null,
      };
    });
  },
  setMixingWeights: (mixingWeights) => set({ mixingWeights }),
  setMixGenerating: (isMixGenerating, mixTaskId = get().mixTaskId) => set({ isMixGenerating, mixTaskId }),
  setMixError: (mixError) => set({ mixError, isMixGenerating: false }),
  clearMixingSelection: () => set({ mixingCandidateIds: [], mixingWeights: [], mixError: null }),
  hoverCandidate: (candidateId) => {
    set({ hoveredCandidateId: candidateId });
    if (candidateId) get().logUserEvent('candidate.hover', { candidateId });
  },
  markCandidate: (candidateId, mark) => {
    set((state) => {
      const next = { ...state.candidateMarks };
      if (mark == null || next[candidateId] === mark) delete next[candidateId];
      else next[candidateId] = mark;
      writeJson(STORAGE_KEYS.candidateMarks, next);
      return { candidateMarks: next };
    });
    get().logUserEvent(mark == null ? 'candidate.mark.clear' : `candidate.mark.${mark}`, { candidateId });
  },

  setAudioState: (audioState) => set(audioState),
  setHudVisible: (hudVisible) => {
    set({ hudVisible });
    get().logUserEvent('hud.toggle', { hudVisible });
  },
  setCandidateHudCollapsed: (candidateHudCollapsed) => set({ candidateHudCollapsed }),
  setActivePanel: (activePanel) => {
    set({ activePanel });
    get().logUserEvent(activePanel ? 'panel.open' : 'panel.close', { activePanel });
  },

  addRequestHistory: (entry) =>
    set((state) => {
      const next = [entry, ...state.requestHistory].slice(0, 80);
      writeJson(STORAGE_KEYS.requestHistory, next);
      return { requestHistory: next };
    }),
  updateRequestHistory: (requestId, patch) =>
    set((state) => {
      const next = state.requestHistory.map((entry) =>
        entry.requestId === requestId ? { ...entry, ...patch } : entry,
      );
      writeJson(STORAGE_KEYS.requestHistory, next);
      return { requestHistory: next };
    }),
  logUserEvent: (type, payload = {}) =>
    set((state) => {
      const next = [
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, payload, at: new Date().toISOString() },
        ...state.userEventLog,
      ].slice(0, 120);
      writeJson(STORAGE_KEYS.userEventLog, next);
      return { userEventLog: next };
    }),

  setArtifactMetadata: (artifactId, metadata) =>
    set((state) => ({ artifactMetadataById: { ...state.artifactMetadataById, [artifactId]: metadata } })),
  setArtifactContent: (artifactId, content) =>
    set((state) => ({ artifactContentById: { ...state.artifactContentById, [artifactId]: content } })),
  setGeneProfileLoading: (geneProfileId) =>
    set((state) => ({
      geneProfileStatusById: { ...state.geneProfileStatusById, [geneProfileId]: 'loading' },
      geneProfileErrorById: { ...state.geneProfileErrorById, [geneProfileId]: null },
    })),
  setGeneProfileLoaded: (geneProfileId, profile) =>
    set((state) => ({
      geneProfilesById: { ...state.geneProfilesById, [geneProfileId]: profile },
      geneProfileStatusById: { ...state.geneProfileStatusById, [geneProfileId]: 'loaded' },
      geneProfileErrorById: { ...state.geneProfileErrorById, [geneProfileId]: null },
    })),
  setGeneProfileError: (geneProfileId, error) =>
    set((state) => ({
      geneProfileStatusById: { ...state.geneProfileStatusById, [geneProfileId]: 'error' },
      geneProfileErrorById: { ...state.geneProfileErrorById, [geneProfileId]: error },
    })),

  resetLocalState: () => {
    Object.values(STORAGE_KEYS).forEach(removeStorage);
    set({ ...initialState, baseUrl: DEFAULT_BASE_URL, themeName: 'theme-nord', candidateMarks: {}, requestHistory: [], userEventLog: [] });
  },
}));
