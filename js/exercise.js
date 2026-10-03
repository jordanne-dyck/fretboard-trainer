// Player-configured exercises. Pure: a config becomes a fixed, finite list of steps.
// Every setting is chosen before the exercise starts and holds for its whole length.
import { FIFTHS, scaleById, tonicFor, pretty } from './theory.js';
import { ladderRep, degreeCallRep, d3Modes, patternFits, shuffle, pick, randomPosition, STRING_PAIRS } from './drills.js';

export const DEFAULT_CONFIG = {
  exercise: 'ladder', // 'ladder' | 'degree' | 'mixed'
  scale: 'major',
  pattern: 'linear',
  response: 'degrees', // 'play' | 'degrees' | 'notes'
  direction: 'updown', // 'up' | 'down' | 'updown'
  where: 'position', // 'position' | 'along'
  stringPair: 'any',
  ask: 'toNote', // 'toNote' | 'toDegree' | 'both'
  keys: [0], // pitch classes
  passes: 3,
  lengthMin: 20,
  fretMin: 0,
  fretMax: 20,
};

export const KEY_CARD_MS = 3000;

// Keys always run in circle-of-fifths order, whatever order they were picked in.
export function orderedKeys(pcs) {
  return FIFTHS.filter((pc) => pcs.includes(pc));
}

// Returns { steps, reps }. A step is { kind: 'card', title, sub } or { kind: 'rep', rep, progress }.
export function buildExercise(config, { rng, patterns }) {
  const c = { ...DEFAULT_CONFIG, ...config };
  const scale = scaleById(c.scale);
  const keys = orderedKeys(c.keys);
  if (!keys.length) throw new Error('no keys selected');
  const steps = [];
  let reps = 0;
  // Location is chosen once and held for the whole exercise: no switching mid-run.
  // A 5-fret range pins the position exactly.
  const positionStart = randomPosition(rng, c.fretMin, c.fretMax);
  const stringPair = c.stringPair === 'any' ? pick(rng, STRING_PAIRS) : c.stringPair;

  keys.forEach((pc, ki) => {
    const tonic = tonicFor(scale, pc);
    steps.push({ kind: 'card', title: `${pretty(tonic)} ${scale.name.toLowerCase()}`, sub: `Key ${ki + 1} of ${keys.length}` });

    for (let p = 0; p < c.passes; p++) {
      const progress = `Key ${ki + 1} of ${keys.length} · pass ${p + 1} of ${c.passes}`;
      if (c.exercise === 'ladder') {
        const pattern = patterns.find((x) => x.id === c.pattern);
        // Along-the-neck needs 7+ frets; fall back to one position rather than fail.
        const where = d3Modes(c.fretMin, c.fretMax).includes(c.where) ? c.where : 'position';
        const dirs = c.direction === 'updown' ? ['asc', 'desc'] : [c.direction === 'down' ? 'desc' : 'asc'];
        for (const direction of dirs) {
          steps.push({
            kind: 'rep',
            progress,
            rep: ladderRep({
              rng, scale, tonic, pattern, direction,
              response: c.response, where, stringPair, positionStart,
              fretMin: c.fretMin, fretMax: c.fretMax,
            }),
          });
          reps++;
        }
      } else {
        // Every degree of the scale once per pass, shuffled.
        shuffle(rng, scale.degrees).forEach((degree, i) => {
          const ask = c.ask === 'both' ? (i % 2 ? 'toDegree' : 'toNote') : c.ask;
          steps.push({ kind: 'rep', progress, rep: degreeCallRep({ scale, tonic, degree, ask }) });
          reps++;
        });
      }
    }
  });
  return { steps, reps };
}

// Rep count for the setup screen, so the end is visible before starting.
export function repCount(config) {
  const c = { ...DEFAULT_CONFIG, ...config };
  const k = c.keys.length * c.passes;
  if (c.exercise === 'ladder') return k * (c.direction === 'updown' ? 2 : 1);
  if (c.exercise === 'degree') return k * scaleById(c.scale).degrees.length;
  return 0;
}

export { patternFits };
