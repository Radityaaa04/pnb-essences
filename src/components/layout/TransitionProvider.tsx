"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import DossierOverlay from "@/components/ui/DossierOverlay";

/**
 * TransitionProvider — mounted in layout.tsx, wraps all page content.
 *
 * Watches Zustand `transitionActive`. When true:
 *   1. Renders <DossierOverlay> (fullscreen classified terminal animation)
 *   2. On overlay complete: calls router.push(target)
 *   3. Calls endTransition() to unmount overlay
 *
 * Navigation links call store.startTransition(href) instead of router.push()
 * directly — this is what kicks off the whole sequence.
 */
export default function TransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const transitionActive = useStore((s) => s.transitionActive);
  const transitionTarget = useStore((s) => s.transitionTarget);
  const endTransition = useStore((s) => s.endTransition);

  // Safety net: if somehow transitionActive gets stuck (e.g. audio context
  // suspended, GSAP blocked), auto-resolve after 4 seconds.
  useEffect(() => {
    if (!transitionActive) return;
    const timeout = setTimeout(() => {
      if (useStore.getState().transitionActive) {
        router.push(transitionTarget);
        endTransition();
      }
    }, 4000);
    return () => clearTimeout(timeout);
  }, [transitionActive, transitionTarget, router, endTransition]);

  const handleOverlayComplete = () => {
    // Navigate THEN clear transition state so overlay unmounts
    // cleanly after the route change starts rendering.
    router.push(transitionTarget);
    // Small delay before clearing — lets the new page start mounting
    // under the overlay's fade-out, so there's no flash of black.
    setTimeout(endTransition, 400);
  };

  return (
    <>
      {children}
      {transitionActive && (
        <DossierOverlay onComplete={handleOverlayComplete} />
      )}
    </>
  );
}
