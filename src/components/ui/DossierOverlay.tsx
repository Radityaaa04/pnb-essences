"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useStore } from "@/lib/store";
import { audioManager } from "@/lib/audioManager";

interface DossierOverlayProps {
  /** Called when the animation is complete and the page can navigate */
  onComplete: () => void;
}

export default function DossierOverlay({ onComplete }: DossierOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const target = useStore((s) => s.transitionTarget);

  // Format the route name beautifully
  const formatRouteName = (route: string) => {
    if (route === "/") return "home.";
    // Strip leading slash and format
    const name = route.replace("/", "");
    return `${name}.`;
  };

  const displayName = formatRouteName(target);

  useEffect(() => {
    if (!overlayRef.current || !textRef.current) return;

    // Play subtle transition audio
    audioManager.playClick();

    const tl = gsap.timeline({
      onComplete: () => {
        // Fade out overlay, then signal parent to push route + unmount
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.6,
          ease: "power2.inOut",
          onComplete,
        });
      },
    });

    // 1. Fade in the absolute black overlay
    tl.to(overlayRef.current, {
      opacity: 1,
      duration: 0.4,
      ease: "power2.out",
    });

    // 2. Animate the text rising up gracefully
    tl.fromTo(
      textRef.current,
      { y: 50, opacity: 0, rotateX: 20 },
      { 
        y: 0, 
        opacity: 1, 
        rotateX: 0, 
        duration: 0.8, 
        ease: "power3.out" 
      }
    );

    // 3. Hold the text for a brief moment of appreciation
    tl.to(textRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.5,
      ease: "power2.in",
      delay: 0.4,
    });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#030303] opacity-0"
      aria-hidden="true"
    >
      {/* ── High-Fashion Typography Transition ── */}
      <div style={{ perspective: "1000px" }}>
        <div
          ref={textRef}
          className="font-[family-name:var(--font-playfair)] font-light italic text-6xl md:text-[8rem] lg:text-[10rem] tracking-tighter leading-none text-white/90"
        >
          {displayName}
        </div>
      </div>
      
      {/* ── Delicate Lab Detail ── */}
      <div className="absolute bottom-12 font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.5em] text-white/20 uppercase">
        ROUTING PROTOCOL // PNB ESSENCES
      </div>
    </div>
  );
}
