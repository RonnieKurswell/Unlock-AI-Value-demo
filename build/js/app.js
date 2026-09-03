/* =============================================================
   APPLICATION — kiosk state machine
   attract → explore → diagnostic(6, case study on each question) → identify → results(5) → done
   ============================================================= */

import { HiveScene } from './scene.js';
import {
  POOLS, POOL, ORDER, QUESTIONS, MAX_POOL_SCORE, BANDS, bandOf, BAND_COPY,
  classifyArchetype, BENCHMARK_MEDIAN, benchmarkFinePrint,
  TILES, FIVE_YEAR, leadAndLag, hexOrder
} from './data.js';

const $ = id => document.getElementById(id);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

/* Staggered entrances are CSS animations, so they only run the first time an
   element paints. A screen that is shown more than once per visit has to have
   them restarted by hand. */
function replay(host) {
  if (!host) return;
  host.classList.remove('stagger');
  void host.offsetWidth;
  host.classList.add('stagger');
}

const IDLE_MS = 90_000;
const DONE_RESET_S = 12;

const FLAT = [];
ORDER.forEach(pid => QUESTIONS[pid].forEach((q, i) => FLAT.push({ ...q, pool: pid, subIndex: i })));

/* ---------- state ------------------------------------------- */

const S = {
  view: 'attract',
  read: new Set(),
  qi: 0,
  answers: {},
  scores: {},
  beat: 0,
  recipient: null
};
ORDER.forEach(id => { S.scores[id] = 0; });

const scene = new HiveScene($('gl'));
scene.start();

// debug handle — framing checks and on-site kiosk troubleshooting
window.__kiosk = { scene, state: S };

/* =============================================================
   ROUTER
   ============================================================= */

const VIEWS = { attract: 'v-attract', intro: 'v-intro', explore: 'v-explore', diag: 'v-diag', identify: 'v-identify', wrap: 'v-wrap', done: 'v-done' };
/* The framework screen is a reading moment, so it takes the bare state: no
   ring, no floor grid, nothing turning behind the panel. */
const SCENE_STATE = { attract: 'attract', intro: 'delivery', explore: 'explore', diag: 'diagnostic', identify: 'delivery', wrap: 'results', done: 'delivery' };
const BEAT_SCENE = i => (i === 0 ? 'results' : 'resultsQuiet');

/* ---------- background plates ---------------------------------
   CSS decides which plate belongs to which state, on the #bg probe. This reads
   the resolved value and cross-fades between two real layers, because
   background-image is not an animatable property — changing it on one element
   is what made switching pool blip to the next image.
   ------------------------------------------------------------- */
let plateFront = null;

function syncPlate() {
  const want = getComputedStyle($('bg')).backgroundImage;
  const a = $('bgA'), b = $('bgB');
  const front = plateFront || a;
  if (front.dataset.src === want) return;

  if (!want || want === 'none') {          // a state with no plate of its own
    a.classList.remove('on');
    b.classList.remove('on');
    a.dataset.src = b.dataset.src = 'none';
    return;
  }
  const back = front === a ? b : a;
  back.style.backgroundImage = want;
  back.dataset.src = want;
  void back.offsetHeight;                  // so the opacity transition runs
  back.classList.add('on');
  front.classList.remove('on');
  plateFront = back;
}

/* Decoded up front, so the first cross-fade into a plate is not a pop. */
function preloadPlates() {
  const seen = new Set();
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch (e) { continue; }
    for (const r of rules) {
      const m = r.style && r.style.backgroundImage && r.style.backgroundImage.match(/url\(["']?([^"')]+)/);
      if (m && !seen.has(m[1])) { seen.add(m[1]); new Image().src = m[1]; }
    }
  }
  return seen.size;
}
preloadPlates();

function show(view) {
  // Drives the per-screen background plate in CSS.
  $('stage').dataset.view = view;
  syncPlate();

  /* Attract's film runs only while attract is showing. Left playing it would
     decode behind every other screen for nothing, and on a kiosk that runs all
     day that is real heat and power. Rewound on the way in so each visitor sees
     it from the top. */
  /* The film plays on attract only. Left running it would decode behind every
     other screen for nothing, and on a kiosk that runs all day that is real
     heat. Rewound on the way in so each visitor sees it from the top. */
  const film = $('bgVideo');
  if (film) {
    if (view === 'attract') {
      try { film.currentTime = 0; } catch (e) { /* not seekable yet */ }
      const p = film.play();
      if (p && p.catch) p.catch(() => { /* autoplay refused; the poster stands in */ });
    } else {
      film.pause();
    }
  }
  S.view = view;
  Object.values(VIEWS).forEach(id => $(id).classList.remove('on'));
  $(VIEWS[view]).classList.add('on');

  scene.setState(SCENE_STATE[view]);
}

/* =============================================================
   ATTRACT
   ============================================================= */

/* The brand lockup doubles as the way back to the start. On a kiosk someone
   always walks off mid-run, and the next visitor needs a way to clear it
   without waiting for the idle timeout. */
function goHome() { if (S.view !== 'attract') reset(true); }
$('brandHome').addEventListener('click', goHome);
$('brandHome').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goHome(); }
});

