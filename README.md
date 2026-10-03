# Fretboard Trainer

A daily guitar fretboard practice app. Installable web app, phone first, works offline.

Pick 20, 35 or 60 minutes. The app runs a randomised session of timed blocks and ends on time. You never pick the next exercise.

## Phase 0 (current)

- **Degree call** — a key plus a degree or a note. Name the other.
- **Ladder** — the major scale in patterned sequences (linear, groups of 3 and 4, thirds, pivot), up and down, in one position or along a string pair.
- Self-marked: got it / slow / missed.
- Fret range adjustable before each session (default 0–20).

Coming next: pitch detection (Phase 1), scoring and high scores (2), adaptive drills (3), voice answers (4).

## Run locally

```
npm test
npm run serve     # http://localhost:8080
npm run print     # print scales, altered degrees and the fretboard map
```

No build step and no dependencies. Node is used only for tests and the local server.
