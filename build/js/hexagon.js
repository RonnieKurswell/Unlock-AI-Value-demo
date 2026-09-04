/* =============================================================
   THE FRAMEWORK HEXAGON — SVG, not WebGL.

   Six trapezoid wedges around an empty centre. Figma node 287:725 in the V4
   file builds it as six mask groups, each a vector path over a texture; this
   is the same construction: one shared path, six 60-degree rotations, each
   clipping that segment's exported texture.

   Every number below is read from the file rather than eyeballed — the wedge
   path is the node's own `vectorPaths[0].data`, and each segment's matrix is
   its vector's `absoluteTransform` with the frame origin (x=4140) subtracted.
   All six vectors returned the same path data, which is why there is one
   WEDGE constant and not six.

   Geometry is in frame pixels because #frame is a fixed 1920x1080 surface
   scaled by --k, so the viewBox and the page agree without any conversion.

   The labels are HTML, not SVG text: they get the build's own type tokens and
   stay real selectable text. See the note on the font in css/app.css.
   ============================================================= */

import { hexOrder } from './data.js';

const NS = 'http://www.w3.org/2000/svg';

/* Tungsten Medium, which the file sets these labels in, is a condensed face:
   its caps run about 0.72 of the width of Geist Medium at the same size. Geist
   has no condensed cut and the kiosk cannot fetch one, so the labels are
   squeezed on the x axis by that ratio. It is a real distortion of the letter
   shapes, and it is the closest this gets to the file without the font: at the
   design's own sizes and unsqueezed, the two long names run clean off their
   wedge. Delete this and the fit will simply pick smaller sizes. */
const SQUEEZE = 0.72;

/* The wedge, in its own 189.383 x 313.909 space. Short edge inboard, long edge
   outboard — six of these rotated 60 degrees apart make the ring. */
const WEDGE = 'M 0 109.2194384614298 L 0 204.65210016424004 ' +
              'L 189.38287353515625 313.9085998535156 ' +
              'L 189.38287353515625 0 L 0 109.2194384614298 Z';

/* Per pool: the wedge's transform, the texture's box, and where the two labels
   sit. `m` is an SVG matrix(a,b,c,d,e,f) built from Figma's absoluteTransform
   [[a,c,e],[b,d,f]]. `box` is the exported PNG's frame rect. Label positions
   are centres, with the rotation the file gives them. */
const SEG = {
  data: {
    m: [1, 0, 0, 1, 1053.3198, 362.2586],
    box: [1053.320, 362.259, 189.383, 313.909],
    name: [1195.6, 521.5, -90], verb: [1102.3, 521.5, -90],
    nameBox: [125.8, 25.2], verbBox: [156.9, 31.2]
  },
  strategy: {
    m: [0.5, -0.8660254, -0.8660254, -0.5, 1143.1274, 514.9645],
    box: [871.275, 194.000, 366.544, 320.965],
    name: [1078.2, 317.9, -30.48], verb: [1033.6, 397.3, -30],
    nameBox: [175.3, 60.1], verbBox: [156.9, 31.2]
  },
  trust: {
    m: [-0.5, -0.8660254, 0.8660254, -0.5, 776.7319, 514.9662],
    box: [682.040, 194.002, 366.544, 320.965],
    name: [841.4, 318.0, 29.4], verb: [890.9, 395.7, 30],
    nameBox: [103.1, 25.2], verbBox: [156.9, 31.2]
  },
  physical: {
    m: [-1, 0, 0, -1, 866.3828, 676.1665],
    box: [677.000, 362.258, 189.383, 313.909],
    name: [724.6, 521.5, 90], verb: [813.7, 521.5, 90],
    nameBox: [125.3, 25.2], verbBox: [156.9, 31.2]
  },
  legacy: {
    m: [-0.5, 0.8660254, 0.8660254, 0.5, 776.7319, 524.3653],
    box: [682.040, 524.365, 366.544, 320.965],
    name: [845.9, 714.9, -30], verb: [892.4, 647.9, -30],
    nameBox: [182.4, 49.2], verbBox: [156.9, 31.2]
  },
  process: {
    m: [0.5, 0.8660254, -0.8660254, 0.5, 1143.1274, 524.3640],
    box: [871.275, 524.364, 366.544, 320.965],
    name: [1073.4, 720.1, 29.4], verb: [1033.6, 647.9, 30],
    nameBox: [122.6, 25.2], verbBox: [156.9, 31.2]
  }
};

const svgEl = (tag, attrs) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};

export class Hexagon {
  constructor(host) {
    this.host = host;
    this.order = hexOrder();               // data, strategy, trust, physical, legacy, process
    this.selected = -1;
    this.seen = new Set();
    this.onSelect = null;
    this.onClear = null;
    this._build();
  }

