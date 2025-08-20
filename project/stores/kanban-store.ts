// // stores/kanban-store.ts
// import { create } from "zustand";

// export interface Task {
//   id: string;
//   title: string;
//   description?: string;
//   priority: number;
//   listId: string;
//   position: number; // always present in DB
// }

// export interface List {
//   id: string;
//   title: string;
//   projectId: string;
// }

// interface KanbanState {
//   lists: List[];
//   tasks: Task[];
//   setLists: (lists: List[]) => void;
//   setTasks: (tasks: Task[]) => void;
//   addList: (list: List) => void;
//   addTask: (task: Task) => void;
//   removeList: (listId: string) => void;
//   removeTask: (taskId: string) => void;
// }

// export const useKanbanStore = create<KanbanState>((set) => ({
//   lists: [],
//   tasks: [],
//   setLists: (lists) => set({ lists }),
//   setTasks: (tasks) => set({ tasks }),
//   addList: (list) => set((state) => ({ lists: [...state.lists, list] })),
//   addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
//   removeList: (listId) =>
//     set((state) => ({
//       lists: state.lists.filter((l) => l.id !== listId),
//       tasks: state.tasks.filter((t) => t.listId !== listId), // remove tasks from deleted list
//     })),
//   removeTask: (taskId) =>
//     set((state) => ({
//       tasks: state.tasks.filter((t) => t.id !== taskId),
//     })),
// }));