$('v-attract').addEventListener('pointerdown', () => show('intro'));
$('introGo').addEventListener('click', () => start());
$('introDiag').addEventListener('click', () => startDiagnostic());

function start() {
  reset(false);
  show('explore');
  if (!scene.hex) scene.buildHex(hexOrder());
  // Opens on the whole framework. A pool is only opened by tapping one.
  scene.clearHex();
}

function reset(toAttract = true) {
  S.read = new Set();
  S.qi = 0;
  S.answers = {};
  S.beat = 0;
  S.recipient = null;
  ORDER.forEach(id => { S.scores[id] = 0; });
  scene.resetTiles();
  scene.clearHex();
  /* clearHex only clears this when a hexagon was actually open. Left set, the
     next visitor's explore overview would open on a pool plate. */
  delete $('stage').dataset.pool;
  resetDelivery();
  if (toAttract) show('attract');
}


/* =============================================================
   EXPLORE — the framework hexagon, read on the right
   ============================================================= */

/* The framework hexagon lives in the 3D scene. Its labels are canvas
   textures, so it can only be built once the webfonts have loaded. */
scene.onHexSelect = (id, i) => {
  renderPool(id);
  const view = $('v-explore');
  view.classList.add('focus');
  // On the view, so the dots and the swipe hint pick up the pool's colour too.
  view.style.setProperty('--seg', POOL[id].hex);
  // Drives that pool's own background plate in CSS.
  $('stage').dataset.pool = id;
  syncPlate();
  paintDots(i);
};

/* Back to the framework: the copy clears and the board reassembles. */
scene.onHexClear = () => {
  const view = $('v-explore');
  view.classList.remove('focus');
  view.style.removeProperty('--seg');
  delete $('stage').dataset.pool;
  syncPlate();
  paintDots(-1);
};

function paintDots(active) {
  const wrap = $('poolDots');
  if (!wrap.children.length) {
    hexOrder().forEach(() => wrap.appendChild(el('i')));
  }
  [...wrap.children].forEach((d, k) => d.classList.toggle('on', k === active));
}

/* The arrows do what the swipe does. Wrapping round rather than stopping at
   the ends, because on a kiosk a dead control reads as broken. */
function stepPool(delta) {
  const n = hexOrder().length;
  const cur = scene.hexSelected;
  if (cur < 0) return scene.selectHex(0);
  scene.selectHex(((cur + delta) % n + n) % n);
}
$('poolPrev').addEventListener('click', () => stepPool(-1));
$('poolNext').addEventListener('click', () => stepPool(1));

/* The scene reports the room it is moving to; the stage gradient follows so
   the WebGL fog and the CSS backdrop agree. */
scene.onRoom = ([a, b]) => {
  const st = $('stage');
  st.style.setProperty('--room-a', a);
  st.style.setProperty('--room-b', b);
};

/* Build it up front so a fast tap never lands on an empty explore screen,
   then re-rasterise once the webfonts are in. */
// Debug handle, matching hexboard.js's window.__board. The scene is otherwise
// module-scoped and unreachable from the console.
window.__scene = scene;

scene.buildHex(hexOrder());
document.fonts.ready.then(() => {
  scene.rebuildHex(hexOrder());
  if (S.view === 'explore') scene.selectHex(Math.max(0, scene.hexSelected));
});

