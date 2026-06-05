import { uiText } from '../config/uiText.js';

const CHORD_PATTERN = /^[A-G](?:#|b)?(?:maj|min|m|dim|aug|sus2|sus4|sus|add\d{1,2}|M)?(?:\d{0,2})?(?:[#b]\d{1,2})?(?:\/[A-G](?:#|b)?)?$/;

export function parseChordProgression(value) {
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function validateChordProgression(value, outputBars) {
  const chords = parseChordProgression(value);
  if (chords.length !== outputBars) {
    return {
      chords,
      error: uiText.errors.chordCount(chords.length, outputBars),
    };
  }

  const invalidChord = chords.find((chord) => !CHORD_PATTERN.test(chord));
  if (invalidChord) {
    return {
      chords,
      error: uiText.errors.invalidChord(invalidChord),
    };
  }

  return { chords, error: null };
}