  _build() {
    const svg = svgEl('svg', {
      id: 'hexSvg', viewBox: '0 0 1920 1080',
      xmlns: NS, 'aria-hidden': 'true', focusable: 'false'
    });
    const defs = svgEl('defs');
    svg.appendChild(defs);

    this.segs = [];
    this.order.forEach((pool, i) => {
      const s = SEG[pool.id];
      if (!s) return;
      const clipId = `hexclip-${pool.id}`;

      // One clip per segment: the wedge, placed by the file's own matrix.
      const clip = svgEl('clipPath', { id: clipId, clipPathUnits: 'userSpaceOnUse' });
      clip.appendChild(svgEl('path', { d: WEDGE, transform: `matrix(${s.m.join(' ')})` }));
      defs.appendChild(clip);

      const g = svgEl('g', { class: 'hex-seg', 'data-pool': pool.id });

      /* The texture is already masked in the export, so the clip is belt and
         braces — but it is what makes the edge vector rather than a 2x raster
         edge, which is the whole reason for doing this in SVG. */
      const img = svgEl('image', {
        href: `images/hex/seg-${pool.id}.png`,
        x: s.box[0], y: s.box[1], width: s.box[2], height: s.box[3],
        'clip-path': `url(#${clipId})`,
        preserveAspectRatio: 'none'
      });
      g.appendChild(img);

      /* A separate hit path. The clipped image would mostly work, but a
         transparent path is explicit about the target and gives the selected
         state something to stroke. */
      const hit = svgEl('path', {
        class: 'hex-hit', d: WEDGE,
        transform: `matrix(${s.m.join(' ')})`
      });
      g.appendChild(hit);

      svg.appendChild(g);
      this.segs.push(g);

      const tap = e => { e.preventDefault(); this.select(i); };
      hit.addEventListener('pointerdown', tap);
    });

    this.host.appendChild(svg);
    this.svg = svg;

    // Labels, as HTML over the artwork.
    const labels = document.createElement('div');
    labels.className = 'hex-labels';
    this.order.forEach(pool => {
      const s = SEG[pool.id];
      if (!s) return;
      /* The design breaks the long names onto two lines and data.js already
         carries those breaks, so use them rather than letting the box wrap
         wherever it lands. */
      const name = (pool.lines || [pool.title]).map(l => l.toUpperCase());
      labels.appendChild(this._label('hex-name', name, s.name, s.nameBox, 32.5, pool.id));
      labels.appendChild(this._label('hex-verb', [pool.verb.toUpperCase()], s.verb, s.verbBox, 24.3, pool.id));
    });
    const core = document.createElement('div');
    core.className = 'hex-core';
    core.innerHTML = 'Unlock<br>AI Value';
    labels.appendChild(core);
    this.host.appendChild(labels);
  }

