"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface ParallaxProps {
  children: React.ReactNode;
  speed?: number; // 1 = normal, > 1 = faster, < 1 = slower
  className?: string;
  // BUG-05 FIX: overflow is now configurable — default 'visible' prevents
  // large text from being clipped during parallax scroll movement.
  overflow?: "hidden" | "clip" | "visible";
}

export default function Parallax({ children, speed = 0.5, className = "", overflow = "visible" }: ParallaxProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run on desktop (optional, but parallax can be heavy on mobile)
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    if (!triggerRef.current || !targetRef.current) return;

    // We use data-speed like typical smooth scroll libraries
    // Calculate the total distance to move based on speed
    // If speed is 0.5, it moves half as fast (lagging behind)
    // If speed is 1.5, it moves 50% faster than the scroll
    const yValue = (1 - speed) * 100;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true, // Use scrub to link to scroll position
      },
    });

    tl.fromTo(
      targetRef.current,
      { yPercent: -yValue },
      { yPercent: yValue, ease: "none" }
    );

    return () => {
      tl.kill();
    };
  }, [speed]);

  return (
    <div ref={triggerRef} className={className} style={{ overflow }}>
      <div ref={targetRef} className="will-change-transform h-full w-full">
        {children}
      </div>
    </div>
  );
}
