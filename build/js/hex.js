/* =============================================================
   THE FRAMEWORK HEXAGON

   Ported from the Confluence US booth build (its src/hex.js) so both
   demos show the same object: a pointy-top hexagon of extruded, bevelled
   trapezoids — an outer band carrying the value pool names, an inner band
   carrying the verbs, and a metallic core plate reading UNLOCK AI VALUE.

   Labels are canvas textures on planes rather than geometry, which is why
   they stay crisp at kiosk scale and can run along each edge. Because they
   are rasterised, the hexagon must be built after document.fonts.ready or
   the textures bake in a fallback face.

   Pools arrive pre-ordered: index i sits on the edge whose mid-point is at
   i x 60 degrees, so 0 is the right edge and the ring runs anticlockwise.
   ============================================================= */

import * as THREE from '../vendor/three.module.js';

const DEG = Math.PI / 180;
export const R = 5;

const APOTHEM = Math.cos(30 * DEG);
const BANDS = {
  outer: { from: 1.0, to: 0.795, depth: 0.2, labelR: ((1.0 + 0.795) / 2) * APOTHEM },
  inner: { from: 0.735, to: 0.525, depth: 0.34, labelR: ((0.735 + 0.525) / 2) * APOTHEM }
};
const GAP = 0.032;   // fraction trimmed off each end of an edge, giving the seams
const BEVEL = 0.05;

export const PALETTE = {
  outer: 0x1e9cd7,
  outerDim: 0x0d4f70,
  inner: 0x1b2a63,
  innerDim: 0x111a3d,
  core: 0x0c1330
};

function edgePoint(theta, radius, u) {
  const a = (theta - 30) * DEG;
  const b = (theta + 30) * DEG;
  const v0 = new THREE.Vector2(Math.cos(a), Math.sin(a)).multiplyScalar(radius);
  const v1 = new THREE.Vector2(Math.cos(b), Math.sin(b)).multiplyScalar(radius);
  return v0.clone().lerp(v1, u);
}

function trapezoidShape(theta, from, to) {
  const p = [
    edgePoint(theta, R * from, GAP),
    edgePoint(theta, R * from, 1 - GAP),
    edgePoint(theta, R * to, 1 - GAP),
    edgePoint(theta, R * to, GAP)
  ];
  const s = new THREE.Shape();
  s.moveTo(p[0].x, p[0].y);
  for (let i = 1; i < p.length; i++) s.lineTo(p[i].x, p[i].y);
  s.closePath();
  return s;
}

function extrude(shape, depth) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: BEVEL,
    bevelSize: 0.045, bevelSegments: 3, curveSegments: 1
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** Parallel to its edge, never upside down. */
function labelRotation(theta) {
  let rot = theta - 90;
  while (rot > 90) rot -= 180;
  while (rot <= -90) rot += 180;
  return rot * DEG;
}

