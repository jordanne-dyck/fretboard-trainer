// UI and runners. All drill logic lives in the pure modules.
import { MAX_FRET, SCALES, FIFTHS, scaleById, tonicFor, pretty } from './theory.js';
import { DRILL_NAMES, STRING_PAIRS, ALONG_MIN_SPAN, patternFits } from './drills.js';
import { DEFAULT_CONFIG, KEY_CARD_MS, buildExercise, repCount } from './exercise.js';
import { planSession, makeRng, CARD_SEC } from './session.js';

const $ = (id) => document.getElementById(id);
const MIN_SPAN = 4; // a ladder position needs a 5-fret window
const D2_AUTO_REVEAL_MS = 8000;
const CONFIG_KEY = 'ft.config';

// ---------- config (per-device convenience; IndexedDB arrives in Phase 2) ----------

function loadConfig() {
  let c = { ...DEFAULT_CONFIG };
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG_KEY));
    if (saved && typeof saved === 'object') c = { ...c, ...saved };
  } catch {}
  // Older saves (Phase 0 first cut) only held fret range under ft.settings.
  try {
    const old = JSON.parse(localStorage.getItem('ft.settings'));
    if (old && !localStorage.getItem(CONFIG_KEY)) c = { ...c, fretMin: old.fretMin, fretMax: old.fretMax };
  } catch {}
  return sanitize(c);
}

function saveConfig() {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); } catch {}
}

function sanitize(c) {
  const fretMax = Math.min(MAX_FRET, Math.max(MIN_SPAN, Number(c.fretMax) || MAX_FRET));
  const fretMin = Math.max(0, Math.min(fretMax - MIN_SPAN, Number(c.fretMin) || 0));
  const keys = Array.isArray(c.keys) ? c.keys.filter((k) => Number.isInteger(k) && k >= 0 && k < 12) : [];
  return {
    ...c,
    fretMin, fretMax,
    keys: keys.length ? [...new Set(keys)] : [0],
    scale: scaleById(c.scale) ? c.scale : 'major',
  };
}

let config = loadConfig();
let patterns = [];

// ---------- setup screen ----------
// Each row: which exercises show it, its label, and its options.

const ROWS = [
  { key: 'exercise', label: 'Exercise', show: 'all',
    options: () => [['ladder', 'Scale ladder'], ['degree', 'Degree call'], ['mixed', 'Mixed session']] },
  { key: 'scale', label: 'Scale', show: 'ladder degree', options: () => SCALES.map((s) => [s.id, s.name]) },
  { key: 'pattern', label: 'Pattern', show: 'ladder',
    options: () => patterns.filter((p) => patternFits(p, scaleById(config.scale).degrees.length)).map((p) => [p.id, p.name]) },
  { key: 'response', label: 'Response', show: 'ladder',
    options: () => [['play', 'Play only'], ['degrees', 'Play + say degrees'], ['notes', 'Play + say notes']] },
  { key: 'direction', label: 'Direction', show: 'ladder', options: () => [['up', 'Up'], ['down', 'Down'], ['updown', 'Up then down']] },
  { key: 'where', label: 'Where', show: 'ladder',
    options: () => [['position', 'One position'], ['along', 'Along a string pair']],
    disabled: (v) => v === 'along' && config.fretMax - config.fretMin < ALONG_MIN_SPAN },
  { key: 'stringPair', label: 'String pair', show: 'ladder', when: () => config.where === 'along',
    options: () => [['any', 'Surprise me'], ...STRING_PAIRS.map((p) => [p, p])] },
  { key: 'ask', label: 'Ask', show: 'degree', options: () => [['toNote', 'Degree → note'], ['toDegree', 'Note → degree'], ['both', 'Both']] },
  { key: 'keys', label: 'Keys', show: 'ladder degree', multi: true,
    options: () => FIFTHS.map((pc) => [pc, pretty(tonicFor(scaleById(config.scale), pc))]) },
  { key: 'passes', label: 'Passes per key', show: 'ladder degree', options: () => [1, 2, 3, 4, 5].map((n) => [n, String(n)]) },
  { key: 'lengthMin', label: 'Length', show: 'mixed', options: () => [[20, '20 min'], [35, '35 min'], [60, '60 min']] },
];

