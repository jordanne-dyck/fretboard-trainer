# Decisions

Closed decisions for this build. Each line records what was decided, when, and why. Reopen only with a reason.

| Date | Decision | Why |
|---|---|---|
| 2026-10-03 | Fret range defaults to 0–20 | Taylor GS Mini-e has 20 frets, 14 clear of the body (taylorguitars.com spec pages). |
| 2026-10-03 | Fret range is adjustable on the start screen, per session, minimum span 4 frets | Jord asked to include or exclude frets. Set before a session, never during one — the spec bans mid-session decisions. A ladder position needs a 5-fret window, hence the minimum. |
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

## Open

- **Pivot pattern** — transcribed as `1,2,3,2, 1,2,3,4, 3,2, 3,4,5`. Not confirmed. The app tags it "unconfirmed" on screen until Jord confirms or corrects it in `data/patterns.json`.
- **D2 as a standalone short mode** for days away from the guitar — deferred.
- **Plugging in.** The GS Mini-e has an onboard pickup. A USB audio interface into the phone would give a much cleaner signal than the mic and sidestep room noise and click bleed. Worth testing in Phase 1. Not verified which interfaces work with the phone.
