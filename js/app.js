// UI and session runner. All drill logic lives in the pure modules.
import { MAX_FRET, pretty } from './theory.js';
import { DRILL_NAMES } from './drills.js';
import { planSession, makeRng, CARD_SEC } from './session.js';

const $ = (id) => document.getElementById(id);
const MIN_SPAN = 4; // a ladder position needs a 5-fret window
const D2_AUTO_REVEAL_MS = 8000;
const SETTINGS_KEY = 'ft.settings';

// ---------- settings (per-device convenience; IndexedDB arrives in Phase 2) ----------

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (s && Number.isInteger(s.fretMin) && Number.isInteger(s.fretMax)) return clampFrets(s);
  } catch {}
  return { fretMin: 0, fretMax: MAX_FRET };
}

function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

function clampFrets({ fretMin, fretMax }) {
  fretMax = Math.min(MAX_FRET, Math.max(MIN_SPAN, fretMax));
  fretMin = Math.max(0, Math.min(fretMax - MIN_SPAN, fretMin));
  return { fretMin, fretMax };
}

let settings = loadSettings();

function renderSettings() {
  $('fret-min').textContent = settings.fretMin;
  $('fret-max').textContent = settings.fretMax;
  const span = settings.fretMax - settings.fretMin;
  $('fret-hint').textContent =
    span < 7
      ? `Ladders stay in one position at this range (along-the-neck runs need 7+ frets).`
      : `Applies to every exercise in the next session.`;
}

document.querySelectorAll('[data-step]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const which = btn.dataset.step === 'min' ? 'fretMin' : 'fretMax';
    settings = clampFrets({ ...settings, [which]: settings[which] + Number(btn.dataset.delta) });
    saveSettings(settings);
    renderSettings();
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

// ---------- pausable clock: time stops while the app is in the background ----------

const clock = {
  base: 0, startedAt: null,
  start() { this.base = 0; this.startedAt = performance.now(); },
  pause() { if (this.startedAt !== null) { this.base += performance.now() - this.startedAt; this.startedAt = null; } },
  resume() { if (this.startedAt === null) this.startedAt = performance.now(); },
  ms() { return this.base + (this.startedAt === null ? 0 : performance.now() - this.startedAt); },
};

// ---------- session state ----------

let patterns = [];
let s = null; // active session

function show(id) {
  for (const el of document.querySelectorAll('.screen')) el.hidden = el.id !== id;
}

async function startSession(lengthMin) {
  if (!patterns.length) patterns = (await (await fetch('data/patterns.json')).json()).patterns;
  const blocks = planSession({
    lengthMin,
    rng: makeRng(Date.now()),
    patterns,
    fretMin: settings.fretMin,
    fretMax: settings.fretMax,
  });
  // Absolute schedule in session-ms: [card][block] … The first block has no card.
  let t = 0;
  const segs = [];
  blocks.forEach((b, i) => {
    if (i > 0) { segs.push({ kind: 'card', start: t, end: t + CARD_SEC * 1000, block: i }); t += CARD_SEC * 1000; }
    segs.push({ kind: 'block', start: t, end: t + b.durationSec * 1000, block: i });
    t += b.durationSec * 1000;
  });
  s = { lengthMin, blocks, segs, totalMs: t, segIdx: -1, rep: null, tally: { got: 0, slow: 0, missed: 0 } };
  await holdWake();
  clock.start();
  tick();
  s.timer = setInterval(tick, 200);
}

function endSession(completed) {
  clearInterval(s.timer);
  releaseWake();
  const minutes = Math.round(clock.ms() / 60000);
  $('done-summary').textContent = completed
    ? `${s.lengthMin} minutes, ${s.blocks.length} blocks.`
    : `Ended early at ${minutes} of ${s.lengthMin} minutes.`;
  $('done-tally').innerHTML = ['got', 'slow', 'missed']
    .map((k) => `<div>${s.tally[k]}<span>${{ got: 'Got it', slow: 'Slow', missed: 'Missed' }[k]}</span></div>`)
    .join('');
  s = null;
  show('done');
}

function blockLabel(b) {
  return b.warmup ? 'Warm-up' : DRILL_NAMES[b.drill.type];
}

function cardSub(b) {
  const d = b.drill;
  return d.type === 'D3' ? `${pretty(d.key)} major · ${d.pattern.name}` : `Key of ${pretty(d.key)}`;
}

function fmt(ms) {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

function tick() {
  if (!s) return;
  const now = clock.ms();
  if (now >= s.totalMs) return endSession(true);

  let idx = s.segIdx < 0 ? 0 : s.segIdx;
  while (s.segs[idx].end <= now) idx++;
  const seg = s.segs[idx];
  const block = s.blocks[seg.block];

  if (idx !== s.segIdx) {
    s.segIdx = idx;
    if (seg.kind === 'card') {
      $('card-title').textContent = blockLabel(block);
      $('card-sub').textContent = cardSub(block);
      show('card');
    } else {
      $('block-name').textContent = blockLabel(block);
      show('drill');
      nextRep(block);
    }
  }

  if (seg.kind === 'card') {
    $('card-count').textContent = Math.max(1, Math.ceil((seg.end - now) / 1000));
  } else {
    $('block-time').textContent = fmt(seg.end - now);
    $('progress-fill').style.width = `${(now / s.totalMs) * 100}%`;
    if (block.drill.type === 'D2' && !s.rep.revealed && now - s.rep.shownAt >= D2_AUTO_REVEAL_MS) reveal();
  }
}

function nextRep(block) {
  const rep = block.drill.nextRep();
  s.rep = { ...rep, shownAt: clock.ms(), revealed: false };
  $('flag').hidden = !rep.unconfirmed;
  $('p-main').textContent = rep.main;
  $('p-sub').textContent = rep.sub || '';
  $('p-pattern').textContent = rep.pattern || '';
  $('p-say').textContent = rep.say || '';
  $('p-answer').textContent = rep.answer;
  $('p-answer').hidden = true;
  $('reveal').hidden = false;
  $('marks').hidden = true;
}

function reveal() {
  if (!s?.rep || s.rep.revealed) return;
  s.rep.revealed = true;
  $('p-answer').hidden = false;
  $('reveal').hidden = true;
  $('marks').hidden = false;
}

function mark(kind) {
  if (!s?.rep?.revealed) return;
  s.tally[kind]++;
  nextRep(s.blocks[s.segs[s.segIdx].block]);
}

// ---------- wiring ----------

document.querySelectorAll('.length[data-min]').forEach((btn) =>
  btn.addEventListener('click', () => startSession(Number(btn.dataset.min))),
);
$('reveal').addEventListener('click', reveal);
document.querySelectorAll('[data-mark]').forEach((btn) => btn.addEventListener('click', () => mark(btn.dataset.mark)));
$('again').addEventListener('click', () => show('start'));

// End needs two taps within 3 seconds, so a stray tap can't kill a session.
let endArmed = null;
$('end').addEventListener('click', () => {
  if (endArmed) { clearTimeout(endArmed); endArmed = null; $('end').classList.remove('armed'); $('end').textContent = 'End'; return endSession(false); }
  $('end').classList.add('armed');
  $('end').textContent = 'Tap again';
  endArmed = setTimeout(() => { endArmed = null; $('end').classList.remove('armed'); $('end').textContent = 'End'; }, 3000);
});

document.addEventListener('visibilitychange', () => {
  if (!s) return;
  if (document.hidden) clock.pause();
  else { clock.resume(); holdWake(); }
});

renderSettings();
show('start');

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
