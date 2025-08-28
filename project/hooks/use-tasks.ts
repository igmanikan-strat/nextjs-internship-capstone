// hooks/use-tasks.ts
import { useBoardStore } from "@/stores/board-store";
import { Task } from "@/types";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";

// ✅ Fetch tasks only once (initial load)
async function fetchTasks(projectId: string): Promise<Task[]> {
  const res = await fetch(`/api/projects/${projectId}/tasks`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  const data = await res.json();

  return data.map((task: any) => ({
    ...task,
    description: task.description ?? "",
    priority: task.priority ?? "medium",
    createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
    updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
  }));
}

export function useTasks(projectId: string) {
  const {
    setTasks,
    addTask,
    updateTask,
    updateTasksBulk,
    deleteTask,
    deleteTasksBulk,
    moveTaskOptimistic,
  } = useBoardStore();

  // 🔹 Load once into Zustand
  const { data, isLoading, error } = useQuery<Task[], Error>({
    queryKey: ["tasks", projectId],
    queryFn: () => fetchTasks(projectId),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (data) setTasks(data as Task[]);
  }, [data, setTasks]);

  // 🔹 Create Task
  const createTaskMutation = useMutation({
    mutationFn: async (newTask: Partial<Task>) => {
      const res = await fetch(`/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: (task: Task) => addTask(task),
  });

  // 🔹 Update Task
  const updateTaskMutation = useMutation({
    mutationFn: async (task: Partial<Task> & { id: string }) => {
      const { id, title, description, dueDate, priority } = task;

      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, dueDate, priority }),
      });

      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onMutate: (updates) => {
      updateTask(updates.id, updates);
    },
    onSuccess: (updatedTask) => {
      updateTask(updatedTask.id, updatedTask);
    },
    onError: (err, task) => {
      console.error("Update task failed, rolling back", err);
    },
  });

  // 🔹 Delete Task
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
      return taskId;
    },
    onSuccess: (taskId) => deleteTask(taskId),
  });

  // 🔹 Bulk Update Tasks
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({
      taskIds,
      updates,
    }: {
      taskIds: string[];
      updates: Partial<Task>;
    }) => {
      const res = await fetch(`/api/tasks/bulk/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds, updates }),
      });
      if (!res.ok) throw new Error("Failed to bulk update tasks");
      return res.json();
    },
    onMutate: ({ taskIds, updates }) => {
      updateTasksBulk(taskIds, updates);
    },
    onSuccess: ({ updated }) => {
      updated.forEach((t: Task) => updateTask(t.id, t));
    },
  });

  // 🔹 Bulk Delete Tasks
  const bulkDeleteMutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const res = await fetch(`/api/tasks/bulk/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds }),
      });
      if (!res.ok) throw new Error("Failed to bulk delete tasks");
      return taskIds;
    },
    onMutate: (taskIds) => {
      deleteTasksBulk(taskIds);
    },
  });

  // 🔹 Move Task
  const moveTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      newListId,
      newPosition,
    }: {
      taskId: string;
      newListId: string;
      newPosition: number;
    }) => {
      const res = await fetch(`/api/tasks/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          { id: taskId, listId: newListId, position: newPosition },
        ]),
      });
      if (!res.ok) throw new Error("Failed to move task");
      return res.json();
    },
    onMutate: ({ taskId, newListId, newPosition }) => {
      moveTaskOptimistic(taskId, newListId, newPosition);
    },
  });

  return {
    tasks: data,
    isLoading,
    error,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutate,
    bulkUpdateTasks: bulkUpdateMutation.mutate,
    bulkDeleteTasks: bulkDeleteMutation.mutate,
    moveTask: moveTaskMutation.mutate,
    bulkDeleteMutation,
  };
}
