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

// Display form: real sharp and flat glyphs. Lowercase b is only ever an accidental.
export function pretty(s) {
  return String(s).replace(/#/g, '♯').replace(/b/g, '♭');
}
