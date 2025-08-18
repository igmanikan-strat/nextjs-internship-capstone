// stores/list-modal-store.ts
import { create } from "zustand";

interface ListModalState {
  isOpen: boolean;
  projectId: string | null;
  open: (projectId: string) => void;
  close: () => void;
}

export const useListModal = create<ListModalState>((set) => ({
  isOpen: false,
  projectId: null,
  open: (projectId) => set({ isOpen: true, projectId }),
  close: () => set({ isOpen: false, projectId: null })
}));