export function makeTextTexture(text, opts = {}) {
  const {
    width = 1024, height = 220, weight = 700, size = 92,
    tracking = 0, color = '#ffffff', lines = null,
    family = "'Geist', 'Inter', 'Helvetica Neue', Helvetica, sans-serif"
  } = opts;

  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const rows = lines || [text];
  const font = s => `${weight} ${s}px ${family}`;
  let fontSize = size;
  ctx.font = font(fontSize);
  const maxW = width * 0.92;
  const widest = () => Math.max(...rows.map(r => ctx.measureText(r).width + tracking * r.length));
  while (widest() > maxW && fontSize > 10) {
    fontSize -= 2;
    ctx.font = font(fontSize);
  }

  const lineH = fontSize * 1.16;
  const top = height / 2 - ((rows.length - 1) * lineH) / 2;
  rows.forEach((row, i) => {
    if (tracking) {
      const totalW = ctx.measureText(row).width + tracking * (row.length - 1);
      let x = width / 2 - totalW / 2;
      ctx.textAlign = 'left';
      for (const ch of row) {
        ctx.fillText(ch, x, top + i * lineH);
        x += ctx.measureText(ch).width + tracking;
      }
      ctx.textAlign = 'center';
    } else {
      ctx.fillText(row, width / 2, top + i * lineH);
    }
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function labelMesh(text, theta, radiusFactor, planeW, planeH, texOpts) {
  const mat = new THREE.MeshBasicMaterial({
    map: makeTextTexture(text, texOpts),
    transparent: true, depthWrite: false, toneMapped: false
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(planeW, planeH), mat);
  const a = theta * DEG;
  mesh.position.set(Math.cos(a) * R * radiusFactor, Math.sin(a) * R * radiusFactor, 0);
  mesh.rotation.z = labelRotation(theta);
  mesh.renderOrder = 5;
  return mesh;
}

function wrapTitle(title) {
  const words = title.split(' ');
  if (words.length < 3) return [title];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

/**
 * @param {Array<{id:string,title:string,verb:string,accent:number}>} pools
 *        ordered so index i owns the edge at i x 60 degrees
 */
export function buildHexagon(pools) {
  const group = new THREE.Group();
  const segments = [];

  pools.forEach((pool, i) => {
    const theta = i * 60;
    const holder = new THREE.Group();
    holder.userData.poolIndex = i;

    const outerMat = new THREE.MeshStandardMaterial({
      color: PALETTE.outer, roughness: 0.30, metalness: 0.42,
      emissive: new THREE.Color(pool.accent), emissiveIntensity: 0.16
    });
    const innerMat = new THREE.MeshStandardMaterial({
      color: PALETTE.inner, roughness: 0.40, metalness: 0.52,
      emissive: new THREE.Color(pool.accent), emissiveIntensity: 0.05
    });

    const outerMesh = new THREE.Mesh(
      extrude(trapezoidShape(theta, BANDS.outer.from, BANDS.outer.to), BANDS.outer.depth), outerMat);
    const innerMesh = new THREE.Mesh(
      extrude(trapezoidShape(theta, BANDS.inner.from, BANDS.inner.to), BANDS.inner.depth), innerMat);

    // rim that traces the outer edge and lights on hover / select
    const rimMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(pool.accent), transparent: true, opacity: 0, toneMapped: false
    });
    const rimMesh = new THREE.Mesh(
      extrude(trapezoidShape(theta, BANDS.outer.from, BANDS.outer.from - 0.028), BANDS.outer.depth * 1.05), rimMat);

    const titleLabel = labelMesh(pool.title, theta, BANDS.outer.labelR, R * 0.8, R * 0.16,
      { lines: wrapTitle(pool.title), size: 96, weight: 500, width: 1024, height: 205 });
    const verbLabel = labelMesh(pool.verb.toUpperCase(), theta, BANDS.inner.labelR, R * 0.52, R * 0.095,
      { size: 78, weight: 600, tracking: 12, width: 1024, height: 160, color: '#dfefff',
        family: "'Inter', 'Helvetica Neue', Helvetica, sans-serif" });
    titleLabel.position.z = BANDS.outer.depth / 2 + BEVEL + 0.02;
    verbLabel.position.z = BANDS.inner.depth / 2 + BEVEL + 0.02;

    holder.add(outerMesh, innerMesh, rimMesh, titleLabel, verbLabel);
    group.add(holder);

    /* Colour ladder per segment. The booth build kept every band the same
       navy and let only the selection take accent; here each pool owns its
       hue at rest so the six are distinguishable before you touch anything. */
    const acc = new THREE.Color(pool.accent);
    const shade = f => acc.clone().multiplyScalar(f);

    segments.push({
      index: i, id: pool.id, theta,
      accentColor: acc,
      room: pool.room,
      deepOuter: shade(0.13), restOuter: shade(0.42), hotOuter: shade(1.0),
      deepInner: shade(0.06), restInner: shade(0.18), hotInner: shade(0.55),
      /* The diagnostic charges a grey board up: each segment lerps from these
         neutrals to its own colour as that pool's questions are answered. */
      greyOuter: new THREE.Color(0x3E4859),
      greyInner: new THREE.Color(0x272F3C),
      fill: 0, fillTarget: 0, charge: 0,
      holder, rimMesh,
      materials: [outerMat, innerMat],
      labels: [titleLabel, verbLabel],
      hitTargets: [outerMesh, innerMesh, rimMesh],
      lift: 0, targetLift: 0,
      glow: 0, targetGlow: 0,
      dim: 1, targetDim: 1
    });
  });

  // core plate
  const coreShape = new THREE.Shape();
  for (let v = 0; v < 6; v++) {
    const a = (30 + v * 60) * DEG;
    const x = Math.cos(a) * R * 0.5, y = Math.sin(a) * R * 0.5;
    v === 0 ? coreShape.moveTo(x, y) : coreShape.lineTo(x, y);
  }
  coreShape.closePath();

  const corePlate = new THREE.Mesh(extrude(coreShape, 0.18), new THREE.MeshStandardMaterial({
    color: PALETTE.core, roughness: 0.25, metalness: 0.75,
    emissive: new THREE.Color(0x0a1b45), emissiveIntensity: 0.5
  }));
  corePlate.position.z = -0.02;

  const coreTitle = new THREE.Mesh(
    new THREE.PlaneGeometry(R * 0.82, R * 0.34),
    new THREE.MeshBasicMaterial({
      map: makeTextTexture('', { lines: ['UNLOCK', 'AI VALUE'], size: 128, weight: 500, width: 1024, height: 420, tracking: 4 }),
      transparent: true, depthWrite: false, toneMapped: false
    })
  );
  coreTitle.position.z = 0.14;
  coreTitle.renderOrder = 6;

  /* Ripple: expands out of the core each time a segment is chosen, so the
     change registers as an event rather than a state swap. */
  const ripple = new THREE.Mesh(
    new THREE.RingGeometry(R * 0.5, R * 0.54, 6, 1),
    new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false
    })
  );
  ripple.rotation.z = 30 * DEG;
  ripple.position.z = 0.2;
  ripple.renderOrder = 7;

  const core = new THREE.Group();
  core.add(corePlate, coreTitle, ripple);
  group.add(core);

  return { group, segments, core, coreTitle, ripple };
}
