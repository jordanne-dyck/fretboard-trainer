// Drill generators. Pure: given an rng and parameters, produce reps. No DOM.
import { KEYS, DIATONIC, ALTERED, spellDegree, usableDegrees, pretty } from './theory.js';

export const DRILL_NAMES = { D2: 'Degree call', D3: 'Ladder' };

export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

// ---------- D2: degree call ----------
// Key plus a degree or a note; the player names the other. Playable away from the guitar.

export function d2Block({ rng, key, altered }) {
  const recent = [];
  return {
    type: 'D2',
    key,
    nextRep() {
      const pool = altered ? [...DIATONIC, ...usableDegrees(key, ALTERED)] : DIATONIC;
      let deg;
      // No-repeat window: a degree cannot reappear within 3 reps.
      do {
        // Altered degrees at roughly 30% so the diatonic map stays the core.
        deg = altered && rng() < 0.3 ? pick(rng, usableDegrees(key, ALTERED)) : pick(rng, DIATONIC);
      } while (recent.includes(deg) && pool.length > 3);
      recent.push(deg);
      if (recent.length > 3) recent.shift();

      const note = spellDegree(key, deg);
      return rng() < 0.5
        ? { main: `${pretty(deg)} in ${pretty(key)}`, sub: 'Name the note', answer: pretty(note) }
        : { main: `${pretty(note)} in ${pretty(key)}`, sub: 'Name the degree', answer: pretty(deg) };
    },
  };
}

// ---------- D3: ladder ----------
// Major scale in patterned sequences. Patterns are data (patterns.json).

const STRING_PAIRS = ['6–5', '5–4', '4–3', '3–2', '2–1'];
const POSITION_SPAN = 4; // a position is a 5-fret window: start..start+4
const ACROSS_MIN_SPAN = 7; // an octave across two adjacent strings needs ~7 frets

// Descending mirrors the pattern (d -> 9-d): thirds descend 8,6,7,5… which is the
// conventional form, and plain reversal would give the same for linear and groups.
export function sequenceFor(pattern, direction) {
  return direction === 'desc' ? pattern.seq.map((d) => 9 - d) : pattern.seq.slice();
}

export function d3Modes(fretMin, fretMax) {
  const span = fretMax - fretMin;
  const modes = [];
  if (span >= POSITION_SPAN) modes.push('down');
  if (span >= ACROSS_MIN_SPAN) modes.push('across');
  return modes;
}

export function d3Block({ rng, key, pattern, say, fretMin, fretMax }) {
  const modes = d3Modes(fretMin, fretMax);
  return {
    type: 'D3',
    key,
    pattern,
    nextRep() {
      const direction = rng() < 0.5 ? 'asc' : 'desc';
      const mode = pick(rng, modes);
      let where;
      if (mode === 'down') {
        const start = fretMin + Math.floor(rng() * (fretMax - POSITION_SPAN - fretMin + 1));
        where = `Position: frets ${start}–${start + POSITION_SPAN}, string to string`;
      } else {
        where = `Strings ${pick(rng, STRING_PAIRS)}, moving ${direction === 'asc' ? 'up' : 'down'} the neck within frets ${fretMin}–${fretMax}`;
      }
      const seq = sequenceFor(pattern, direction);
      const notes = seq.map((d) => pretty(spellDegree(key, String(((d - 1) % 7) + 1))));
      return {
        main: `${pretty(key)} major · ${pattern.name}`,
        sub: `${direction === 'asc' ? 'Ascending' : 'Descending'} · ${where}`,
        say: say === 'degrees' ? 'Say the degrees' : 'Say the note names',
        pattern: groupJoin(seq.map(String), pattern.group),
        answer: groupJoin(notes, pattern.group),
        unconfirmed: !!pattern.confirm,
        mode,
        direction,
      };
    },
  };
}

// Non-breaking spaces inside a group so a line never wraps mid-group.
function groupJoin(items, group) {
  if (!group) return items.join(' ');
  const out = [];
  for (let i = 0; i < items.length; i += group) out.push(items.slice(i, i + group).join(' '));
  return out.join(' · ');
}

export { KEYS };
