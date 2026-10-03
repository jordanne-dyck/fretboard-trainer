import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { SCALES, FIFTHS, tonicFor, scaleNotes, scaleById, parseNote } from '../js/theory.js';
import { expandPattern, ladderSteps, patternFits } from '../js/drills.js';
import { buildExercise, repCount, orderedKeys, DEFAULT_CONFIG } from '../js/exercise.js';
import { makeRng } from '../js/session.js';

const patterns = JSON.parse(readFileSync(new URL('../data/patterns.json', import.meta.url))).patterns;
const P = (id) => patterns.find((p) => p.id === id);
const rng = () => makeRng(11);

test('every scale in every key spells with one accidental at most, one letter per note', () => {
  for (const scale of SCALES) {
    for (const pc of FIFTHS) {
      const tonic = tonicFor(scale, pc);
      const notes = scaleNotes(scale, tonic);
      assert.equal(parseNote(tonic).pc, pc);
      for (const n of notes) assert.ok(Math.abs(parseNote(n).acc) <= 1, `${tonic} ${scale.name}: ${notes}`);
      if (scale.degrees.length === 7) assert.equal(new Set(notes.map((n) => n[0])).size, 7, `${tonic} ${scale.name} reuses a letter: ${notes}`);
    }
  }
});

test('conventional tonics', () => {
  const names = (id) => FIFTHS.map((pc) => tonicFor(scaleById(id), pc)).join(' ');
  assert.equal(names('major'), 'C G D A E B F# Db Ab Eb Bb F');
  assert.equal(names('minor'), 'C G D A E B F# C# G# Eb Bb F');
});

