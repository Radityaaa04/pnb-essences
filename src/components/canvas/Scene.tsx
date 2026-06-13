// @ts-nocheck — @react-three/postprocessing v3 has broken JSX types with React 19; runtime is fine.
"use client";

import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import HeroBottle from "./HeroBottle";
import { useRef, useEffect, useMemo } from "react";
import { scrollVelocity } from "@/lib/velocity";
import { useStore } from "@/lib/store";

// Lives inside Canvas so it can use R3F hooks; tracks mouse via window
// so pointer-events-none on the container div stays intact for scrolling.
function SceneContent() {
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return <HeroBottle mouse={mouse} scale={1.5} position={[0, -1, 0]} />;
}

// Shader Hooking: Tie chromatic aberration intensity to scroll velocity and burst effect
function ReactiveAberration() {
  const effectRef = useRef<any>(null);
  
  // Stable offset vector created once per component lifecycle
  const aberrationOffset = useMemo(() => new THREE.Vector2(0.0008, 0.0008), []);

  useFrame(() => {
    if (effectRef.current) {
      const v = Math.abs(scrollVelocity.current);
      
      // Read directly from store to avoid re-rendering the EffectComposer pass
      const burstActive = useStore.getState().burstActive;

      // Target offset is much smaller for a subtle luxury effect
      let targetOffset = 0.0001 + Math.min(v * 0.0003, 0.0008);

      // If burst is active (section transition), spike the aberration
      if (burstActive) {
        targetOffset = 0.008; // Subtle cinematic glitch
      }

      // Faster lerp for burst onset, slower for graceful decay
      const lerpFactor = burstActive ? 0.3 : 0.05;

      effectRef.current.offset.x = THREE.MathUtils.lerp(effectRef.current.offset.x, targetOffset, lerpFactor);
      effectRef.current.offset.y = THREE.MathUtils.lerp(effectRef.current.offset.y, targetOffset, lerpFactor);
    }
  });

  return (
    <ChromaticAberration
      ref={effectRef}
      blendFunction={BlendFunction.NORMAL}
      offset={aberrationOffset}
    />
  );
}

export default function Scene() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{
          antialias: false,
          alpha: true,
          stencil: false,
          powerPreference: "high-performance",
        }}
      >
        <ambientLight intensity={0.1} />
        {/* Key Light — dari atas kanan, memotong sisi kaca dengan highlight yang elegan */}
        <spotLight position={[5, 8, 5]} angle={0.2} penumbra={0.8} intensity={0.8} />
        {/* Fill Light — dari kiri atas, sisi kaca yang tidak terkena key light tidak pitch black */}
        <directionalLight position={[-4, 4, -3]} intensity={0.3} color="#8899cc" />
        {/* Backlight — dari belakang bawah, membuat tepi kaca bersinar (rim light) tapi lebih halus */}
        <spotLight position={[0, -3, -8]} intensity={1.5} color="#ffffff" distance={25} penumbra={0.5} />
        {/* Amber Under Light — dari bawah, pantulan hangat dari cairan parfum ke dalam kaca */}
        <pointLight position={[0, -4, 2]} intensity={0.5} color="#c8860a" distance={10} />

        <SceneContent />

        {/* ContactShadows: physically-accurate soft shadow baked beneath the bottle.
            blur=2.5 gives the wide soft penumbra of studio photography.          */}
        <ContactShadows
          position={[0, -2.5, 0]}
          opacity={0.55}
          scale={12}
          blur={2.5}
          far={4}
          color="#000000"
        />

        {/* Environment: city HDRI gives complex multi-angle reflections
            without a single overpowering light source dominating the glass. */}
        <Environment
          preset="city"
          environmentIntensity={0.5}
          background={false}
        />

        {/* Post-Processing Pipeline */}
        <EffectComposer
          disableNormalPass
          multisampling={0}
          frameBufferType={THREE.HalfFloatType}
        >
          <Bloom luminanceThreshold={2.0} mipmapBlur intensity={0.8} />
          <ReactiveAberration />
          {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore postprocessing v3 JSX types incompatible with React 19
          }
          <Noise opacity={0.06} />
          {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore postprocessing v3 JSX types incompatible with React 19
          }
          <Vignette eskil={false} offset={0.3} darkness={0.9} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
