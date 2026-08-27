/* =============================================================
   APPLICATION — kiosk state machine
   attract → explore → diagnostic(18) → identify → results(5) → done
   ============================================================= */

import { HiveScene } from './scene.js';
import {
  POOLS, POOL, ORDER, QUESTIONS, MAX_POOL_SCORE, BANDS, bandOf, BAND_COPY,
  classifyArchetype, BENCHMARK_MEDIAN, BENCHMARK_STATUS, ROLES, ROLE_DEFAULT,
  TILES, forecast, FORECAST_LINES, hexOrder
} from './data.js';

const $ = id => document.getElementById(id);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

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
  notes: {},
  scores: {},
  beat: 0,
  role: null,
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

const VIEWS = { attract: 'v-attract', explore: 'v-explore', diag: 'v-diag', identify: 'v-identify', wrap: 'v-wrap', done: 'v-done' };
const SCENE_STATE = { attract: 'attract', explore: 'explore', diag: 'diagnostic', identify: 'delivery', wrap: 'results', done: 'delivery' };
const BEAT_SCENE = i => (i === 0 ? 'results' : 'resultsQuiet');

function show(view) {
  // Drives the per-screen background plate in CSS.
  $('stage').dataset.view = view;

  /* Attract's film runs only while attract is showing. Left playing it would
     decode behind every other screen for nothing, and on a kiosk that runs all
     day that is real heat and power. Rewound on the way in so each visitor sees
     it from the top. */
  const film = $('bgVideo');
  if (film) {
    if (view === 'attract') {
      try { film.currentTime = 0; } catch (e) { /* not seekable yet */ }
      const p = film.play();
      if (p && p.catch) p.catch(() => { /* autoplay refused; poster stands in */ });
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

$('v-attract').addEventListener('pointerdown', () => start());

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
  S.notes = {};
  S.beat = 0;
  S.role = null;
  S.recipient = null;
  ORDER.forEach(id => { S.scores[id] = 0; });
  scene.resetTiles();
  scene.clearHex();
  renderProgress();
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
  paintDots(i);
};

/* Back to the framework: the copy clears and the board reassembles. */
scene.onHexClear = () => {
  const view = $('v-explore');
  view.classList.remove('focus');
  view.style.removeProperty('--seg');
  delete $('stage').dataset.pool;
  paintDots(-1);
};

function paintDots(active) {
  const wrap = $('poolDots');
  if (!wrap.children.length) {
    hexOrder().forEach(() => wrap.appendChild(el('i')));
  }
  [...wrap.children].forEach((d, k) => d.classList.toggle('on', k === active));
}

/* The scene reports the room it is moving to; the stage gradient follows so
   the WebGL fog and the CSS backdrop agree. */
scene.onRoom = ([a, b]) => {
  const st = $('stage');
  st.style.setProperty('--room-a', a);
  st.style.setProperty('--room-b', b);
};

/* Build it up front so a fast tap never lands on an empty explore screen,
   then re-rasterise once the webfonts are in. */
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
  $('prVerb').style.color = p.hex;
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

function renderProgress() {
  const g = $('progClusters');
  g.innerHTML = '';
  ORDER.forEach(pid => {
    const c = el('div', 'cluster');
    c.dataset.pool = pid;
    const ticks = el('div', 'ticks');
    for (let i = 0; i < 3; i++) ticks.appendChild(el('i'));
    c.appendChild(ticks);
    c.appendChild(el('div', 'lb', POOL[pid].lines[0]));
    g.appendChild(c);
  });
}

function paintProgress() {
  const cur = FLAT[S.qi];
  ORDER.forEach(pid => {
    const c = $('progClusters').querySelector(`[data-pool="${pid}"]`);
    if (!c) return;
    c.classList.toggle('active', !!cur && cur.pool === pid);
    [...c.querySelectorAll('i')].forEach((tick, i) => {
      tick.style.background = S.answers[`${pid}:${i}`] != null ? POOL[pid].hex : 'var(--fg-4)';
    });
  });
}

function renderQuestion() {
  const q = FLAT[S.qi];
  if (!q) return finish();
  const p = POOL[q.pool];

  $('qPool').textContent = p.name;
  $('qPool').style.color = p.hex;
  $('qCount').textContent = `${String(S.qi + 1).padStart(2, '0')} / ${FLAT.length}`;
  $('qKind').textContent = q.kind;
  $('qText').textContent = q.q;

  const box = $('qOpts');
  box.innerHTML = '';
  q.opts.forEach((o, i) => {
    const b = el('button', 'opt');
    b.innerHTML = `<div class="key">${i + 1}</div><div><div class="lab">${o[0]}</div><div class="sub">${o[1]}</div></div>`;
    b.onclick = () => answer(i);
    box.appendChild(b);
  });

  const foot = $('qFoot');
  foot.innerHTML = '';
  if (S.qi > 0) {
    const back = el('button', 'link-quiet', '← Back');
    back.onclick = () => { S.qi--; renderQuestion(); };
    foot.appendChild(back);
  }
  const eb = $('explainBox');
  eb.classList.remove('on');
  $('explainText').value = S.notes[q.pool] || '';
  if (q.allowExplain) {
    const add = el('button', 'link-quiet', 'Add context in your own words');
    add.onclick = () => { eb.classList.toggle('on'); if (eb.classList.contains('on')) $('explainText').focus(); };
    foot.appendChild(add);
  }

  paintProgress();
  scene.focus(q.pool);
}

$('explainText').addEventListener('input', e => {
  const q = FLAT[S.qi];
  if (q) S.notes[q.pool] = e.target.value;
});

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
  const notes = Object.entries(S.notes).filter(([, v]) => v && v.trim());
  let out = `Strongest: ${POOL[top].name}. Binding constraint: ${POOL[low].name} — ${BAND_COPY[low][lb].read.toLowerCase().replace(/\.$/, '')}. `;
  out += BAND_COPY[low][lb].move;
  if (notes.length) out += ` Your own note is carried into the report.`;
  return out;
}

function buildWrapped() {
  const arch = classifyArchetype(S.scores);
  $('archName').textContent = arch.name;
  $('archTag').textContent = arch.tag;
  $('archBody').innerHTML = `${arch.body}<br><br>${composeNarrative()}`;
  $('archRisk').textContent = arch.risk;

  const pips = [0, 1, 2, 3].map(i => `<i data-pip="${i}"></i>`).join('');
  document.querySelectorAll('.beat-pips').forEach(n => { n.innerHTML = pips; });

  /* benchmark */
  $('benchNote').textContent = BENCHMARK_STATUS;

  const ahead = ORDER.filter(id => S.scores[id] > BENCHMARK_MEDIAN[id]);
  const level = ORDER.filter(id => S.scores[id] === BENCHMARK_MEDIAN[id]);
  const praise = $('benchPraise');
  if (ahead.length >= 3) {
    praise.innerHTML = `You are ahead of the benchmark in <b>${ahead.length} of 6</b> pools — ${POOL[ahead[0]].name} most of all. That is where your advantage compounds.`;
  } else if (ahead.length) {
    praise.innerHTML = `<b>${POOL[ahead[0]].name}</b> is ahead of the benchmark. Strength there is what funds the rest.`;
  } else if (level.length) {
    praise.innerHTML = `You are level with the benchmark on <b>${level.length} of 6</b> — no ground lost, and the gaps are addressable.`;
  } else {
    praise.textContent = 'Every pool is below the benchmark, which means the first move is a sequencing decision rather than a technology one.';
  }
  const list = $('benchList');
  list.innerHTML = '';
  [...ORDER].sort((a, b) => S.scores[b] - S.scores[a]).forEach(id => {
    const p = POOL[id], sc = S.scores[id], med = BENCHMARK_MEDIAN[id], d = sc - med;
    const row = el('div', 'bench-row');
    row.innerHTML = `
      <div><div class="nm">${p.name}</div><div class="bd">${BANDS[bandOf(sc)]}</div></div>
      <div class="track">
        <div class="fill" style="background:${p.hex}"></div>
        <div class="bmark" style="left:${(med / MAX_POOL_SCORE) * 100}%"></div>
      </div>
      <div class="val"><b>${sc}</b>/12 <span class="${d >= 0 ? 'delta-up' : 'delta-dn'}">${d >= 0 ? '+' : ''}${d}</span></div>`;
    list.appendChild(row);
    requestAnimationFrame(() => { row.querySelector('.fill').style.width = `${(sc / MAX_POOL_SCORE) * 100}%`; });
  });

  /* forecast */
  const fc = forecast(S.scores);
  const cols = [
    { key: 'compounding', title: 'Compounding', ids: fc.compounding, hot: false },
    { key: 'holding', title: 'Decision point', ids: fc.holding, hot: true },
    { key: 'exposed', title: 'Widening gap', ids: fc.exposed, hot: false }
  ];
  const grid = $('fcGrid');
  grid.innerHTML = '';
  cols.forEach(c => {
    const d = el('div', 'fc-col' + (c.hot ? ' hot' : ''));
    const items = c.ids.length
      ? `<ul>${c.ids.map(id => `<li><i style="background:${POOL[id].hex}"></i>${POOL[id].name}</li>`).join('')}</ul>`
      : `<div class="fc-empty">None in this band</div>`;
    d.innerHTML = `<h4>${c.title}</h4><p>${FORECAST_LINES[c.key]}</p>${items}`;

    /* Proof under each column. These describe today, not the forecast, so the
       label says so — otherwise it reads as evidence of a five-year claim. */
    const pick = columnProof(c.ids);
    if (pick) {
      const wrap = el('div', 'fc-proof');
      wrap.appendChild(el('div', 'fc-proof-label', 'Proven now'));
      wrap.appendChild(tileEl(POOL[pick.poolId], pick.tile, 0));
      d.appendChild(wrap);
    }
    grid.appendChild(d);
  });

  buildRoleBeat();
}

/* ---- beat 4: pick your role, see it transform ---- */

function buildRoleBeat() { paintRole(S.role); }

/* The note asks for role read from the scan AND the questionnaire. The badge
   gives the transformation; the answers decide which pool to point them at —
   weakest among the pools that actually matter to that role, so an actuary is
   sent to Data or Trust rather than to whatever scored lowest overall. */
function focusPool(role) {
  const candidates = (role && role.focus && role.focus.length) ? role.focus : ORDER;
  return [...candidates].sort((a, b) => S.scores[a] - S.scores[b])[0];
}

function paintRole(i) {
  const r = (i == null) ? ROLE_DEFAULT : ROLES[i];
  $('roleFrom').textContent = r.from;
  $('roleTo').textContent = r.to;
  $('roleChange').textContent = r.change;

  const f = POOL[focusPool(r)];
  const el2 = $('roleFocus');
  if (el2 && f) {
    el2.innerHTML = `Your focus area is <b style="color:${f.hex}">${f.name}</b> — the pool where your answers and your role intersect.`;
  }
}

/* ---- beat 5: proof ---- */

/* Best available proof for a timeline column: a real engagement if one of the
   column's pools has one, otherwise a pending tile with its label intact. */
function columnProof(ids) {
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

function setBeat(i) {
  S.beat = i;
  // Each beat has its own plate, composed around where its copy sits.
  $('stage').dataset.beat = String(i + 1);
  [1, 2, 3, 4].forEach(n => $('beat' + n).classList.toggle('on', n === i + 1));
  document.querySelectorAll('.beat-pips').forEach(nav => {
    [...nav.querySelectorAll('i')].forEach((pip, k) => pip.classList.toggle('on', k <= i));
  });
  scene.setState(BEAT_SCENE(i));
  scene.flare(i === 0 ? 1 : 0.3);
}

document.querySelectorAll('[data-next]').forEach(b => {
  b.onclick = () => { if (S.beat < 3) setBeat(S.beat + 1); else showDone(); };
});

/* =============================================================
   DELIVERY
   ============================================================= */

function resetDelivery() {
  $('tileSheet').classList.remove('on');
  $('socket').classList.remove('locked');
  $('cradleMark').textContent = '';
  $('scanState').textContent = 'Waiting for badge…';
  $('manualForm').classList.remove('on');
  document.querySelector('#v-identify .deliver-wrap')?.classList.remove('form-open');
  $('mfError').textContent = '';
  ['mfName', 'mfTitle', 'mfEmail'].forEach(id => { $(id).value = ''; });
}

$('manualBtn').onclick = () => {
  $('manualForm').classList.add('on');
  document.querySelector('#v-identify .deliver-wrap').classList.add('form-open');
  $('mfName').focus();
};
$('manualCancel').onclick = () => {
  $('manualForm').classList.remove('on');
  document.querySelector('#v-identify .deliver-wrap').classList.remove('form-open');
  $('mfError').textContent = '';
};

$('manualForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = $('mfEmail').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    $('mfError').textContent = 'Enter a valid email address.';
    return;
  }
  identified({ name: $('mfName').value.trim(), title: $('mfTitle').value.trim(), email });
});

