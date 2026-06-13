"use client";

import RevealText from "@/components/ui/RevealText";
import Magnetic from "@/components/ui/Magnetic";
import MouseParallax from "@/components/ui/MouseParallax";
import ScrambleText from "@/components/ui/ScrambleText";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Ensure plugins are registered
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const setScrollProgress = useStore((state) => state.setScrollProgress);
  const startTransition = useStore((state) => state.startTransition);
  
  const containerRef = useRef<HTMLElement>(null);
  const phase1Ref = useRef<HTMLDivElement>(null);
  const phase2Ref = useRef<HTMLDivElement>(null);
  const manifesto1Ref = useRef<HTMLDivElement>(null);
  const manifesto2Ref = useRef<HTMLDivElement>(null);
  const manifesto3Ref = useRef<HTMLDivElement>(null);
  const phase4Ref = useRef<HTMLDivElement>(null);

  // Local state to trigger scramble text only once without causing 60fps re-renders
  const [scrambleTriggered, setScrambleTriggered] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Reset progress on mount to ensure clean state if navigating back
    setScrollProgress(0);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=8000", // 8000px of scrolling for the sequence
        pin: true,
        scrub: 0.5,
        onUpdate: (self) => {
          setScrollProgress(self.progress);
        }
      }
    });

    // Timeline duration arbitrary scale: 0 to 10
    
    // Phase 1: Silence (0 - 2.5)
    // Fades out early
    tl.to(phase1Ref.current, { opacity: 0, filter: "blur(10px)", duration: 2 }, 1);

    // Phase 2: Transmission (3.0 - 6.0)
    // Data strings fade in from bottom
    tl.fromTo(phase2Ref.current, 
      { opacity: 0, y: 40, filter: "blur(10px)" }, 
      { 
        opacity: 1, 
        y: 0, 
        filter: "blur(0px)", 
        duration: 2,
        onStart: () => setScrambleTriggered(true)
      }, 
      3.0
    );
    // Data strings fade out to top
    tl.to(phase2Ref.current, { opacity: 0, y: -40, filter: "blur(10px)", duration: 2 }, 6.0);

    // Phase 3: The Manifesto (7.0 - 18.0)
    tl.fromTo(manifesto1Ref.current, { opacity: 0, y: 20, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 2 }, 7.0);
    tl.to(manifesto1Ref.current, { opacity: 0, y: -20, filter: "blur(10px)", duration: 2 }, 10.0);
    
    tl.fromTo(manifesto2Ref.current, { opacity: 0, y: 20, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 2 }, 11.0);
    tl.to(manifesto2Ref.current, { opacity: 0, y: -20, filter: "blur(10px)", duration: 2 }, 14.0);

    tl.fromTo(manifesto3Ref.current, { opacity: 0, y: 20, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 2 }, 15.0);
    tl.to(manifesto3Ref.current, { opacity: 0, y: -20, filter: "blur(10px)", duration: 2 }, 18.0);

    // Phase 4: Extraction / CTA (19.0 - 21.0)
    // CTA fades in
    tl.fromTo(phase4Ref.current,
      { opacity: 0, scale: 0.9, filter: "blur(10px)" },
      { opacity: 1, scale: 1.0, filter: "blur(0px)", duration: 2 },
      19.0
    );

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [setScrollProgress]);

  return (
    <div className="w-full">
      <main ref={containerRef} className="relative w-full h-screen overflow-hidden text-white">
        {/* ── Phase 1: Silence ── */}
        <div ref={phase1Ref} className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <MouseParallax intensity={0.03} reverse className="w-full flex justify-center">
            <RevealText tag="h1" splitBy="chars" triggerOnLoad className="font-[family-name:var(--font-playfair)] font-light italic text-7xl md:text-[9rem] lg:text-[12rem] tracking-tighter leading-none opacity-20 pr-4">
              PNB Essences
            </RevealText>
          </MouseParallax>
          <div className="absolute top-28 md:top-32 left-1/2 -translate-x-1/2 font-[family-name:var(--font-geist-mono)] text-[10px] tracking-[0.5em] text-white/30 uppercase w-full text-center">
            [ 01 // Olfactory Lab ]
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
            <span className="font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.4em] text-white/40 uppercase">
              Scroll to Synthesize
            </span>
            <div className="relative w-[1px] h-12 overflow-hidden bg-white/10">
              <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-transparent via-white/50 to-transparent h-1/2 animate-scroll-line" />
            </div>
          </div>
        </div>

        {/* ── Phase 2: Analysis ── */}
        <div ref={phase2Ref} className="absolute inset-0 flex flex-col items-center justify-center z-10 opacity-0 pointer-events-none px-8">
          <MouseParallax intensity={0.015} className="w-full max-w-4xl grid grid-cols-2 gap-x-20 gap-y-16">
            <div className="flex flex-col gap-2 text-right">
              <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-white/40 uppercase tracking-[0.2em]">Molecular Weight</span>
              <ScrambleText text="314.46 g/mol" className="font-[family-name:var(--font-geist-mono)] text-sm tracking-[0.1em] text-white/80" trigger={scrambleTriggered} />
            </div>
            <div className="flex flex-col gap-2 text-left">
              <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-white/40 uppercase tracking-[0.2em]">Sillage Index</span>
              <ScrambleText text="0.94 [HIGH]" className="font-[family-name:var(--font-geist-mono)] text-sm tracking-[0.1em] text-white/80" trigger={scrambleTriggered} delay={200} />
            </div>
            
            <div className="flex flex-col gap-2 text-right">
              <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-white/40 uppercase tracking-[0.2em]">Extraction Method</span>
              <ScrambleText text="CO2 SUPERCRITICAL" className="font-[family-name:var(--font-geist-mono)] text-sm tracking-[0.1em] text-white/80" trigger={scrambleTriggered} delay={400} />
            </div>
            <div className="flex flex-col gap-2 text-left">
              <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-white/40 uppercase tracking-[0.2em]">Stability</span>
              <ScrambleText text="14.2% DECAY/YR" className="font-[family-name:var(--font-geist-mono)] text-sm tracking-[0.1em] text-white/80" trigger={scrambleTriggered} delay={600} />
            </div>
          </MouseParallax>
        </div>

        {/* ── Phase 3: The Manifesto ── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none px-4 text-center">
          <div ref={manifesto1Ref} className="absolute font-[family-name:var(--font-playfair)] italic text-5xl md:text-7xl lg:text-8xl text-white/90 tracking-tight opacity-0">
            We do not extract scents.
          </div>
          <div ref={manifesto2Ref} className="absolute font-[family-name:var(--font-playfair)] italic text-5xl md:text-7xl lg:text-8xl text-white/90 tracking-tight opacity-0">
            We bottle shadows.
          </div>
          <div ref={manifesto3Ref} className="absolute font-[family-name:var(--font-playfair)] italic text-3xl md:text-5xl lg:text-6xl text-white/70 tracking-tight opacity-0 max-w-3xl leading-snug">
            A silent rebellion against<br/>the loud and the generic.
          </div>
        </div>

        {/* ── Phase 4: Extraction ── */}
        <div ref={phase4Ref} className="absolute inset-0 flex flex-col items-center justify-center z-30 opacity-0 pointer-events-none">
          <div className="font-[family-name:var(--font-playfair)] italic text-4xl md:text-5xl text-white/70 tracking-tight mb-8">
            Synthesis Complete
          </div>
          <div className="pointer-events-auto">
            <Magnetic intensity={0.25}>
              <button
                onClick={() => startTransition("/archive")}
                className="group relative font-[family-name:var(--font-geist-mono)] text-[10px] tracking-[0.4em] text-white/50 hover:text-white transition-colors duration-700 p-8 uppercase bg-transparent border border-white/10 cursor-pointer overflow-hidden focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
                data-cursor="hover"
                aria-label="Discover the formula in the archive"
              >
                <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]" />
                <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30 group-hover:border-white transition-colors duration-700" />
                <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/30 group-hover:border-white transition-colors duration-700" />
                <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/30 group-hover:border-white transition-colors duration-700" />
                <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30 group-hover:border-white transition-colors duration-700" />
                <span className="relative z-10">DISCOVER THE FORMULA</span>
              </button>
            </Magnetic>
          </div>
        </div>
      </main>
    </div>
  );
}