  _label(cls, lines, [cx, cy, rot], [bw, bh], max, poolId) {
    const n = document.createElement('span');
    n.className = cls;
    /* One element per line. The fit tests each line's own ink rather than the
       whole block's: a two-line label's block corners sit out in the empty
       diagonal space, and testing those against the wedge held the type to
       well under half the size the design asks for. */
    for (const line of lines) {
      const b = document.createElement('b');
      b.textContent = line;
      n.appendChild(b);
    }
    n.style.left = `${cx}px`;
    n.style.top = `${cy}px`;
    n.style.width = `${bw}px`;
    n.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scaleX(${SQUEEZE})`;
    n.dataset.bw = bw; n.dataset.bh = bh; n.dataset.max = max; n.dataset.rot = rot;
    n.dataset.pool = poolId;
    return n;
  }

  /* One size for all six names, one for all six verbs — the largest that keeps
     every label inside the wedge it belongs to.
     ---
     The file sets these in Tungsten Medium: 32.47px for the names, 24.28px for
     the verbs, the same on all six. Tungsten is not licensed into this build,
     there is no webfont for it, and the kiosk runs offline, so they are Geist.
     Geist is not condensed, so the file's sizes overflow and something has to
     give.

     Three things were tried and the two failures are worth not repeating:

     - Fitting each label to the box the file gives it. Those boxes are sized
       to Tungsten's narrower ink, so Geist fitted to the same box is wider and
       the long names ran off the wedge into white space.
     - Fitting each one to the wedge's light and dark bands. It stayed inside,
       but sized every label on its own: 24px on the two vertical names against
       9px on the diagonal ones, because a label running tangentially barely
       eats into a radial band while one at 30 degrees to it eats a lot. It
       read as a bug. The design's uniformity is the point — and the file's own
       names straddle that band anyway, so the band was never the constraint.

     What is left is the wedge outline itself, tested with isPointInFill
     against the four corners of each label's real ink, and one size shared by
     all six. Once Tungsten is available this can go back to the file's two
     sizes and drop the fitting entirely. */
  fitLabels() {
    const probe = this.host.querySelector('.hex-name');
    /* Nothing is laid out while the explore view is hidden, so every
       measurement reads zero. Refuse to fit until the view is actually on
       screen; app.js calls this again when it is. */
    if (!probe || !probe.offsetWidth) return false;

    const range = document.createRange();
    const labels = [...this.host.querySelectorAll('.hex-name, .hex-verb')];

    /* Measure unrotated. getBoundingClientRect is post-transform, so on the
       labels the file rotates 90 degrees the returned box comes back with its
       width and height swapped against what is being fitted. */
    for (const n of labels) n.style.transform = 'translate(-50%, -50%)';

    /* Every line's ink box, in frame px, relative to the label's own centre.
       Measured with the transform stripped, so the x axis is unsqueezed and
       gets scaled here; the label is squeezed when it renders. */
    const inkLines = n => {
      const own = n.getBoundingClientRect();
      if (!own.width) return [];
      const k = (+n.dataset.bw) / own.width;      // screen px -> frame px
      const ocx = own.x + own.width / 2, ocy = own.y + own.height / 2;
      const out = [];
      for (const b of n.children) {
        range.selectNodeContents(b);
        const r = range.getBoundingClientRect();
        if (!r.width) continue;
        out.push({
          dx: (r.x + r.width / 2 - ocx) * k * SQUEEZE,
          dy: (r.y + r.height / 2 - ocy) * k,
          w: r.width * k * SQUEEZE,
          h: r.height * k
        });
      }
      return out;
    };

    // Inset a little so the glyphs do not sit hard against the bevel.
    const PAD = 5;
    /* The texture has two bands along the wedge's radial axis: light out to
       local x ~100, dark from there to the outer bevel at ~186 (measured off
       seg-data.png, the unrotated wedge). The names are white and the verbs
       #0C364F, so each only has contrast on its own band.

       The verbs are held to the light band, which costs them nothing. The
       names are NOT held to the dark one, and that is a deliberate, flagged
       compromise: "AI STRATEGY & ENGINEERING" and "AGENTIC LEGACY
       MODERNIZATION" are two lines of Geist in a slot drawn for condensed
       Tungsten, and confining their ink to an 85px band drags every name down
       to 9px. Left free they sit at 16.5px and read as designed, but part of
       those two spills onto the light band at about 2:1. Tungsten fixes it
       outright; a shorter label on the hexagon would too. Until then this is
       an open accessibility item, not a solved one. */
    const BAND = { name: [-1e4, 1e4], verb: [0, 99] };
    const inside = n => {
      const seg = this.svg.querySelector(`.hex-seg[data-pool="${n.dataset.pool}"] .hex-hit`);
      const inv = seg.getCTM().inverse();
      const cx = parseFloat(n.style.left), cy = parseFloat(n.style.top);
      const rot = (+n.dataset.rot) * Math.PI / 180;
      const cos = Math.cos(rot), sin = Math.sin(rot);
      const lines = inkLines(n);
      if (!lines.length) return false;
      const band = BAND[n.classList.contains('hex-name') ? 'name' : 'verb'];
      for (const m of lines) {
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          const lx = m.dx + sx * (m.w / 2 + PAD);
          const ly = m.dy + sy * (m.h / 2 + PAD);
          const p = this.svg.createSVGPoint();
          p.x = cx + lx * cos - ly * sin;
          p.y = cy + lx * sin + ly * cos;
          const local = p.matrixTransform(inv);
          if (local.x < band[0] || local.x > band[1]) return false;
          if (!seg.isPointInFill(local)) return false;
        }
      }
      return true;
    };

    const fitOne = n => {
      let size = +n.dataset.max;
      n.style.fontSize = `${size}px`;
      while (size > 9 && !inside(n)) {
        size -= 0.5;
        n.style.fontSize = `${size}px`;
      }
      return size;
    };

    const smallest = cls => Math.min(...labels.filter(n => n.classList.contains(cls)).map(fitOne));
    const nameSize = smallest('hex-name');
    const verbSize = smallest('hex-verb');

    for (const n of labels) {
      const size = n.classList.contains('hex-name') ? nameSize : verbSize;
      n.style.fontSize = `${size}px`;
      n.dataset.fitted = size;
      n.dataset.in = inside(n) ? 'y' : 'n';
    }

    for (const n of labels) {
      n.style.transform = `translate(-50%, -50%) rotate(${n.dataset.rot}deg) scaleX(${SQUEEZE})`;
    }
    return true;
  }

  /* ---- the same surface the WebGL board exposed ------------- */

  get hexSelected() { return this.selected; }
  get hexSeen() { return this.seen; }

  select(i) {
    const pool = this.order[i];
    if (!pool) return;
    this.selected = i;
    this.seen.add(i);
    this.segs.forEach((g, k) => g.classList.toggle('on', k === i));
    this.host.classList.add('picked');
    if (this.onSelect) this.onSelect(pool.id, i);
  }

  clear() {
    const had = this.selected >= 0;
    this.selected = -1;
    this.segs.forEach(g => g.classList.remove('on'));
    this.host.classList.remove('picked');
    if (had && this.onClear) this.onClear();
  }

  /* Forward only returns to the framework once every pool has been opened,
     matching what the board did: a back step is someone re-reading. */
  cycle(n) {
    const len = this.order.length;
    if (n > 0 && this.seen.size >= len) return this.clear();
    const cur = this.selected < 0 ? 0 : this.selected + n;
    this.select(((cur % len) + len) % len);
  }

  resetSeen() { this.seen.clear(); }
}
