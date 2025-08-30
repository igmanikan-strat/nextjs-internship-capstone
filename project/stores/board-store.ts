import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { arrayMove } from "@dnd-kit/sortable"; // ✅ Import added
import type { Task, List, Project } from "@/types";

// Define your types
// export interface Task {
//   id: string;
//   title: string;
//   description?: string;
//   priority: number;
//   listId: string;
//   position: number;
// }

// export interface List {
//   id: string;
//   title: string;
//   projectId: string;
//   position: number;
// }

// export interface Project {
//   id: string;
//   name: string;
//   description?: string;
// }

interface BoardState {
  currentProject: Project | null;
  lists: List[];
  tasks: Task[];
  setLists: (lists: List[]) => void;
  setTasks: (tasks: Task[]) => void;
  removeList: (listId: string) => void;
  removeTask: (taskId: string) => void;
  draggedTask: Task | null;
  draggedOverList: string | null;
  isLoading: boolean;
  isSaving: boolean;
  addList: (list: List) => void;
  updateList: (listId: string, updates: Partial<List>) => void;
  loadProject: (projectId: string) => Promise<void>;
  createTask: (listId: string, task: Partial<Task>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => void; // 🔹 change here
  moveTask: (taskId: string, newListId: string, newPosition: number) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTaskOptimistic: (taskId: string, newListId: string, newPosition: number) => void;
  moveListOptimistic: (listId: string, newPosition: number) => void;
  setDraggedTask: (task: Task | null) => void;
  setDraggedOverList: (listId: string | null) => void;
  addTask: (task: Task) => void; // ✅ new
  updateTasksBulk: (taskIds: string[], updates: Partial<Task>) => void;
  deleteTasksBulk: (taskIds: string[]) => void;
  selectedTaskIds: Set<string>;
  toggleTaskSelection: (id: string, checked?: boolean) => void;
  selectSingleTask: (id: string) => void;
  selectRange: (fromId: string | null, toId: string) => void;
  setLastSelected: (id: string | null) => void;
  clearSelection: () => void;
  selectAllTasks: () => void;
  lastSelectedId: string | null;
  moveTasks: (taskIds: string[], targetListId: string) => void;
}


export const useBoardStore = create<BoardState>()(
  subscribeWithSelector((set, get) => ({
    currentProject: null,
    lists: [],
    tasks: [],
    draggedTask: null,
    draggedOverList: null,
    isLoading: false,
    isSaving: false,
    // tasks: [],
    selectedTaskIds: new Set(),
    lastSelectedId: null,

    addList: (list: List) => set((state) => ({ lists: [...state.lists, list] })),
    updateList: async (listId: string, updates: Partial<List>) => {
      try {
        const res = await fetch(`/api/lists/${listId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!res.ok) throw new Error("Failed to update list");

        const updatedList = await res.json();

        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId ? { ...l, ...updatedList } : l
          ),
        }));
      } catch (err) {
        console.error("updateList error:", err);
      }
    },


    addTask: (task: Task) =>
    set((state) => ({
      tasks: [
        ...state.tasks,
        {
          ...task,
          description: task.description ?? "", // convert null to "" to satisfy SortableList
        },
      ],
    })),

    setLists: (lists: List[]) => set({ lists }),
    setTasks: (tasks: Task[]) => set({ tasks }),

    removeList: (listId: string) =>
      set((state) => ({
        lists: state.lists.filter((l) => l.id !== listId),
        tasks: state.tasks.filter((t) => t.listId !== listId),
      })),

    removeTask: (taskId: string) =>
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
      })),

    loadProject: async (projectId: string) => {
      set({ isLoading: true });
      try {
        const projectRes = await fetch(`/api/projects/${projectId}`);
        if (!projectRes.ok) throw new Error("Failed to load project");
        const projectData: Project = await projectRes.json();

        const listsRes = await fetch(`/api/lists/${projectId}`);
        if (!listsRes.ok) throw new Error("Failed to load lists");
        const listsData: List[] = await listsRes.json();

        const tasksRes = await fetch(`/api/projects/${projectId}/tasks`);
        if (!tasksRes.ok) throw new Error("Failed to load tasks");
        const tasksData: Task[] = (await tasksRes.json()).map((task: any) => ({
          ...task,
          priority: task.priority ?? "medium", // match your type: "low" | "medium" | "high"
          comments: task.comments ?? [],
          createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
          updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          description: task.description ?? "",
          assigneeId: task.assigneeId ?? undefined,
        }));



        set({
          currentProject: projectData,
          lists: listsData,
          tasks: tasksData,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error loading project data:", error);
        set({ isLoading: false });
      }
    },

    createTask: async (listId: string, task: Partial<Task>) => {
      set({ isSaving: true });
      const tempId = `temp-${Date.now()}`;
      const optimisticTask: Task = {
        id: tempId,
        listId,
        title: task.title ?? "Untitled",
        description: task.description ?? "",
        priority: task.priority ?? "medium", // ✅ default if undefined
        status: task.status ?? "ongoing",
        position: task.position ?? 0,
        comments: task.comments ?? [], // also ensure comments array exists
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate: task.dueDate,
        assigneeId: task.assigneeId,
        projectId: task.projectId ?? "temp-project", // fallback
        userId: task.userId ?? "temp-user",         // fallback
        ...task,
      };
      set((state) => ({ tasks: [...state.tasks, optimisticTask] }));

      try {
        const res = await fetch(`/api/tasks/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...task, listId }),
        });

        if (!res.ok) throw new Error("Failed to create task");

        const savedTask: Task = await res.json();
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === tempId ? savedTask : t)),
          isSaving: false,
        }));
      } catch (error) {
        console.error("Create task failed, rolling back optimistic update", error);
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== tempId),
          isSaving: false,
        }));
      }
    },

    toggleTaskSelection: (id, checked) =>
      set((state) => {
        const selected = new Set(state.selectedTaskIds);
        const isSelected = selected.has(id);

        if (checked === undefined) {
          // toggle mode
          if (isSelected) selected.delete(id);
          else selected.add(id);
        } else {
          // explicit true/false
          if (checked) selected.add(id);
          else selected.delete(id);
        }

        return { selectedTaskIds: selected };
      }),

      selectSingleTask: (id) =>
        set(() => ({
          selectedTaskIds: new Set([id]),
          lastSelectedId: id,
        })),

      selectRange: (fromId, toId) =>
        set((state) => {
          if (!fromId) return { selectedTaskIds: new Set([toId]), lastSelectedId: toId };

          const tasksInList = state.tasks.sort((a, b) => a.position - b.position);
          const fromIndex = tasksInList.findIndex((t) => t.id === fromId);
          const toIndex = tasksInList.findIndex((t) => t.id === toId);

          if (fromIndex === -1 || toIndex === -1) return state;

          const [start, end] = fromIndex < toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];
          const rangeIds = tasksInList.slice(start, end + 1).map((t) => t.id);

          const selected = new Set(state.selectedTaskIds);
          rangeIds.forEach((id) => selected.add(id));

          return { selectedTaskIds: selected, lastSelectedId: toId };
        }),

        setLastSelected: (id) => set({ lastSelectedId: id }),

        clearSelection: () => set({ selectedTaskIds: new Set(), lastSelectedId: null }),

        selectAllTasks: () =>
          set((state) => ({
            selectedTaskIds: new Set(state.tasks.map((t) => t.id)),
          })),

    // clearSelection: () => set({ selectedTaskIds: new Set() }),
    // selectAllTasks: () =>
    //   set((state) => ({
    //     selectedTaskIds: new Set(state.tasks.map((t) => t.id)),
    //   })),


    updateTask: (taskId: string, updates: Partial<Task>) => {
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, ...updates, updatedAt: new Date() } : t
        ),
      }));
    },

    updateTasksBulk: (taskIds: string[], updates: Partial<Task>) => {
      set((state) => ({
        tasks: state.tasks.map((t) =>
          taskIds.includes(t.id) ? { ...t, ...updates, updatedAt: new Date() } : t
        ),
      }));
    },

    moveTask: async (taskId: string, newListId: string, newPosition: number) => {
      const prevTasks = get().tasks;

      set((state) => {
        const task = state.tasks.find(t => t.id === taskId);
        if (!task) return state;

        const oldListId = task.listId;

        // remove task
        const without = state.tasks.filter(t => t.id !== taskId);

        // reindex old list
        const oldList = without
          .filter(t => t.listId === oldListId)
          .sort((a,b) => a.position - b.position)
          .map((t, i) => ({ ...t, position: i }));

        // target list tasks
        const target = without
          .filter(t => t.listId === newListId)
          .sort((a,b) => a.position - b.position);

        // insert at newPosition
        const inserted = [
          ...target.slice(0, newPosition),
          { ...task, listId: newListId }, // position set below
          ...target.slice(newPosition),
        ].map((t, i) => ({ ...t, position: i }));

        const untouched = without.filter(
          t => t.listId !== oldListId && t.listId !== newListId
        );

        return { tasks: [...oldList, ...inserted, ...untouched] };
      });

      try {
        const stateNow = get();
        const updates = stateNow.tasks.map(t => ({
          id: t.id, listId: t.listId, position: t.position
        }));
        const res = await fetch(`/api/tasks/reorder`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error("Failed to move task");
      } catch (e) {
        console.error("Move task failed, rolling back", e);
        set({ tasks: prevTasks });
      }
    },

    moveTasks: (taskIds: string[], targetListId: string) =>
      set((state) => {
        if (taskIds.length === 0) return state;

        // Get selected tasks
        const selectedTasks = state.tasks.filter((t) => taskIds.includes(t.id));

        // Ensure they are all from the same list
        const sourceListId = selectedTasks[0]?.listId;
        const sameList = selectedTasks.every((t) => t.listId === sourceListId);

        if (!sameList) {
          console.warn("Cannot move tasks from different lists together");
          return state;
        }

        // Compute new positions (append to target list for now)
        const targetTasks = state.tasks
          .filter((t) => t.listId === targetListId)
          .sort((a, b) => a.position - b.position);

        let nextPosition = targetTasks.length > 0 ? targetTasks[targetTasks.length - 1].position + 1 : 0;

        const updatedTasks = state.tasks.map((t) => {
          if (taskIds.includes(t.id)) {
            return { ...t, listId: targetListId, position: nextPosition++ };
          }
          return t;
        });

        return { tasks: updatedTasks };
      }),


    moveList: async (listId: string, newPosition: number) => {
    const prevLists = get().lists; // Store old order for rollback

    // ✅ Instant UI update
    set((state) => {
      const oldIndex = state.lists.findIndex((l) => l.id === listId);
      if (oldIndex === -1) return state;

      let newLists = arrayMove(state.lists, oldIndex, newPosition);
      newLists = newLists.map((l, i) => ({ ...l, position: i }));

      return { lists: newLists };
    });

    // ✅ Send request in background
    try {
      const res = await fetch("/api/lists/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ id: listId, position: newPosition }]),
      });

      if (!res.ok) throw new Error("Failed to reorder list");
    } catch (error) {
      console.error("Move list failed, rolling back", error);
      set({ lists: prevLists }); // Rollback on failure
    }
  },


    deleteTask: async (taskId: string) => {
      set({ isSaving: true });
      const prevTasks = get().tasks;
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
      }));

      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Failed to delete task");
        set({ isSaving: false });
      } catch (error) {
        console.error("Delete task failed, rolling back", error);
        set({ tasks: prevTasks, isSaving: false });
      }
    },

    deleteTasksBulk: async (taskIds: string[]) => {
      const prevTasks = get().tasks;

      // 🔹 Optimistic update
      set((state) => ({
        tasks: state.tasks.filter((t) => !taskIds.includes(t.id)),
        selectedTaskIds: new Set(),
      }));

      try {
        const res = await fetch("/api/tasks/bulk/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskIds }),
        });

        if (!res.ok) throw new Error("Failed bulk delete");
      } catch (error) {
        console.error("Bulk delete failed, rolling back", error);
        // 🔹 Rollback if server fails
        set({ tasks: prevTasks });
      }
    },


    // ✅ FIXED: Explicit parameter types + typed .map
