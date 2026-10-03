# Fretboard Trainer — repo rules

Build spec: `C:\Users\Jord\jord-claude\music\fretboard-trainer-spec-v1.md`. It is kept outside this repo on purpose: the repo is public and the spec holds personal context. Read it before changing drill design or session structure.

Course framework: `C:\Users\Jord\AI_Capstone_Project\reference\`. Applied where relevant. The mapping lives in `docs/`: `engine-selection.md`, `metrics.md`, `eval-set.md`. Closed calls are in `docs/decisions.md`.

## Standing rules

- Vanilla JS, ES modules, no framework, no build step, no runtime dependencies. Third-party code is vendored into `js/vendor/`.
- Theory, drills and session planning stay pure (no DOM) so node tests can import them. The DOM lives only in `js/app.js`.
- No routing of any kind. Screens are shown and hidden.
- No decisions mid-session. Every setting is chosen on the start screen.
- Patterns are data (`data/patterns.json`), never code.
- New files the app needs offline go in the `SHELL` list in `sw.js`.
- `npm test` must pass. `npm run print` prints the theory tables — read them after any theory change.
- A phase is not done until its human eval gate in `docs/eval-set.md` has been run and logged.
- Tag each phase (`v0.1.0` = Phase 0). Tags are the rollback points.
- Do not put personal context in this repo. It is public.

## Local run

```powershell
cd C:\Users\Jord\jord-claude\music\fretboard-trainer
npm test
npm run serve    # http://localhost:8080
```
