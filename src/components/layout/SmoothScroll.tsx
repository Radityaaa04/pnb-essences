"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollVelocity } from "@/lib/velocity";

// Register here so ScrollTrigger is ready before any child component mounts.
gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 5. prefers-reduced-motion support
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const lenis = new Lenis({
      lerp: 0.035, // Lusion style: Very heavy inertia, long floaty decay
      smoothWheel: true,
      wheelMultiplier: 1.2, // Lusion style: Amplify scroll distance to compensate for heavy lerp
      touchMultiplier: 2,
      autoRaf: false, // Critical: prevent double RAF since we use GSAP ticker
    });

    lenis.on("scroll", (e: any) => {
      ScrollTrigger.update();
      scrollVelocity.current = e.velocity;
    });

    // Synchronize Lenis with GSAP's internal time instead of performance.now()
    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(tick);
    };
  }, []);

  return <>{children}</>;
}
