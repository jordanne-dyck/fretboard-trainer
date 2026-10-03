# Fretboard Trainer

A daily guitar fretboard practice app. Installable web app, phone first, works offline.

Pick an exercise and its settings. It runs to a visible end, one prompt at a time, with no decisions once it starts. The last setup is remembered, so repeating yesterday is one tap.

## Exercises (Phase 0)

- **Scale ladder.** A scale in a pattern (linear, groups of 3 or 4, thirds, pivot), on any of 11 scales: major, natural minor, major and minor pentatonic, blues, harmonic minor, and the modes. You choose the response (play, play and say degrees, or play and say notes), the direction, one position or along a string pair, the keys and the number of passes.
- **Degree call.** A key plus a degree or a note; name the other. Needs no guitar.
- **Mixed session.** 20, 35 or 60 minutes of app-chosen, randomised blocks.

All exercises are self-marked for now (got it / slow / missed). Pitch detection arrives in Phase 1, scoring in Phase 2, adaptive drills in Phase 3, voice answers in Phase 4.

## On an iPhone

Open the site in Safari → Share → **Add to Home Screen**, then launch it from the icon. It works offline after the first launch.

If the screen locks during practice, the keep-awake feature isn't supported on that iOS version. Set Settings → Display & Brightness → Auto-Lock → Never while practising.

## Run locally

```
npm test
npm run serve     # http://localhost:8080
npm run print     # print scales, altered degrees and the fretboard map
```

No build step and no dependencies. Node is used only for tests and the local server.
