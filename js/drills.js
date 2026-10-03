// Drill content. Pure: given parameters (and an rng where needed), produce reps. No DOM.
import { DIATONIC, ALTERED, spellDegree, resolveDegree, usableDegrees, scaleById, pretty } from './theory.js';

export const DRILL_NAMES = { D2: 'Degree call', D3: 'Scale ladder' };

export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

export function shuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- patterns ----------
// Steps are 1-based scale steps; step len+1 is the octave.

export function expandPattern(pattern, len) {
  if (pattern.seq) return pattern.seq.slice();
  const top = Math.max(...pattern.cell);
  const out = [];
  for (let s = 0; s + top <= len; s++) for (const c of pattern.cell) out.push(s + c + 1);
  return out;
}

export function patternFits(pattern, len) {
  return Math.max(...expandPattern(pattern, len)) <= len + 1;
}

// Descending mirrors the pattern (step -> len+2-step): thirds descend 8,6,7,5… which is the
// conventional form. For linear and groups the mirror equals plain reversal.
export function ladderSteps(pattern, len, direction) {
  const up = expandPattern(pattern, len);
  return direction === 'desc' ? up.map((k) => len + 2 - k) : up;
}

const groupSize = (pattern) => (pattern.cell && pattern.cell.length > 1 ? pattern.cell.length : 0);

// Non-breaking spaces inside a group so a line never wraps mid-group.
function groupJoin(items, group) {
  if (!group) return items.join(' ');
  const out = [];
  for (let i = 0; i < items.length; i += group) out.push(items.slice(i, i + group).join(' '));
  return out.join(' · ');
}

// ---------- D3: scale ladder ----------

export const STRING_PAIRS = ['6–5', '5–4', '4–3', '3–2', '2–1'];
export const POSITION_SPAN = 4; // a position is a 5-fret window: start..start+4
export const ALONG_MIN_SPAN = 7; // an octave across two adjacent strings needs ~7 frets

export function d3Modes(fretMin, fretMax) {
  const span = fretMax - fretMin;
  const modes = [];
  if (span >= POSITION_SPAN) modes.push('position');
  if (span >= ALONG_MIN_SPAN) modes.push('along');
  return modes;
}

export const randomPosition = (rng, fretMin, fretMax) => fretMin + Math.floor(rng() * (fretMax - POSITION_SPAN - fretMin + 1));

const SAY = {
  play: 'Play it',
  degrees: 'Play it and say the degrees',
  notes: 'Play it and say the note names',
};

// One run of a pattern in one direction. `where` is 'position' or 'along'.
// positionStart and a specific stringPair pin the location; when absent, one is picked at random.
export function ladderRep({ rng, scale, tonic, pattern, direction, response, where, stringPair, positionStart, fretMin, fretMax }) {
  const len = scale.degrees.length;
  const steps = ladderSteps(pattern, len, direction);
  const degreeAt = (k) => resolveDegree(tonic, scale.degrees[(k - 1) % len]);
  const label = (k) => (k === len + 1 ? '8' : degreeAt(k));
  const note = (k) => spellDegree(tonic, degreeAt(k));

  let whereText;
  if (where === 'along') {
    const pair = stringPair && stringPair !== 'any' ? stringPair : pick(rng, STRING_PAIRS);
    whereText = `Strings ${pair}, moving ${direction === 'asc' ? 'up' : 'down'} the neck within frets ${fretMin}–${fretMax}`;
  } else {
    const start = positionStart ?? randomPosition(rng, fretMin, fretMax);
    whereText = `Position: frets ${start}–${start + POSITION_SPAN}, string to string`;
  }

  const g = groupSize(pattern);
  return {
    main: `${pretty(tonic)} ${scale.name.toLowerCase()} · ${pattern.name}`,
    sub: `${direction === 'asc' ? 'Ascending' : 'Descending'} · ${whereText}`,
    pattern: groupJoin(steps.map((k) => pretty(label(k))), g),
    say: SAY[response],
    answer: groupJoin(steps.map((k) => pretty(note(k))), g),
    unconfirmed: !!pattern.confirm,
    where,
    direction,
  };
}

// ---------- D2: degree call ----------

export function degreeCallRep({ scale, tonic, degree: raw, ask }) {
  const degree = resolveDegree(tonic, raw);
  const note = pretty(spellDegree(tonic, degree));
  const key = `${pretty(tonic)} ${scale.id === 'major' ? 'major' : scale.name.toLowerCase()}`;
  return ask === 'toDegree'
    ? { main: `${note} in ${key}`, sub: 'Name the degree', answer: pretty(degree) }
    : { main: `${pretty(degree)} in ${key}`, sub: 'Name the note', answer: note };
}

// ---------- blocks for the Mixed session ----------

// Key plus a degree or a note; the player names the other. Major keys, altered degrees mixed in.
export function d2Block({ rng, key, altered }) {
  const major = scaleById('major');
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
      return degreeCallRep({ scale: major, tonic: key, degree: deg, ask: rng() < 0.5 ? 'toNote' : 'toDegree' });
    },
  };
}

export function d3Block({ rng, key, pattern, say, fretMin, fretMax }) {
  const modes = d3Modes(fretMin, fretMax);
  const scale = scaleById('major');
  return {
    type: 'D3',
    key,
    pattern,
    nextRep: () =>
      ladderRep({
        rng, scale, tonic: key, pattern,
        direction: rng() < 0.5 ? 'asc' : 'desc',
        response: say,
        where: pick(rng, modes),
        fretMin, fretMax,
      }),
  };
}
