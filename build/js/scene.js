/* =============================================================
   THREE.JS SCENE — the hexagon is the interface, not decoration.

   One object, three postures:
     flat ring      → attract, diagnostic, results, delivery
     quad menu      → sector choice (the prisms ARE the options)
     upright wheel  → framework explore (drag to rotate and read)

   `rig` carries posture and offset; `hive` carries the spin, so
   the ring can stand upright and still rotate within its plane.
   ============================================================= */

import * as THREE from '../vendor/three.module.js';
import { POOLS } from './data.js';

const RING = 1.78;
const TILE_R = 0.98;
const BASE_H = 0.26;
const MAX_H = 2.70;
const DARK = 0x080B11;
const TAU = Math.PI * 2;
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
    this.onFace = null;
    this.onFrame = null;
    this.slots = null;
    this.layout = 'ring';
    this.wheel = false;
    this.face = 0;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x05070B, 0.034);

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

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-2, -2);
    this.drag = null;
    this._bind();
    this.resize();
    this.setState('attract');
  }

  /* ---------- build ------------------------------------------ */

  _lights() {
    this.scene.add(new THREE.HemisphereLight(0x1a2436, 0x03050A, 0.65));
    const key = new THREE.DirectionalLight(0x9fc4e8, 0.9);
    key.position.set(-5, 9, 7);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x2a3f6b, 0.7);
    rim.position.set(6, 3, -7);
    this.scene.add(rim);
    this.coreLight = new THREE.PointLight(0x37A6E4, 2.0, 14, 2);
    this.scene.add(this.coreLight);
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
        pool: p, group, body, edges, halo, ping, slotKey: null,
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
      uniforms: { uTime: { value: 0 }, uSize: { value: 2.4 * Math.min(window.devicePixelRatio, 2) } },
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
      fragmentShader: `varying float vA;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          gl_FragColor = vec4(vec3(0.68,0.80,0.96), vA * (1.0 - d*2.0));
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

    this.canvas.addEventListener('pointerdown', e => {
      const p = toLocal(e);
      if (this.wheel) {
        this.drag = { x: p.clientX, rot0: this.hive.rotation.y, moved: 0 };
        this.rotTarget = null;
        try { this.canvas.setPointerCapture(e.pointerId); } catch {}
        return;
      }
      if (this.pickEnabled && this.onPick) {
        const hit = this._pick();
        if (hit) this.onPick(hit);
      }
    });

    this.canvas.addEventListener('pointermove', e => {
      const p = toLocal(e);
      if (this.drag) {
        const dx = p.clientX - this.drag.x;
        this.drag.moved = Math.max(this.drag.moved, Math.abs(dx));
        this.hive.rotation.y = this.drag.rot0 - dx * 0.0072;
      }
    });

    const release = () => {
      if (!this.drag) return;
      const tapped = this.drag.moved < 6;
      this.drag = null;
      if (tapped) {
        const hit = this._pick();
        if (hit) {
          const i = this.tiles.findIndex(t => t.pool.id === hit);
          if (i >= 0) return this.setFace(i);
        }
      }
      this.snapFace();
    };
    this.canvas.addEventListener('pointerup', release);
    this.canvas.addEventListener('pointercancel', release);
  }

  _pick() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const targets = this.tileBodies.filter(b => b.parent.visible);
    const hits = this.raycaster.intersectObjects(targets, false);
    if (!hits.length) return null;
    const d = hits[0].object.userData;
    return this.slots ? d.slotKey : d.poolId;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this._frame();
  }

  /* ---------- wheel ------------------------------------------ */

  /** Rotation that brings face i to twelve o'clock. */
  detent(i) { return -Math.PI + i * STEP; }

  faceFromRotation() {
    const raw = (this.hive.rotation.y + Math.PI) / STEP;
    return ((Math.round(raw) % 6) + 6) % 6;
  }

  /** Snap to the nearest detent without unwinding whole turns. */
  _aim(i) {
    const turns = Math.round((this.hive.rotation.y - this.detent(i)) / TAU) * TAU;
    this.rotTarget = this.detent(i) + turns;
  }

  snapFace() { const i = this.faceFromRotation(); this._aim(i); this._activate(i); }
  setFace(i) { this._aim(i); this._activate(i); }
  nextFace(d = 1) { this.setFace((this.face + d + 6) % 6); }

  _activate(i) {
    const changed = this.face !== i;
    this.face = i;
    this.tiles.forEach((t, k) => {
      const on = k === i;
      t.glowTarget = on ? 0.40 : 0.055;
      t.hTarget = on ? BASE_H + 0.60 : BASE_H + 0.10;
    });
    if (changed) this.ping(this.tiles[i].pool.id);
    if (this.onFace) this.onFace(i, this.tiles[i].pool.id);
  }

  /* ---------- public ----------------------------------------- */

  setCoreVisible(v) { this.core.visible = v; this.coreHalo.visible = v; }

  _tint(t, hex) {
    const c = new THREE.Color(hex);
    t.body.material.emissive.copy(c);
    t.edges.material.color.copy(c);
    t.halo.material.color.copy(c);
    t.ping.material.color.copy(c);
  }

  /** Repurpose the prisms as a labelled choice set. */
  setSlots(keys, tint = 0x5FA0D6) {
    this.slots = keys;
    this.layout = 'row';
    this.tiles.forEach((t, i) => {
      const on = i < keys.length;
      t.group.visible = on;
      t.slotKey = on ? keys[i] : null;
      t.body.userData.slotKey = t.slotKey;
      if (on) { this._tint(t, tint); t.hTarget = BASE_H + 1.05; t.glowTarget = 0.17; t.liftTarget = 0; }
    });
  }

  clearSlots() {
    this.slots = null;
    this.layout = 'ring';
    this.tiles.forEach(t => {
      t.group.visible = true;
      t.slotKey = null;
      t.body.userData.slotKey = null;
      this._tint(t, t.pool.color);
    });
  }

  /** Screen-space position of a tile cap, for HTML labels. */
  project(i) {
    const t = this.tiles[i];
    const v = new THREE.Vector3(0, t.h + (this.slots ? 0.42 : 0.1), 0);
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
  }

  setState(name) {
    this.state = name;
    const ST = {
      attract:     { focus: [0, 0, 0],   radius: 2.90, elev: 14, margin: 1.55, bias: [0,    0.86], spin: 0.055, spread: 1.00, fade: 0.90, tilt: 0,             off: [0, 0, 0] },
      sector:      { focus: [0, 0.4, 0], extent: [4.75, 1.70], elev: 20, margin: 1.26, bias: [0, 0.10], spin: 0, spread: 1.00, fade: 0.28, tilt: 0, off: [0, 0, 0], rot: 0 },
      explore:     { focus: [0, 0, 0],   radius: 2.85, elev: 2,  margin: 1.55, bias: [0.50, 0.02], spin: 0,     spread: 1.02, fade: 0.18, tilt: -Math.PI / 2,  off: [0, 0, 0] },
      diagnostic:  { focus: [0, 0.6, 0], radius: 3.20, elev: 32, margin: 1.70, bias: [0.52, 0.10], spin: 0.030, spread: 1.00, fade: 0.42, tilt: 0,             off: [0, 0, 0] },
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

    this.wheel = (name === 'explore');
    this.pickEnabled = (name === 'sector');
    this.setCoreVisible(!this.wheel && name !== 'sector');
    this.ground.visible = !this.wheel;
    this.canvas.style.cursor = this.wheel ? 'grab' : 'default';

    if ((name === 'attract' || name === 'delivery') && !this.slots) {
      this.tiles.forEach(t => { t.hTarget = BASE_H + 0.34; t.glowTarget = 0.10; t.liftTarget = 0; });
    }
    if (this.wheel) this.setFace(this.face);
  }

  setProgress(poolId, v) {
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
    this.tiles.forEach(t => { t.hTarget = BASE_H; t.glowTarget = 0.09; t.liftTarget = 0; });
    this.coreFlareTarget = 0;
    this.focused = null;
  }

  focus(poolId) {
    if (this.wheel) return;
    this.focused = poolId;
    this.tiles.forEach(t => {
      const on = t.pool.id === poolId;
      t.liftTarget = on ? 0.85 : 0;
      t.glowTarget = poolId ? (on ? 0.44 : 0.03) : 0.09;
    });
  }

  ping(poolId) {
    const t = this.tiles.find(x => x.pool.id === poolId);
    if (t) t.pingT = 0;
  }

  flare(v = 1) { this.coreFlareTarget = v; }

  /* ---------- frame ------------------------------------------ */

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    this.spin = damp(this.spin, this.spinTarget, 3, dt);
    if (this.rotTarget === null) { if (!this.drag) this.hive.rotation.y += this.spin * dt; }
    else this.hive.rotation.y = damp(this.hive.rotation.y, this.rotTarget, 5, dt);

    this.spread = damp(this.spread, this.spreadTarget, 4, dt);
    this.tilt = damp(this.tilt, this.tiltTarget, 3.2, dt);
    this.rig.rotation.x = this.tilt;
    this.off.lerp(this.offTarget, 1 - Math.exp(-3.2 * dt));
    this.rig.position.copy(this.off);

    this.camera.position.lerp(this.camTarget, 1 - Math.exp(-2.6 * dt));
    this.lookAt.lerp(this.lookTarget, 1 - Math.exp(-2.6 * dt));
    this.camera.position.x += this.pointer.x * 0.018;
    this.camera.position.y += this.pointer.y * 0.012;
    this.camera.lookAt(this.lookAt);

    for (const tile of this.tiles) {
      const bob = (this.state === 'attract' && !this.reduced) ? Math.sin(t * 0.62 + tile.phase) * 0.11 : 0;
      tile.h = damp(tile.h, tile.hTarget, 4.2, dt);
      tile.lift = damp(tile.lift, tile.liftTarget, 5, dt);
      tile.glow = damp(tile.glow, tile.glowTarget, 4, dt);

      if (this.layout === 'row') {
        const n = this.slots ? this.slots.length : 4;
        const i = tile.pool.index;
        const k = i - (n - 1) / 2;
        tile.group.position.set(k * 2.42, tile.lift + bob, Math.abs(k) * 0.46);
      } else {
        const a = tile.group.userData.baseAngle;
        const R = RING * this.spread;
        tile.group.position.set(Math.cos(a) * R, tile.lift + bob, Math.sin(a) * R);
      }

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

    this.groundMat.uniforms.uTime.value = t;
    this.groundMat.uniforms.uFade.value = damp(this.groundMat.uniforms.uFade.value, this.groundFadeTarget, 3, dt);
    this.dustMat.uniforms.uTime.value = t;

    if (this.wheel) {
      this.canvas.style.cursor = this.drag ? 'grabbing' : 'grab';
    } else if (this.pickEnabled) {
      const id = this._pick();
      if (id !== this.hoverId) {
        this.hoverId = id;
        this.canvas.style.cursor = id ? 'pointer' : 'default';
        this.tiles.forEach(x => {
          const key = this.slots ? x.slotKey : x.pool.id;
          const on = key && key === id;
          x.glowTarget = on ? 0.46 : (this.slots ? 0.22 : 0.09);
          if (this.slots) x.liftTarget = on ? 0.42 : 0;
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
    const loop = () => { this.tick(); requestAnimationFrame(loop); };
    loop();
  }
}
