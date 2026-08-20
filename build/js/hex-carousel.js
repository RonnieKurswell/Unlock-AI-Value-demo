/**
 * hex-carousel — a touchable hexagon board with a damped revolve.
 *
 * Lifted out of the Infosys "Unlock AI Value" demo so the same interaction can
 * be reused. Content-free: you pass in labels and accent colours, it gives you
 * the board and the behaviour.
 *
 * The interaction, in one paragraph: six sectors sit on a pointy-top hexagon.
 * Tap one and the whole board translates, rolls and zooms so that sector lands
 * square in the middle of the free space, while the other five fade out. Tap
 * outside to go back. Swipe horizontally to move to the next or previous
 * sector. Every move is exponentially damped rather than tweened, so an
 * interruption mid-flight is picked up smoothly instead of fighting.
 *
 * The two things that are easy to get wrong, and why this file exists:
 *
 *  1. SOLVING POSITION AGAINST THE ROLL. The board is one transform. If you
 *     roll it and then translate it, the sector lands off-centre, because the
 *     roll has already moved the point you were aiming at. The target position
 *     has to be solved through the rotation (see applyTargets).
 *
 *  2. THE HALF-TURN AMBIGUITY. Squaring a sector up leaves two valid rolls,
 *     180 degrees apart. Taking the shorter one lands alternate sectors
 *     mirrored, so the inner and outer bands swap top for bottom as you swipe
 *     and the object appears to jump. This always picks the half-turn that
 *     points the sector the same way, and counter-rotates the labels by the
 *     same amount so the text stays upright while the geometry turns under it.
 *
 * Usage:
 *   import { createHexCarousel } from './hex-carousel.js';
 *   const board = createHexCarousel({
 *     canvas: document.getElementById('stage'),
 *     items: [{ title: 'Motor', verb: 'PROTECT', accent: 0x35d0f5 }, ...six],
 *     onSelect: (i, item) => {...},
 *     onDeselect: () => {...},
 *   });
 *
 * Needs three.js (`npm i three`). No other dependency.
 */

import * as THREE from 'three';

const DEG = Math.PI / 180;

const DEFAULTS = {
  // Board geometry. `bands` are circumradius factors: 1.0 is the outer rim.
  radius: 5,
  bands: {
    outer: { from: 1.0, to: 0.795, depth: 0.2 },
    inner: { from: 0.735, to: 0.525, depth: 0.34 },
  },
  gap: 0.032, // fraction trimmed off each end of a band, making the seams
  bevel: 0.05,

  // Motion
  focusScale: 2.1, // how far it zooms into an open sector
  lambda: 4.2, // damping rate for position / scale / roll
  slowLambda: 3.4, // damping for tilt
  fadeLambda: 9, // how fast the other sectors clear out

  // Input
  swipeMinPx: 70, // horizontal travel before a drag counts as a swipe
  swipeRatio: 1.5, // how much more horizontal than vertical it has to be
  tapMaxPx: 14, // movement above this is a drag, not a tap

  // Layout: the fraction of the viewport width the open sector is centred in.
  // 1 uses the whole width; 0.62 leaves the left 38% clear for a copy column.
  freeWidth: 1,

  fontFamily: 'system-ui, sans-serif',
  titleWeight: 500,
  verbWeight: 600,
  palette: { outer: 0x16406b, inner: 0x101b3f, core: 0x0c1330 },
};

const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));

// Same angle, nearest full turn to `ref`. Without this, the extra half-turn in
// the orientation fix can become a 300-degree spin between two sectors.
const nearestTurn = (angle, ref) => {
  const TAU = Math.PI * 2;
  return angle + Math.round((ref - angle) / TAU) * TAU;
};

// Keeps a label parallel to its own edge and never upside down.
const labelRotation = (theta) => {
  let r = theta - 90;
  while (r > 90) r -= 180;
  while (r <= -90) r += 180;
  return r * DEG;
};

