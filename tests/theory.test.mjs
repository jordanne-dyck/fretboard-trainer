import { test } from 'node:test';
import assert from 'node:assert/strict';
import { majorScale, spellDegree, usableDegrees, ALTERED, pcAt, midiAt, fretsFor, pretty } from '../js/theory.js';

test('major scales spell by letter, key decides sharps or flats', () => {
  assert.deepEqual(majorScale('C'), ['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  assert.deepEqual(majorScale('D'), ['D', 'E', 'F#', 'G', 'A', 'B', 'C#']);
  assert.deepEqual(majorScale('F#'), ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#']);
  assert.deepEqual(majorScale('Bb'), ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A']);
  assert.deepEqual(majorScale('Db'), ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C']);
});

test('altered degrees', () => {
  assert.equal(spellDegree('Eb', 'b7'), 'Db');
  assert.equal(spellDegree('B', '#4'), 'E#');
  assert.equal(spellDegree('D', 'b3'), 'F');
  assert.equal(spellDegree('C', 'b5'), 'Gb');
});

test('double-accidental spellings are excluded from drills', () => {
  assert.equal(spellDegree('Db', 'b6'), 'Bbb');
  assert.ok(!usableDegrees('Db', ALTERED).includes('b6'));
  assert.deepEqual(usableDegrees('C', ALTERED), ALTERED);
});

test('fretboard: open strings and the 20th fret', () => {
  assert.equal(midiAt(6, 0), 40); // E2
  assert.equal(midiAt(1, 20), 84); // C6, top of the GS Mini neck
  assert.equal(pcAt(5, 0), 9); // A
  assert.deepEqual(fretsFor('A', 1, 0, 20), [5, 17]);
  assert.deepEqual(fretsFor('A', 1, 6, 16), []);
});

test('display glyphs never touch the letter B', () => {
  assert.equal(pretty('Bb'), 'B♭');
  assert.equal(pretty('F#'), 'F♯');
  assert.equal(pretty('b7'), '♭7');
});