/* Stands in for the NFC read. On the kiosk the reader fires this. */
$('simulateTap').onclick = () => {
  $('socket').classList.add('locked');
  $('cradleMark').textContent = '✓';
  $('scanState').textContent = 'Badge read · profile matched';
  scene.flare(1);
  // a real badge carries name, job title and email; the sim supplies a title
  setTimeout(() => identified({ name: '', title: 'Head of Underwriting', email: 'the address on your badge' }), 900);
};

/* Identity in hand: build the report, then show it. */
function identified({ name, email, title }) {
  S.recipient = { name, email, title };
  if (title) {
    const i = ROLES.findIndex(r => r.match.some(m => title.toLowerCase().includes(m)));
    S.role = i >= 0 ? i : null;
  }
  revealResults();
}

function showDone() {
  const r = S.recipient || {};
  $('doneName').textContent = r.name ? `, ${r.name.split(/\s+/)[0]}` : '';
  $('doneEmail').textContent = r.email || 'the address on your badge';
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
  if (S.view === 'attract' && (e.key === 'Enter' || e.key === ' ')) return start();
  if (S.view === 'explore') return exploreKeys(e);
  if (S.view === 'diag' && /^[1-5]$/.test(e.key) && !typing()) return answer(Number(e.key) - 1);
  if (S.view === 'wrap' && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    if (S.beat < 3) setBeat(S.beat + 1); else showDone();
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
function fitFrame() {
  const stage = $('stage');
  const frame = $('frame');
  if (!stage || !frame || !stage.clientWidth) return;
  frame.style.setProperty('--k', stage.clientWidth / 1920);
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

renderProgress();
renderPool(POOLS[0].id);
paintDots(-1);
$('backToFramework').addEventListener('click', () => scene.clearHex());
$('beginDiagOv').addEventListener('click', startDiagnostic);
S.read = new Set();
$('seenCount').textContent = '0';
show('attract');
bumpIdle();
