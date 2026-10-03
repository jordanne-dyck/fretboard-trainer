# Metrics — what "good" means

Course method (Develop and Deploy phases): define good before measuring, and track two kinds of metric — the AI's accuracy, and whether the product is doing its job.

Every target below is a **starting guess**. Revise it after the first real eval run and record the change and the reason in the change log at the bottom. Raising or lowering a target is never a fix in itself: see the rule in `eval-set.md`.

## AI metrics — measured by the human eval runs in `eval-set.md`

| Metric | Definition | Target | First measured |
|---|---|---|---|
| Note detection accuracy | Played notes where the detected note is the one played | ≥ 98% at slow tempo | Phase 1 |
| Octave errors, strings 5 and 6 | Detections an octave off the played note | 0 in the eval set | Phase 1 |
| Fret resolution | Detections mapped to the right fret inside the drill's window | ≥ 98% | Phase 1 |
| Detection latency | Pick attack to accepted note | ≤ 250 ms | Phase 1 |
| False triggers | Notes accepted when nothing new was played (sustain, click, room) | ≤ 1 per 100 reps | Phase 1 |
| Voice match: degrees, frets, strings | Spoken answers matched to the right candidate | ≥ 95% | Phase 4 |
| Voice match: note names, voice alone | Same, for "C sharp", "B flat" and so on, no pitch help | ≥ 85% | Phase 4 |
| Voice match: note names with pitch prior | Same, with the guitar's detected note breaking ties | ≥ 97% | Phase 4 |
| Voice false negatives | Correct answers scored wrong | ≤ 3% — these are corrosive in a scored game | Phase 4 |

## Product metrics — read from the app's own run history (Phase 2 onward)

| Metric | Definition | Target |
|---|---|---|
| Sessions completed | Runs that reached the summary screen, per week | No target. This is a habit, not a quota, and a missed day costs nothing. |
| Completion rate | Runs completed ÷ runs started | ≥ 90%. A drop means sessions feel too long or something breaks mid-run. |
| Fluency trend | Median latency on the 20 weakest cells, week over week | Falling over 4 weeks |
| Coverage | Share of mastery cells seen at least once in 2 weeks | ≥ 90%. Confirms the adaptive bias isn't hiding a region of the neck. |
| Vibe check | After a session: did that feel worth doing? | Jord's call, noted in the change log when it shifts |

## Change log

| Date | Change | Reason |
|---|---|---|
| 2026-10-03 | Initial targets | Starting guesses, not yet measured |
