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
      error: `和弦数量需要等于小节数：当前 ${chords.length} 个，目标 ${outputBars} 个。`,
    };
  }

  const invalidChord = chords.find((chord) => !CHORD_PATTERN.test(chord));
  if (invalidChord) {
    return {
      chords,
      error: `和弦格式不合理：${invalidChord}`,
    };
  }

  return { chords, error: null };
}
