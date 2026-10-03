# Evaluation set and human eval

Course method (Develop phase): build an evaluation set as insurance, start with manual review, and turn every failure into a permanent test case so it cannot come back unnoticed.

## The rule

**Every failure becomes a permanent, named case.** A missed note, an octave error, or a misheard "B flat" goes into the set with its recording. It is re-run after every change to detection, the matcher or the speech engine.

**Fix the system, never the expected answer.** If a case fails, change the detection or the matcher. Editing what a case expects so that it passes is training on the test: it moves the measurement instead of the thing being measured.

**Read the actual values.** Every run prints what was played or said next to what the app heard and what it decided. A pass count says a process ran, not that it is right.

## Human eval gates — required before a phase counts as done

Each gate is run by Jord, on the phone, with the guitar. Automated checks support these gates but never replace them.

### Gate 0 — Phase 0, no mic

At the music stand, phone at arm's length, a full 20-minute session.

- [ ] Every prompt readable from the stand without leaning in
- [ ] Never had to decide anything mid-session
- [ ] Block changes happened on their own, with the next-up card
- [ ] Session ended on time with a clear end screen
- [ ] Screen stayed on the whole time (or the auto-lock workaround was needed — note which)
- [ ] Fret range set before the session was respected in every ladder
- [ ] Spellings looked right for each key (note anything that looked wrong, e.g. E♯ or C♭, and whether it is wrong or just unfamiliar)
- [ ] Pivot pattern: correct as transcribed, or the corrected sequence
- [ ] Vibe check: worth doing again tomorrow?

Record the result in the run log below.

### Gate 1 — Phase 1, guitar

Run in the app's test mode (built in Phase 1), which records each clip and logs its result.

1. **Chromatic run, every string.** Each string, every fret inside the chosen range, slowly, one note at a time. The app logs: expected note, detected note, cents off, frames agreed, latency.
2. **Low-string octave check.** Strings 5 and 6, frets 0–5, played three times each. Target: zero octave errors.
3. **Sustain bleed.** Let a note ring, play the next without muting. Check the second note is detected and the first is not re-triggered.
4. **Click bleed.** Same chromatic run on one string with the metronome on.
5. **Room.** One run with normal room noise (talking or TV in the next room).
6. **Plugged in** (if an interface is available). Repeat step 1 on strings 5 and 6 through the pickup.

Jord reads the log and marks each row right or wrong. Every wrong row becomes a case.

### Gate 4 — Phase 4, voice and guitar together

1. **Voice alone.** Each of the 17 note names (C, C♯, D♭, D … B), all degree forms (1–7, ♭2, ♭3, ♯4, ♭5, ♭6, ♭7), fret numbers 0–20 and string names, each said 5 times. Log the raw ASR text, the matched candidate and the confidence, side by side.
2. **Voice plus guitar.** Play a note and name it, 3 times for each of the 12 pitch classes. Log the detected pitch, the raw ASR text and the final match. This tests the cross-check: does the played note fix a garbled name?
3. **Deliberate wrong answers.** Say a wrong note name while playing a different note, 10 times. The app must score these wrong. This catches a matcher that is too forgiving.
4. **Away from the guitar.** D2 by voice only, one full block.

Jord reads the strings, not the counts. Every mismatch becomes a case.

## Case format

Cases live in `eval/cases.json`, with recordings in `eval/clips/`. Both are created in Phase 1.

```json
{
  "id": "oct-s6-f0-001",
  "added": "2026-10-10",
  "channel": "guitar",
  "clip": "eval/clips/oct-s6-f0-001.webm",
  "context": { "strings": [6], "fretWindow": [0, 4] },
  "expected": { "note": "E2", "string": 6, "fret": 0 },
  "why": "Detected E3 — octave error on the open low E"
}
```

Voice cases add `"candidates"` (the valid answers at that moment) and, when the guitar is involved, `"pitchPrior"`.

## Getting logs off the phone

The test mode will have a "Save log" button that downloads the log and clips as one file. It goes into `eval/runs/` and is committed, so every run stays comparable.

## Run log

| Date | Gate | Build | Result | Cases added | Notes |
|---|---|---|---|---|---|
| | 0 | v0.1.0 | | | |
