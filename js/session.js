// Session planner. Pure: turns a length and settings into a fixed list of timed blocks.
import { KEYS } from './theory.js';
import { d2Block, d3Block, d3Modes, pick } from './drills.js';

export const LENGTHS = [20, 35, 60];
export const CARD_SEC = 5;

const PLAN = {
  20: { warmup: 90, block: 120 },
  35: { warmup: 120, block: 150 },
  60: { warmup: 180, block: 180 },
};

// Seeded PRNG (mulberry32) so tests can reproduce a session.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Returns blocks whose durations plus the between-block cards sum to exactly lengthMin.
export function planSession({ lengthMin, rng, patterns, fretMin, fretMax }) {
  const p = PLAN[lengthMin];
  if (!p) throw new Error(`unsupported length: ${lengthMin}`);
  const total = lengthMin * 60;
  const canLadder = d3Modes(fretMin, fretMax).length > 0;

  const blocks = [];
  const warmKey = pick(rng, ['C', 'G', 'F']);
  blocks.push({ durationSec: p.warmup, warmup: true, drill: d2Block({ rng, key: warmKey, altered: false }) });

  // Every main block is preceded by a card.
  const remaining = total - p.warmup;
  const n = Math.floor(remaining / (p.block + CARD_SEC));
  const leftover = remaining - n * (p.block + CARD_SEC);
  const extra = Math.floor(leftover / n);

  const types = ['D2']; // the warm-up counts toward the no-three-in-a-row rule
  let lastKey = warmKey;
  for (let i = 0; i < n; i++) {
    let type = canLadder && rng() < 0.5 ? 'D3' : 'D2';
    // Never three of the same type in a row.
    if (canLadder && types.length >= 2 && types.at(-1) === type && types.at(-2) === type) {
      type = type === 'D3' ? 'D2' : 'D3';
    }
    types.push(type);

    let key;
    do key = pick(rng, KEYS); while (key === lastKey);
    lastKey = key;

    const drill =
      type === 'D2'
        ? d2Block({ rng, key, altered: true })
        : d3Block({
            rng,
            key,
            pattern: pick(rng, patterns),
            say: rng() < 0.5 ? 'degrees' : 'notes',
            fretMin,
            fretMax,
          });
    const durationSec = p.block + extra + (i === n - 1 ? leftover - extra * n : 0);
    blocks.push({ durationSec, warmup: false, drill });
  }
  return blocks;
}

export function sessionSeconds(blocks) {
  return blocks.reduce((s, b, i) => s + b.durationSec + (i > 0 ? CARD_SEC : 0), 0);
}
