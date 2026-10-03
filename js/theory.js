// Music theory primitives. Pure functions, no DOM — imported by the app and by node tests.

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];

// Twelve major keys, conventional spelling. The key decides sharp vs flat spelling.
export const KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

// Standard tuning. String 1 is high E. MIDI 40 = E2.
export const STRINGS = {
  1: { name: 'high E', midi: 64 },
  2: { name: 'B', midi: 59 },
  3: { name: 'G', midi: 55 },
  4: { name: 'D', midi: 50 },
  5: { name: 'A', midi: 45 },
  6: { name: 'low E', midi: 40 },
};

// Taylor GS Mini-e: 20 frets, 14 clear of the body.
export const MAX_FRET = 20;

export const DIATONIC = ['1', '2', '3', '4', '5', '6', '7'];
export const ALTERED = ['b2', 'b3', '#4', 'b5', 'b6', 'b7'];

const mod = (n, m) => ((n % m) + m) % m;

export function parseNote(name) {
  const letter = name[0];
  if (!(letter in LETTER_PC)) throw new Error(`bad note: ${name}`);
  let acc = 0;
  for (const ch of name.slice(1)) {
    if (ch === '#') acc++;
    else if (ch === 'b') acc--;
    else throw new Error(`bad note: ${name}`);
  }
  return { letter, acc, pc: mod(LETTER_PC[letter] + acc, 12) };
}

export function noteName(letter, acc) {
  return letter + (acc > 0 ? '#'.repeat(acc) : 'b'.repeat(-acc));
}

export function parseDegree(deg) {
  const m = /^([#b]?)(\d+)$/.exec(deg);
  if (!m) throw new Error(`bad degree: ${deg}`);
  return { acc: m[1] === '#' ? 1 : m[1] === 'b' ? -1 : 0, num: Number(m[2]) };
}

// Spell a scale degree in a major key by letter-stepping, so F# major gives E#, not F.
export function spellDegree(key, degree) {
  const k = parseNote(key);
  const { acc: degAcc, num } = parseDegree(degree);
  const idx = (num - 1) % 7;
  const letter = LETTERS[(LETTERS.indexOf(k.letter) + idx) % 7];
  const targetPc = mod(k.pc + MAJOR_STEPS[idx] + degAcc, 12);
  const acc = mod(targetPc - LETTER_PC[letter] + 6, 12) - 6;
  return noteName(letter, acc);
}

export function majorScale(key) {
  return DIATONIC.map((d) => spellDegree(key, d));
}

// Degrees whose spelling in this key needs at most one accidental (skips e.g. Bbb).
export function usableDegrees(key, degrees) {
  return degrees.filter((d) => Math.abs(parseNote(spellDegree(key, d)).acc) <= 1);
}

export function midiAt(string, fret) {
  return STRINGS[string].midi + fret;
}

export function pcAt(string, fret) {
  return mod(midiAt(string, fret), 12);
}

// Frets on a string, within [minFret, maxFret], that sound the given note.
export function fretsFor(note, string, minFret, maxFret) {
  const pc = parseNote(note).pc;
  const out = [];
  for (let f = minFret; f <= maxFret; f++) if (pcAt(string, f) === pc) out.push(f);
  return out;
}

// ---------- scales ----------
// Degrees are relative to the major scale on the same tonic, so A natural minor's b3 is C.

export const SCALES = [
  { id: 'major', name: 'Major', degrees: ['1', '2', '3', '4', '5', '6', '7'] },
  { id: 'minor', name: 'Natural minor', degrees: ['1', '2', 'b3', '4', '5', 'b6', 'b7'] },
  { id: 'majpent', name: 'Major pentatonic', degrees: ['1', '2', '3', '5', '6'] },
  { id: 'minpent', name: 'Minor pentatonic', degrees: ['1', 'b3', '4', '5', 'b7'] },
  // 'b5|#4': the blue note is b5 unless that needs a double flat, then #4 (Eb blues has A, not Bbb).
  { id: 'blues', name: 'Blues', degrees: ['1', 'b3', '4', 'b5|#4', '5', 'b7'] },
  { id: 'harmmin', name: 'Harmonic minor', degrees: ['1', '2', 'b3', '4', '5', 'b6', '7'] },
  { id: 'dorian', name: 'Dorian', degrees: ['1', '2', 'b3', '4', '5', '6', 'b7'] },
  { id: 'phrygian', name: 'Phrygian', degrees: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'] },
  { id: 'lydian', name: 'Lydian', degrees: ['1', '2', '3', '#4', '5', '6', '7'] },
  { id: 'mixolydian', name: 'Mixolydian', degrees: ['1', '2', '3', '4', '5', '6', 'b7'] },
  { id: 'locrian', name: 'Locrian', degrees: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'] },
];

export const scaleById = (id) => SCALES.find((s) => s.id === id);

// Pitch classes in circle-of-fifths order: the order keys run in.
export const FIFTHS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

const TONIC_SPELLINGS = [['C'], ['C#', 'Db'], ['D'], ['D#', 'Eb'], ['E'], ['F'], ['F#', 'Gb'], ['G'], ['G#', 'Ab'], ['A'], ['A#', 'Bb'], ['B']];

// A degree may list alternatives ('b5|#4'); use the first that spells with one accidental at most.
export function resolveDegree(tonic, degree) {
  const options = degree.split('|');
  return options.find((d) => Math.abs(parseNote(spellDegree(tonic, d)).acc) <= 1) ?? options[0];
}

export function scaleNotes(scale, tonic) {
  return scale.degrees.map((d) => spellDegree(tonic, resolveDegree(tonic, d)));
}

// Pick the tonic spelling with the fewest accidentals and no double accidentals.
// This lands on conventional keys without a lookup table: Db major, C# minor, G# minor, Eb minor.
// Ties go to the spelling in KEYS (so F# major over Gb, Eb minor over D#).
export function tonicFor(scale, pc) {
  let best = null;
  for (const t of TONIC_SPELLINGS[pc]) {
    const accs = scaleNotes(scale, t).map((n) => Math.abs(parseNote(n).acc));
    if (Math.max(...accs) > 1) continue;
    const score = accs.reduce((a, b) => a + b, 0);
    if (!best || score < best.score || (score === best.score && KEYS.includes(t))) best = { t, score };
  }
  return best.t;
}

// Display form: real sharp and flat glyphs. Lowercase b is only ever an accidental.
export function pretty(s) {
  return String(s).replace(/#/g, '♯').replace(/b/g, '♭');
}
