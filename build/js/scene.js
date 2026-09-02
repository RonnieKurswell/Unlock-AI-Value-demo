/* =============================================================
   THREE.JS SCENE — the hexagon is the interface, not decoration.

   A flat ring of six prisms behind attract, the diagnostic, the results
   and delivery. It grows with progress and extrudes to the final scores.

   The explore screen's framework hexagon is SVG, not WebGL — see
   js/hexagon.js for why. The rig is hidden there.
   ============================================================= */

import * as THREE from '../vendor/three.module.js';
import { POOLS } from './data.js';
import { buildHexagon, R as HEX_R, PALETTE } from './hex.js';

const RING = 1.78;
const TILE_R = 0.98;
const BASE_H = 0.26;
const MAX_H = 2.70;
const DARK = 0x080B11;
const TAU = Math.PI * 2;
const HEX_HOLD = 0.62;   // seconds the board waits out the camera move
const HEX_FOCUS_SCALE = 2.5;   // how far an opened pool zooms in
// What a segment glows before it has been answered: cool, near-black, no hue.
const EMISSIVE_OFF = new THREE.Color(0x171D26);

// Same angle, nearest full turn to `ref`, so the extra half-turn in the
// orientation fix never becomes a 300-degree spin between two pools.
const nearestTurn = (angle, ref) => {
  const TAU2 = Math.PI * 2;
  return angle + Math.round((ref - angle) / TAU2) * TAU2;
};
const STEP = Math.PI / 3;

const damp = (c, t, l, dt) => c + (t - c) * (1 - Math.exp(-l * dt));

