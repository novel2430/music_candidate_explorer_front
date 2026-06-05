function chordSymbol(chord) {
  if (typeof chord === 'string') return chord;
  return chord?.display_symbol || chord?.simple_symbol || chord?.symbol || chord?.chord || null;
}

export function chordList(value) {
  return (Array.isArray(value) ? value : value ? [value] : []).map(chordSymbol).filter(Boolean);
}

export function lineageForCandidate(candidateId, lineages = []) {
  if (!candidateId) return null;
  return lineages.find((lineage) => lineage.childCandidateId === candidateId) || null;
}

export function userChordProgressionForCandidate(candidateId, lineages = []) {
  const lineage = lineageForCandidate(candidateId, lineages);
  const chords = chordList(lineage?.settings?.chordProgression);
  return chords.length ? chords : [];
}

export function chordListForCandidate({ candidate, profile = null, lineages = [] }) {
  const userChords = userChordProgressionForCandidate(candidate?.candidate_id, lineages);
  if (userChords.length) return userChords;

  const harmony = profile?.features?.harmony;
  const profileBarProgression = chordList(harmony?.bar_progression);
  if (profileBarProgression.length) return profileBarProgression;

  const profileSummary = chordList(profile?.summary?.main_chords);
  if (profileSummary.length) return profileSummary;

  return chordList(candidate?.music_summary?.main_chords);
}

export function chordSummaryForCandidate({ candidate, lineages = [], profile = null, limit = 4 }) {
  return chordListForCandidate({ candidate, profile, lineages }).slice(0, limit).join(' - ');
}
