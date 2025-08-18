// // hooks/use-tasks.ts (client-safe)
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import type { Task } from "@/types";

// interface CreateTaskInput {
//   title: string;
//   priority: "low" | "medium" | "high";
//   listId: string;
//   projectId: string;
//   position: number;
//   description?: string;
//   dueDate?: string;
//   assigneeId?: string;
//   userId?: string;
// }

// export function useTasks(projectId: string) {
//   const queryClient = useQueryClient();

//   const { data: tasks, isLoading, error } = useQuery<Task[]>({
//     queryKey: ["tasks", projectId],
//     queryFn: async () => {
//       const res = await fetch(`/api/projects/${projectId}/tasks`);
//       if (!res.ok) throw new Error("Failed to fetch tasks");
//       return res.json();
//     },
//     enabled: !!projectId,
//   });

//   const createTask = useMutation({
//     mutationFn: async (task: CreateTaskInput) => {
//       const res = await fetch(`/api/tasks/create`, {
//         method: "POST",
//         body: JSON.stringify(task),
//         headers: { "Content-Type": "application/json" },
//       });
//       if (!res.ok) throw new Error("Failed to create task");
//       return res.json();
//     },
//     onSettled: () => queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
//   });

//   const updateTask = useMutation({
//     mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
//       const res = await fetch(`/api/tasks/${id}`, {
//         method: "PATCH",
//         body: JSON.stringify(data),
//         headers: { "Content-Type": "application/json" },
//       });
//       if (!res.ok) throw new Error("Failed to update task");
//       return res.json();
//     },
//     onSettled: () => queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
//   });

//   const deleteTask = useMutation({
//     mutationFn: async (id: string) => {
//       const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
//       if (!res.ok) throw new Error("Failed to delete task");
//     },
//     onSettled: () => queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
//   });

//   return { tasks, isLoading, error, createTask, updateTask, deleteTask };
// }