export class HiveScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.state = 'attract';
    this.focused = null;
    this.hoverId = null;
    this.pickEnabled = false;
    this.onPick = null;
    this.onFrame = null;
    this.layout = 'ring';
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.16;

    this.scene = new THREE.Scene();
    /* Matches the lifted CSS ground; at the old near-black the 3D sat visibly
       darker than the page around it. */
    this.scene.fog = new THREE.FogExp2(0x00243F, 0.034);

    this.camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 200);
    this.camera.position.set(0, 1.7, 13.8);
    this.camTarget = this.camera.position.clone();
    this.lookAt = new THREE.Vector3(0, 4.9, 0);
    this.lookTarget = this.lookAt.clone();

    this.rig = new THREE.Group();
    this.hive = new THREE.Group();
    this.rig.add(this.hive);
    this.scene.add(this.rig);

    this.spin = 0.055; this.spinTarget = 0.055;
    this.rotTarget = null;
    this.spread = 1; this.spreadTarget = 1;
    this.tilt = 0; this.tiltTarget = 0;
    this.off = new THREE.Vector3(); this.offTarget = new THREE.Vector3();
    this.groundFadeTarget = 0.9;

    this._lights();
    this._ground();
    this._tiles();
    this._core();
    this._dust();
    this._drift();

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-2, -2);
    this._bind();
    this.resize();
    this.setState('attract');
  }

  /* ---------- build ------------------------------------------ */

  _lights() {
    /* Two rigs. The prism ring is lit soft and cool; the hexagon's metallic
       bands need a hard key to read their bevels. Lights are global, so each
       rig is a group toggled with the object it belongs to. */
    this.ringLights = new THREE.Group();
    this.ringLights.add(new THREE.HemisphereLight(0x1a2436, 0x03050A, 0.65));
    const key = new THREE.DirectionalLight(0x9fc4e8, 0.9);
    key.position.set(-5, 9, 7);
    this.ringLights.add(key);
    const rim = new THREE.DirectionalLight(0x2a3f6b, 0.7);
    rim.position.set(6, 3, -7);
    this.ringLights.add(rim);
    this.coreLight = new THREE.PointLight(0x37A6E4, 2.0, 14, 2);
    this.ringLights.add(this.coreLight);
    this.scene.add(this.ringLights);

    this.hexLights = new THREE.Group();
    this.hexLights.visible = false;
    this.hexLights.add(new THREE.AmbientLight(0x5a7cb8, 0.72));
    const hKey = new THREE.DirectionalLight(0xdcecff, 2.5);
    hKey.position.set(-7, 9, 12);
    this.hexLights.add(hKey);
    const hFill = new THREE.DirectionalLight(0x3f8ae0, 1.25);
    hFill.position.set(9, -6, 8);
    this.hexLights.add(hFill);
    const hRim = new THREE.PointLight(0x36d6ff, 34, 34, 2);
    hRim.position.set(0, 0, -5);
    this.hexLights.add(hRim);

    /* Travels to whichever segment is chosen and takes its accent, so the
       board is lit *by* the selection rather than just tinted. */
    this.hexAccentLight = new THREE.PointLight(0xffffff, 0, 26, 2);
    this.hexAccentLight.position.set(0, 0, 4);
    this.hexLights.add(this.hexAccentLight);
    this.scene.add(this.hexLights);
  }

  _ground() {
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { uTime: { value: 0 }, uFade: { value: 0.9 } },
      vertexShader: `varying vec2 vW;
        void main(){ vW = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec2 vW; uniform float uTime; uniform float uFade;
        float grid(vec2 p, float s){
          vec2 g = abs(fract(p/s - 0.5) - 0.5) / fwidth(p/s);
          return 1.0 - min(min(g.x,g.y),1.0);
        }
        void main(){
          float fine = grid(vW,0.9)*0.15;
          float coarse = grid(vW,4.5)*0.28;
          float d = length(vW);
          float fall = smoothstep(34.0,3.0,d);
          float sweep = 0.5 + 0.5*sin(d*0.22 - uTime*0.55);
          float a = (fine+coarse)*fall*uFade*(0.62+0.38*sweep);
          vec3 col = mix(vec3(0.30,0.46,0.66), vec3(0.62,0.78,0.95), coarse);
          gl_FragColor = vec4(col, a);
        }`
    });
    this.groundMat = mat;
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), mat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.02;
    this.scene.add(this.ground);
  }

  _hexPrism(r, h) {
    const g = new THREE.CylinderGeometry(r, r, h, 6, 1);
    g.rotateY(Math.PI / 6);
    return g;
  }

  _tiles() {
    this.tiles = POOLS.map((p, i) => {
      const angle = -Math.PI / 2 + i * STEP;
      const group = new THREE.Group();
      group.userData.baseAngle = angle;

      const body = new THREE.Mesh(this._hexPrism(TILE_R, 1), new THREE.MeshStandardMaterial({
        color: DARK, roughness: 0.62, metalness: 0.16,
        emissive: new THREE.Color(p.color), emissiveIntensity: 0.04
      }));
      body.userData.poolId = p.id;
      group.add(body);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(this._hexPrism(TILE_R, 1)),
        new THREE.LineBasicMaterial({ color: p.color, transparent: true, opacity: 0.5 })
      );
      group.add(edges);

      const halo = new THREE.Mesh(new THREE.CircleGeometry(TILE_R * 1.04, 6), new THREE.MeshBasicMaterial({
        color: p.color, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      }));
      halo.rotation.x = -Math.PI / 2;
      group.add(halo);

      const ping = new THREE.Mesh(new THREE.RingGeometry(TILE_R * 1.02, TILE_R * 1.1, 6), new THREE.MeshBasicMaterial({
        color: p.color, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      }));
      ping.rotation.x = -Math.PI / 2;
      group.add(ping);

      this.hive.add(group);
      return {
        pool: p, group, body, edges, halo, ping,
        h: BASE_H, hTarget: BASE_H,
        glow: 0.05, glowTarget: 0.05,
        lift: 0, liftTarget: 0,
        pingT: -1, phase: i * 1.07
      };
    });
    this.tileBodies = this.tiles.map(t => t.body);
  }

  _core() {
    this.core = new THREE.Mesh(this._hexPrism(0.9, 0.3), new THREE.MeshStandardMaterial({
      color: 0x06131F, roughness: 0.35, metalness: 0.4,
      emissive: new THREE.Color(0x37A6E4), emissiveIntensity: 0.5
    }));
    this.core.position.y = 0.15;
    this.hive.add(this.core);

    this.coreHalo = new THREE.Mesh(new THREE.CircleGeometry(2.0, 6), new THREE.MeshBasicMaterial({
      color: 0x37A6E4, transparent: true, opacity: 0.1,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    }));
    this.coreHalo.rotation.x = -Math.PI / 2;
    this.coreHalo.position.y = 0.33;
    this.hive.add(this.coreHalo);

    this.coreFlare = 0; this.coreFlareTarget = 0;
  }

  /* A slow ambient layer, attached to the camera rather than the world.
     The camera travels a long way between screens — attract frames far wider
     than the diagnostic — so world-space drifters would leave frame on some
     states and swamp others. Parented to the camera they are framed
     identically everywhere, which is what "motion on every screen" needs.
     Hexagon outlines, additive, barely there. Positions are hand-placed to
     stay out of the middle where the copy and the board live. */
  _drift() {
    this.scene.add(this.camera);          // camera children only render if it is in the graph

    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI / 6 + (i % 6) * Math.PI / 3;   // pointy-top, closed loop
      pts.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);

    /* At z = -9 with a 38 degree fov the visible half-height is 3.1 and the
       half-width 5.5, so these sit just inside the edges. */
    const PLACE = [
      [-4.9,  2.30, 0.85, 0.16], [-5.35, -1.95, 1.15, 0.13], [-3.25, -2.60, 0.60, 0.18],
      [ 4.80, 2.50, 0.95, 0.15], [ 5.30, -2.10, 1.25, 0.12], [ 3.40, -2.70, 0.62, 0.17],
      [-4.25, 0.15, 0.50, 0.11], [ 4.45,  0.40, 0.55, 0.11], [-1.45, -2.85, 0.70, 0.14]
    ];
    this.drifters = [];
    const group = new THREE.Group();
    group.position.z = -9;
    PLACE.forEach(([x, y, sc, op], i) => {
      const mat = new THREE.LineBasicMaterial({
        color: 0x9FD4FF, transparent: true, opacity: op,
        blending: THREE.AdditiveBlending, depthWrite: false, fog: false
      });
      const line = new THREE.Line(geo, mat);
      line.position.set(x, y, 0);
      line.scale.setScalar(sc);
      line.rotation.z = i * 0.7;
      group.add(line);
      this.drifters.push({
        obj: line, baseY: y,
        spin: (i % 2 ? 1 : -1) * (0.020 + (i % 3) * 0.008),
        bob: 0.16 + (i % 4) * 0.05,
        rate: 0.10 + (i % 5) * 0.035,
        phase: i * 1.9
      });
    });
    this.camera.add(group);
    this.driftGroup = group;
  }

  _dust() {
    const N = 1400;
    const pos = new Float32Array(N * 3), seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const r = 4 + Math.random() * 26, a = Math.random() * TAU;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.random() * 14 - 1;
      pos[i * 3 + 2] = Math.sin(a) * r;
      seed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    this.dustMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uSize: { value: 2.4 * Math.min(window.devicePixelRatio, 2) }, uTint: { value: new THREE.Color(0xaecbf5) } },
      vertexShader: `attribute float aSeed; uniform float uTime; uniform float uSize; varying float vA;
        void main(){
          vec3 p = position;
          p.y += sin(uTime*0.18 + aSeed*24.0)*0.9;
          p.x += cos(uTime*0.11 + aSeed*17.0)*0.6;
          vec4 mv = modelViewMatrix * vec4(p,1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * (1.0 + aSeed) * (12.0 / -mv.z);
          vA = (0.16 + 0.5*aSeed) * smoothstep(46.0, 6.0, -mv.z);
        }`,
      fragmentShader: `varying float vA; uniform vec3 uTint;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          gl_FragColor = vec4(uTint * 1.6, vA * (1.0 - d*2.0));
        }`
    });
    this.scene.add(new THREE.Points(geo, this.dustMat));
  }

  /* ---------- input ------------------------------------------ */

  _bind() {
    window.addEventListener('resize', () => this.resize());

    const toLocal = e => {
      const r = this.canvas.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      this.pointer.set(((p.clientX - r.left) / r.width) * 2 - 1, -((p.clientY - r.top) / r.height) * 2 + 1);
      return p;
    };

    /* On the framework surface a tap opens a pool, a horizontal drag moves
       between them, and a tap on empty space goes back to the board — the same
       three gestures the booth build uses, hinted on screen. */
    let down = null;
    this.canvas.addEventListener('pointerdown', e => {
      // Picking reads this.pointer, so it has to be taken from the event that
      // is actually being handled. Touch gives a pointerdown with no preceding
      // pointermove, so relying on the move handler alone meant a tap picked
      // whatever the previous one pointed at — wrong pool on every tap but the
      // first, on the touchscreen this is built for.
      toLocal(e);
      down = { x: e.clientX, y: e.clientY };
      if (this.pickEnabled && this.onPick) {
        const hit = this._pick();
        if (hit) this.onPick(hit);
      }
    });
    this.canvas.addEventListener('pointerup', e => {
      if (!down || !(this.hex && this.hexPickable && this.hexRig.visible)) { down = null; return; }
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      down = null;

      if (this.hexSelected >= 0 && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        return this.cycleHex(dx < 0 ? 1 : -1);
      }
      if (Math.hypot(dx, dy) > 14) return;   // a drag, not a tap
      toLocal(e);                            // pick where the finger lifted
      const i = this._pickHex();
      if (i >= 0) this.selectHex(i);
      else this.clearHex();
    });
    this.canvas.addEventListener('pointermove', toLocal);
  }

  _pick() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const targets = this.tileBodies.filter(b => b.parent.visible);
    const hits = this.raycaster.intersectObjects(targets, false);
    if (!hits.length) return null;
    const d = hits[0].object.userData;
    return d.poolId;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this._frame();
  }

  /* ---------- framework hexagon ------------------------------ */

  /** Call after document.fonts.ready — label textures rasterise the face. */
  buildHex(pools) {
    if (this.hex) return this.hex;
    this.hex = buildHexagon(pools);
    this.hexRig = new THREE.Group();
    this.hexRig.add(this.hex.group);
    this.hexRig.visible = false;
    this.scene.add(this.hexRig);
    this.hexHit = this.hex.segments.flatMap(s => s.hitTargets);
    this.hexSelected = -1;
    this.hexHovered = -1;
    this.hexSeen = this.hexSeen || new Set();
    if (this.state === 'explore') this.setState('explore');
    return this.hex;
  }

  /** Rebuild with freshly rasterised labels — used once fonts have loaded. */
  rebuildHex(pools) {
    if (this.hex) {
      this.hexRig.remove(this.hex.group);
      this.hex.group.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (o.material.map) o.material.map.dispose();
          o.material.dispose();
        }
      });
      this.hex = null;
      this.hexRig = null;
    }
    const sel = this.hexSelected;
    this.buildHex(pools);
    if (sel >= 0) this.selectHex(sel);
    return this.hex;
  }

  selectHex(i) {
    if (!this.hex) return;
    const changed = this.hexSelected !== i;
    this.hexSelected = i;

    // Straight on while focused: a lean fights the zoom and hurts legibility.
    this.hexTiltTarget = { x: 0, y: 0 };
    if (changed) {
      this.hexPop = 1; this.hexRipple = 0; this.hexKick = 1;
      this.hexRippleColor = this.hex.segments[i].accentColor;
    }
    this.setRoom(this.hex.segments[i].room);
    this.hexSeen.add(i);
    this.hex.segments.forEach((p, k) => {
      p.targetLift = k === i ? 1 : 0;
      p.targetGlow = k === i ? 1 : 0;
      p.targetDim = 1;
      // Everything but the open pool clears out of the way entirely.
      p.targetFade = k === i ? 1 : 0;
    });
    if (this.onHexSelect) this.onHexSelect(this.hex.segments[i].id, i);
  }

  /* Once every pool has been opened, swiping forward returns to the framework
     rather than looping round to pool one again. Forward only — a back swipe is
     someone re-reading, not finishing. */
  cycleHex(n) {
    if (!this.hex) return;
    const len = this.hex.segments.length;
    if (n > 0 && this.hexSeen.size >= len) return this.clearHex();
    const cur = this.hexSelected < 0 ? 0 : this.hexSelected + n;
    this.selectHex(((cur % len) + len) % len);
  }

  clearHex() {
    if (!this.hex) return;
    const had = this.hexSelected >= 0;
    this.hexSelected = -1;
    this.hexTiltTarget = { x: 0, y: 0 };
    this.hexSeen.clear();
    this.hex.segments.forEach(p => {
      p.targetLift = 0; p.targetGlow = 0; p.targetDim = 1; p.targetFade = 1;
    });
    if (had) this.clearRoom();
    if (had && this.onHexClear) this.onHexClear();
  }

  _pickHex() {
    if (!this.hex || !this.hexRig.visible) return -1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.hexHit, false);
    if (!hits.length) return -1;
    let n = hits[0].object;
    while (n && n.userData.poolIndex === undefined) n = n.parent;
    return n ? n.userData.poolIndex : -1;
  }

  /* ---------- public ----------------------------------------- */

  setCoreVisible(v) { this.core.visible = v; this.coreHalo.visible = v; }

  /* Each pool gets its own room: fog and the drifting motes take its tint, so
     choosing a segment changes the space and not just the object. */
  setRoom(room) {
    if (!room) return;
    this.roomTarget = new THREE.Color(room[0]);
    this.roomDeep = new THREE.Color(room[1]);
    if (this.onRoom) this.onRoom(room);
  }

  clearRoom() {
    this.roomTarget = new THREE.Color(0x0A1A2B);
    this.roomDeep = new THREE.Color(0x04070C);
    if (this.onRoom) this.onRoom(['#0A1A2B', '#04070C']);
  }

  _tint(t, hex) {
    const c = new THREE.Color(hex);
    t.body.material.emissive.copy(c);
    t.edges.material.color.copy(c);
    t.halo.material.color.copy(c);
    t.ping.material.color.copy(c);
  }

  /** Screen-space position of a tile cap, for HTML labels. */
  project(i) {
    const t = this.tiles[i];
    const v = new THREE.Vector3(0, t.h + 0.1, 0);
    t.group.localToWorld(v);
    v.project(this.camera);
    const r = this.canvas.getBoundingClientRect();
    return { x: (v.x * 0.5 + 0.5) * r.width, y: (-v.y * 0.5 + 0.5) * r.height, ok: v.z < 1 };
  }

  /* Framing is computed, not hand-placed, so nothing crops at any
     aspect ratio. Per state we declare WHAT to look at and HOW much
     of the frame it should occupy; distance falls out of the FOV.

       focus   world point to centre on
       radius  bounding radius to fit
       elev    degrees above the horizon
       margin  1 / fraction of the half-frame the object may fill
       bias    [x, y] shove in half-frames — +x moves it left, +y up-frame

     Overflow rule: |bias| + 1/margin must stay under 1. */
  _frame() {
    const S = this.frameSpec;
    if (!S) return;

    const halfV = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2);
    const halfH = halfV * this.camera.aspect;
    const m = S.margin ?? 1.5;
    // `extent` [halfWidth, halfHeight] fits a non-spherical subject properly;
    // `radius` is the isotropic shorthand.
    const w = S.extent ? S.extent[0] : S.radius;
    const h = S.extent ? S.extent[1] : S.radius;
    const dist = Math.max(w / halfH, h / halfV) * m;

    const elev = THREE.MathUtils.degToRad(S.elev ?? 0);
    const az = THREE.MathUtils.degToRad(S.az ?? 0);
    const dir = new THREE.Vector3(
      Math.sin(az) * Math.cos(elev),
      Math.sin(elev),
      Math.cos(az) * Math.cos(elev)
    );

    const focus = new THREE.Vector3(...S.focus);
    const camPos = focus.clone().add(dir.clone().multiplyScalar(dist));

    // shifting the look-at moves the object the opposite way on screen
    const fwd = focus.clone().sub(camPos).normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
    const bx = (S.bias?.[0] ?? 0) * halfH * dist;
    const by = (S.bias?.[1] ?? 0) * halfV * dist;

    this.camTarget.copy(camPos);
    this.lookTarget.copy(focus).addScaledVector(right, bx).addScaledVector(up, by);

    // objBias slides the subject sideways in world space, keeping the camera
    // square to it — the difference between an off-centre object and a
    // skewed one.
    this.hexOffsetTarget = -(S.objBias ?? 0) * halfH * dist;   // halfH already carries aspect
  }

  /* The explore transform, solved the way the booth build solves it.
     Overview centres the whole board and fits it to the frustum. Opening a
     pool rolls that sector square, clears the other five away and zooms into
     it, offset into whatever width the copy column leaves free.

     Two things here are load-bearing, and both are easy to get wrong:
       - Position is solved THROUGH the roll. Rolling and then translating
         lands the sector off-centre, because the roll has already moved the
         point being aimed at.
       - Squaring a sector up leaves two valid rolls, half a turn apart. Taking
         the shorter one lands three of the six mirrored — verb above title for
         some pools, below for others — which reads as the board jumping as you
         swipe. This always picks the half-turn that points the sector the same
         way, and the labels carry the opposite of it so the text stays upright
         while the geometry turns underneath. */
  _hexSolve() {
    const half = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2);
    const dist = this.camera.position.distanceTo(this.lookAt) || 1;
    const worldH = 2 * dist * half;
    const worldW = worldH * this.camera.aspect;

    const T = this.hexTargets || (this.hexTargets = { x: 0, y: 0, scale: 1, roll: 0, labelFlip: 0 });

    const boardH = HEX_R * 2 * 1.02;
    const boardW = HEX_R * 2 * Math.cos(Math.PI / 6) * 1.02;

    if (this.state === 'diagnostic') {
      /* The questions own the right of the frame, so the board is centred in
         what is left and sized to fit it, rather than filling the whole stage.
         The column takes 60%: an even split gave the board more room than it
         needs to read, and two thirds took too much away. The case study lives
         in the panel now, so nothing sits under the board and it centres. */
      const colFrac = Math.min(this.canvas.clientWidth * 0.60, 1080) /
                      (this.canvas.clientWidth || 1);
      const freeW = worldW * (1 - colFrac);
      T.x = -(worldW * colFrac) / 2;
      T.y = worldH * 0.02;
      T.scale = Math.min((worldH * 0.68) / boardH, (freeW * 0.90) / boardW);
      T.roll = nearestTurn(0, T.roll);
      T.labelFlip = 0;
      return T;
    }

    if (this.hexSelected < 0) {
      const fill = Math.min((worldH * 0.80) / boardH, (worldW * 0.90) / boardW);
      T.x = 0;
      // Lifted a touch so the room left over sits under the board, where the
      // touch hint goes, rather than being split evenly above and below.
      T.y = worldH * 0.025;
      T.scale = Math.max(1, fill);
      T.roll = nearestTurn(0, T.roll);
      T.labelFlip = 0;
      return T;
    }

    const seg = this.hex.segments[this.hexSelected];
    const theta = seg.theta;
    const th = theta * Math.PI / 180;
    const rSector = HEX_R * ((1.0 + 0.795) / 2) * Math.cos(Math.PI / 6);

    let deg = theta + 90;
    while (deg > 90) deg -= 180;
    while (deg <= -90) deg += 180;
    let rollDeg = -deg;
    let outward = (theta + rollDeg) % 360;
    if (outward > 180) outward -= 360;
    if (outward <= -180) outward += 360;
    if (outward > 0) rollDeg += 180;

    T.roll = nearestTurn(rollDeg * Math.PI / 180, T.roll);
    T.labelFlip = -seg.labels[0].userData.baseRot - T.roll;

    const cos = Math.cos(T.roll), sin = Math.sin(T.roll);
    const px = Math.cos(th) * rSector, py = Math.sin(th) * rSector;
    const rx = px * cos - py * sin;
    const ry = px * sin + py * cos;

    // Centre of the width the copy column leaves free. The column is on the
    // left, so the open sector lives to the right of it.
    const colPx = Math.min(this.canvas.clientWidth * 0.46, 880);
    const freeCentreX = (worldW * (colPx / (this.canvas.clientWidth || 1))) / 2;

    T.scale = HEX_FOCUS_SCALE;
    T.x = freeCentreX - T.scale * rx;
    T.y = -T.scale * ry;
    return T;
  }

  setState(name) {
    this.state = name;
    const ST = {
      attract:     { focus: [0, 0, 0],   radius: 2.90, elev: 14, margin: 1.55, bias: [0,    0.86], spin: 0.055, spread: 1.00, fade: 0.90, tilt: 0,             off: [0, 0, 0] },
      explore:     { focus: [0, 0, 0],   radius: HEX_R * 1.70, elev: 0, margin: 1.00, bias: [0, 0], objBias: 0, spin: 0, spread: 1.02, fade: 0.18, tilt: 0, off: [0, 0, 0] },
      diagnostic:  { focus: [0, 0, 0],   radius: HEX_R * 1.70, elev: 0, margin: 1.00, bias: [0, 0], objBias: 0, spin: 0, spread: 1.00, fade: 0.10, tilt: 0, off: [0, 0, 0] },
      results:     { focus: [0, 0.9, 0], radius: 3.50, elev: 24, margin: 1.50, bias: [0,    0.22], spin: 0.045, spread: 1.04, fade: 0.80, tilt: 0,             off: [0, 0, 0] },
      resultsQuiet:{ focus: [0, 0.9, 0], radius: 3.50, elev: 32, margin: 2.60, bias: [0,    0.52], spin: 0.020, spread: 1.04, fade: 0.22, tilt: 0,             off: [0, 0, 0] },
      delivery:    { focus: [0, 0, 0],   radius: 3.00, elev: 34, margin: 3.00, bias: [0,    0.60], spin: 0.022, spread: 1.10, fade: 0.30, tilt: 0,             off: [0, 0, 0] }
    };
    const S = ST[name] || ST.attract;

    this.frameSpec = S;
    this._frame();
    this.spinTarget = this.reduced ? 0 : S.spin;
    this.spreadTarget = S.spread;
    this.groundFadeTarget = S.fade;
    this.tiltTarget = S.tilt;
    this.offTarget.set(...S.off);
    this.rotTarget = (S.rot === undefined) ? null : S.rot;

    const onHex = (name === 'explore' || name === 'diagnostic');
    // Only the framework page lets you choose a pool; during the questionnaire
    // the board is an indicator, so it must not respond to taps or show a
    // pointer cursor.
    this.hexPickable = (name === 'explore');
    /* Attract is the generated plate plus the headline, nothing else: the ring
       of prisms and the floor grid are off there so the background can carry
       the screen. They still belong to results and delivery. */
    /* Attract, identify and the closing screen are the plate plus copy: the
       ring of prisms muddled them rather than adding anything. Results keeps
       it, since the beats are read against the object. */
    const bare = (name === 'attract' || name === 'delivery');
    this.rig.visible = !onHex && !bare;
    this.ringLights.visible = !onHex && !bare;
    this.hexLights.visible = onHex;
    /* The board is held back until the camera has finished travelling to the
       explore framing, then makes its own contained entrance. Revealing it
       during the camera move would show it sliced by the left edge, because
       the attract framing is far wider than this one. */
    this.hexOn = onHex;
    if (this.hexRig) this.hexRig.visible = false;
    if (onHex) { this.hexEnter = 0; this.hexHold = HEX_HOLD; }

    if (!onHex) { this.hexKick = 0; this.hexPop = 0; }

    if (name === 'diagnostic') {
      // No selection here: it would zoom and lean the board. And the room the
      // framework page left behind has to go, or the charge cannot read.
      this.clearHex();
      this.clearRoom();
    }
    this.pickEnabled = false;
    this.setCoreVisible(!bare);
    this.ground.visible = !onHex && !bare;

    if (name === 'attract' || name === 'delivery') {
      this.tiles.forEach(t => { t.hTarget = BASE_H + 0.34; t.glowTarget = 0.10; t.liftTarget = 0; });
    }
  }

  setProgress(poolId, v) {
    const seg = this.hex && this.hex.segments.find(p => p.id === poolId);
    if (seg) seg.fillTarget = v;
    const t = this.tiles.find(x => x.pool.id === poolId);
    if (!t) return;
    t.hTarget = BASE_H + (MAX_H - BASE_H) * 0.42 * v;
    t.glowTarget = 0.04 + 0.26 * v;
  }

  setScore(poolId, v) {
    const t = this.tiles.find(x => x.pool.id === poolId);
    if (!t) return;
    t.hTarget = BASE_H + (MAX_H - BASE_H) * v;
    t.glowTarget = 0.07 + 0.40 * v;
  }

  resetTiles() {
    if (this.hex) {
      this.hex.segments.forEach(p => { p.fillTarget = 0; p.fill = 0; p.charge = 0; p.targetLift = 0; });
    }
    this.tiles.forEach(t => { t.hTarget = BASE_H; t.glowTarget = 0.09; t.liftTarget = 0; });
    this.coreFlareTarget = 0;
    this.focused = null;
  }

  focus(poolId) {
    this.focused = poolId;
    if (this.hex) {
      this.hex.segments.forEach(p => { p.targetLift = p.id === poolId ? 0.55 : 0; });
    }
    this.tiles.forEach(t => {
      const on = t.pool.id === poolId;
      t.liftTarget = on ? 0.85 : 0;
      t.glowTarget = poolId ? (on ? 0.44 : 0.03) : 0.09;
    });
  }

  /* Each answer lands as an event on the board rather than a silent state
     change: the answered segment kicks forward and flashes its rim, a ring
     ripples out of the core in that pool's colour, and the whole board takes a
     short settle. Everything decays on its own, so answering fast just stacks
     the pulses instead of queueing them. */
  ping(poolId) {
    const seg = this.hex && this.hex.segments.find(p => p.id === poolId);
    if (seg) {
      seg.charge = 1;
      seg.kick = 1;
      this.hexRipple = 0;
      this.hexRippleColor = seg.accentColor;
      this.hexPop = 0.7;
      if (this.hexAccentLight) {
        const a = seg.theta * Math.PI / 180;
        this.hexAccentLight.position.set(
          Math.cos(a) * HEX_R * 0.82, Math.sin(a) * HEX_R * 0.82, 3.2);
        this.hexAccentLight.color.copy(seg.accentColor);
      }
      this.hexFlash = 1;
    }
    const t = this.tiles.find(x => x.pool.id === poolId);
    if (t) t.pingT = 0;
  }

  flare(v = 1) { this.coreFlareTarget = v; }

  /* ---------- frame ------------------------------------------ */

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    this.spin = damp(this.spin, this.spinTarget, 3, dt);
    if (this.rotTarget === null) this.hive.rotation.y += this.spin * dt;
    else this.hive.rotation.y = damp(this.hive.rotation.y, this.rotTarget, 5, dt);

    this.spread = damp(this.spread, this.spreadTarget, 4, dt);
    this.tilt = damp(this.tilt, this.tiltTarget, 3.2, dt);
    this.rig.rotation.x = this.tilt;
    this.off.lerp(this.offTarget, 1 - Math.exp(-3.2 * dt));
    this.rig.position.copy(this.off);

    this.camera.position.lerp(this.camTarget, 1 - Math.exp(-2.6 * dt));
    this.hexKick = damp(this.hexKick || 0, 0, 4.4, dt);
    if (this.hexKick > 0.001) this.camera.position.z -= this.hexKick * 0.9;
    this.lookAt.lerp(this.lookTarget, 1 - Math.exp(-2.6 * dt));
    this.camera.position.x += this.pointer.x * 0.018;
    this.camera.position.y += this.pointer.y * 0.012;
    this.camera.lookAt(this.lookAt);

    for (const tile of this.tiles) {
      const bob = (this.state === 'attract' && !this.reduced) ? Math.sin(t * 0.62 + tile.phase) * 0.11 : 0;
      tile.h = damp(tile.h, tile.hTarget, 4.2, dt);
      tile.lift = damp(tile.lift, tile.liftTarget, 5, dt);
      tile.glow = damp(tile.glow, tile.glowTarget, 4, dt);

      const a = tile.group.userData.baseAngle;
      const R = RING * this.spread;
      tile.group.position.set(Math.cos(a) * R, tile.lift + bob, Math.sin(a) * R);

      tile.body.scale.y = tile.h;
      tile.body.position.y = tile.h / 2;
      tile.edges.scale.y = tile.h;
      tile.edges.position.y = tile.h / 2;
      tile.body.material.emissiveIntensity = tile.glow;
      tile.edges.material.opacity = 0.30 + tile.glow * 1.15;
      tile.halo.position.y = tile.h + 0.02;
      tile.halo.material.opacity = tile.glow * 0.16;

      if (tile.pingT >= 0) {
        tile.pingT += dt;
        const k = Math.min(tile.pingT / 0.85, 1);
        tile.ping.position.y = tile.h + 0.04;
        tile.ping.scale.setScalar(1 + k * 2.4);
        tile.ping.material.opacity = (1 - k) * 0.8;
        if (k >= 1) { tile.pingT = -1; tile.ping.material.opacity = 0; }
      }
    }

    this.coreFlare = damp(this.coreFlare, this.coreFlareTarget, 2.4, dt);
    const pulse = 0.5 + Math.sin(t * 1.25) * 0.12;
    this.core.material.emissiveIntensity = pulse + this.coreFlare * 2.6;
    this.coreHalo.material.opacity = 0.08 + this.coreFlare * 0.34;
    this.coreHalo.scale.setScalar(1 + this.coreFlare * 0.5);
    this.coreLight.intensity = 1.6 + this.coreFlare * 5.0;
    this.core.getWorldPosition(this.coreLight.position);
    this.coreLight.position.y += 0.7;

    if (this.hex && this.hexOn) {
      const hovered = this.hexPickable ? this._pickHex() : -1;
      if (hovered !== this.hexHovered) {
        this.hexHovered = hovered;
        this.canvas.style.cursor = hovered >= 0 ? 'pointer' : 'default';
      }
      const diag = this.state === 'diagnostic';
      this.hex.segments.forEach((p, i) => {
        const hot = i === this.hexHovered;
        const wantGlow = this.hexSelected === i ? 1 : (hot && this.hexSelected < 0 ? 0.65 : p.targetGlow);
        const wantLift = this.hexSelected < 0 && hot ? 0.35 : p.targetLift;

        p.glow = damp(p.glow, wantGlow, 6, dt);
        p.lift = damp(p.lift, wantLift, 5.5, dt);
        p.dim = damp(p.dim, p.targetDim, 5, dt);
        p.fill = damp(p.fill, p.fillTarget, 3.6, dt);
        p.charge = Math.max(0, p.charge - dt * 2.0);   // decays after each answer
        p.kick = Math.max(0, (p.kick || 0) - dt * 2.6);
        // Eased so the kick leaves fast and returns slowly, which reads as a
        // knock rather than a wobble.
        const kick = p.kick * p.kick;

        // The idle bob is parked during the diagnostic — the board has to read
        // as a steady instrument, not something floating.
        p.holder.position.z = p.lift * 0.85 + kick * 0.55 +
          (!diag && this.hexSelected < 0 ? Math.sin(t * 0.8 + i) * 0.045 : 0);
        p.holder.scale.setScalar(1 + kick * 0.035);
        p.rimMesh.material.opacity = diag
          ? Math.min(1, p.fill * 0.42 + p.charge * 0.9 + kick * 0.8)
          : Math.min(1, p.glow * 0.9 + (i === this.hexSelected ? this.hexPop * 0.8 : 0));
        p.materials.forEach((m, k) => {
          if (diag) {
            const grey = k === 0 ? p.greyOuter : p.greyInner;
            const full = k === 0 ? p.hotOuter  : p.hotInner;
            m.color.copy(grey).lerp(full, p.fill);
            /* The glow has to come up with the fill as well, not just the
               surface colour. Each segment's emissive is its pool accent, and
               with the fog gone that alone lit an unanswered board in full
               colour — so it never read as grey. Neutral until answers arrive. */
            m.emissive.copy(EMISSIVE_OFF).lerp(p.accentColor, p.fill);
            // A floor of light stays, or the greys read as flat black.
            m.emissiveIntensity = (k === 0 ? 0.10 : 0.05)
              + p.fill * (k === 0 ? 0.52 : 0.24)
              + p.charge * 0.55;
          } else {
            m.emissive.copy(p.accentColor);   // restored: the diagnostic lerps it
            m.emissiveIntensity = (k === 0 ? 0.14 : 0.05) + p.glow * (k === 0 ? 0.5 : 0.3);
            const deep = k === 0 ? p.deepOuter : p.deepInner;
            const rest = k === 0 ? p.restOuter : p.restInner;
            const hot  = k === 0 ? p.hotOuter  : p.hotInner;
            m.color.copy(deep).lerp(rest, p.dim).lerp(hot, p.glow);
          }
        });
        // Opening a pool clears the other five away entirely.
        p.fade = damp(p.fade, diag ? 1 : p.targetFade, 9, dt);
        p.holder.visible = p.fade > 0.01;
        /* Blend only while actually fading. A fully opaque band left in the
           transparent pass gets depth-sorted against its neighbours instead of
           depth-tested, and the idle bob keeps nudging the sort order — which
           made abutting slabs take turns clipping each other, so the board
           looked like it was cropping and un-cropping on a loop. */
        const fading = p.fade < 0.995;
        p.materials.forEach(m => {
          m.opacity = p.fade;
          if (m.transparent !== fading) { m.transparent = fading; m.needsUpdate = true; }
        });
        p.rimMesh.material.opacity *= p.fade;
        p.labels.forEach(l => {
          // The diagnostic shows the shape alone. Names and verbs belong to the
          // framework page, where there is a reason to read them.
          l.visible = !diag;
          l.material.opacity = (0.34 + p.dim * 0.66) * p.fade;
          // The label carries the opposite of the board's roll, so the text
          // reads straight across while the geometry turns under it.
          l.rotation.z = l.userData.baseRot +
            (!diag && this.hexSelected === i ? this.hexFlip : 0);
        });
      });
      // The centre plate belongs to the framework view; it clears away with
      // the other sectors when a pool opens.
      // The centre lockup is a title too, so it goes with the rest on the
      // diagnostic. The plate itself stays — that is part of the shape.
      const showCore = this.hexSelected < 0 ? 1 : 0;
      this.hex.coreTitle.material.opacity = damp(this.hex.coreTitle.material.opacity, diag ? 0 : showCore, 9, dt);
      this.hex.coreTitle.visible = !diag && this.hex.coreTitle.material.opacity > 0.01;
      this.hex.coreMat.opacity = damp(this.hex.coreMat.opacity, diag ? 1 : showCore, 9, dt);
      this.hex.core.visible = this.hex.coreMat.opacity > 0.01;
      const coreFading = this.hex.coreMat.opacity < 0.995;
      if (this.hex.coreMat.transparent !== coreFading) {
        this.hex.coreMat.transparent = coreFading;
        this.hex.coreMat.needsUpdate = true;
      }

      /* Entrance. Held for as long as the camera takes to travel in from the
         attract framing, then the board rises into place. Revealing it during
         the camera move would show it sliced by the frame edge. */
      if (this.hexHold > 0) {
        this.hexHold -= dt;
        this.hexRig.visible = false;
      } else {
        this.hexRig.visible = true;
        this.hexEnter = damp(this.hexEnter ?? 1, 1, 3.6, dt);
      }
      const enter = this.hexEnter ?? 1;

      const T = this._hexSolve();
      this.hexCur = this.hexCur || { x: 0, y: 0, scale: 1, roll: 0, labelFlip: 0 };
      const C = this.hexCur;
      C.x = damp(C.x, T.x, 4.2, dt);
      C.y = damp(C.y, T.y, 4.2, dt);
      C.scale = damp(C.scale, T.scale, 4.2, dt);
      C.roll = damp(C.roll, T.roll, 4.2, dt);
      C.labelFlip = damp(C.labelFlip, T.labelFlip, 4.2, dt);
      this.hexFlip = C.labelFlip;

      this.hexRig.position.set(C.x, C.y - (1 - enter) * 1.05, 0);
      this.hexRig.scale.setScalar(C.scale * (0.92 + 0.08 * enter));
      this.hexRig.rotation.set(0, 0, C.roll);

      /* Ripple out of the core, and a short camera push toward the board. */
      if (this.hexRipple !== undefined && this.hexRipple < 1) {
        this.hexRipple = Math.min(1, this.hexRipple + dt * 1.5);
        const e = this.hexRipple;
        this.hex.ripple.scale.setScalar(1 + e * 1.15);
        this.hex.ripple.material.opacity = (1 - e) * 0.5;
        const rc = this.hexRippleColor ||
          (this.hexSelected >= 0 ? this.hex.segments[this.hexSelected].accentColor : null);
        if (rc) this.hex.ripple.material.color.copy(rc);
      } else if (this.hex.ripple) {
        this.hex.ripple.material.opacity = 0;
      }


      // a short settle when the selection changes, on top of the solved scale
      this.hexPop = damp(this.hexPop || 0, 0, 5.2, dt);
      this.hexRig.scale.setScalar(this.hexRig.scale.x * (1 + this.hexPop * 0.055));

      if (this.hexAccentLight) {
        const sel = this.hexSelected >= 0 ? this.hex.segments[this.hexSelected] : null;
        if (sel) {
          const a = sel.theta * Math.PI / 180;
          this.hexAccentLight.position.set(
            Math.cos(a) * HEX_R * 0.82, Math.sin(a) * HEX_R * 0.82, 3.2);
          this.hexAccentLight.color.copy(sel.accentColor);
        }
        /* The steady level belongs to a selection; the flash belongs to an
           answer, which has no selection behind it. Decayed separately and
           added, so a burst of answers reads as repeated pulses. */
        this.hexFlash = Math.max(0, (this.hexFlash || 0) - dt * 2.2);
        const steady = damp(this.hexAccentLight.intensity - (this.hexLastFlash || 0),
                            sel ? 22 : 0, 4, dt);
        const flash = this.hexFlash * this.hexFlash * 26;
        this.hexLastFlash = flash;
        this.hexAccentLight.intensity = steady + flash;
      }
    }

    this.groundMat.uniforms.uTime.value = t;
    this.groundMat.uniforms.uFade.value = damp(this.groundMat.uniforms.uFade.value, this.groundFadeTarget, 3, dt);
    this.dustMat.uniforms.uTime.value = t;

    /* Rotate and bob. Slow enough that it reads as ambient rather than as
       something asking to be looked at. */
    if (this.drifters) {
      for (const d of this.drifters) {
        d.obj.rotation.z += d.spin * dt;
        d.obj.position.y = d.baseY + Math.sin(t * d.rate + d.phase) * d.bob;
        d.obj.position.x += Math.cos(t * d.rate * 0.7 + d.phase) * 0.02 * dt;
      }
    }

    if (this.roomTarget) {
      this.scene.fog.color.lerp(this.roomDeep, 1 - Math.exp(-2.2 * dt));
      this.dustTint = this.dustTint || new THREE.Color(0xaecbf5);
      this.dustTint.lerp(this.roomTarget, 1 - Math.exp(-2.2 * dt));
      this.dustMat.uniforms.uTint.value.copy(this.dustTint);
    }

    if (this.pickEnabled) {
      const id = this._pick();
      if (id !== this.hoverId) {
        this.hoverId = id;
        this.canvas.style.cursor = id ? 'pointer' : 'default';
        this.tiles.forEach(x => {
          x.glowTarget = (x.pool.id === id) ? 0.46 : 0.09;
        });
      }
    }

    this.renderer.render(this.scene, this.camera);
    if (this.onFrame) this.onFrame();
  }

  /** Jump every damped value to its target. Used by the framing check
      and available if a kiosk ever needs to skip a transition. */
  snap() {
    this.spin = this.spinTarget;
    this.spread = this.spreadTarget;
    this.tilt = this.tiltTarget;
    this.off.copy(this.offTarget);
    if (this.rotTarget !== null) this.hive.rotation.y = this.rotTarget;
    this.camera.position.copy(this.camTarget);
    this.lookAt.copy(this.lookTarget);
    this.tiles.forEach(t => { t.h = t.hTarget; t.lift = t.liftTarget; t.glow = t.glowTarget; });
    this.coreFlare = this.coreFlareTarget;
    this.groundMat.uniforms.uFade.value = this.groundFadeTarget;
    this.tick();
  }

  /** NDC bounds of every visible prism — negative/over-1 means cropped. */
  measure() {
    const box = new THREE.Box3();
    const v = new THREE.Vector3();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const t of this.tiles) {
      if (!t.group.visible) continue;
      t.body.updateWorldMatrix(true, false);
      if (!t.body.geometry.boundingBox) t.body.geometry.computeBoundingBox();
      box.copy(t.body.geometry.boundingBox).applyMatrix4(t.body.matrixWorld);
      for (let i = 0; i < 8; i++) {
        v.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
        v.project(this.camera);
        minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
        minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
      }
    }
    return { minX, maxX, minY, maxY };
  }

  start() {
    /* The next frame is scheduled BEFORE tick runs. The old order meant one
       thrown frame killed the loop for good — on an unattended kiosk that is
       a dead screen until someone walks over. Errors are logged (throttled)
       instead of silently swallowed, so the cause stays visible in devtools. */
    const loop = () => {
      requestAnimationFrame(loop);
      try {
        this.tick();
      } catch (err) {
        const now = performance.now();
        if (!this._lastTickErr || now - this._lastTickErr > 5000) {
          this._lastTickErr = now;
          console.error('[kiosk] tick failed, frame skipped:', err);
        }
      }
    };
    loop();
  }
}