function renderPool(poolId) {
  const p = POOL[poolId];
  if (!p) return;
  S.read.add(poolId);

  $('prRule').style.background = p.hex;
  $('prVerb').textContent = p.verb;
  $('prVerb').style.removeProperty('color');
  $('prName').textContent = p.name;
  $('prBlurb').textContent = p.blurb;

  const facts = $('prFacts');
  facts.innerHTML = '';
  (p.facts || []).forEach(f => {
    const li = el('li', null, f);
    li.style.setProperty('--seg', p.hex);
    facts.appendChild(li);
  });

  $('seenCount').textContent = S.read.size;

  const card = $('poolRead');
  card.classList.remove('swap');
  void card.offsetWidth;
  card.classList.add('swap');
}

/* One proof tile, rendered wherever it is asked for. Pending ones stay
   visible and say so rather than being hidden. */
function tileEl(p, t, i) {
  const b = el('button', 'tile' + (t.pending ? ' pending' : ''));
  b.innerHTML = `
    <span class="t-n">0${i + 1}</span>
    <span class="t-client">${t.client || 'Pending'}</span>
    <span class="t-title">${t.title}</span>
    <span class="t-metric">${t.metric}</span>`;
  b.style.setProperty('--tile-accent', p.hex);
  b.onclick = () => openTile(p, t);
  return b;
}

function openTile(p, t) {
  $('tsRule').style.background = p.hex;
  $('tsClient').textContent = `${p.name} · ${t.client || 'Content pending'}`;
  $('tsTitle').textContent = t.title;
  $('tsMetric').textContent = t.metric;
  $('tsMetric').style.color = t.pending ? 'var(--fg-3)' : p.hex;
  $('tsDetail').textContent = t.detail;
  const flag = $('tsFlag');
  if (t.pending) {
    flag.hidden = false;
    flag.innerHTML = '<b>Content pending</b><br>Not in the playbook or the use case register. Infosys to supply before the event.';
  } else if (t.substitute) {
    flag.hidden = false;
    flag.innerHTML = '<b>Substituted</b><br>Drawn from the use case register; this pillar has no dedicated case study in the playbook.';
  } else {
    flag.hidden = true;
  }
  $('tileSheet').classList.add('on');
}

const closeTile = () => $('tileSheet').classList.remove('on');
$('tileClose').onclick = closeTile;
$('tileSheet').addEventListener('pointerdown', e => { if (e.target === $('tileSheet')) closeTile(); });

/* Keyboard parity with the booth build: 1–6 select, arrows cycle, Esc clears. */
function exploreKeys(e) {
  if (/^[1-6]$/.test(e.key)) return scene.selectHex(Number(e.key) - 1);
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return scene.cycleHex(1);
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return scene.cycleHex(-1);
}

/* One entry point for the questionnaire. Both the framework page and the
   overview shortcut go through it: showing the view without rendering a question
   leaves the screen empty except the chrome. */
function startDiagnostic() {
  S.qi = 0;
  show('diag');
  renderQuestion();
}
$('beginDiag').onclick = startDiagnostic;

/* =============================================================
   DIAGNOSTIC
   ============================================================= */

/* ---------- maturity slider ----------------------------------
   Snaps to the question's stops. Nothing here knows how many stops there are;
   it reads q.opts, so a pool with a different number still works.
   ------------------------------------------------------------- */
const SLIDER = { i: null };

function stopCount(q) { return q.opts.length; }

function paintStop(q, i) {
  const last = stopCount(q) - 1;
  i = Math.max(0, Math.min(last, i));
  SLIDER.i = i;
  const pct = (i / last) * 100;
  $('msFill').style.width = `${pct}%`;
  $('msThumb').style.left = `${pct}%`;
  $('msThumb').classList.add('set');
  $('msHint').classList.add('gone');
  $('msLabel').textContent = q.opts[i][0];
  $('msDetail').textContent = q.opts[i][1];
  [...$('msTicks').children].forEach((t, k) => t.classList.toggle('on', k <= i));
  const sl = $('qSlider');
  sl.setAttribute('aria-valuenow', String(i));
  sl.setAttribute('aria-valuetext', `${q.opts[i][0]}. ${q.opts[i][1]}`);
  $('qNext').disabled = false;
}