function makeTextTexture(lines, opts) {
  const { width = 1024, height = 220, weight, size, tracking = 0, color, family } = opts;
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const font = (s) => `${weight} ${s}px ${family}`;
  let fontSize = size;
  ctx.font = font(fontSize);
  const maxW = width * 0.92;
  const widest = () => Math.max(...lines.map((r) => ctx.measureText(r).width + tracking * r.length));
  while (widest() > maxW && fontSize > 10) {
    fontSize -= 2;
    ctx.font = font(fontSize);
  }

  const lineH = fontSize * 1.16;
  const top = height / 2 - ((lines.length - 1) * lineH) / 2;
  lines.forEach((row, i) => {
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
  return tex;
}

const wrapTitle = (title) => {
  const words = title.split(' ');
  if (words.length < 3) return [title];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
};

export function createHexCarousel(userOpts) {
  const o = { ...DEFAULTS, ...userOpts, bands: { ...DEFAULTS.bands, ...(userOpts.bands || {}) } };
  const { canvas, items } = o;
  if (!canvas) throw new Error('hex-carousel: `canvas` is required');
  if (!items || items.length < 2) throw new Error('hex-carousel: needs at least 2 items');

  const N = items.length;
  const STEP = 360 / N; // works for any N, not just 6
  const R = o.radius;

  /* ---------- scene ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  camera.position.set(0, 0, 16);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(-6, 9, 12);
  scene.add(key);

  const world = new THREE.Group();
  scene.add(world);

  /* ---------- geometry ---------- */
  const edgePoint = (theta, radius, u) => {
    const a = (theta - STEP / 2) * DEG;
    const b = (theta + STEP / 2) * DEG;
    const v0 = new THREE.Vector2(Math.cos(a), Math.sin(a)).multiplyScalar(radius);
    const v1 = new THREE.Vector2(Math.cos(b), Math.sin(b)).multiplyScalar(radius);
    return v0.lerp(v1, u);
  };

  const trapezoid = (theta, from, to) => {
    const pts = [
      edgePoint(theta, R * from, o.gap),
      edgePoint(theta, R * from, 1 - o.gap),
      edgePoint(theta, R * to, 1 - o.gap),
      edgePoint(theta, R * to, o.gap),
    ];
    const s = new THREE.Shape();
    pts.forEach((p, i) => (i ? s.lineTo(p.x, p.y) : s.moveTo(p.x, p.y)));
    s.closePath();
    return s;
  };

  const extrude = (shape, depth) => {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: o.bevel,
      bevelSize: 0.045,
      bevelSegments: 3,
      curveSegments: 1,
    });
    g.translate(0, 0, -depth / 2);
    return g;
  };

  const APOTHEM = Math.cos((STEP / 2) * DEG);
  const labelR = {
    outer: ((o.bands.outer.from + o.bands.outer.to) / 2) * APOTHEM,
    inner: ((o.bands.inner.from + o.bands.inner.to) / 2) * APOTHEM,
  };

  const labelMesh = (lines, theta, radiusFactor, planeW, planeH, texOpts) => {
    const mat = new THREE.MeshBasicMaterial({
      map: makeTextTexture(lines, { ...texOpts, family: o.fontFamily }),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(planeW, planeH), mat);
    const a = theta * DEG;
    mesh.position.set(Math.cos(a) * R * radiusFactor, Math.sin(a) * R * radiusFactor, 0);
    mesh.rotation.z = labelRotation(theta);
    // Kept so the focus transform can counter-rotate the label against the
    // extra half-turn of board roll.
    mesh.userData.baseRot = mesh.rotation.z;
    mesh.renderOrder = 5;
    return mesh;
  };

  const sectors = items.map((item, i) => {
    const theta = i * STEP;
    const holder = new THREE.Group();
    holder.userData.index = i;
    const accent = new THREE.Color(item.accent ?? 0x4f9dff);

    const outerMat = new THREE.MeshStandardMaterial({
      color: o.palette.outer, roughness: 0.34, metalness: 0.5,
      emissive: accent.clone(), emissiveIntensity: 0.06, transparent: true,
    });
    const innerMat = new THREE.MeshStandardMaterial({
      color: o.palette.inner, roughness: 0.42, metalness: 0.62,
      emissive: accent.clone(), emissiveIntensity: 0.015, transparent: true,
    });

    const outerMesh = new THREE.Mesh(
      extrude(trapezoid(theta, o.bands.outer.from, o.bands.outer.to), o.bands.outer.depth), outerMat);
    const innerMesh = new THREE.Mesh(
      extrude(trapezoid(theta, o.bands.inner.from, o.bands.inner.to), o.bands.inner.depth), innerMat);

    const rimMat = new THREE.MeshBasicMaterial({
      color: accent.clone(), transparent: true, opacity: 0, toneMapped: false,
    });
    const rimMesh = new THREE.Mesh(
      extrude(trapezoid(theta, o.bands.outer.from, o.bands.outer.from - 0.028), o.bands.outer.depth * 1.05), rimMat);

    const titleLabel = labelMesh(wrapTitle(item.title), theta, labelR.outer, R * 0.8, R * 0.16,
      { size: 96, weight: o.titleWeight, width: 1024, height: 205, color: '#ffffff' });
    titleLabel.position.z = o.bands.outer.depth / 2 + o.bevel + 0.02;

    const labels = [titleLabel];
    let verbLabel = null;
    if (item.verb) {
      verbLabel = labelMesh([item.verb], theta, labelR.inner, R * 0.52, R * 0.095,
        { size: 78, weight: o.verbWeight, tracking: 12, width: 1024, height: 160, color: '#dfefff' });
      verbLabel.position.z = o.bands.inner.depth / 2 + o.bevel + 0.02;
      labels.push(verbLabel);
    }

    holder.add(outerMesh, innerMesh, rimMesh, ...labels);
    world.add(holder);

    return {
      index: i, item, theta, accent, holder, titleLabel, verbLabel, labels,
      materials: [outerMat, innerMat], rimMesh,
      hitTargets: [outerMesh, innerMesh, rimMesh],
      lift: 0, glow: 0, fade: 1,
      targetLift: 0, targetGlow: 0, targetFade: 1,
    };
  });

  // Centre plate
  const coreShape = new THREE.Shape();
  for (let v = 0; v < N; v++) {
    const a = (STEP / 2 + v * STEP) * DEG;
    const x = Math.cos(a) * R * 0.5;
    const y = Math.sin(a) * R * 0.5;
    v === 0 ? coreShape.moveTo(x, y) : coreShape.lineTo(x, y);
  }
  coreShape.closePath();
  const coreMat = new THREE.MeshStandardMaterial({
    color: o.palette.core, roughness: 0.25, metalness: 0.75, transparent: true,
  });
  const core = new THREE.Mesh(extrude(coreShape, 0.18), coreMat);
  core.position.z = -0.02;
  world.add(core);

  /* ---------- transform state ---------- */
  const state = { selected: -1, hovered: -1 };
  const target = { x: 0, y: 0, scale: 1, roll: 0, labelFlip: 0, tilt: 0 };
  const current = { x: 0, y: 0, scale: 1, roll: 0, labelFlip: 0, tilt: 0 };

  function applyTargets() {
    const half = Math.tan((camera.fov * DEG) / 2);
    const worldW = 2 * camera.position.z * half * camera.aspect;

    if (state.selected < 0) {
      target.x = 0;
      target.y = 0;
      target.scale = 1;
      target.roll = nearestTurn(0, current.roll);
      target.labelFlip = 0;
      return;
    }

    const s = sectors[state.selected];
    const theta = s.theta;
    // Distance from the board centre to the middle of the outer band, measured
    // along the edge normal, so the band lands centred rather than its corner.
    const rSector = R * ((o.bands.outer.from + o.bands.outer.to) / 2) * APOTHEM;

    // Square the sector up...
    let deg = theta + 90;
    while (deg > 90) deg -= 180;
    while (deg <= -90) deg += 180;
    let rollDeg = -deg;

    // ...then resolve the half-turn ambiguity the same way every time, so the
    // bands never swap top for bottom between sectors.
    let outward = (theta + rollDeg) % 360;
    if (outward > 180) outward -= 360;
    if (outward <= -180) outward += 360;
    if (outward > 0) rollDeg += 180;

    target.roll = nearestTurn(rollDeg * DEG, current.roll);
    // The labels carry the opposite of whatever the roll adds beyond squaring
    // up, so the text stays upright while the geometry turns underneath it.
    target.labelFlip = -s.titleLabel.userData.baseRot - target.roll;

    // Position has to solve THROUGH the roll or the sector lands off-centre.
    const cos = Math.cos(target.roll);
    const sin = Math.sin(target.roll);
    const px = Math.cos(theta * DEG) * rSector;
    const py = Math.sin(theta * DEG) * rSector;
    const rx = px * cos - py * sin;
    const ry = px * sin + py * cos;

    target.scale = o.focusScale;
    // Centre of the free region. With freeWidth 1 that is simply 0; a narrower
    // value leaves a column on the left and shifts the centre right by half of
    // it. Then subtract the rolled sector offset, so the band lands on that
    // centre rather than the board origin doing.
    target.x = (worldW * (1 - o.freeWidth)) / 2 - target.scale * rx;
    target.y = -target.scale * ry;
  }

  function select(i) {
    if (i === state.selected) return;
    state.selected = i;
    sectors.forEach((s, k) => {
      s.targetLift = k === i ? 1 : 0;
      s.targetGlow = k === i ? 1 : 0;
      s.targetFade = k === i ? 1 : 0; // the others clear out entirely
    });
    applyTargets();
    o.onSelect?.(i, items[i]);
  }

  function deselect() {
    if (state.selected < 0) return;
    state.selected = -1;
    sectors.forEach((s) => {
      s.targetLift = 0;
      s.targetGlow = 0;
      s.targetFade = 1;
    });
    applyTargets();
    o.onDeselect?.();
  }

  const cycle = (dir) => select((state.selected + dir + N) % N);

  /* ---------- input ---------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function sectorAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    // Only sectors that are actually on screen. three.js Raycaster tests
    // `layers`, not `visible`, so a faded-out sector stays tappable otherwise,
    // and a tap on empty space selects something nobody can see instead of
    // going back to the board.
    const live = sectors.filter((s) => s.fade > 0.01).flatMap((s) => s.hitTargets);
    const hit = raycaster.intersectObjects(live, false)[0];
    if (!hit) return -1;
    let n = hit.object;
    while (n && n.userData.index === undefined) n = n.parent;
    return n ? n.userData.index : -1;
  }

  let down = null;
  const onDown = (e) => { down = { x: e.clientX, y: e.clientY }; };
  const onUp = (e) => {
    if (!down) return;
    const dx = e.clientX - down.x;
    const dy = e.clientY - down.y;
    const moved = Math.hypot(dx, dy);
    down = null;

    // A deliberate horizontal drag moves between sectors rather than selecting.
    if (state.selected >= 0 && Math.abs(dx) > o.swipeMinPx && Math.abs(dx) > Math.abs(dy) * o.swipeRatio) {
      cycle(dx < 0 ? 1 : -1);
      return;
    }
    if (moved > o.tapMaxPx) return; // a drag, not a tap
    const i = sectorAt(e.clientX, e.clientY);
    if (i >= 0) select(i);
    else deselect();
  };
  const onMove = (e) => {
    if (e.pointerType === 'touch') return;
    state.hovered = sectorAt(e.clientX, e.clientY);
    canvas.style.cursor = state.hovered >= 0 ? 'pointer' : 'default';
  };
  const onKey = (e) => {
    if (e.key === 'Escape') return deselect();
    if (e.key === 'ArrowRight') return cycle(1);
    if (e.key === 'ArrowLeft') return cycle(-1);
    const n = Number(e.key);
    if (n >= 1 && n <= N) select(n - 1);
  };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointermove', onMove);
  addEventListener('keydown', onKey);

  /* ---------- resize + loop ---------- */
  function resize() {
    const w = canvas.clientWidth || innerWidth;
    const h = canvas.clientHeight || innerHeight;
    // A zero-sized canvas — hidden pane, display:none parent, mounted before
    // layout — would make camera.aspect NaN, and a single frame in that state
    // puts NaN into `current`, which damp() can never bring back. Refuse the
    // frame instead; the observer below re-runs this once a size exists.
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    applyTargets();
  }
  addEventListener('resize', resize);
  // Covers what a window resize event does not: a container going from
  // display:none to visible.
  const sizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  if (sizeObserver) sizeObserver.observe(canvas);
  resize();

  const clock = new THREE.Clock();
  let running = true;

  // One frame of animation, factored out of the rAF driver so it can also be
  // stepped by hand — useful for tests, deep links, and headless capture.
  function step(dt, t) {
    current.x = damp(current.x, target.x, o.lambda, dt);
    current.y = damp(current.y, target.y, o.lambda, dt);
    current.scale = damp(current.scale, target.scale, o.lambda, dt);
    current.roll = damp(current.roll, target.roll, o.lambda, dt);
    current.labelFlip = damp(current.labelFlip, target.labelFlip, o.lambda, dt);

    world.position.set(current.x, current.y, 0);
    world.scale.setScalar(current.scale);
    world.rotation.set(0, 0, current.roll);

    sectors.forEach((s, i) => {
      const hot = i === state.hovered && state.selected < 0;
      s.glow = damp(s.glow, state.selected === i ? 1 : hot ? 0.65 : s.targetGlow, 6, dt);
      s.lift = damp(s.lift, state.selected < 0 && hot ? 0.35 : s.targetLift, 5.5, dt);
      s.fade = damp(s.fade, s.targetFade, o.fadeLambda, dt);

      s.holder.visible = s.fade > 0.01;
      s.materials.forEach((m, k) => {
        m.opacity = s.fade;
        m.emissiveIntensity = (k === 0 ? 0.05 : 0.015) + s.glow * (k === 0 ? 0.3 : 0.24);
      });
      s.rimMesh.material.opacity = s.glow * 0.9 * s.fade;
      s.labels.forEach((l) => {
        l.material.opacity = s.fade;
        l.rotation.z = l.userData.baseRot + (state.selected === i ? current.labelFlip : 0);
      });
      // A slow idle bob, parked while a sector is open.
      s.holder.position.z = s.lift * 0.85 + (state.selected < 0 ? Math.sin(t * 0.8 + i) * 0.045 : 0);
    });

    coreMat.opacity = damp(coreMat.opacity, state.selected < 0 ? 1 : 0, o.fadeLambda, dt);
    core.visible = coreMat.opacity > 0.01;

    renderer.render(scene, camera);
  }

  function tick() {
    if (!running) return;
    step(Math.min(clock.getDelta(), 0.05), clock.elapsedTime);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  return {
    select,
    deselect,
    cycle,
    get selected() { return state.selected; },
    // Snap straight to the target, skipping the animation. Useful for deep links.
    snap() { Object.assign(current, target); },
    step,
    scene, camera, renderer, world, sectors,
    dispose() {
      running = false;
      if (sizeObserver) sizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointermove', onMove);
      removeEventListener('keydown', onKey);
      removeEventListener('resize', resize);
      renderer.dispose();
    },
  };
}
