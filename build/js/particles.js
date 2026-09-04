/* =============================================================
   DRIFT — a thin particle field over the render plates.

   Its own canvas and its own renderer rather than a group inside scene.js,
   because that canvas is deliberately dark on every screen but the framework
   overview. Making it visible everywhere would drag the ring, the ground plane
   and the navy fog along with it. This layer is 150 points, one draw call, no
   lights, no depth buffer, and it can be switched off by deleting one line in
   app.js.

   The scene already had a dust field, and it could never have shown: it blends
   additively with a pale blue tint, and additive blending over a white ground
   is a no-op. It is gone; this replaces it.
   ============================================================= */

import * as THREE from '../vendor/three.module.js';

const N = 150;
const NEAR = -1.5, FAR = -9;        // depth slab the points sit in

export class Drift {
  constructor(canvas) {
    this.canvas = canvas;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.clock = new THREE.Clock();

    /* low-power on purpose: this runs all day on a kiosk beside a second
       context, and it is 150 unlit points. antialias off — the sprites carry
       their own edge falloff, so MSAA would cost samples for nothing. */
    this.renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: false, powerPreference: 'low-power', depth: false
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 100);

    // Where the pointer is, in NDC. Off-screen until something moves.
    this.pointer = new THREE.Vector2(-3, -3);
    this.pointerAt = new THREE.Vector2(-3, -3);
    this.par = new THREE.Vector2(0, 0);

