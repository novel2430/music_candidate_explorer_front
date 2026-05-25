# music-candidate-space-explorer

Map-first, game HUD style frontend for exploring music candidate spaces. Built with Vite, React, JavaScript, Zustand, plain CSS, and HTMLAudioElement.

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Vite will print the local URL, usually `http://localhost:5173`.

## Build

```bash
npm run build
```

## BASE_URL

Default backend:

```txt
https://www.next.zju.edu.cn/novel-discover-midi/back
```

Configuration order:

1. `src/config/env.js` defines `DEFAULT_BASE_URL`.
2. The Advanced panel can temporarily edit `BASE_URL`.
3. The edited value is saved in `localStorage` and reused on reload.

## Features

- Query-driven workflow: create workspace, create exploration task, poll task, load space.
- Candidate map with circular dots, hover tooltip, selected glow, playing pulse, and mark states.
- Camera controls: WASD, arrow keys, mouse wheel zoom, pointer drag pan, reset view.
- Candidate HUD: play/pause audio, previous/next candidate, Good/Bad/Interesting marks, MIDI download, details toggle.
- MiniMap showing all candidates, current viewport, selected candidate, and playing candidate.
- Advanced panel for backend and task parameters.
- Debug panel for task JSON, space JSON, artifacts, request history, and user event log.
- Theme panel with Nord, dark, and minimal themes using CSS variables.
- Local persistence for base URL, theme, recent queries, request history, event log, candidate marks, and query params.

## Directory Structure

```txt
src/
  api/                 endpoint wrappers and http client
  config/              default environment values
  features/explorer/   page, components, and explorer hooks
  services/            workflows, polling, artifacts, audio controller
  store/               Zustand state
  styles/              plain CSS modules
  utils/               geometry, scales, storage, formatting, ids
```

## FAQ

### Audio does not play

Some candidates may return `404` for audio. The Candidate HUD shows an audio error and MIDI download remains available when `midi_url` exists.

### CORS or network requests fail

Check the Advanced panel `BASE_URL`. The backend must allow browser requests from the Vite dev origin.

### The map is empty after search

Open the Debug panel and inspect task status, task error, request history, and loaded space JSON.

### How are relative URLs handled?

Relative `audio_url`, `midi_url`, and artifact paths are resolved against the configured `BASE_URL`.
