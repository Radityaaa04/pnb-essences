"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useStore } from "@/lib/store";

type ValidTag = "h1" | "h2" | "h3" | "h4" | "p" | "span";

interface RevealTextProps {
  children: string;
  tag?: ValidTag;
  className?: string;
  delay?: number;
  splitBy?: "chars" | "words" | "lines";
  triggerOnLoad?: boolean;
}

export default function RevealText({
  children,
  tag: Tag = "p",
  className,
  delay = 0,
  splitBy = "lines",
  triggerOnLoad = false,
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);

  const isEntered = useStore((state) => state.isEntered);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    const split = new SplitText(el, { type: splitBy });
    const units =
      splitBy === "chars" ? split.chars :
      splitBy === "words" ? split.words :
      split.lines;

    // Immediately hide elements to prevent flashing before animation starts
    gsap.set(units, {
      y: splitBy === "chars" ? 50 : 30,
      opacity: 0,
    });

    // If it's a load-triggered animation, wait until preloader finishes
    if (triggerOnLoad && !isEntered) {
      return () => split.revert();
    }

    const vars: gsap.TweenVars = {
      y: 0,
      opacity: 1,
      duration: splitBy === "chars" ? 0.6 : 0.85,
      ease: "power3.out",
      stagger: splitBy === "chars" ? 0.02 : splitBy === "words" ? 0.06 : 0.1,
      delay,
      // Let CSS opacity classes take over after animation ends.
      onComplete: () => gsap.set(units, { clearProps: "opacity,y" }),
    };

    const tl = triggerOnLoad
      ? gsap.timeline().to(units, vars)
      : gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        }).to(units, vars);

    return () => {
      tl.kill();
      split.revert();
    };
  }, [children, delay, splitBy, triggerOnLoad, isEntered]);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={className}>
      {children}
    </Tag>
  );
}