moveTaskOptimistic: (taskId, newListId, newPosition) => {
  set((state) => {
    // console.log("📦 moveTaskOptimistic called", { taskId, newListId, newPosition });

    const task = state.tasks.find(t => t.id === taskId);
    if (!task) {
      console.warn("❌ Task not found", taskId);
      return state;
    }

    const oldListId = task.listId;

    // remove task from pool
    const without = state.tasks.filter(t => t.id !== taskId);

    // group remaining by list
    const byList: Record<string, Task[]> = {};
    for (const t of without) {
      (byList[t.listId] ??= []).push(t);
    }

    // sort each list by current position
    for (const key of Object.keys(byList)) {
      byList[key] = byList[key].sort((a, b) => a.position - b.position);
    }

    // insert into target list
    const target = byList[newListId] ?? [];
    target.splice(newPosition, 0, { ...task, listId: newListId });

    // reindex all lists independently
    const nextTasks = Object.entries(byList).flatMap(([lid, items]) =>
      items.map((t, i) => ({ ...t, position: i }))
    );

    // console.log("✅ New tasks state", nextTasks);

    return { tasks: nextTasks };
  });

  // push updates
  const snapshot = get().tasks.map(t => ({ id: t.id, listId: t.listId, position: t.position }));
  // console.log("📤 Sending reorder snapshot", snapshot);

  fetch("/api/tasks/reorder", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snapshot),
  }).then(res => {
    if (!res.ok) console.error("❌ Failed to persist reorder");
    else console.log("✅ Reorder persisted");
  });
},






    moveListOptimistic: (listId: string, newPosition: number) => {
      set((state) => {
        const oldIndex = state.lists.findIndex((l) => l.id === listId);
        if (oldIndex === -1) return state;

        let newLists = arrayMove(state.lists, oldIndex, newPosition);
        newLists = newLists.map((l: List, i: number) => ({ ...l, position: i }));

        return { lists: newLists };
      });

      fetch("/api/lists/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ id: listId, position: newPosition }]),
      }).then((res) => {
        if (!res.ok) {
          alert("Failed to reorder list!");
        }
      });
    },


    setDraggedTask: (task: Task | null) => set({ draggedTask: task }),
    setDraggedOverList: (listId: string | null) => set({ draggedOverList: listId }),
  }))
);

