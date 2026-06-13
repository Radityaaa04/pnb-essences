"use client";

import { useProgress } from "@react-three/drei";
import { useEffect, useState } from "react";
import gsap from "gsap";
import { useStore } from "@/lib/store";
import { audioManager } from "@/lib/audioManager";

export default function Preloader() {
  const { progress } = useProgress();
  const [ready, setReady] = useState(false);
  const enter = useStore((state) => state.enter);
  const isEntered = useStore((state) => state.isEntered);
  const [isInitiating, setIsInitiating] = useState(false);

  useEffect(() => {
    // If progress is 100%, we wait a tiny bit to ensure everything is initialized
    if (progress === 100) {
      const timer = setTimeout(() => setReady(true), 500);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  const handleEnter = () => {
    if (isInitiating) return;
    setIsInitiating(true);

    // 1. Initialize audio context (requires user gesture)
    audioManager.init();
    audioManager.playClick();
    audioManager.startAmbient();

    // 2. Animate out the preloader
    gsap.to(".preloader-container", {
      opacity: 0,
      duration: 1.5,
      ease: "power2.inOut",
      onComplete: () => {
        // 3. Trigger global "enter" state to start the rest of the site animations
        enter();
      },
    });

    // BUG-04 FIX: Fallback — if the tab is in the background when the GSAP
    // animation runs, onComplete may never fire. Force enter() after a safe
    // timeout (animation duration + generous buffer).
    const ANIMATION_DURATION_MS = 1500;
    const BUFFER_MS = 500;
    setTimeout(() => {
      if (!useStore.getState().isEntered) {
        enter();
      }
    }, ANIMATION_DURATION_MS + BUFFER_MS);
  };

  if (isEntered) return null;

  return (
    <div className="preloader-container fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#050505] text-white">
      {/* Background grain for texture (Inline SVG to avoid missing asset) */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}
      ></div>
      
      <div className="flex flex-col items-center space-y-8 z-10">
        <h1 className="text-xs uppercase tracking-[0.5em] text-gray-500">PNB ESSENCES / LAB</h1>
        
        <div className="text-5xl md:text-7xl font-light tabular-nums tracking-tighter">
          {Math.round(progress)}%
        </div>

        <div className="h-10 flex items-center justify-center">
          {ready ? (
            <button
              onClick={handleEnter}
              className="px-6 py-2 text-xs border border-white/20 hover:border-white/60 hover:bg-white/10 uppercase tracking-[0.2em] transition-all duration-300"
              data-cursor="hover"
            >
              [ INITIATE SEQUENCE ]
            </button>
          ) : (
            <div className="w-32 h-[1px] bg-white/20 overflow-hidden relative">
              <div 
                className="absolute top-0 left-0 h-full bg-white transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