function renderSetup() {
  const root = $('setup');
  root.innerHTML = '';
  for (const row of ROWS) {
    if (row.show !== 'all' && !row.show.split(' ').includes(config.exercise)) continue;
    if (row.when && !row.when()) continue;
    const wrap = document.createElement('div');
    wrap.className = 'row';
    const label = document.createElement('div');
    label.className = 'row-label';
    label.textContent = row.label;
    wrap.append(label);
    const chips = document.createElement('div');
    chips.className = 'chips' + (row.key === 'keys' ? ' keys' : '');
    for (const [value, text] of row.options()) {
      const b = document.createElement('button');
      b.className = 'chip';
      b.textContent = text;
      const on = row.multi ? config[row.key].includes(value) : config[row.key] === value;
      b.setAttribute('aria-pressed', on);
      if (row.disabled?.(value)) b.disabled = true;
      b.addEventListener('click', () => choose(row, value));
      chips.append(b);
    }
    if (row.key === 'keys') {
      const all = document.createElement('button');
      all.className = 'chip wide';
      const allOn = config.keys.length === 12;
      all.textContent = allOn ? 'Just C' : 'All 12';
      all.addEventListener('click', () => { config.keys = allOn ? [0] : FIFTHS.slice(); changed(); });
      chips.append(all);
    }
    wrap.append(chips);
    root.append(wrap);
  }
  for (const el of document.querySelectorAll('[data-show]')) el.hidden = !el.dataset.show.split(' ').includes(config.exercise);
  renderFrets();
  renderSummary();
}

function choose(row, value) {
  if (row.multi) {
    const set = new Set(config[row.key]);
    if (set.has(value)) { if (set.size > 1) set.delete(value); } else set.add(value);
    config[row.key] = [...set];
  } else {
    config[row.key] = value;
  }
  changed();
}

function changed() {
  // Keep dependent choices valid: a pattern too long for the scale, along-the-neck on a narrow range.
  const len = scaleById(config.scale).degrees.length;
  const p = patterns.find((x) => x.id === config.pattern);
  if (p && !patternFits(p, len)) config.pattern = 'linear';
  if (config.where === 'along' && config.fretMax - config.fretMin < ALONG_MIN_SPAN) config.where = 'position';
  saveConfig();
  renderSetup();
}

function renderFrets() {
  $('fret-min').textContent = config.fretMin;
  $('fret-max').textContent = config.fretMax;
  $('fret-hint').textContent =
    config.fretMax - config.fretMin < ALONG_MIN_SPAN
      ? 'Along-the-neck runs need 7+ frets, so ladders stay in one position at this range.'
      : 'Ladders hold one position for the whole exercise. Set a 5-fret range to choose which.';
}

function renderSummary() {
  if (config.exercise === 'mixed') {
    $('summary').textContent = `${config.lengthMin} minutes · the app picks the drills`;
    return;
  }
  const n = repCount(config);
  const unit = config.exercise === 'ladder' ? 'runs' : 'prompts';
  $('summary').textContent = `${config.keys.length} ${config.keys.length === 1 ? 'key' : 'keys'} × ${config.passes} ${config.passes === 1 ? 'pass' : 'passes'} · ${n} ${unit}`;
}

document.querySelectorAll('[data-step]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const which = btn.dataset.step === 'min' ? 'fretMin' : 'fretMax';
    config = sanitize({ ...config, [which]: config[which] + Number(btn.dataset.delta) });
    changed();
  });
});

// ---------- screen wake lock ----------

let wakeLock = null;
async function holdWake() {
  try { wakeLock = await navigator.wakeLock.request('screen'); } catch { wakeLock = null; }
}
function releaseWake() {
  try { wakeLock?.release(); } catch {}
  wakeLock = null;
}
if (!('wakeLock' in navigator)) $('wake-hint').hidden = false;