function buildSlider(q) {
  const last = stopCount(q) - 1;
  const ticks = $('msTicks');
  ticks.innerHTML = '';
  q.opts.forEach(() => ticks.appendChild(el('i')));
  $('msLo').textContent = q.opts[0][0];
  $('msHi').textContent = q.opts[last][0];
  $('qSlider').setAttribute('aria-valuemax', String(last));

  // unset by default; a previous answer is restored when stepping back
  SLIDER.i = null;
  $('msFill').style.width = '0%';
  $('msThumb').classList.remove('set');
  $('msHint').classList.remove('gone');
  $('msLabel').textContent = '';
  $('msDetail').textContent = '';
  $('qSlider').setAttribute('aria-valuenow', '-1');
  $('qSlider').removeAttribute('aria-valuetext');
  $('qNext').disabled = true;

  const prev = S.answers[`${q.pool}:${q.subIndex}`];
  if (prev != null) paintStop(q, prev);
}

/* The track lives inside #frame, which is CSS-scaled. getBoundingClientRect
   and pointer coordinates are both in viewport space, so the ratio holds at
   any scale — the trap that broke hexagon picking earlier. */
function stopFromPointer(e, q) {
  const r = $('msTrack').getBoundingClientRect();
  const t = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  return Math.round(t * (stopCount(q) - 1));
}

let msDragging = false;
$('msTrack').addEventListener('pointerdown', e => {
  const q = FLAT[S.qi]; if (!q) return;
  msDragging = true;
  try { $('msTrack').setPointerCapture(e.pointerId); } catch (err) { /* not captureable */ }
  paintStop(q, stopFromPointer(e, q));
});
$('msTrack').addEventListener('pointermove', e => {
  if (!msDragging) return;
  const q = FLAT[S.qi]; if (!q) return;
  paintStop(q, stopFromPointer(e, q));
});
['pointerup', 'pointercancel'].forEach(ev =>
  $('msTrack').addEventListener(ev, () => { msDragging = false; }));

$('qSlider').addEventListener('keydown', e => {
  const q = FLAT[S.qi]; if (!q) return;
  const cur = SLIDER.i == null ? -1 : SLIDER.i;
  const K = {
    ArrowRight: cur + 1, ArrowUp: cur + 1,
    ArrowLeft: cur <= 0 ? 0 : cur - 1, ArrowDown: cur <= 0 ? 0 : cur - 1,
    Home: 0, End: stopCount(q) - 1
  };
  if (e.key in K) { e.preventDefault(); paintStop(q, K[e.key]); }
});

$('qNext').addEventListener('click', () => {
  if (SLIDER.i != null) answer(SLIDER.i);
});

$('qBack').addEventListener('click', () => {
  if (S.qi > 0) { S.qi--; renderQuestion(); }
});

function renderQuestion() {
  const q = FLAT[S.qi];
  if (!q) return finish();
  const p = POOL[q.pool];

  $('qPool').textContent = p.name;
  // The pool hex is a fill colour. Text on white takes the darker step.
  $('qPool').style.removeProperty('color');
  /* Spelled out rather than "01 / 18": at kiosk distance a slashed pair
     reads as a code, not as position in a sequence. */
  $('qCount').textContent = `Question ${S.qi + 1} of ${FLAT.length}`;
  $('qProgFill').style.width = `${((S.qi + 1) / FLAT.length) * 100}%`;
  $('qKind').textContent = q.kind;
  $('qText').textContent = q.q;

  buildSlider(q);
  renderQuestionCase(q.pool);

  // Static, in the action row. It used to be built fresh on every question,
  // which meant a listener per render and no fixed place on the screen.
  $('qBack').hidden = S.qi === 0;

  /* The design gives every question its own render, so the plate follows the
     pool being asked about the same way the explore screen's does. */
  $('stage').dataset.pool = q.pool;
  syncPlate();

  scene.focus(q.pool);
}

/* The case study alongside the question. It is the proof for the pool being
   asked about, so it argues for the question rather than interrupting it, and
   the first cleared tile is used so what shows is the same every run and can
   be reviewed off the content sheet. A pool with nothing cleared shows no
   card at all: Physical AI has no case studies yet, and "Infosys to supply" is
   fine in a report appendix and not fine on a show floor. */
