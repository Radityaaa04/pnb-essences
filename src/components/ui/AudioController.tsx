"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { audioManager } from "@/lib/audioManager";
import Magnetic from "./Magnetic";

export default function AudioController() {
  const { isMuted, toggleMute } = useStore();

  useEffect(() => {
    // Sync mute state with audio engine whenever it changes
    audioManager.setMute(isMuted);
  }, [isMuted]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      // Read latest state directly from store to avoid stale closure
      const currentMuted = useStore.getState().isMuted;
      audioManager.init();
      audioManager.setMute(currentMuted);
      audioManager.startAmbient();
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("scroll", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction);
    window.addEventListener("scroll", handleFirstInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("scroll", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, []);

  return (
    <div className="fixed top-8 right-8 z-50 mix-blend-difference pointer-events-auto">
      <Magnetic intensity={0.2}>
        <button
          onClick={toggleMute}
          onMouseEnter={() => audioManager.playHover()}
          className="font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.3em] uppercase opacity-40 hover:opacity-100 transition-opacity p-4 flex items-center gap-2 cursor-pointer"
          data-cursor="hover"
        >
          {isMuted ? "SOUND OFF" : "SOUND ON"}
          <div className="w-2 h-2 rounded-full border border-current flex items-center justify-center">
            {!isMuted && <div className="w-1 h-1 bg-current rounded-full" />}
          </div>
        </button>
      </Magnetic>
    </div>
  );
}
