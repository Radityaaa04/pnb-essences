"use client";

import * as THREE from "three";
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { scrollVelocity } from "@/lib/velocity";
import { useStore } from "@/lib/store";

// ── Constants ──────────────────────────────────────────────────────────────────
const MAX_PARTICLES = 800;
const MAX_AGE       = 5.0; // seconds until a particle fully fades

// ── Vertex Shader ─────────────────────────────────────────────────────────────
// Positions are computed entirely on the GPU from aBirthPos + time-based drift.
// Three.js frustum culling is disabled so dummy CPU positions don't matter.
const vertexShader = /* glsl */`
  uniform float uTime;
  uniform vec3  uMouseWorld;

  attribute vec3  aBirthPos;
  attribute float aBirthTime;
  attribute float aSeed;        // random [0, 1] per particle, static over lifetime

  varying float vAlpha;

  void main() {
    float age      = uTime - aBirthTime;
    float progress = clamp(age / ${MAX_AGE.toFixed(1)}, 0.0, 1.0);

    // Dead particle (never born or expired): push to far plane, zero size
    if (aBirthTime < -100.0 || progress >= 0.99) {
      vAlpha       = 0.0;
      gl_Position  = vec4(0.0, 0.0, 10000.0, 1.0);
      gl_PointSize = 0.0;
      return;
    }

    // ── Organic drift: phase-shifted oscillators simulate curl noise ──────
    float spread = progress * (1.0 + aSeed * 0.6);
    vec3 drift;
    drift.x = sin(uTime * 0.70 + aSeed * 6.283) * 0.45 * spread
             + sin(uTime * 1.40 + aSeed * 2.094) * 0.22 * spread;
    drift.y = progress * 1.5          // buoyancy: rises upward over lifetime
             + cos(uTime * 0.50 + aSeed * 4.189) * 0.18 * spread;
    drift.z = sin(uTime * 0.90 + aSeed * 5.236) * 0.38 * spread;

    vec3 worldPos = aBirthPos + drift;

    // ── Mouse attraction: particles drift toward the cursor ───────────────
    // Simulates scent being drawn to someone nearby.
    vec3  toMouse    = uMouseWorld - worldPos;
    float mouseDist  = length(toMouse);
    float attraction = smoothstep(3.5, 0.0, mouseDist) * 0.40;
    worldPos += normalize(toMouse) * attraction;

    // ── Alpha: sine envelope — peaks at mid-life, transparent at ends ─────
    vAlpha = sin(progress * 3.14159) * 0.10 * (0.5 + aSeed * 0.5);

    // ── Size: gaussian bell curve over lifetime ───────────────────────────
    vec4  mvPos = modelViewMatrix * vec4(worldPos, 1.0);
    gl_Position  = projectionMatrix * mvPos;
    gl_PointSize = (2.5 + aSeed * 6.0)
                 * sin(progress * 3.14159)
                 * (280.0 / max(-mvPos.z, 0.001));
  }
`;

// ── Fragment Shader ───────────────────────────────────────────────────────────
const fragmentShader = /* glsl */`
  varying float vAlpha;

  void main() {
    // Soft gaussian disc — no hard edges
    float dist  = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = smoothstep(1.0, 0.0, dist);
    if (alpha < 0.006) discard;

    // Warm amber gold — matches the bottle liquid, Sparkles, and CausticsGlow
    vec3 color = vec3(0.78, 0.53, 0.06);
    gl_FragColor = vec4(color, alpha * vAlpha);
  }
`;

// ── Component ─────────────────────────────────────────────────────────────────
interface SillageTrailProps {
  /** Raw mouse position ref from Scene — x/y in NDC space [-1, 1] */
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  /** Bottle world-space position, updated each frame by HeroBottle (plain object) */
  bottlePos: React.MutableRefObject<{ x: number; y: number; z: number }>;
}