function renderQuestionCase(pid) {
  const card = $('qCase');
  const tile = (TILES[pid] || []).find(t => !t.pending);
  if (!tile) { card.hidden = true; card.onclick = null; return; }

  const p = POOL[pid];
  $('qcRule').style.background = p.hex;
  // The panel above already names the pool, so the strip only carries who.
  $('qcEyebrow').textContent = tile.client;
  $('qcMetric').textContent = tile.metric;
  $('qcTitle').textContent = tile.title;
  card.hidden = false;
  card.onclick = () => openTile(p, tile);
}

function answer(optIndex) {
  const q = FLAT[S.qi];
  S.answers[`${q.pool}:${q.subIndex}`] = optIndex;

  let sc = 0, answered = 0;
  QUESTIONS[q.pool].forEach((qq, i) => {
    const a = S.answers[`${q.pool}:${i}`];
    if (a != null) { sc += qq.opts[a][2]; answered++; }
  });
  S.scores[q.pool] = sc;
  scene.setProgress(q.pool, answered / QUESTIONS[q.pool].length);
  scene.ping(q.pool);

  S.qi++;
  if (S.qi >= FLAT.length) finish();
  else renderQuestion();
}


/* =============================================================
   RESULTS
   ============================================================= */

/* The 18th answer sends them to identify, not to the results. Capturing the
   badge first means nobody walks away without a report, and the role beat is
   written from their actual job title rather than a guess. */
function finish() {
  show('identify');
}

function revealResults() {
  ORDER.forEach(id => scene.setScore(id, S.scores[id] / MAX_POOL_SCORE));
  scene.focus(null);
  scene.flare(1);
  S.beat = 0;
  buildWrapped();
  show('wrap');
  setBeat(0);
}

/* Deterministic assembly from the 30 band blocks. In production this
   is where a playbook-grounded model call writes the connecting
   paragraph — nothing here invents a figure. */
function composeNarrative() {
  const ranked = [...ORDER].sort((a, b) => S.scores[b] - S.scores[a]);
  const top = ranked[0], low = ranked[ranked.length - 1];
  const tb = bandOf(S.scores[top]), lb = bandOf(S.scores[low]);
  let out = `Strongest: ${POOL[top].name}. Binding constraint: ${POOL[low].name}, ${BAND_COPY[low][lb].read.toLowerCase().replace(/\.$/, '')}. `;
  out += BAND_COPY[low][lb].move;
  return out;
}

function buildWrapped() {
  const arch = classifyArchetype(S.scores);
  $('archName').textContent = arch.name;
  $('archTag').textContent = arch.tag;
  $('archBody').innerHTML = `${arch.body}<br><br>${composeNarrative()}`;
  $('archRisk').textContent = arch.risk;

  const pips = BEATS.map((_, i) => `<i data-pip="${i}"></i>`).join('');
  document.querySelectorAll('.beat-pips').forEach(n => { n.innerHTML = pips; });

  /* benchmark */
  /* Where the baseline came from and what it was used for. Both surfaces read
     the same string, so the credit can never say two different things. The
     short status label it used to sit next to is gone: it said the same thing
     in shouting caps directly above the rows. */
  $('benchSource').textContent = benchmarkFinePrint();

  const ahead = ORDER.filter(id => S.scores[id] > BENCHMARK_MEDIAN[id]);
  const level = ORDER.filter(id => S.scores[id] === BENCHMARK_MEDIAN[id]);
  const praise = $('benchPraise');
  if (ahead.length >= 3) {
    praise.innerHTML = `Ahead in <b>${ahead.length} of 6</b> pools, ${POOL[ahead[0]].name} most of all.`;
  } else if (ahead.length) {
    praise.innerHTML = `<b>${POOL[ahead[0]].name}</b> is your one pool ahead. Strength there funds the rest.`;
  } else if (level.length) {
    praise.innerHTML = `Level on <b>${level.length} of 6</b>. No ground lost, and the gaps are addressable.`;
  } else {
    praise.textContent = 'Every pool sits below, which makes the first move a sequencing decision rather than a technology one.';
  }
  const list = $('benchList');
  list.innerHTML = '';
  [...ORDER].sort((a, b) => S.scores[b] - S.scores[a]).forEach((id, i) => {
    const p = POOL[id], sc = S.scores[id], med = BENCHMARK_MEDIAN[id], d = sc - med;
    const first = i === 0;
    const row = el('div', 'bench-row');
    row.innerHTML = `
      <div><div class="nm">${p.name}</div><div class="bd">${BANDS[bandOf(sc)]}</div></div>
      <div class="track">
        <div class="fill" style="background:${p.hex}"></div>
        <div class="bmark${first ? ' labelled' : ''}" style="left:${(med / MAX_POOL_SCORE) * 100}%"></div>
      </div>
      <div class="val">
        <b class="${d >= 0 ? 'delta-up' : 'delta-dn'}">${d === 0 ? 'level' : (d > 0 ? '+' : '') + d}</b>
        <span class="raw">${sc}/${MAX_POOL_SCORE}</span>
      </div>`;
    list.appendChild(row);
    requestAnimationFrame(() => { row.querySelector('.fill').style.width = `${(sc / MAX_POOL_SCORE) * 100}%`; });
  });

  /* five-year view: one paragraph, in the archetype's voice, naming this
     visitor's own strongest and weakest pool. */
  const { lead, lag } = leadAndLag(S.scores);
  const poolName = id => `<b>${POOL[id].name}</b>`;
  $('fyBody').innerHTML = (FIVE_YEAR[arch.key] || '')
    .replace(/\{lead\}/g, poolName(lead))
    .replace(/\{lag\}/g, poolName(lag));

  /* Proof for the pool the paragraph points at. bestProof takes the pools in
     preference order and returns the first with a cleared case study, so the
     lag pool wins when it has one and a pending tile is never shown while any
     real one exists. */
  const pick = bestProof([lag, lead, ...ORDER]);
  const proof = $('fyProof'), holder = $('fyProofTile');
  holder.innerHTML = '';
  if (pick) {
    holder.appendChild(tileEl(POOL[pick.poolId], pick.tile, 0));
    $('fyProofLabel').textContent = `Proven now · ${POOL[pick.poolId].name}`;
    proof.hidden = false;
  } else {
    proof.hidden = true;
  }
}