    this._build();
    this._bind();
    this.resize();
    this._loop();
  }

  _build() {
    const pos = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      /* x and y are normalised to the frustum, not world units: the shader
         expands them against the visible half-extent at that point's depth.
         Placing them in world units put most of the field outside the camera —
         a slab wide enough for the far plane is far wider than the near one. */
      pos[i * 3]     = Math.random() * 2 - 1;
      pos[i * 3 + 1] = Math.random() * 2 - 1;
      pos[i * 3 + 2] = NEAR + Math.random() * (FAR - NEAR);
      seed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    // Everything is placed per-frame in the shader, so three's own culling has
    // nothing useful to test against.
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e3);

    this.mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      // Normal alpha, not additive. The ground is white now, and additive over
      // white draws nothing at all.
      blending: THREE.NormalBlending,
      uniforms: {
        uTime:    { value: 0 },
        uSize:    { value: 3.4 * Math.min(window.devicePixelRatio, 1.5) },
        uAspect:  { value: 16 / 9 },
        uTanHalf: { value: Math.tan(THREE.MathUtils.degToRad(42) / 2) },
        uPointer: { value: new THREE.Vector2(-3, -3) },
        uPar:     { value: new THREE.Vector2(0, 0) },
        uPush:    { value: this.reduced ? 0 : 1 },
        uDrift:   { value: this.reduced ? 0 : 1 },
        /* Pale, not brand blue. A blue dot darkens the plate, and the copy
           sits on the palest part of every render: a brand-blue point drifting
           behind the small --blue-lift labels took them from 4.7:1 to 3.6:1.
           A point lighter than the plate can only raise the background's
           luminance, so it cannot cut the contrast of dark type no matter
           where it drifts — measured across all twelve plates, the change is
           between -0.07 and +0.72 and nothing crosses a threshold. It also
           reads where it should: invisible over the pale reading column,
           a clear 50/255 step over the saturated artwork. */
        uTint:    { value: new THREE.Color(0xeaf4ff) },
        uAlpha:   { value: 1 }
      },
      vertexShader: `
        attribute float aSeed;
        uniform float uTime, uSize, uAspect, uTanHalf, uPush, uDrift;
        uniform vec2 uPointer, uPar;
        varying float vA;
        void main() {
          float s = aSeed * 6.2831853;
          float z = position.z;

          // The frustum at this depth, with a margin so drift and parallax
          // never walk a point in from a visible edge.
          float hh = -z * uTanHalf * 1.35;
          float hw = hh * uAspect;

          vec2 n = position.xy;
          // Slow, unsynchronised drift, in units of the local frustum so it
          // reads at the same speed at every depth.
          n.x += sin(uTime * 0.061 + s * 3.1) * 0.16 * uDrift;
          n.y += cos(uTime * 0.047 + s * 2.3) * 0.16 * uDrift;

          // Parallax: near points lead, far points lag, so moving the pointer
          // opens a little depth in what is otherwise a flat field.
          float depth = clamp((-z - 1.5) / 7.5, 0.0, 1.0);
          n += uPar * mix(0.30, 0.05, depth);

          vec3 p = vec3(n.x * hw, n.y * hh, z);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vec4 clip = projectionMatrix * mv;

          /* The parting around the pointer is done in screen space, after the
             projection, so a point far from the camera moves aside by the same
             number of pixels as a near one. Doing it in world space made the
             far ones barely twitch. */
          vec2 ndc = clip.xy / clip.w;
          vec2 d = (ndc - uPointer) * vec2(uAspect, 1.0);
          float dist = length(d);
          float push = smoothstep(0.42, 0.02, dist) * 0.20 * uPush;
          ndc += normalize(d + vec2(1e-4)) * push * vec2(1.0 / uAspect, 1.0);
          clip.xy = ndc * clip.w;
          gl_Position = clip;

          gl_PointSize = uSize * (0.5 + aSeed) * (7.0 / -mv.z);
          // Peak 0.34 on the largest point, most of them well under it.
          vA = 0.10 + 0.24 * aSeed;
        }`,
      fragmentShader: `
        uniform vec3 uTint;
        uniform float uAlpha;
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.08, d);
          if (a <= 0.002) discard;
          gl_FragColor = vec4(uTint, vA * a * uAlpha);
        }`
    });

    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  _bind() {
    window.addEventListener('resize', () => this.resize());

    /* pointermove covers mouse and a finger dragging across the glass. A kiosk
       has no hover, so the field also has to look alive with no input at all —
       that is what the drift is for; the pointer only ever adds to it. */
    const move = e => {
      const r = this.canvas.getBoundingClientRect();
      if (!r.width) return;
      this.pointerAt.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1
      );
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', move, { passive: true });
    // A finger that leaves the glass should not leave a hole behind it.
    window.addEventListener('pointerup', () => this.pointerAt.set(-3, -3), { passive: true });
    window.addEventListener('pointerleave', () => this.pointerAt.set(-3, -3), { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) { this.clock.getDelta(); this._loop(); }
    });
  }

  /* Checked every frame off clientWidth rather than driven by events. The
     canvas measures zero while the page is still laying out, and a resize
     listener never recovers from that — nothing resizes the window afterwards,
     so the field stayed a 1x1 buffer stretched over the whole screen. A
     ResizeObserver fixed the first case and then got collected, which put it
     back. This cannot get stuck. */
  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h || (w === this._w && h === this._h)) return;
    this._w = w; this._h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.mat.uniforms.uAspect.value = w / h;
  }

  /* One knob for app.js: how present the field is on the screen showing. */
  setLevel(a) { this.mat.uniforms.uAlpha.value = a; }

  _loop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    const step = () => {
      if (document.hidden) { this._raf = 0; return; }   // no frames behind a locked screen
      this._raf = requestAnimationFrame(step);
      this.resize();
      const dt = Math.min(this.clock.getDelta(), 0.05);
      const t = this.clock.elapsedTime;
      const k = 1 - Math.exp(-6 * dt);
      this.pointer.lerp(this.pointerAt, k);
      const on = this.pointerAt.x > -2;
      this.par.lerp(
        on ? { x: this.pointerAt.x * 0.34, y: this.pointerAt.y * 0.20 } : { x: 0, y: 0 },
        1 - Math.exp(-1.8 * dt)
      );
      const u = this.mat.uniforms;
      u.uTime.value = t;
      u.uPointer.value.copy(this.pointer);
      u.uPar.value.copy(this.par);
      this.renderer.render(this.scene, this.camera);
    };
    step();
  }
}
