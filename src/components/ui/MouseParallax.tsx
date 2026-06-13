"use client";

import { useRef, useEffect, ReactNode } from "react";
import gsap from "gsap";

interface MouseParallaxProps {
  children: ReactNode;
  intensity?: number; // How much it moves. e.g. 0.02 is 2% of screen
  className?: string;
  reverse?: boolean; // Move opposite to mouse direction
}

export default function MouseParallax({ children, intensity = 0.02, className = "", reverse = false }: MouseParallaxProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    // quickTo is highly optimized for mouse move events
    const xTo = gsap.quickTo(el, "x", { duration: 1.5, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 1.5, ease: "power3.out" });

    const handleMouseMove = (e: MouseEvent) => {
      // Normalized coordinates: -1 to 1
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;

      // Direction multiplier
      const dir = reverse ? -1 : 1;

      // Calculate shift in pixels
      const xShift = x * window.innerWidth * intensity * dir;
      const yShift = y * window.innerHeight * intensity * dir;

      xTo(xShift);
      yTo(yShift);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [intensity, reverse]);

  return (
    <div ref={wrapperRef} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
