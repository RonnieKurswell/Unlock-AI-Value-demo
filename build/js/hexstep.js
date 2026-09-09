/* =============================================================
   HEX STEPPER — which question you are on, as a hexagon.

   Six rounded capsules, one per question, arranged as the six edges of a
   pointy-top hexagon with the question number in the middle. Answered
   questions are filled, the rest are pale.

   Built rather than imported: it is regular geometry, so as SVG it stays
   crisp at any --k, takes the build's own colour tokens, and the fill can
   animate. Nothing to export and keep in sync.

   The fill runs clockwise from the UPPER-RIGHT edge, because that is where the
   framework hexagon puts AI Strategy — question one. Read the label positions
   in hexagon.js against the centre (x 960, y 519) and the six sit clockwise
   from the top right as strategy, data, process, legacy, physical, trust,
   which is already the order POOLS declares and therefore the order the
   questions are asked in. The stepper used to start at the left edge, so
   question one lit the wrong side of the hexagon and the two never agreed.
   Each capsule is a thick round-capped line rather than a path, which is what
   gives the stadium shape for free.
   ============================================================= */

const NS = 'http://www.w3.org/2000/svg';

const R = 26;          // centre to vertex
const W = 9;           // capsule thickness
const INSET = 6;       // pulled back from each vertex, so the caps do not meet

/* Each edge as its two vertex angles, in fill order. Angles are measured with
   y pointing up, so 90 is the top vertex. */
const EDGES = [
  [30, 90],     // upper-right  — AI Strategy & Engineering
  [330, 30],    // right        — Data for AI
  [270, 330],   // lower-right  — Process AI
  [210, 270],   // lower-left   — Agentic Legacy Modernization
  [150, 210],   // left         — Physical AI
  [90, 150]     // upper-left   — AI Trust
];

const svgEl = (tag, attrs) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};

const at = a => [R * Math.cos(a * Math.PI / 180), -R * Math.sin(a * Math.PI / 180)];

export class HexStep {
  constructor(host) {
    this.host = host;
    this._build();
  }

  _build() {
    const halfW = R * Math.cos(Math.PI / 6) + W / 2;
    const halfH = R + W / 2;
    const svg = svgEl('svg', {
      class: 'hexstep',
      viewBox: `${-halfW - 1} ${-halfH - 1} ${(halfW + 1) * 2} ${(halfH + 1) * 2}`,
      'aria-hidden': 'true', focusable: 'false'
    });

    this.segs = EDGES.map(([a1, a2]) => {
      const [x1, y1] = at(a1), [x2, y2] = at(a2);
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len;
      const seg = svgEl('line', {
        class: 'hs-seg',
        x1: (x1 + ux * INSET).toFixed(2), y1: (y1 + uy * INSET).toFixed(2),
        x2: (x2 - ux * INSET).toFixed(2), y2: (y2 - uy * INSET).toFixed(2),
        'stroke-width': W, 'stroke-linecap': 'round'
      });
      svg.appendChild(seg);
      return seg;
    });

    /* dominant-baseline is unreliable across engines, so the number is nudged
       with dy instead — 0.35em puts a cap-height digit on the centre. */
    this.num = svgEl('text', { class: 'hs-num', x: 0, y: 0, dy: '0.35em', 'text-anchor': 'middle' });
    svg.appendChild(this.num);

    this.host.appendChild(svg);
    this.svg = svg;
  }

  /** `index` is 0-based; segments up to and including it read as done. */
  set(index, total) {
    this.segs.forEach((s, i) => {
      s.classList.toggle('on', i <= index);
      // Anything past the question count is not a step at all on this build.
      s.classList.toggle('off', total != null && i >= total);
    });
    this.num.textContent = String(index + 1);
  }
}
