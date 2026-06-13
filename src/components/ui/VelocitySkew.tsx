"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { scrollVelocity } from "@/lib/velocity";

interface VelocitySkewProps {
  children: React.ReactNode;
  intensity?: number;
  maxSkew?: number;
}

export default function VelocitySkew({ 
  children, 
  intensity = 0.03, // Tweak this for more/less bend
  maxSkew = 10      // Prevent it from breaking the layout completely
}: VelocitySkewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // quickTo is highly optimized for values that change every frame
    const skewTo = gsap.quickTo(el, "skewY", { 
      ease: "power3.out", 
      duration: 0.5 
    });

    const tick = () => {
      // Calculate skew based on velocity
      let targetSkew = scrollVelocity.current * intensity;
      
      // Clamp the skew so it doesn't flip or look broken
      targetSkew = gsap.utils.clamp(-maxSkew, maxSkew, targetSkew);
      
      // Apply the skew
      skewTo(targetSkew);
    };

    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
    };
  }, [intensity, maxSkew]);

  return (
    <div ref={containerRef} className="will-change-transform origin-center inline-block w-full">
      {children}
    </div>
  );
}
