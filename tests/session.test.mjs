import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planSession, sessionSeconds, makeRng, LENGTHS } from '../js/session.js';
import { sequenceFor, d3Block, d2Block } from '../js/drills.js';

const patterns = JSON.parse(readFileSync(new URL('../data/patterns.json', import.meta.url))).patterns;
const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);

test('every session length ends exactly on time', () => {
  for (const lengthMin of LENGTHS) {
    for (const seed of SEEDS) {
      const blocks = planSession({ lengthMin, rng: makeRng(seed), patterns, fretMin: 0, fretMax: 20 });
      assert.equal(sessionSeconds(blocks), lengthMin * 60, `length ${lengthMin} seed ${seed}`);
    }
  }
});

test('a 20-minute session has 6-10 blocks', () => {
  const blocks = planSession({ lengthMin: 20, rng: makeRng(7), patterns, fretMin: 0, fretMax: 20 });
  assert.ok(blocks.length >= 6 && blocks.length <= 10, `got ${blocks.length}`);
});

test('never three blocks of the same type in a row, never the same key twice running', () => {
  for (const seed of SEEDS) {
    const blocks = planSession({ lengthMin: 60, rng: makeRng(seed), patterns, fretMin: 0, fretMax: 20 });
    for (let i = 2; i < blocks.length; i++) {
      const t = blocks.slice(i - 2, i + 1).map((b) => b.drill.type);
      assert.ok(!(t[0] === t[1] && t[1] === t[2]), `seed ${seed} at ${i}: ${t}`);
    }
    for (let i = 1; i < blocks.length; i++) assert.notEqual(blocks[i].drill.key, blocks[i - 1].drill.key);
  }
});

test('sessions differ between seeds', () => {
  const sig = (seed) => planSession({ lengthMin: 20, rng: makeRng(seed), patterns, fretMin: 0, fretMax: 20 })
    .map((b) => b.drill.type + b.drill.key).join();
  assert.notEqual(sig(1), sig(2));
});

test('descending ladders mirror the pattern', () => {
  const thirds = patterns.find((p) => p.id === 'thirds');
  assert.deepEqual(sequenceFor(thirds, 'desc'), [8, 6, 7, 5, 6, 4, 5, 3, 4, 2, 3, 1]);
});

test('ladder positions stay inside the chosen fret range', () => {
  const rng = makeRng(3);
  const block = d3Block({ rng, key: 'G', pattern: patterns[0], say: 'notes', fretMin: 5, fretMax: 12 });
  for (let i = 0; i < 500; i++) {
    const rep = block.nextRep();
    const m = /frets (\d+)–(\d+)/.exec(rep.sub);
    assert.ok(Number(m[1]) >= 5 && Number(m[2]) <= 12, rep.sub);
  }
});

test('narrow fret range: ladders stay in position mode only', () => {
  const block = d3Block({ rng: makeRng(4), key: 'A', pattern: patterns[0], say: 'notes', fretMin: 0, fretMax: 5 });
  for (let i = 0; i < 100; i++) assert.equal(block.nextRep().mode, 'down');
});

test('D2 does not repeat a degree within 3 reps', () => {
  const block = d2Block({ rng: makeRng(9), key: 'E', altered: true });
  const answers = Array.from({ length: 300 }, () => block.nextRep());
  const degOf = (r) => (r.sub === 'Name the note' ? r.main.split(' in ')[0] : r.answer);
  for (let i = 3; i < answers.length; i++) {
    const window = answers.slice(i - 3, i).map(degOf);
    assert.ok(!window.includes(degOf(answers[i])), `rep ${i}`);
  }
});
