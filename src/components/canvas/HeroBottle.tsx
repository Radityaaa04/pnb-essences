"use client";

import * as THREE from "three";
import { useRef, useMemo, useEffect } from "react";
import { useGLTF, useTexture, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { GLTF } from "three-stdlib";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useStore } from "@/lib/store";

gsap.registerPlugin(ScrollTrigger);

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
  scale = 15,
  position = [0, -1, 0],
}: HeroBottleProps) {
  const group       = useRef<THREE.Group>(null);
  const bottleGroup = useRef<THREE.Group>(null);
  const liquidMatRef  = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const liquidShader  = useRef<any>(null);

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
  // We use scene.clone() so all parent→child transforms are preserved,
  // which avoids the "floating pump" bug caused by extracting local transforms.
  const { scene } = useGLTF("/models/hero-v3-draco.glb") as unknown as GLTFResult;

  const roughnessMap = useTexture("/textures/kaca_luar_roughness_map.jpg");

  // BUG-07 FIX: Configure roughnessMap in a useEffect (not inside useMemo).
  // Side effects in useMemo are forbidden — React may call useMemo multiple
  // times in Strict Mode / Fast Refresh, causing flicker or material rebuilds.
  useEffect(() => {
    roughnessMap.flipY = false;
    roughnessMap.colorSpace = THREE.NoColorSpace;
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.needsUpdate = true;
  }, [roughnessMap]);

  // ── Build materials + inject liquid shader imperatively ──────────────────
  // useMemo ensures materials are created once and NOT recreated on re-renders.
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

    // 1. Kaca Luar — premium glass (MeshPhysical is better than Transmission
    //    for a black-background scene; Transmission would just refract black)
    applyMat("kaca_luar", new THREE.MeshPhysicalMaterial({
      color:              new THREE.Color("#ffffff"),
      transmission:       1.0,
      thickness:          1.5,
      roughness:          0.05,
      roughnessMap,
      ior:                1.5,
      reflectivity:       0.25,   // was 0.8 — too white, now truly transparent
      clearcoat:          0.2,    // was 1.0 — less mirror-like surface bloom
      clearcoatRoughness: 0.15,   // slight diffusion on clearcoat layer
      attenuationColor:   new THREE.Color("#e8f0f5"),
      attenuationDistance: 8.0,   // larger distance = more transparency
      transparent:        true,
      side:               THREE.DoubleSide,
    }));

    // 2. Pipet — clear plastic
    applyMat("tabung_pipet", new THREE.MeshPhysicalMaterial({
      color:        new THREE.Color("#ffffff"),
      transmission: 0.9,
      opacity:      0.5,
      transparent:  true,
      roughness:    0.2,
      ior:          1.4,
      thickness:    0.1,
    }));

    // 3. Cairan — golden amber liquid with GLSL fluid dynamics
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color:              new THREE.Color("#d18800"),
      roughness:          0.15,
      metalness:          0.1,
      transmission:       0.9,
      transparent:        true,
      ior:                1.33,
      thickness:          2.0,
      attenuationColor:   new THREE.Color("#e89517"),
      attenuationDistance: 1.5,
      side:               THREE.DoubleSide,
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

    // 4. Tutup — pitch-black titanium
    applyMat("tutup_botol", new THREE.MeshStandardMaterial({
      color:     new THREE.Color("#050505"),
      roughness: 0.25,
      metalness: 1.0,
    }));

    // 5. Pompa — HIDDEN
    // The AI-generated model has a sphere as the pump head which looks like
    // a floating gray ball above the cap. No material fix works — hide it.
    const pumpObj = clone.getObjectByName("mekanisme_pompa");
    if (pumpObj) {
      pumpObj.visible = false;
    }

    // Also hide tabung_pipet if it's adding visual noise as a float frame
    const pipetObj = clone.getObjectByName("tabung_pipet");
    if (pipetObj) {
      pipetObj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).visible = false;
        }
      });
    }

    return clone;
  }, [scene, roughnessMap]);

  // ── Animation state ───────────────────────────────────────────────────────
  const scrollData = useRef({
    xOffset: 0, yOffset: 0, yRotOffset: 0, scaleOffset: 1, colorProgress: 0,
  });
  const smoothMouse    = useRef({ x: 0, y: 0 });
  const elapsedTime    = useRef(0);
  const lastScrollY    = useRef(0);
  const smoothVelocity = useRef(0);

  const isEntered = useStore((state) => state.isEntered);

  useEffect(() => {
    const sd = scrollData.current;
    if (!isEntered) {
      gsap.set(sd, { yOffset: 5, scaleOffset: 0.8, yRotOffset: -Math.PI });
      return;
    }
    gsap.to(sd, { yOffset: 0, scaleOffset: 1, yRotOffset: 0, duration: 2.5, ease: "power3.out" });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: "#hero", start: "top top", endTrigger: "body", end: "bottom bottom", scrub: 0.5 },
    });

    tl.to(sd, { xOffset: 3.0,  yOffset: -0.3, yRotOffset: Math.PI * 0.3, scaleOffset: 1.0,  colorProgress: 0.5, ease: "power2.inOut" });
    tl.to(sd, { xOffset: 0,    yOffset: -0.8, yRotOffset: Math.PI * 4,   scaleOffset: 0.35, colorProgress: 1.0, ease: "power2.inOut" });
    tl.to(sd, { yOffset: 12,               yRotOffset: Math.PI * 4.5, scaleOffset: 0,                        ease: "power2.in" });

    return () => { tl.scrollTrigger?.kill(); tl.kill(); };
  }, [isEntered]);

  // ── Per-frame updates ─────────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!group.current || !bottleGroup.current) return;
    const sd = scrollData.current;

    elapsedTime.current += delta;

    // Scroll velocity
    const curY = window.scrollY;
    let raw = (curY - lastScrollY.current) * 0.05;
    raw = Math.max(-2.5, Math.min(2.5, raw));
    lastScrollY.current = curY;
    smoothVelocity.current = smoothVelocity.current * 0.9 + raw * 0.1;

    if (liquidShader.current) {
      liquidShader.current.uniforms.uTime.value           = elapsedTime.current;
      liquidShader.current.uniforms.uScrollVelocity.value = smoothVelocity.current;
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
    group.current.position.y = position[1] + sd.yOffset + Math.sin(elapsedTime.current * 0.8) * 0.15;
    const s = scale * sd.scaleOffset;
    group.current.scale.set(s, s, s);

    bottleGroup.current.rotation.y = sd.yRotOffset + smoothMouse.current.x * 0.35;
    bottleGroup.current.rotation.x = smoothMouse.current.y * 0.15;
  });

  return (
    <group ref={group}>
      <group ref={bottleGroup}>
        {/* scene.clone() preserves the full parent→child hierarchy, fixing
            the "floating pump" transform bug that individual node extraction caused */}
        <primitive object={clonedScene} />
      </group>

      {/* GPU Sparkles — replaces the 120-particle CPU shader */}
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
