/* =============================================================
   APPLICATION — kiosk state machine
   attract → sector → explore → diagnostic(18) → wrapped(5) → delivery → done
   ============================================================= */

import { HiveScene } from './scene.js';
import {
  POOLS, POOL, ORDER, QUESTIONS, MAX_POOL_SCORE, BANDS, bandOf, BAND_COPY,
  classifyArchetype, SECTORS, BENCHMARK_STATUS, ROLES, ROLE_DEFAULT, CASES,
  forecast, FORECAST_LINES
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
  sector: SECTORS[0],
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

const VIEWS = { attract: 'v-attract', sector: 'v-sector', explore: 'v-explore', diag: 'v-diag', wrap: 'v-wrap', deliver: 'v-deliver', done: 'v-done' };
const SCENE_STATE = { attract: 'attract', sector: 'sector', explore: 'explore', diag: 'diagnostic', wrap: 'results', deliver: 'delivery', done: 'delivery' };
const BEAT_SCENE = i => (i === 0 ? 'results' : 'resultsQuiet');

function show(view) {
  S.view = view;
  Object.values(VIEWS).forEach(id => $(id).classList.remove('on'));
  $(VIEWS[view]).classList.add('on');

  if (view === 'sector') scene.setSlots(SECTORS.map(s => s.id));
  else scene.clearSlots();

  scene.setState(SCENE_STATE[view]);
}

/* =============================================================
   ATTRACT
   ============================================================= */

$('v-attract').addEventListener('pointerdown', () => start());

function start() { reset(false); show('sector'); }

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
  scene.face = 0;
  renderProgress();
  resetDelivery();
  if (toAttract) show('attract');
}

/* =============================================================
   SECTOR — labels ride on the 3D faces
   ============================================================= */

function buildSectorLabels() {
  const host = $('sectorLabels');
  host.innerHTML = '';
  SECTORS.forEach((s, i) => {
    const n = el('button', 'sector-label');
    n.dataset.slot = s.id;
    n.innerHTML = `<div class="idx">0${i + 1}</div><div class="nm">${s.name}</div><div class="sb">${s.sub}</div>`;
    n.onclick = () => chooseSector(s.id);
    host.appendChild(n);
  });
}

function positionSectorLabels() {
  const host = $('sectorLabels');
  SECTORS.forEach((s, i) => {
    const p = scene.project(i);
    const n = host.children[i];
    if (!n) return;
    n.style.left = `${p.x}px`;
    n.style.top = `${p.y}px`;
    n.style.opacity = p.ok ? '1' : '0';
  });
}

function chooseSector(id) {
  S.sector = SECTORS.find(x => x.id === id) || SECTORS[0];
  show('explore');
  renderPool(POOLS[scene.face].id);
}

scene.onPick = key => { if (S.view === 'sector') chooseSector(key); };

/* =============================================================
   EXPLORE — drag the wheel, read on the right
   ============================================================= */

function buildWheelPips() {
  const host = $('wheelPips');
  host.innerHTML = '';
  POOLS.forEach((p, i) => {
    const n = el('i');
    n.dataset.i = i;
    n.style.cursor = 'pointer';
    host.appendChild(n);
  });
  host.style.pointerEvents = 'auto';
  host.onclick = e => { const i = e.target.dataset?.i; if (i != null) scene.setFace(Number(i)); };
}

function renderPool(poolId) {
  const p = POOL[poolId];
  if (!p) return;
  S.read.add(poolId);

  $('prRule').style.background = p.hex;
  $('prVerb').textContent = `${p.verb} · Value pool 0${p.index + 1}`;
  $('prVerb').style.color = p.hex;
  $('prName').textContent = p.name;
  $('prBlurb').textContent = p.blurb;
  $('prChallenge').textContent = p.challenge;
  $('prApproach').textContent = p.approach;
  const ul = $('prValue');
  ul.innerHTML = '';
  p.value.forEach(v => ul.appendChild(el('li', null, v)));

  $('seenCount').textContent = S.read.size;
  [...$('wheelPips').children].forEach((n, i) => n.classList.toggle('on', i === p.index));

  const card = $('poolRead');
  card.classList.remove('swap');
  void card.offsetWidth;
  card.classList.add('swap');
}

