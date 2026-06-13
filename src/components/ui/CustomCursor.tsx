"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { audioManager } from "@/lib/audioManager";

export default function CustomCursor() {
  const cursorDot = useRef<HTMLDivElement>(null);
  const cursorRing = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // We only want the custom cursor on non-touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    // BUG 1 FIX: Keep a reference to the style element so we can remove it on cleanup.
    document.body.classList.add("cursor-none");
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `* { cursor: none !important; }`;
    document.head.appendChild(styleEl);

    // High performance GSAP quickTo setters
    const setDotX = gsap.quickTo(cursorDot.current, "x", { duration: 0.1, ease: "power3" });
    const setDotY = gsap.quickTo(cursorDot.current, "y", { duration: 0.1, ease: "power3" });
    const setRingX = gsap.quickTo(cursorRing.current, "x", { duration: 0.5, ease: "power3" });
    const setRingY = gsap.quickTo(cursorRing.current, "y", { duration: 0.5, ease: "power3" });

    let isHovering = false;
    let lastClientX = 0;
    let lastClientY = 0;

    const onMouseMove = (e: MouseEvent) => {
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      setDotX(e.clientX - 4);
      setDotY(e.clientY - 4);
      setRingX(e.clientX - 16);
      setRingY(e.clientY - 16);
    };

    const isInteractive = (target: HTMLElement): boolean => {
      return !!(
        target.closest("a") ||
        target.closest("button") ||
        target.closest("[data-cursor='hover']")
      );
    };

    const triggerHoverState = (target: HTMLElement | null) => {
      const isTargetInteractive = target ? isInteractive(target) : false;
      
      if (!isHovering && isTargetInteractive) {
        isHovering = true;
        audioManager.playHover(); // PLAY HOVER SOUND
        
        gsap.to(cursorDot.current, { scale: 0, opacity: 0, duration: 0.3 });
        gsap.to(cursorRing.current, {
          scale: 2,
          backgroundColor: "rgba(255,255,255,0.1)",
          borderColor: "rgba(255,255,255,0.5)",
          duration: 0.3,
        });
        cursorRing.current?.classList.add("cursor-ring--hover");
      } else if (isHovering && !isTargetInteractive) {
        isHovering = false;
        gsap.to(cursorDot.current, { scale: 1, opacity: 1, duration: 0.3 });
        gsap.to(cursorRing.current, {
          scale: 1,
          backgroundColor: "transparent",
          borderColor: "rgba(255,255,255,1)",
          duration: 0.3,
        });
        cursorRing.current?.classList.remove("cursor-ring--hover");
      }
    };

    const onMouseOver = (e: MouseEvent) => triggerHoverState(e.target as HTMLElement);
    // Use relatedTarget for mouseout to know where the mouse went
    const onMouseOut = (e: MouseEvent) => triggerHoverState(e.relatedTarget as HTMLElement);

    // 4. CustomCursor aware of virtual scroll position
    const onScroll = () => {
      if (lastClientX === 0 && lastClientY === 0) return;
      // Get the element currently under the fixed cursor
      const currentElement = document.elementFromPoint(lastClientX, lastClientY);
      triggerHoverState(currentElement as HTMLElement | null);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (isInteractive(e.target as HTMLElement)) {
        audioManager.playClick(); // PLAY CLICK SOUND
      }
      gsap.to(cursorRing.current, { scale: isHovering ? 1.6 : 0.8, duration: 0.1 });
    };
    const onMouseUp = () => {
      gsap.to(cursorRing.current, { scale: isHovering ? 2 : 1, duration: 0.1 });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", onMouseOver);
    window.addEventListener("mouseout", onMouseOut);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("scroll", onScroll, { passive: true });

    gsap.to([cursorDot.current, cursorRing.current], { opacity: 1, duration: 0.5 });

    return () => {
      document.body.classList.remove("cursor-none");
      if (styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      window.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <div
        ref={cursorDot}
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[100001] opacity-0 mix-blend-difference"
      />
      {/*
        BUG 3 FIX: backdrop-filter is applied via a CSS class `.cursor-ring--hover`
        with `transition: backdrop-filter 0.3s ease` defined below, so the browser
        can interpolate it natively and smoothly — something GSAP cannot do.
      */}
      <style>{`
        .cursor-ring--hover {
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        div[data-cursor-ring] {
          transition: backdrop-filter 0.3s ease, -webkit-backdrop-filter 0.3s ease;
        }
      `}</style>
      <div
        ref={cursorRing}
        data-cursor-ring
        className="fixed top-0 left-0 w-8 h-8 border border-white rounded-full pointer-events-none z-[100000] opacity-0 mix-blend-difference"
      />
    </>
  );
}