/* Best available proof across a list of pools, taken in preference order: a
   cleared engagement if any of them has one, otherwise a pending tile with its
   label intact. Was per timeline column; the columns are gone. */
function bestProof(ids) {
  for (const id of ids) {
    const real = (TILES[id] || []).find(t => !t.pending);
    if (real) return { poolId: id, tile: real };
  }
  for (const id of ids) {
    const any = (TILES[id] || [])[0];
    if (any) return { poolId: id, tile: any };
  }
  return null;
}

/* ---- beats ---- */

/* Three beats: position, benchmark, five-year view. The role morph is gone -
   it was matched from a job title the badge used to supply, and the badge is
   gone too. */
const BEATS = ['beat1', 'beat2', 'beat3'];
const LAST_BEAT = BEATS.length - 1;

function setBeat(i) {
  S.beat = i;
  // Each beat has its own plate, composed around where its copy sits.
  $('stage').dataset.beat = String(i + 1);
  syncPlate();
  BEATS.forEach((_, n) => $('beat' + (n + 1)).classList.toggle('on', n === i));
  document.querySelectorAll('.beat-pips').forEach(nav => {
    [...nav.querySelectorAll('i')].forEach((pip, k) => pip.classList.toggle('on', k <= i));
  });
  scene.setState(BEAT_SCENE(i));
  scene.flare(i === 0 ? 1 : 0.3);
}

document.querySelectorAll('[data-next]').forEach(b => {
  b.onclick = () => { if (S.beat < LAST_BEAT) setBeat(S.beat + 1); else showDone(); };
});

/* =============================================================
   DELIVERY
   ============================================================= */

function resetDelivery() {
  $('tileSheet').classList.remove('on');
  $('idAsk').hidden = false;
  $('idDone').hidden = true;
  $('mfError').textContent = '';
  $('mfEmail').value = '';
  clearTimeout(idAdvance);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let idAdvance = null;

$('emailForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = $('mfEmail').value.trim();
  if (!EMAIL_RE.test(email)) {
    $('mfError').textContent = 'Enter a valid email address.';
    $('mfEmail').focus();
    return;
  }
  $('mfError').textContent = '';
  S.recipient = { email };

  /* Acknowledge before the report rolls, so nobody is left wondering whether
     the address went in. It moves on by itself: on a kiosk an extra tap to
     dismiss a confirmation is a tap nobody wants. */
  $('idDoneEmail').textContent = email;
  $('idAsk').hidden = true;
  $('idDone').hidden = false;
  replay($('idDone'));
  scene.flare(1);
  clearTimeout(idAdvance);
  idAdvance = setTimeout(revealResults, 2600);
});

