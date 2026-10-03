// Prints the actual theory values for human reading. Run: node tools/print-theory.mjs
// A passing test count is not a check of spelling; reading these tables is.
import { KEYS, ALTERED, STRINGS, MAX_FRET, majorScale, spellDegree, usableDegrees, pcAt } from '../js/theory.js';

console.log('MAJOR SCALES');
for (const k of KEYS) console.log(`  ${k.padEnd(3)} ${majorScale(k).join(' ')}`);

console.log('\nALTERED DEGREES (only single-accidental spellings are used in drills)');
for (const k of KEYS) {
  const used = usableDegrees(k, ALTERED);
  const cells = ALTERED.map((d) => `${d}=${spellDegree(k, d)}${used.includes(d) ? '' : '(skip)'}`);
  console.log(`  ${k.padEnd(3)} ${cells.join('  ')}`);
}

console.log(`\nFRETBOARD, pitch classes, frets 0-${MAX_FRET} (sharp spelling, key-neutral)`);
const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
console.log('  str ' + Array.from({ length: MAX_FRET + 1 }, (_, f) => String(f).padStart(3)).join(''));
for (const s of [1, 2, 3, 4, 5, 6]) {
  const row = Array.from({ length: MAX_FRET + 1 }, (_, f) => SHARP[pcAt(s, f)].padStart(3)).join('');
  console.log(`  ${String(s).padEnd(3)} ${row}   (${STRINGS[s].name})`);
}
