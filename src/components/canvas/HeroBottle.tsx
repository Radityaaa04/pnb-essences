"use client";

import * as THREE from "three";
import { useRef, useMemo, useEffect } from "react";
import { useGLTF, useTexture, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { GLTF } from "three-stdlib";
import gsap from "gsap";
import { useStore } from "@/lib/store";
import { usePathname } from "next/navigation";

// ─── Caustics floor glow ─────────────────────────────────────────────────────
const CausticsGlow = () => {
  const fragmentShader = `
    varying vec2 vUv;
    void main() {
      float dist = length(vUv - 0.5);
      float intensity = 1.0 - smoothstep(0.0, 0.5, dist);
      intensity = pow(intensity, 1.8);
      vec3 color = vec3(1.0, 0.45, 0.0);
      gl_FragColor = vec4(color, intensity * 0.65);
    }
  `;
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.3, 0]} scale={[4.0, 4.0, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface HeroBottleProps {
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  /** Shared ref — SillageTrail reads this to know where to emit particles (plain object) */
  bottlePos?: React.MutableRefObject<{ x: number; y: number; z: number }>;
  scale?: number;
  position?: [number, number, number];
}

type GLTFResult = GLTF & {
  nodes: Record<string, THREE.Mesh>;
  materials: Record<string, THREE.Material>;
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function HeroBottle({
  mouse,
  bottlePos,
  scale = 15,
  position = [0, -1, 0],
}: HeroBottleProps) {
  const pathname = usePathname();
  const group       = useRef<THREE.Group>(null);
  const bottleGroup = useRef<THREE.Group>(null);
  const liquidMatRef  = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const liquidShader  = useRef<any>(null);

  // ── [NEW] Chromatic Resonance refs ────────────────────────────────────────
  // glassShader: captured in onBeforeCompile, updated each frame
  // smoothResonance: lerped value [0→1] driven by mouse↔bottle proximity
  // projVec: scratch Vector3 for projecting bottle pos to NDC each frame
  const glassShader     = useRef<any>(null);
  const smoothResonance = useRef(0);
  const projVec         = useRef(new THREE.Vector3());

  // ── Color-morph palette ───────────────────────────────────────────────────
  const COLOR_AMBER       = useMemo(() => new THREE.Color("#d18800"), []);
  const COLOR_AMBER_ATT   = useMemo(() => new THREE.Color("#e89517"), []);
  const COLOR_TEAL        = useMemo(() => new THREE.Color("#003d4d"), []);
  const COLOR_TEAL_ATT    = useMemo(() => new THREE.Color("#006b7d"), []);
  const COLOR_CRIMSON     = useMemo(() => new THREE.Color("#6b0000"), []);
  const COLOR_CRIMSON_ATT = useMemo(() => new THREE.Color("#9b1a1a"), []);
  const _tmpColor    = useMemo(() => new THREE.Color(), []);
  const _tmpColorAtt = useMemo(() => new THREE.Color(), []);

  // ── Load GLB — keep original scene graph intact via cloning ──────────────
  const { scene } = useGLTF("/models/hero-v3-draco.glb") as unknown as GLTFResult;
  const roughnessMap = useTexture("/textures/kaca_luar_roughness_map.jpg");

  // BUG-07 FIX: configure roughnessMap in useEffect (not useMemo)
  useEffect(() => {
    roughnessMap.flipY = false;
    roughnessMap.colorSpace = THREE.NoColorSpace;
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.needsUpdate = true;
  }, [roughnessMap]);

  // ── Build materials + inject shaders imperatively ─────────────────────────
  const clonedScene = useMemo(() => {
    const clone = scene.clone();

    const applyMat = (objName: string, mat: THREE.Material) => {
      const obj = clone.getObjectByName(objName);
      if (!obj) {
        console.warn(`[HeroBottle] '${objName}' not found in GLB`);
        return;
      }
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) (child as THREE.Mesh).material = mat;
      });
    };

    // ── 1. Kaca Luar — CHROMATIC RESONANCE glass ──────────────────────────
    // onBeforeCompile injects two GLSL effects driven by mouse proximity:
    //   • Vertex: Fourier standing wave displacement (physical ripple on glass)
    //   • Fragment: Thin-film iridescent interference (rainbow spectral bands)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color:               new THREE.Color("#ffffff"),
      transmission:        1.0,
      thickness:           1.5,
      roughness:           0.05,
      roughnessMap,
      ior:                 1.5,
      reflectivity:        0.25,
      clearcoat:           0.2,
      clearcoatRoughness:  0.15,
      attenuationColor:    new THREE.Color("#e8f0f5"),
      attenuationDistance: 8.0,
      transparent:         true,
      side:                THREE.DoubleSide,
    });

    glassMat.onBeforeCompile = (shader) => {
      // Inject custom uniforms — updated every frame in useFrame
      shader.uniforms.uTime      = { value: 0 };
      shader.uniforms.uResonance = { value: 0 };
      glassShader.current = shader;

      // ── Vertex: Fourier standing wave displacement ──────────────────────
      // Three harmonics at irrational-ratio frequencies create a non-repeating
      // standing wave pattern. Displacement is along objectNormal (surface normal
      // in local space), so it ripples the glass geometry outward/inward.
      shader.vertexShader = `uniform float uTime;\nuniform float uResonance;\n${shader.vertexShader}`;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>
        // Fourier harmonics: frequencies chosen to avoid periodicity
        float gw1 = sin(position.y *  8.0 + uTime * 2.5) * 0.022;
        float gw2 = sin(position.x * 13.0 - uTime * 1.8) * 0.014;
        float gw3 = sin(position.z *  5.0 + uTime * 3.1) * 0.018;
        // normal attribute is the raw per-vertex normal in local space
        transformed += normalize(normal) * (gw1 + gw2 + gw3) * uResonance;
        `
      );

      // ── Fragment: thin-film iridescent interference ─────────────────────
      // vWorldPosition is available because USE_TRANSMISSION is defined
      // (transmission: 1.0 on the material).
      // We use three non-harmonic oscillators to produce an aperiodic rainbow:
      //   freq 1.000 — fundamental
      //   freq 1.618 — golden ratio (φ) — avoids octave repetition
      //   freq 2.414 — silver ratio (1+√2) — avoids harmonic repetition
      // A secondary X-axis wave creates a 2D interference grid.
      shader.fragmentShader = `uniform float uTime;\nuniform float uResonance;\n${shader.fragmentShader}`;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <tonemapping_fragment>",
        `
        // ── Thin-film spectral interference ─────────────────────────────
        float phaseY = vWorldPosition.y * 7.0 + uTime * 0.8;
        float ri = sin(phaseY * 1.000) * 0.5 + 0.5;
        float gi = sin(phaseY * 1.618) * 0.5 + 0.5;  // φ
        float bi = sin(phaseY * 2.414) * 0.5 + 0.5;  // silver ratio

        // Transverse X-wave creates 2D interference pattern
        float phaseX = vWorldPosition.x * 5.0 - uTime * 0.6;
        ri *= sin(phaseX * 0.793) * 0.5 + 0.5;
        gi *= sin(phaseX * 1.000) * 0.5 + 0.5;
        bi *= sin(phaseX * 1.272) * 0.5 + 0.5;

        // Quadratic resonance gives a dramatic "snap" into iridescence —
        // stays subtle until cursor is very close, then blazes.
        float iridStrength = uResonance * uResonance * 0.90;
        gl_FragColor.rgb   = mix(
          gl_FragColor.rgb,
          gl_FragColor.rgb + vec3(ri, gi, bi) * 0.70,
          iridStrength
        );
        #include <tonemapping_fragment>
        `
      );
    };

    applyMat("kaca_luar", glassMat);

    // ── 2. Pipet — clear plastic ───────────────────────────────────────────
    applyMat("tabung_pipet", new THREE.MeshPhysicalMaterial({
      color:        new THREE.Color("#ffffff"),
      transmission: 0.9,
      opacity:      0.5,
      transparent:  true,
      roughness:    0.2,
      ior:          1.4,
      thickness:    0.1,
    }));

    // ── 3. Cairan — golden amber liquid with GLSL fluid dynamics ──────────
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color:               new THREE.Color("#d18800"),
      roughness:           0.15,
      metalness:           0.1,
      transmission:        0.9,
      transparent:         true,
      ior:                 1.33,
      thickness:           2.0,
      attenuationColor:    new THREE.Color("#e89517"),
      attenuationDistance: 1.5,
      side:                THREE.DoubleSide,
    });

    liquidMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime           = { value: 0 };
      shader.uniforms.uScrollVelocity = { value: 0 };
      liquidShader.current = shader;

      shader.vertexShader = `
        uniform float uTime;
        uniform float uScrollVelocity;
        ${shader.vertexShader}
      `;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>
        float intensity  = smoothstep(-0.5, 0.8, position.y);
        float wave       = sin(position.x * 8.0 + uTime * 10.0) * 0.06 * abs(uScrollVelocity) * intensity;
        float waveZ      = cos(position.z * 8.0 + uTime *  8.0) * 0.04 * abs(uScrollVelocity) * intensity;
        transformed.y   += wave + waveZ;
        float sloshTilt  = position.x * (uScrollVelocity * 0.4) * intensity;
        transformed.y   -= sloshTilt;
        `
      );
    };

    liquidMatRef.current = liquidMat;
    applyMat("cairan_dalam", liquidMat);

    // ── 4. Tutup — pitch-black titanium ───────────────────────────────────
    applyMat("tutup_botol", new THREE.MeshStandardMaterial({
      color:     new THREE.Color("#050505"),
      roughness: 0.25,
      metalness: 1.0,
    }));

    // ── 5. Hide pump + pipet (model artifacts) ────────────────────────────
    const pumpObj = clone.getObjectByName("mekanisme_pompa");
    if (pumpObj) pumpObj.visible = false;

    const pipetObj = clone.getObjectByName("tabung_pipet");
    if (pipetObj) {
      pipetObj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) (child as THREE.Mesh).visible = false;
      });
    }

    return clone;
  }, [scene, roughnessMap]); // eslint-disable-line react-hooks/exhaustive-deps
  // glassShader and liquidShader are refs — excluded intentionally

  // ── Animation state ───────────────────────────────────────────────────────
  const scrollData = useRef({
    xOffset: 0, yOffset: 0, yRotOffset: 0, scaleOffset: 1, colorProgress: 0,
  });
  const smoothMouse    = useRef({ x: 0, y: 0 });
  const elapsedTime    = useRef(0);
  const lastScrollY    = useRef(0);
  const smoothVelocity = useRef(0);
  const scrollTl       = useRef<gsap.core.Timeline | null>(null);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  }, []);

  const isEntered = useStore((state) => state.isEntered);

  useEffect(() => {
    const sd = scrollData.current;
    if (!isEntered) {
      gsap.set(sd, { yOffset: 5, scaleOffset: 0.8, yRotOffset: -Math.PI });
      return;
    }
    gsap.to(sd, { yOffset: 0, scaleOffset: 1, yRotOffset: 0, duration: 2.5, ease: "power3.out" });

    // Create a paused timeline that we'll scrub manually via scrollProgress
    const tl = gsap.timeline({ paused: true });

    // FIX: Use fromTo for the first step so we don't capture the yOffset=5 from the intro animation!
    tl.fromTo(sd, 
      { xOffset: 0, yOffset: 0, yRotOffset: 0, scaleOffset: 1.0, colorProgress: 0 },
      { xOffset: 3.0, yOffset: -0.3, yRotOffset: Math.PI * 0.3, scaleOffset: 1.0, colorProgress: 0.5, ease: "power2.inOut", duration: 0.5 }, 
      0
    );
    tl.to(sd, { xOffset: 0,    yOffset: -0.8, yRotOffset: Math.PI * 4,   scaleOffset: 0.35, colorProgress: 1.0, ease: "power2.inOut", duration: 0.3 }, 0.5);
    tl.to(sd, { yOffset: 12,                  yRotOffset: Math.PI * 4.5, scaleOffset: 0,                        ease: "power2.in", duration: 0.2 }, 0.8);

    scrollTl.current = tl;

    return () => { tl.kill(); };
  }, [isEntered]);

  // ── Per-frame updates ─────────────────────────────────────────────────────
  useFrame((state, delta) => {
    if (!group.current || !bottleGroup.current) return;
    const sd = scrollData.current;

    elapsedTime.current += delta;

    // Scroll velocity
    const curY = window.scrollY;
    let raw = (curY - lastScrollY.current) * 0.05;
    raw = Math.max(-2.5, Math.min(2.5, raw));
    lastScrollY.current = curY;
    smoothVelocity.current = smoothVelocity.current * 0.9 + raw * 0.1;

    // Liquid shader uniforms
    if (liquidShader.current) {
      liquidShader.current.uniforms.uTime.value           = elapsedTime.current;
      liquidShader.current.uniforms.uScrollVelocity.value = smoothVelocity.current;
    }

    // ── [NEW] Chromatic Resonance: mouse proximity + Cinematic Scroll ────
    // Combine mouse proximity resonance with scroll-driven narrative resonance
    if (glassShader.current) {
      projVec.current.copy(group.current.position).project(state.camera);
      const dx   = mouse.current.x - projVec.current.x;
      const dy   = mouse.current.y - projVec.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const t        = Math.min(1.0, dist / 1.2);
      const smooth   = t * t * (3.0 - 2.0 * t);
      
      // Mouse interaction target
      let target = 1.0 - smooth;

      // Add cinematic scroll resonance
      // Peak resonance at progress 0.3 to 0.6 (The Transmission phase)
      const p = useStore.getState().scrollProgress;
      if (scrollTl.current && p > 0) {
        scrollTl.current.progress(p);
      }

      if (p > 0.15 && p < 0.7) {
        // Bell curve peaking at 0.425
        const cinematic = Math.sin((p - 0.15) / 0.55 * Math.PI);
        target = Math.max(target, cinematic * 1.5); // Cinematic resonance is stronger
      }

      smoothResonance.current += (target - smoothResonance.current) * 0.04;
      glassShader.current.uniforms.uTime.value      = elapsedTime.current;
      glassShader.current.uniforms.uResonance.value = smoothResonance.current;
    }

    // Mouse parallax
    smoothMouse.current.x += (mouse.current.x - smoothMouse.current.x) * 0.05;
    smoothMouse.current.y += (mouse.current.y - smoothMouse.current.y) * 0.05;

    // Color morph
    if (liquidMatRef.current) {
      const p = sd.colorProgress;
      if (p <= 0.5) {
        _tmpColor.lerpColors(COLOR_AMBER, COLOR_TEAL, p * 2);
        _tmpColorAtt.lerpColors(COLOR_AMBER_ATT, COLOR_TEAL_ATT, p * 2);
      } else {
        _tmpColor.lerpColors(COLOR_TEAL, COLOR_CRIMSON, (p - 0.5) * 2);
        _tmpColorAtt.lerpColors(COLOR_TEAL_ATT, COLOR_CRIMSON_ATT, (p - 0.5) * 2);
      }
      liquidMatRef.current.color.copy(_tmpColor);
      liquidMatRef.current.attenuationColor.copy(_tmpColorAtt);
    }

    group.current.position.x = position[0] + sd.xOffset;
    group.current.position.y = position[1] + sd.yOffset + (prefersReducedMotion ? 0 : Math.sin(elapsedTime.current * 0.8) * 0.15);
    const s = scale * sd.scaleOffset;
    group.current.scale.set(s, s, s);

    bottleGroup.current.rotation.y = sd.yRotOffset + (prefersReducedMotion ? 0 : smoothMouse.current.x * 0.35);
    bottleGroup.current.rotation.x = prefersReducedMotion ? 0 : smoothMouse.current.y * 0.15;

    // ── [NEW] Share bottle world position for SillageTrail ────────────────
    if (bottlePos && group.current) {
      // Plain object assignment — compatible with { x, y, z } plain ref
      bottlePos.current.x = group.current.position.x;
      bottlePos.current.y = group.current.position.y;
      bottlePos.current.z = group.current.position.z;
    }
  });

  return (
    <group ref={group} visible={pathname === "/"}>
      <group ref={bottleGroup}>
        <primitive object={clonedScene} />
      </group>

      <Sparkles
        count={150}
        scale={5}
        size={2.0}
        speed={0.3}
        noise={0.4}
        color="#c8860a"
        opacity={0.6}
      />

      <CausticsGlow />
    </group>
  );
}

useGLTF.preload("/models/hero-v3-draco.glb");
useTexture.preload("/textures/kaca_luar_roughness_map.jpg");