$('idContinue').addEventListener('click', () => {
  clearTimeout(idAdvance);
  revealResults();
});

function showDone() {
  const r = S.recipient || {};
  // No name is collected any more, so nothing to greet them by.
  $('doneName').textContent = '';
  $('doneEmail').textContent = r.email || 'your address';
  // The emailed report carries the same comparison, so the credit follows it.
  $('doneSource').textContent = benchmarkFinePrint();
  show('done');
  countdown();
}

let resetTimer = null;
function countdown() {
  clearInterval(resetTimer);
  let t = DONE_RESET_S;
  $('resetIn').textContent = t;
  resetTimer = setInterval(() => {
    t--;
    $('resetIn').textContent = Math.max(t, 0);
    if (t <= 0) { clearInterval(resetTimer); reset(true); }
  }, 1000);
}

/* =============================================================
   INPUT + IDLE
   ============================================================= */

const typing = () => ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') return closeTile();
  if (S.view === 'attract' && (e.key === 'Enter' || e.key === ' ')) return show('intro');
  if (S.view === 'intro' && (e.key === 'Enter' || e.key === ' ')) return start();
  if (S.view === 'explore') return exploreKeys(e);
  if (S.view === 'diag' && /^[1-5]$/.test(e.key) && !typing()) return answer(Number(e.key) - 1);
  if (S.view === 'wrap' && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    if (S.beat < LAST_BEAT) setBeat(S.beat + 1); else showDone();
  }
});

let idle = null;
function bumpIdle() {
  clearTimeout(idle);
  idle = setTimeout(() => { if (S.view !== 'attract') reset(true); }, IDLE_MS);
}
['pointerdown', 'pointermove', 'keydown', 'wheel'].forEach(ev => window.addEventListener(ev, bumpIdle, { passive: true }));

/* =============================================================
   BOOT
   ============================================================= */

/* The overlay is authored at 1920x1080; this scales it to whatever the stage
   actually is. Uniform, so the composition is identical at every size. */
/* The stage is the whole window now, so the 16:9 design surface has to be
   fitted inside it rather than assumed to match: scale by whichever axis runs
   out first, then centre. On a 16:9 display this is exactly what it was
   before; on anything else the background fills the window and the
   composition sits in the middle of it. */
function fitFrame() {
  const stage = $('stage');
  const frame = $('frame');
  if (!stage || !frame || !stage.clientWidth) return;
  const w = stage.clientWidth, h = stage.clientHeight;
  const k = Math.min(w / 1920, h / 1080);
  frame.style.setProperty('--k', k);
  frame.style.setProperty('--fx', `${Math.round((w - 1920 * k) / 2)}px`);
  frame.style.setProperty('--fy', `${Math.round((h - 1080 * k) / 2)}px`);
  /* The plate layers live on the stage, not in the frame, so they need the
     same scale to stay in register with the content. Without this they were
     sized with `cover` against the WINDOW while the content was sized against
     the 1920x1080 frame, so on any window that is not exactly 16:9 the artwork
     was enlarged relative to the type. */
  stage.style.setProperty('--k', k);
}
/* Three triggers, deliberately redundant, because each one alone has a hole.
   A window resize event can fire before the stage's new box is computed, so it
   reads stale. A ResizeObserver reads the box accurately but is delivered as
   part of the rendering steps, so a backgrounded tab that is not painting never
   gets the callback. fitFrame is idempotent and costs a division, so run it
   from all of them and let the last correct read win. */
if (typeof ResizeObserver === 'function') {
  new ResizeObserver(fitFrame).observe($('stage'));
}
addEventListener('resize', () => {
  fitFrame();                                  // immediate, may read stale
  requestAnimationFrame(fitFrame);             // again after layout settles
});
fitFrame();

renderPool(POOLS[0].id);
paintDots(-1);
$('backToFramework').addEventListener('click', () => scene.clearHex());
$('beginDiagOv').addEventListener('click', startDiagnostic);
S.read = new Set();
$('seenCount').textContent = '0';
show('attract');
bumpIdle();