// ---------- shared rep display ----------

let run = null; // the active exercise or mixed session

function show(id) {
  for (const el of document.querySelectorAll('.screen')) el.hidden = el.id !== id;
}

function showRep(rep, isDegreeCall) {
  clearTimeout(run.revealTimer);
  run.rep = { ...rep, revealed: false };
  $('flag').hidden = !rep.unconfirmed;
  $('p-main').textContent = rep.main;
  $('p-sub').textContent = rep.sub || '';
  $('p-pattern').textContent = rep.pattern || '';
  $('p-say').textContent = rep.say || '';
  $('p-answer').textContent = rep.answer;
  $('p-answer').hidden = true;
  $('reveal').hidden = false;
  $('marks').hidden = true;
  if (isDegreeCall) run.revealTimer = setTimeout(reveal, D2_AUTO_REVEAL_MS);
}

function reveal() {
  if (!run?.rep || run.rep.revealed) return;
  run.rep.revealed = true;
  $('p-answer').hidden = false;
  $('reveal').hidden = true;
  $('marks').hidden = false;
}

function mark(kind) {
  if (!run?.rep?.revealed) return;
  run.tally[kind]++;
  run.onMarked();
}

function finish(summary) {
  clearTimeout(run.revealTimer);
  clearTimeout(run.cardTimer);
  clearInterval(run.cardInterval);
  clearInterval(run.timer);
  releaseWake();
  $('done-summary').textContent = summary;
  $('done-tally').innerHTML = ['got', 'slow', 'missed']
    .map((k) => `<div>${run.tally[k]}<span>${{ got: 'Got it', slow: 'Slow', missed: 'Missed' }[k]}</span></div>`)
    .join('');
  run = null;
  show('done');
}

// ---------- exercise runner: finite list of steps, advances on each mark ----------

function startExercise() {
  const { steps, reps } = buildExercise(config, { rng: makeRng(Date.now()), patterns });
  const title = config.exercise === 'ladder'
    ? `${scaleById(config.scale).name} · ${patterns.find((p) => p.id === config.pattern).name}`
    : `Degree call · ${scaleById(config.scale).name}`;
  run = { kind: 'exercise', steps, reps, i: -1, done: 0, title, tally: { got: 0, slow: 0, missed: 0 } };
  run.onMarked = () => { run.done++; advance(); };
  advance();
}

function advance() {
  run.i++;
  if (run.i >= run.steps.length) return finish(`${run.title}. ${run.reps} of ${run.reps} done.`);
  const step = run.steps[run.i];
  if (step.kind === 'card') {
    $('card-title').textContent = step.title;
    $('card-sub').textContent = step.sub;
    show('card');
    const endsAt = Date.now() + KEY_CARD_MS;
    const count = () => { $('card-count').textContent = Math.max(1, Math.ceil((endsAt - Date.now()) / 1000)); };
    count();
    run.cardInterval = setInterval(count, 200);
    run.cardTimer = setTimeout(() => { clearInterval(run.cardInterval); advance(); }, KEY_CARD_MS);
    return;
  }
  $('block-name').textContent = run.title;
  $('block-time').textContent = step.progress;
  $('block-time').classList.add('small');
  $('progress-fill').style.width = `${(run.done / run.reps) * 100}%`;
  show('drill');
  showRep(step.rep, config.exercise === 'degree');
}

// ---------- mixed runner: timed, app-chosen blocks (the original Phase 0 session) ----------

const clock = {
  base: 0, startedAt: null,
  start() { this.base = 0; this.startedAt = performance.now(); },
  pause() { if (this.startedAt !== null) { this.base += performance.now() - this.startedAt; this.startedAt = null; } },
  resume() { if (this.startedAt === null) this.startedAt = performance.now(); },
  ms() { return this.base + (this.startedAt === null ? 0 : performance.now() - this.startedAt); },
};

