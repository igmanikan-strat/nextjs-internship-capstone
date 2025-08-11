// stores/task-modal-store.ts
import { create } from "zustand";

interface TaskModalStore {
  isOpen: boolean;
  projectId: string | null;
  listId: string | null;
  open: (projectId: string, listId: string) => void;
  close: () => void;
}

export const useTaskModal = create<TaskModalStore>((set) => ({
  isOpen: false,
  projectId: null,
  listId: null,
  open: (projectId, listId) => set({ isOpen: true, projectId, listId }),
  close: () => set({ isOpen: false, projectId: null, listId: null }),
}));
