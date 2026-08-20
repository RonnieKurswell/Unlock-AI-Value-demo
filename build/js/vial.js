/* =============================================================
   THE DIAGNOSTIC VIAL

   A single upright hexagonal tube that fills with liquid as the
   questionnaire is answered. One object, one reading — how far through you
   are — rather than six things to interpret.

   The liquid is stratified: the column is divided into as many bands as
   there are value pools, in the order the questions are asked, and each band
   carries that pool's colour. So the level rises through a new hue every
   three questions, and a finished run reads as the whole framework stacked
   up. The band colours come from a nearest-filtered ramp texture, which is
   what keeps the boundaries crisp instead of blended.

   Nothing here animates itself. scene.js owns the fill level and the surge,
   the same split hex.js uses.
   ============================================================= */

import * as THREE from '../vendor/three.module.js';

export const R = 1.42;   // circumradius of the tube
export const H = 5.10;   // full height

/** 1px-tall ramp, one pixel per pool, sampled by height in the shader. */
function rampTexture(colors) {
  const data = new Uint8Array(colors.length * 4);
  colors.forEach((c, i) => {
    const col = new THREE.Color(c);
    data[i * 4 + 0] = Math.round(col.r * 255);
    data[i * 4 + 1] = Math.round(col.g * 255);
    data[i * 4 + 2] = Math.round(col.b * 255);
    data[i * 4 + 3] = 255;
  });
  const tex = new THREE.DataTexture(data, colors.length, 1, THREE.RGBAFormat);
  tex.magFilter = THREE.NearestFilter;   // crisp band edges, no blend
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const LIQUID_VERT = `
  varying float vY;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vY = position.y / ${H.toFixed(4)} + 0.5;           // 0 at the base, 1 at the brim
    vNormalW = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const LIQUID_FRAG = `
  uniform sampler2D uRamp;
  uniform float uFill;
  uniform float uSurge;
  varying float vY;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    // Everything above the level simply is not there.
    if (vY > uFill) discard;

    vec3 base = texture2D(uRamp, vec2(clamp(vY, 0.0, 0.999), 0.5)).rgb;

    // Brighter just under the surface, the way a lit liquid reads.
    float toSurface = uFill - vY;
    float meniscus = smoothstep(0.085, 0.0, toSurface);

    // Denser and darker toward the base, so the column has weight.
    float depth = smoothstep(1.0, 0.0, vY) * 0.28;

    // Rim light on the glancing angles.
    float fres = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vViewDir))), 2.4);

    vec3 col = base * (0.72 - depth);
    col += base * meniscus * 1.30;
    col += vec3(0.72, 0.85, 1.0) * fres * 0.30;
    col += base * uSurge * 0.55;

    gl_FragColor = vec4(col, 1.0);
  }
`;

/**
 * @param {Array<{id:string,color:number}>} order pools in questionnaire order,
 *        bottom band first
 */
export function buildVial(order) {
  const group = new THREE.Group();
  const ramp = rampTexture(order.map(p => p.color));

  /* ---------- the glass ---------- */
  const shellMat = new THREE.MeshPhysicalMaterial({
    color: 0x9fc4e8, roughness: 0.16, metalness: 0.0,
    transparent: true, opacity: 0.085, side: THREE.DoubleSide,
    depthWrite: false
  });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 6, 1, true), shellMat);

  // The outline is what actually makes it read as a tube; the transparent
  // shell alone disappears against a dark ground.
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.CylinderGeometry(R, R, H, 6, 1, false)),
    new THREE.LineBasicMaterial({ color: 0x7fb2dd, transparent: true, opacity: 0.32 })
  );

  /* ---------- graduation marks, one per pool boundary ---------- */
  const tickPts = [];
  for (let i = 1; i < order.length; i++) {
    const y = -H / 2 + (H * i) / order.length;
    // A short mark on the two faces that catch the light, not a full ring.
    for (const s of [-1, 1]) {
      tickPts.push(new THREE.Vector3(s * R * 0.90, y, R * 0.42));
      tickPts.push(new THREE.Vector3(s * R * 0.62, y, R * 0.42));
    }
  }
  const ticks = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(tickPts),
    new THREE.LineBasicMaterial({ color: 0xbcd6ee, transparent: true, opacity: 0.20 })
  );

  /* ---------- the liquid ---------- */
  const liquidMat = new THREE.ShaderMaterial({
    vertexShader: LIQUID_VERT,
    fragmentShader: LIQUID_FRAG,
    uniforms: {
      uRamp: { value: ramp },
      uFill: { value: 0 },
      uSurge: { value: 0 }
    },
    side: THREE.DoubleSide,
    transparent: false
  });
  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 0.93, R * 0.93, H, 6, 1, false), liquidMat);

  /* ---------- the surface ---------- */
  // Discarding above the level leaves the column open, so the meniscus is its
  // own disc, moved to the level each frame and tinted to the band it sits in.
  const capMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.92,
    side: THREE.DoubleSide, toneMapped: false
  });
  const capGeo = new THREE.CircleGeometry(R * 0.93, 6);
  capGeo.rotateX(-Math.PI / 2);
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.renderOrder = 4;

  /* ---------- base ---------- */
  const baseGeo = new THREE.CircleGeometry(R, 6);
  baseGeo.rotateX(-Math.PI / 2);
  const base = new THREE.Mesh(baseGeo, new THREE.MeshStandardMaterial({
    color: 0x0d1626, roughness: 0.3, metalness: 0.7
  }));
  base.position.y = -H / 2 + 0.004;

  group.add(shell, edges, ticks, liquid, cap, base);
  // A flat face toward the camera reads the level better than an edge-on vertex.
  group.rotation.y = Math.PI / 6;

  return { group, shell, edges, ticks, liquid, liquidMat, cap, capMat, base, ramp, order };
}
