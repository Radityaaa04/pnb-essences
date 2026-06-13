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
  // Shared Scroll Progress (The Classified Transmission playhead)
  scrollProgress: number;
  setScrollProgress: (p: number) => void;
  // Page Transitions
  transitionActive: boolean;
  transitionTarget: string;
  startTransition: (href: string) => void;
  endTransition: () => void;
}

export const useStore = create<AppState>((set) => ({
  isEntered: false,
  enter: () => set({ isEntered: true }),

  isMuted: false,
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  burstActive: false,
  triggerBurst: () => {
    set({ burstActive: true });
    setTimeout(() => set({ burstActive: false }), 100);
  },

  scrollProgress: 0,
  setScrollProgress: (p) => set({ scrollProgress: p }),

  // Page transition — DossierOverlay reads transitionActive to show itself.
  // TransitionProvider calls startTransition(href) on link clicks,
  // then calls endTransition() after the overlay animation + router.push complete.
  transitionActive: false,
  transitionTarget: "",
  startTransition: (href: string) =>
    set({ transitionActive: true, transitionTarget: href }),
  endTransition: () =>
    set({ transitionActive: false, transitionTarget: "" }),
}));