function startMixed() {
  const blocks = planSession({
    lengthMin: config.lengthMin, rng: makeRng(Date.now()), patterns, fretMin: config.fretMin, fretMax: config.fretMax,
  });
  // Absolute schedule in session-ms: [block][card][block] …
  let t = 0;
  const segs = [];
  blocks.forEach((b, i) => {
    if (i > 0) { segs.push({ kind: 'card', start: t, end: t + CARD_SEC * 1000, block: i }); t += CARD_SEC * 1000; }
    segs.push({ kind: 'block', start: t, end: t + b.durationSec * 1000, block: i });
    t += b.durationSec * 1000;
  });
  run = { kind: 'mixed', blocks, segs, totalMs: t, segIdx: -1, tally: { got: 0, slow: 0, missed: 0 } };
  run.onMarked = () => showRep(run.blocks[run.segs[run.segIdx].block].drill.nextRep(), currentBlock().drill.type === 'D2');
  clock.start();
  tick();
  run.timer = setInterval(tick, 200);
}

const currentBlock = () => run.blocks[run.segs[run.segIdx].block];
const blockLabel = (b) => (b.warmup ? 'Warm-up' : DRILL_NAMES[b.drill.type]);
const cardSub = (b) => (b.drill.type === 'D3' ? `${pretty(b.drill.key)} major · ${b.drill.pattern.name}` : `Key of ${pretty(b.drill.key)}`);
const fmt = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

function tick() {
  if (run?.kind !== 'mixed') return;
  const now = clock.ms();
  if (now >= run.totalMs) return finish(`Mixed session. ${run.blocks.length} blocks in ${config.lengthMin} minutes.`);
  let idx = Math.max(0, run.segIdx);
  while (run.segs[idx].end <= now) idx++;
  const seg = run.segs[idx];
  const block = run.blocks[seg.block];
  if (idx !== run.segIdx) {
    run.segIdx = idx;
    if (seg.kind === 'card') {
      clearTimeout(run.revealTimer);
      $('card-title').textContent = blockLabel(block);
      $('card-sub').textContent = cardSub(block);
      show('card');
    } else {
      $('block-name').textContent = blockLabel(block);
      show('drill');
      showRep(block.drill.nextRep(), block.drill.type === 'D2');
    }
  }
  if (seg.kind === 'card') $('card-count').textContent = Math.max(1, Math.ceil((seg.end - now) / 1000));
  else {
    $('block-time').textContent = fmt(seg.end - now);
    $('block-time').classList.remove('small');
    $('progress-fill').style.width = `${(now / run.totalMs) * 100}%`;
  }
}

// ---------- wiring ----------

$('go').addEventListener('click', async () => {
  await holdWake();
  if (config.exercise === 'mixed') startMixed();
  else startExercise();
});
$('reveal').addEventListener('click', reveal);
document.querySelectorAll('[data-mark]').forEach((btn) => btn.addEventListener('click', () => mark(btn.dataset.mark)));
$('again').addEventListener('click', () => { renderSetup(); show('start'); });

// End needs two taps within 3 seconds, so a stray tap can't kill a run.
let endArmed = null;
const disarm = () => { clearTimeout(endArmed); endArmed = null; $('end').classList.remove('armed'); $('end').textContent = 'End'; };
$('end').addEventListener('click', () => {
  if (!endArmed) {
    $('end').classList.add('armed');
    $('end').textContent = 'Tap again';
    endArmed = setTimeout(disarm, 3000);
    return;
  }
  disarm();
  if (!run) return;
  finish(run.kind === 'mixed'
    ? `Ended early at ${Math.round(clock.ms() / 60000)} of ${config.lengthMin} minutes.`
    : `Ended early. ${run.done} of ${run.reps} done.`);
});

document.addEventListener('visibilitychange', () => {
  if (!run) return;
  if (document.hidden) { if (run.kind === 'mixed') clock.pause(); }
  else { if (run.kind === 'mixed') clock.resume(); holdWake(); }
});

patterns = (await (await fetch('data/patterns.json')).json()).patterns;
renderSetup();
show('start');

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
