import { create } from "zustand";

/** Bridges in-world 3D interactions to the interactive tutorial. */
interface TutorialBus {
  selected: string | null;
  drags: number;
  select: (id: string | null) => void;
  noteDrag: () => void;
  reset: () => void;
}

export const useTutorialBus = create<TutorialBus>((set) => ({
  selected: null,
  drags: 0,
  select: (id) => set({ selected: id }),
  noteDrag: () => set((s) => ({ drags: s.drags + 1 })),
  reset: () => set({ selected: null, drags: 0 }),
}));
