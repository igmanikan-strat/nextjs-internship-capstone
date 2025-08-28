// // hooks/use-tasks.ts
// import { useBoardStore } from "@/stores/board-store";
// import { Task } from "@/types";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { useEffect } from "react";

// // ✅ Fetch tasks only once (initial load)
// async function fetchTasks(projectId: string): Promise<Task[]> {
//   const res = await fetch(`/api/projects/${projectId}/tasks`);
//   if (!res.ok) throw new Error("Failed to fetch tasks");
//   const data = await res.json();

//   return data.map((task: any) => ({
//     ...task,
//     description: task.description ?? "",
//     priority: task.priority ?? "medium",
//     createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
//     updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
//   }));
// }

// export function useTasks(projectId: string) {
//   const {
//     setTasks,
//     addTask,
//     updateTask,
//     deleteTask,
//     moveTaskOptimistic,
//   } = useBoardStore();

//   // 🔹 Load once into Zustand
//   const { data, isLoading, error } = useQuery<Task[], Error>({
//     queryKey: ["tasks", projectId],
//     queryFn: () => fetchTasks(projectId),
//     staleTime: 1000 * 60 * 5, // cache 5 min
//   });

//   // ✅ Hydrate Zustand when data arrives
//   useEffect(() => {
//     if (data) setTasks(data as Task[]);
//   }, [data, setTasks]);

//   // 🔹 Create Task
//   const createTaskMutation = useMutation({
//     mutationFn: async (newTask: Partial<Task>) => {
//       const res = await fetch(`/api/tasks`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(newTask),
//       });
//       if (!res.ok) throw new Error("Failed to create task");
//       return res.json();
//     },
//     onSuccess: (task: Task) => addTask(task),
//   });

//   // 🔹 Update Task (optimistic)
//   const updateTaskMutation = useMutation({
//     mutationFn: async (task: Partial<Task> & { id: string }) => {
//       const { id, title, description, dueDate, priority } = task;

//       const res = await fetch(`/api/tasks/${id}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           title,
//           description,
//           dueDate,
//           priority,
//         }),
//       });

//       if (!res.ok) throw new Error("Failed to update task");
//       return res.json();
//     },

//     onMutate: async (updates) => {
//       // ✅ Optimistic update: update store immediately
//       updateTask(updates.id, updates);
//     },
//     onSuccess: (updatedTask) => {
//       // ✅ Replace optimistic update with server-validated data
//       updateTask(updatedTask.id, updatedTask);
//     },
//     onError: (err, task) => {
//       console.error("Update task failed, rolling back", err);
//       // Optional: refetch tasks or show error toast
//     },
//   });

//   // 🔹 Delete Task
//   const deleteTaskMutation = useMutation({
//     mutationFn: async (taskId: string) => {
//       const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
//       if (!res.ok) throw new Error("Failed to delete task");
//       return taskId;
//     },
//     onSuccess: (taskId: string) => deleteTask(taskId),
//   });

//   // 🔹 Move Task (drag-and-drop reorder, optimistic)
//   const moveTaskMutation = useMutation({
//     mutationFn: async ({
//       taskId,
//       newListId,
//       newPosition,
//     }: {
//       taskId: string;
//       newListId: string;
//       newPosition: number;
//     }) => {
//       const res = await fetch(`/api/tasks/reorder`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify([
//           { id: taskId, listId: newListId, position: newPosition },
//         ]),
//       });
//       if (!res.ok) throw new Error("Failed to move task");
//       return res.json();
//     },
//     onMutate: ({ taskId, newListId, newPosition }) => {
//       moveTaskOptimistic(taskId, newListId, newPosition);
//     },
//   });

//   return {
//     tasks: data,
//     isLoading,
//     error,
//     createTask: createTaskMutation.mutate,
//     updateTask: updateTaskMutation.mutateAsync, // ✅ instant update
//     deleteTask: deleteTaskMutation.mutate,
//     moveTask: moveTaskMutation.mutate,
//   };
// }