test('scale spellings', () => {
  assert.deepEqual(scaleNotes(scaleById('minor'), 'A'), ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  assert.deepEqual(scaleNotes(scaleById('minpent'), 'E'), ['E', 'G', 'A', 'B', 'D']);
  assert.deepEqual(scaleNotes(scaleById('majpent'), 'G'), ['G', 'A', 'B', 'D', 'E']);
  assert.deepEqual(scaleNotes(scaleById('blues'), 'A'), ['A', 'C', 'D', 'Eb', 'E', 'G']);
  assert.deepEqual(scaleNotes(scaleById('blues'), 'Eb'), ['Eb', 'Gb', 'Ab', 'A', 'Bb', 'Db']); // blue note falls back to #4
  assert.deepEqual(scaleNotes(scaleById('harmmin'), 'A'), ['A', 'B', 'C', 'D', 'E', 'F', 'G#']);
  assert.deepEqual(scaleNotes(scaleById('dorian'), 'D'), ['D', 'E', 'F', 'G', 'A', 'B', 'C']);
  assert.deepEqual(scaleNotes(scaleById('lydian'), 'F'), ['F', 'G', 'A', 'B', 'C', 'D', 'E']);
  assert.deepEqual(scaleNotes(scaleById('mixolydian'), 'G'), ['G', 'A', 'B', 'C', 'D', 'E', 'F']);
  assert.deepEqual(scaleNotes(scaleById('phrygian'), 'E'), ['E', 'F', 'G', 'A', 'B', 'C', 'D']);
  assert.deepEqual(scaleNotes(scaleById('locrian'), 'B'), ['B', 'C', 'D', 'E', 'F', 'G', 'A']);
});

test('patterns on a 7-note scale match the original spec sequences', () => {
  assert.deepEqual(expandPattern(P('linear'), 7), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(expandPattern(P('groups3'), 7), [1, 2, 3, 2, 3, 4, 3, 4, 5, 4, 5, 6, 5, 6, 7, 6, 7, 8]);
  assert.deepEqual(expandPattern(P('groups4'), 7), [1, 2, 3, 4, 2, 3, 4, 5, 3, 4, 5, 6, 4, 5, 6, 7, 5, 6, 7, 8]);
  assert.deepEqual(expandPattern(P('thirds'), 7), [1, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8]);
  assert.deepEqual(expandPattern(P('pivot'), 7), [1, 2, 3, 2, 1, 2, 3, 4, 3, 2, 3, 4, 5]);
});

test('patterns on a pentatonic scale stop at the octave', () => {
  assert.deepEqual(expandPattern(P('linear'), 5), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(expandPattern(P('groups3'), 5), [1, 2, 3, 2, 3, 4, 3, 4, 5, 4, 5, 6]);
  assert.deepEqual(ladderSteps(P('thirds'), 5, 'desc'), [6, 4, 5, 3, 4, 2, 3, 1]);
  for (const p of patterns) assert.ok(patternFits(p, 5), p.id);
});

test('descending mirrors: thirds on major go 8 6 7 5', () => {
  assert.deepEqual(ladderSteps(P('thirds'), 7, 'desc'), [8, 6, 7, 5, 6, 4, 5, 3, 4, 2, 3, 1]);
});

test('ladder rep labels and notes follow the scale', () => {
  const { steps } = buildExercise(
    { exercise: 'ladder', scale: 'minpent', pattern: 'linear', direction: 'up', keys: [9], passes: 1 },
    { rng: rng(), patterns },
  );
  const rep = steps.find((s) => s.kind === 'rep').rep;
  assert.equal(rep.pattern, '1 ♭3 4 5 ♭7 8');
  assert.equal(rep.answer, 'A C D E G A');
  assert.equal(rep.main, 'A minor pentatonic · Linear');
});

test('every chosen setting holds for the whole exercise', () => {
  const cfg = {
    exercise: 'ladder', scale: 'dorian', pattern: 'groups3', response: 'notes', direction: 'down',
    where: 'along', stringPair: '4–3', keys: [0, 2, 7], passes: 2, fretMin: 0, fretMax: 20,
  };
  const { steps, reps } = buildExercise(cfg, { rng: rng(), patterns });
  const r = steps.filter((s) => s.kind === 'rep').map((s) => s.rep);
  assert.equal(reps, 6);
  assert.equal(r.length, repCount(cfg));
  for (const rep of r) {
    assert.match(rep.main, /dorian · Groups of 3$/);
    assert.equal(rep.say, 'Play it and say the note names');
    assert.equal(rep.direction, 'desc');
    assert.match(rep.sub, /^Descending · Strings 4–3/);
  }
});

test('keys run in circle-of-fifths order with a card before each', () => {
  assert.deepEqual(orderedKeys([2, 0, 7]), [0, 7, 2]);
  const { steps } = buildExercise({ exercise: 'ladder', keys: [2, 0, 7], passes: 1, direction: 'updown' }, { rng: rng(), patterns });
  assert.deepEqual(
    steps.map((s) => (s.kind === 'card' ? s.title : s.rep.direction)),
    ['C major', 'asc', 'desc', 'G major', 'asc', 'desc', 'D major', 'asc', 'desc'],
  );
});

test('fret range is respected and narrow ranges fall back to one position', () => {
  const { steps } = buildExercise(
    { exercise: 'ladder', where: 'along', keys: FIFTHS, passes: 5, fretMin: 3, fretMax: 8 },
    { rng: rng(), patterns },
  );
  for (const s of steps.filter((x) => x.kind === 'rep')) {
    assert.equal(s.rep.where, 'position');
    const [, a, b] = /frets (\d+)–(\d+)/.exec(s.rep.sub).map(Number);
    assert.ok(a >= 3 && b <= 8, s.rep.sub);
  }
});

test('degree call covers every degree once per pass', () => {
  const { steps, reps } = buildExercise(
    { exercise: 'degree', scale: 'major', ask: 'toNote', keys: [0], passes: 2 },
    { rng: rng(), patterns },
  );
  const asked = steps.filter((s) => s.kind === 'rep').map((s) => s.rep.main.split(' in ')[0]);
  assert.equal(reps, 14);
  assert.deepEqual(asked.slice(0, 7).sort(), ['1', '2', '3', '4', '5', '6', '7']);
  assert.deepEqual(asked.slice(7).sort(), ['1', '2', '3', '4', '5', '6', '7']);
});

test('defaults build a valid exercise', () => {
  assert.equal(buildExercise(DEFAULT_CONFIG, { rng: rng(), patterns }).reps, 6);
});

test('offline cache lists every file the app loads', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const js = readdirSync(new URL('../js/', import.meta.url)).filter((f) => f.endsWith('.js')).map((f) => `js/${f}`);
  for (const f of [...js, 'index.html', 'css/app.css', 'data/patterns.json', 'manifest.webmanifest']) {
    assert.ok(sw.includes(`'${f}'`), `${f} missing from sw.js SHELL`);
  }
});

test('position and string pair hold for the whole exercise', () => {
  for (const where of ['position', 'along']) {
    const { steps } = buildExercise({ exercise: 'ladder', where, stringPair: 'any', keys: FIFTHS, passes: 3 }, { rng: rng(), patterns });
    const locs = new Set(steps.filter((s) => s.kind === 'rep').map((s) => s.rep.sub.replace(/^(Ascending|Descending) · /, '').replace(/moving (up|down)/, 'moving')));
    assert.equal(locs.size, 1, [...locs].join(' / '));
  }
});
