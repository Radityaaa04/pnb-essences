import { create } from "zustand";

interface AppState {
  isEntered: boolean;
  enter: () => void;
  // Audio
  isMuted: boolean;
  toggleMute: () => void;
  // Post-processing Transitions
  burstActive: boolean;
  triggerBurst: () => void;
}

export const useStore = create<AppState>((set) => ({
  isEntered: false,
  enter: () => set({ isEntered: true }),
  
  isMuted: false,
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  
  burstActive: false,
  triggerBurst: () => {
    set({ burstActive: true });
    // Auto-reset after a short duration to allow it to trigger again
    setTimeout(() => set({ burstActive: false }), 100);
  },
}));

