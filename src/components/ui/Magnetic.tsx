"use client";

import { useRef, useEffect, ReactNode } from "react";
import gsap from "gsap";

interface MagneticProps {
  children: ReactNode;
  intensity?: number;
}

export default function Magnetic({ children, intensity = 0.2 }: MagneticProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    // Use GSAP quickTo for 60fps performance
    const xTo = gsap.quickTo(el, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const yTo = gsap.quickTo(el, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { height, width, left, top } = el.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      // Calculate distance from center
      const distanceX = clientX - centerX;
      const distanceY = clientY - centerY;

      // Apply the magnetic pull based on intensity
      xTo(distanceX * intensity);
      yTo(distanceY * intensity);
    };

    const handleMouseLeave = () => {
      // Snap back to origin
      xTo(0);
      yTo(0);
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [intensity]);

  // Wrap children in a div so we can attach the ref without cloneElement
  // (React 19 removed ref from cloneElement props)
  return (
    <div ref={wrapperRef} style={{ display: "inline-block" }}>
      {children}
    </div>
  );
}