export default function SillageTrail({ mouse, bottlePos }: SillageTrailProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // ── Per-particle data (CPU-side, pushed to GPU when particles emit) ───────
  const pBirthPos  = useMemo(() => new Float32Array(MAX_PARTICLES * 3), []);
  const pBirthTime = useMemo(() => {
    const a = new Float32Array(MAX_PARTICLES);
    a.fill(-9999); // –9999 = "never born", shader treats as dead
    return a;
  }, []);
  const pSeed = useMemo(() => {
    const a = new Float32Array(MAX_PARTICLES);
    for (let i = 0; i < MAX_PARTICLES; i++) a[i] = Math.random();
    return a;
  }, []);

  // Emission state — refs avoid re-renders
  const emitIdx  = useRef(0);                             // circular buffer pointer
  const lastEmit = useRef(-1);                            // last emission timestamp
  const prevPos  = useRef({ x: 0, y: -1, z: 0 });        // previous bottle position (plain obj)

  // ── BufferGeometry ────────────────────────────────────────────────────────
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    // Dummy positions at origin — vertex shader computes actual world positions.
    // All three attributes need to be the same length (MAX_PARTICLES).
    geo.setAttribute("position",   new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3));
    geo.setAttribute("aBirthPos",  new THREE.BufferAttribute(pBirthPos,  3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("aBirthTime", new THREE.BufferAttribute(pBirthTime, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("aSeed",      new THREE.BufferAttribute(pSeed,      1));
    return geo;
  }, [pBirthPos, pBirthTime, pSeed]);

  // ── ShaderMaterial ────────────────────────────────────────────────────────
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending, // additive: bright on black, invisible on white
    uniforms: {
      uTime:       { value: 0 },
      uMouseWorld: { value: new THREE.Vector3() },
    },
  }), []);

  // Disable frustum culling — dummy CPU positions are all at origin (0,0,0),
  // so Three.js would incorrectly cull when the camera moves. Actual positions
  // are computed in the vertex shader via aBirthPos.
  useEffect(() => {
    if (pointsRef.current) pointsRef.current.frustumCulled = false;
  }, []);

  // ── Per-frame: update uniforms + emit particles ───────────────────────────
  useFrame((state) => {
    const t   = state.clock.getElapsedTime();
    const vel = Math.abs(scrollVelocity.current);
    const bp  = bottlePos.current;

    // Update time uniform
    material.uniforms.uTime.value = t;

    // Convert mouse NDC → approximate world XY (camera z=8, fov=45 ≈ 4.5× scale)
    const mw = material.uniforms.uMouseWorld.value as THREE.Vector3;
    mw.set(mouse.current.x * 4.5, mouse.current.y * 4.5, 0.0);

    // Determine if bottle moved enough to warrant emission
    const dx0       = bp.x - prevPos.current.x;
    const dy0       = bp.y - prevPos.current.y;
    const dz0       = bp.z - prevPos.current.z;
    const moved     = Math.sqrt(dx0 * dx0 + dy0 * dy0 + dz0 * dz0) > 0.006;
    
    // Read cinematic scroll state
    const p = useStore.getState().scrollProgress;
    
    // Emission logic:
    // - Always emit if bottle is actively moving or high scroll velocity
    // - During "Transmission" phase (0.15 - 0.7), actively emit to create intensity
    // - Otherwise, stay dormant or fade out
    const cinematicEmit = (p > 0.15 && p < 0.7);
    const shouldEmit    = moved || vel > 0.15 || cinematicEmit;

    if (shouldEmit && t - lastEmit.current > 0.014) {
      lastEmit.current = t;
      prevPos.current.x = bp.x;
      prevPos.current.y = bp.y;
      prevPos.current.z = bp.z;

      // Emit more particles when scrolling fast; minimum 1 per tick
      const count = Math.min(Math.ceil(vel * 5 + 1), 9);
      const sc    = 0.28; // scatter radius around bottle center

      for (let e = 0; e < count; e++) {
        const i = emitIdx.current;
        pBirthPos[i * 3]     = bp.x + (Math.random() - 0.5) * sc;
        pBirthPos[i * 3 + 1] = bp.y + (Math.random() - 0.5) * sc + 0.5; // slight upward offset
        pBirthPos[i * 3 + 2] = bp.z + (Math.random() - 0.5) * sc;
        pBirthTime[i]        = t;
        emitIdx.current      = (i + 1) % MAX_PARTICLES; // wrap circular buffer
      }

      // Flag changed attributes for GPU upload
      (geometry.attributes.aBirthPos  as THREE.BufferAttribute).needsUpdate = true;
      (geometry.attributes.aBirthTime as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