scene.onFace = (i, poolId) => { if (S.view === 'explore') renderPool(poolId); };
scene.onFrame = () => { if (S.view === 'sector') positionSectorLabels(); };

$('beginDiag').onclick = () => { S.qi = 0; show('diag'); renderQuestion(); };

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

function finish() {
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
  let out = `Your strongest pool is ${POOL[top].name} — ${BAND_COPY[top][tb].read.toLowerCase().replace(/\.$/, '')}. `;
  out += `Your binding constraint is ${POOL[low].name}: ${BAND_COPY[low][lb].read.toLowerCase().replace(/\.$/, '')}. `;
  out += BAND_COPY[low][lb].move;
  if (notes.length) out += ` You also told us: “${notes[0][1].trim().replace(/\s+/g, ' ').slice(0, 180)}” — carried into your report.`;
  return out;
}

function buildWrapped() {
  const arch = classifyArchetype(S.scores);
  $('archName').textContent = arch.name;
  $('archTag').textContent = arch.tag;
  $('archBody').innerHTML = `${arch.body}<br><br>${composeNarrative()}`;
  $('archRisk').textContent = arch.risk;

  const pips = [0, 1, 2, 3, 4].map(i => `<i data-pip="${i}"></i>`).join('');
  document.querySelectorAll('.beat-pips').forEach(n => { n.innerHTML = pips; });

  /* peer benchmark */
  $('benchNote').innerHTML = `${S.sector.name}<br>${BENCHMARK_STATUS}`;
  const list = $('benchList');
  list.innerHTML = '';
  [...ORDER].sort((a, b) => S.scores[b] - S.scores[a]).forEach(id => {
    const p = POOL[id], sc = S.scores[id], med = S.sector.median[id], d = sc - med;
    const row = el('div', 'bench-row');
    row.innerHTML = `
      <div><div class="nm">${p.name}</div><div class="bd">${BANDS[bandOf(sc)]}</div></div>
      <div class="track">
        <div class="fill" style="background:${p.hex}"></div>
        <div class="peer" style="left:${(med / MAX_POOL_SCORE) * 100}%"></div>
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
    grid.appendChild(d);
  });

  buildRoleBeat();
  buildCase();
}

/* ---- beat 4: pick your role, see it transform ---- */

function buildRoleBeat() {
  const host = $('roleChips');
  host.innerHTML = '';
  ROLES.forEach((r, i) => {
    const b = el('button', 'role-chip', r.from);
    b.onclick = () => selectRole(i);
    host.appendChild(b);
  });
  paintRole(S.role);
}

function selectRole(i) {
  S.role = i;
  [...$('roleChips').children].forEach((n, k) => n.classList.toggle('on', k === i));
  paintRole(i);
}

function paintRole(i) {
  const r = (i == null) ? ROLE_DEFAULT : ROLES[i];
  $('roleFrom').textContent = r.from;
  $('roleTo').textContent = r.to;
  $('roleChange').textContent = r.change;
}

/* ---- beat 5: proof ---- */

function pickCase() {
  const ranked = [...ORDER].sort((a, b) => S.scores[a] - S.scores[b]);
  const weakest = ranked[0];
  let pendingFor = null, chosen = weakest;
  if (CASES[weakest].pending) {
    pendingFor = weakest;
    chosen = ranked.find(id => !CASES[id].pending) || weakest;
  }
  return { poolId: chosen, c: CASES[chosen], pendingFor };
}

function buildCase() {
  const { poolId, c, pendingFor } = pickCase();
  const p = POOL[poolId];
  $('caseFor').textContent = p.name;
  $('caseFor').style.color = p.hex;

  const g = $('caseGrid');
  g.innerHTML = '';

  const left = el('div', 'case-meta');
  left.innerHTML = `
    <div class="client">${c.client}</div>
    <div class="detail">${c.detail}</div>
    <div class="ttl">${c.title}</div>
    <div class="case-block"><h4>The challenge</h4><p>${c.challenge}</p></div>
    <div class="case-block"><h4>The approach</h4><p>${c.approach}</p></div>`;
  g.appendChild(left);

  const right = el('div');
  right.innerHTML = `
    <h4 style="font-family:var(--mono);font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--fg-3);margin-bottom:6px;">The results</h4>
    <ul class="results-list">${c.results.map((r, i) => `<li><span class="rk">0${i + 1}</span>${r}</li>`).join('')}</ul>`;

  const flags = [];
  if (c.substitute) flags.push(`<b>Content flag</b><br>${c.note}`);
  if (pendingFor) flags.push(`<b>Content pending · ${POOL[pendingFor].name}</b><br>${CASES[pendingFor].note}`);
  if (flags.length) right.appendChild(el('div', 'pending-note', flags.join('<br><br>')));
  g.appendChild(right);
}

/* ---- beats ---- */

function setBeat(i) {
  S.beat = i;
  [1, 2, 3, 4, 5].forEach(n => $('beat' + n).classList.toggle('on', n === i + 1));
  document.querySelectorAll('.beat-pips').forEach(nav => {
    [...nav.querySelectorAll('i')].forEach((pip, k) => pip.classList.toggle('on', k <= i));
  });
  scene.setState(BEAT_SCENE(i));
  scene.flare(i === 0 ? 1 : 0.3);
}

document.querySelectorAll('[data-next]').forEach(b => {
  b.onclick = () => { if (S.beat < 4) setBeat(S.beat + 1); else show('deliver'); };
});

/* =============================================================
   DELIVERY
   ============================================================= */

function resetDelivery() {
  $('socket').classList.remove('locked');
  $('cradle').textContent = 'NFC';
  $('scanState').textContent = 'Waiting for badge…';
  $('manualForm').classList.remove('on');
  $('mfError').textContent = '';
  ['mfName', 'mfTitle', 'mfEmail'].forEach(id => { $(id).value = ''; });
}

$('manualBtn').onclick = () => {
  $('manualForm').classList.add('on');
  $('mfName').focus();
};
$('manualCancel').onclick = () => {
  $('manualForm').classList.remove('on');
  $('mfError').textContent = '';
};

$('manualForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = $('mfEmail').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    $('mfError').textContent = 'Enter a valid email address.';
    return;
  }
  const name = $('mfName').value.trim();
  const title = $('mfTitle').value.trim();
  if (title) {
    const i = ROLES.findIndex(r => r.match.some(m => title.toLowerCase().includes(m)));
    if (i >= 0) S.role = i;
  }
  dispatch({ name, email });
});

/* Stands in for the NFC read. On the kiosk the reader fires this. */
$('simulateTap').onclick = () => {
  $('socket').classList.add('locked');
  $('cradle').textContent = '✓';
  $('scanState').textContent = 'Badge read · profile matched';
  scene.flare(1);
  setTimeout(() => dispatch({ name: '', email: 'the address on your badge' }), 1000);
};

function dispatch({ name, email }) {
  S.recipient = { name, email };
  $('doneName').textContent = name ? `, ${name.split(/\s+/)[0]}` : '';
  $('doneEmail').textContent = email;
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
  if (S.view === 'attract' && (e.key === 'Enter' || e.key === ' ')) return start();
  if (S.view === 'sector' && /^[1-4]$/.test(e.key)) return chooseSector(SECTORS[Number(e.key) - 1].id);
  if (S.view === 'explore') {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return scene.nextFace(1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return scene.nextFace(-1);
  }
  if (S.view === 'diag' && /^[1-5]$/.test(e.key) && !typing()) return answer(Number(e.key) - 1);
  if (S.view === 'wrap' && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    if (S.beat < 4) setBeat(S.beat + 1); else show('deliver');
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

buildSectorLabels();
buildWheelPips();
renderProgress();
renderPool(POOLS[0].id);
S.read = new Set();
$('seenCount').textContent = '0';
show('attract');
bumpIdle();
