# Decisions

Closed decisions for this build. Each line records what was decided, when, and why. Reopen only with a reason.

| Date | Decision | Why |
|---|---|---|
| 2026-10-03 | Fret range defaults to 0–20 | Taylor GS Mini-e has 20 frets, 14 clear of the body (taylorguitars.com spec pages). |
| 2026-10-03 | Fret range is adjustable on the setup screen, minimum span 4 frets | Jord asked to include or exclude frets. Set before starting, never during. A ladder position needs a 5-fret window, hence the minimum. |
| 2026-10-03 | Along-the-neck ladders need a range of 7+ frets; below that, ladders run in one position only | An octave across two adjacent strings spans about 7 frets. |
| 2026-10-03 | Sharps and flats both; the key decides the spelling | Jord's call. Scales are spelled by letter, so F♯ major has E♯ and B♭ major has E♭. |
| 2026-10-03 | Altered degrees that would need a double accidental are skipped | ♭6 in D♭ is B𝄫, which teaches nothing useful. Single accidentals like F♭ and C♭ stay, because they are the correct spelling in those keys. |
| 2026-10-03 | 12 major keys: C G D A E B F♯ D♭ A♭ E♭ B♭ F | Conventional spellings. The enharmonic twins (G♭, C♯, C♭) can be added later. |
| 2026-10-03 | GitHub Pages, public repo | Jord's call. The code holds no personal data; practice data stays on the phone. |
| 2026-10-03 | Hosting set up in Phase 0, not Phase 5 | A service worker only runs on HTTPS or localhost, so the Phase 0 phone test needs a real host. |
| 2026-10-03 | No routing; screens are shown and hidden | The spec flags iOS re-prompting for the mic on hash route changes. |
| 2026-10-03 | Settings live in localStorage until Phase 2 | IndexedDB arrives with scoring in Phase 2. localStorage is fine for one remembered setting. |
| 2026-10-03 | pitchfinder will be vendored (copied into the repo), not bundled | The spec says no build step and also names an npm package. Copying the one file keeps both true. Applies from Phase 1. |
| 2026-10-03 | Phase 0 D2 auto-reveals the answer after 8 seconds | Keeps the block moving with no decision needed. Tune after real use. |
| 2026-10-03 | **The player picks the exercise and its settings; the app no longer picks for her.** Setup screen: exercise, scale, pattern, response, direction, where, keys, passes, frets. | First-pass feedback: choosing minutes first felt wrong; she wants to pick an exercise and run it to her own parameters. |
| 2026-10-03 | Every setting holds for the whole exercise — no random switching of response, direction, position or string pair | Feedback: switching is too much right now. May come back later as an option. Position and string pair are picked once per exercise; a 5-fret range pins the position exactly. |
| 2026-10-03 | An exercise ends after keys × passes (default 3 passes); keys run in circle-of-fifths order with a 3-second key card | Keeps a visible, finite end without choosing minutes. Progress shows "Key 3 of 12 · pass 2 of 3". |
| 2026-10-03 | The original timed random session is kept as "Mixed session" | Jord's call. Useful once switching is wanted. |
| 2026-10-03 | Scales: major, natural minor, major and minor pentatonic, blues, harmonic minor, dorian, phrygian, lydian, mixolydian, locrian | Jord approved the list. |
| 2026-10-03 | Patterns are defined in scale steps, not major-scale degrees (`cell` shapes, or a literal `seq`) | Lets every pattern run on every scale, including 5- and 6-note scales. Still data, still in patterns.json. |
| 2026-10-03 | Tonic spelling per scale is computed: fewest accidentals, no double accidentals | Lands on conventional keys (D♭ major, C♯ minor, G♯ minor) without a table. Some modes land on less familiar names (D♯ phrygian, A♯ locrian) because they are the spellings without double flats. |
| 2026-10-03 | Blues blue note is ♭5, falling back to ♯4 when ♭5 needs a double flat | E♭ blues shows A, not B𝄫. |
| 2026-10-03 | Evals split: automated checks confirm anything mechanical; human checks cover quality, ease of use, and whether the app hears and judges correctly | Jord's direction. See eval-set.md. |
| 2026-10-03 | High scores (Phase 2) key on the exercise setup, not session length; cold spots (D6) become an exercise to pick | Follows from the player choosing the exercise. |

## Open

- **Pivot pattern** — transcribed as `1,2,3,2, 1,2,3,4, 3,2, 3,4,5`. Not confirmed. The app tags it "unconfirmed" on screen until Jord confirms or corrects it in `data/patterns.json`.
- **D2 as a standalone short mode** — resolved: Degree call is now its own exercise and needs no guitar.
- **Plugging in.** The GS Mini-e has an onboard pickup. A USB audio interface into the phone would give a much cleaner signal than the mic and sidestep room noise and click bleed. Worth testing in Phase 1. Not verified which interfaces work with the phone.
