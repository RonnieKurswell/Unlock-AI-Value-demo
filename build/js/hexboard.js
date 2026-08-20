/* =============================================================
   VALUE POOL BOARD — wiring only

   The interaction lives in hex-carousel.js and is used as-is: the revolve,
   the position-solved-through-the-roll, the half-turn fix and the swipe
   handling are all its business. Everything below just supplies the six
   items and paints the detail column on select.

   Ordering matters: sectors are laid out at index x 60 degrees, so the pools
   are sorted by their canonical `edge` to put each one on the same edge it
   occupies everywhere else in the kiosk.
   ============================================================= */

import * as THREE from 'three';
import { POOLS } from './data.js';
import { createHexCarousel } from './hex-carousel.js';

const $ = id => document.getElementById(id);

const pools = [...POOLS].sort((a, b) => a.edge - b.edge);

const items = pools.map(p => ({
  title: p.name,
  verb: p.verb.toUpperCase(),
  accent: p.color,
  pool: p
}));

/* ---------- detail column ---------- */
const detail = $('detail');
const hint = $('hint');

function openDetail(pool) {
  document.documentElement.style.setProperty('--accent', pool.hex);
  $('dVerb').textContent = pool.verb;
  $('dName').textContent = pool.name;
  $('dBlurb').textContent = pool.blurb;

  const facts = $('dFacts');
  facts.replaceChildren();
  for (const f of pool.facts) {
    const li = document.createElement('li');
    const tick = document.createElement('span');
    tick.className = 'tick';
    const text = document.createElement('span');
    text.textContent = f;
    li.append(tick, text);
    facts.append(li);
  }

  detail.dataset.open = '1';
  detail.setAttribute('aria-hidden', 'false');
  hint.hidden = true;
}

function closeDetail() {
  delete detail.dataset.open;
  detail.setAttribute('aria-hidden', 'true');
  hint.hidden = false;
}

/* ---------- board ---------- */
/* Labels are canvas textures, so they bake whatever face is resolved at build
   time. Waiting for the fonts means they bake in Geist rather than a fallback. */
await document.fonts.ready;

const board = createHexCarousel({
  canvas: $('board'),
  items,
  // Leaves the left 38% clear for the detail column.
  freeWidth: 0.62,
  fontFamily: "'Geist', 'Inter', 'Helvetica Neue', sans-serif",
  onSelect: (i, item) => openDetail(item.pool),
  onDeselect: closeDetail
});

/* The module's renderer owns an opaque canvas, so the page's CSS ground would
   sit behind it unseen — the board would read as flat black. Painting the same
   ground into the scene gives it back without touching the module. */
function groundTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(154, 102, 0, 154, 102, 470);
  g.addColorStop(0, '#0D1A2B');
  g.addColorStop(0.62, '#04070C');
  g.addColorStop(1, '#02040A');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
board.scene.background = groundTexture();

// Exposed for the deterministic step() check.
window.__board = board;
