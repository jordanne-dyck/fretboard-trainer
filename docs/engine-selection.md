# Speech engine selection

Course method (Develop phase): score the options on cost, speed and quality, then decide. This app adds two dimensions it cannot do without: offline, and privacy.

**Evidence position.** The figures below come from the build spec (v1, 2026-10-02). They have not been re-checked for this doc. The scores are a starting judgement. The real decision is made by the voice eval in `eval-set.md`, run on Jord's phone with Jord's voice — not by this table.

## Scores (1 = poor, 5 = best)

| Engine | Cost | Speed | Quality | Offline | Privacy | Total |
|---|---|---|---|---|---|---|
| Web Speech API | 5 — free | 4 — no download | 2 — weakest; partial iOS support from 14.5, absent on Firefox | 1 — unclear; the browser may send audio to a server | 2 | 14 |
| Moonshine (transformers.js) | 5 — free, MIT | 3 — ~30 MB tiny / ~65 MB base first download, then fast on short utterances | 4 — 6.66% WER on the Open ASR Leaderboard per spec | 5 — cached by the service worker | 5 — audio never leaves the phone | 22 |
| Google Chirp v2 | 3 — $0.016/min, 60 free min/month; short-utterance billing rounding unverified | 3 — network round trip | 3 — strong general ASR, but Google's docs say phrase boosting has a small effect on one-word phrases | 0 — needs network | 2 — audio goes to Google | 11 |

## Decision

1. **Web Speech first** — only to get the pipeline (mic → engine → matcher → result) working end to end. Not the production engine.
2. **Moonshine as production.** Highest total, and the only option that keeps the app offline and private.
3. **Chirp is an escape hatch**, used only if Moonshine fails the voice eval. Before adopting it, verify billing for short utterances: if each rep bills a 15-second minimum, the cost is about 10x the naive estimate.

## What matters more than the engine

The constrained matcher. The app always knows the valid answers for the current rep, so it matches what was heard against that short list rather than accepting raw text. On note names, the guitar's detected pitch breaks ties. Build it regardless of engine.
