# Evaluation set and human eval

Course method (Develop phase): build an evaluation set as insurance, start with manual review, automate what can be automated, and turn every failure into a permanent test case so it cannot come back unnoticed.

## Who checks what

**Automated checks confirm anything mechanical.** If a machine can decide right or wrong, a machine does it, on every change. Jord's time is not spent on them.

**Human checks cover what only a person at the guitar can judge:** quality, ease of use, whether the mic hears the guitar and the voice in a real room, and whether the app calls right and wrong correctly.

## The rules

- **Every failure becomes a permanent, named case.** A missed note, an octave error, a misheard "B flat", a spelling bug: each goes into the set and is re-run on every change after that.
- **Fix the system, never the expected answer.** Editing what a case expects so that it passes is training on the test.
- **Read the actual values.** Runs print what was played or said next to what the app heard and what it decided. A pass count says a process ran, not that it is right.

## Automated checks

Run with `npm test` on every change. They must pass before any push.

| Area | What is checked | Since |
|---|---|---|
| Theory | Every scale in every key spells with one accidental at most and one letter per note; conventional tonics; named spellings per scale | Phase 0 |
| Patterns | Each pattern on 7-, 6- and 5-note scales; descending mirrors; the spec's original sequences unchanged | Phase 0 |
| Exercise | Every chosen setting holds for every rep; position and string pair never change mid-exercise; keys in fifths order; rep count matches the setup summary; fret range respected | Phase 0 |
| Mixed session | Ends exactly on time for 20/35/60; never three blocks of one type in a row; never the same key twice running | Phase 0 |
| Offline | Every file the app loads is in the service worker cache list | Phase 0 |
| Browser run | A scripted headless-browser pass through setup → exercise → done, and a full Mixed session with time fast-forwarded. No console errors. | Phase 0 (run by Claude before each push; to be scripted into the repo) |
| Pitch detection replay | Every recorded guitar clip in `eval/clips/` replayed through the detector; expected note, string and fret compared with what was decided | Phase 1 |
| Matcher replay | Every recorded voice clip and transcript replayed through the matcher, with and without the pitch prior | Phase 4 |

The replay sets start from Jord's human eval sessions: every clip she records in test mode is kept, so the automated set grows from real playing in her real room.

## Human checks

Short, at the guitar, on the phone. Each phase is done only when its check has been run and logged below.

### Check 0 — Phase 0: is it easy and worth doing?

- [ ] Setting up an exercise is quick, and repeating yesterday's is one tap
- [ ] Prompts are readable from the stand at arm's length
- [ ] Nothing needs deciding once it starts
- [ ] The exercise ends where the setup summary said it would
- [ ] Screen stayed on (if not, note it — the auto-lock workaround is in the README)
- [ ] Any spelling that looked wrong (as opposed to unfamiliar)
- [ ] Pivot pattern: correct as transcribed, or the corrected sequence
- [ ] Vibe check: worth doing again tomorrow?

### Check 1 — Phase 1: does it hear the guitar and judge it correctly?

In a normal exercise, not a test script:

- [ ] Plays that were right are scored right
- [ ] Plays that were wrong (play a wrong note on purpose, a few times) are scored wrong
- [ ] Low E and A strings: no "wrong" calls on notes that were right
- [ ] With the metronome on, the click doesn't get scored as a note
- [ ] With normal room noise, it still hears the guitar
- [ ] It feels fast enough — no lag between playing and the app reacting
- [ ] Plugged in through the pickup (if there's an interface): same checks

Then a short test-mode session that records clips (chromatic run on strings 5 and 6, a few wrong notes on purpose). Those clips seed the automated replay set.

### Check 4 — Phase 4: does it hear the voice and judge it correctly?

- [ ] Saying a right degree or note name is scored right
- [ ] Saying a wrong one on purpose is scored wrong
- [ ] Note names that sound alike (B / D / E, "B flat" / "E flat") come out right when played and said together
- [ ] Degree call by voice alone, away from the guitar, works for a full exercise
- [ ] Turning voice off mid-exercise is easy if it starts misfiring
- [ ] Vibe check: is talking to it better than tapping?

Then a short test-mode session saying each note name and degree a few times. Those recordings and transcripts seed the matcher replay set.

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

Test mode will have a "Save log" button that downloads the log and clips as one file. It goes into `eval/runs/` and is committed, so every run stays comparable.

## Run log

| Date | Check | Build | Result | Cases added | Notes |
|---|---|---|---|---|---|
| 2026-10-03 | 0 (first pass) | v0.1.0 | Loaded and ran | — | Choosing minutes first felt wrong; wants to pick an exercise and its settings; switching too much for now. Led to v0.2.0. Human checks re-scoped to quality and recognition. |
| | 0 | v0.2.0 | | | |
