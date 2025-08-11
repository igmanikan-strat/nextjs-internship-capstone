// hooks/use-tasks.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getTasksByProjectId,
  createTask as createTaskFn,
  updateTask as updateTaskFn,
  deleteTask as deleteTaskFn,
  moveTask as moveTaskFn,
} from "@/lib/db";
import { Task } from "@/types"

export function useTasks(projectId: string) {
  const queryClient = useQueryClient()

  const {
    data: tasks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => getTasksByProjectId(projectId),
    enabled: !!projectId,
  })

  // Create task
  const createTask = useMutation({
    mutationFn: createTaskFn,
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] })

      const previousTasks = queryClient.getQueryData<Task[]>(["tasks", projectId])

      queryClient.setQueryData<Task[]>(["tasks", projectId], (old = []) => [
        ...old,
        {
          ...newTask,
          id: `temp-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as Task

      ])

      return { previousTasks }
    },
    onError: (_err, _newTask, context) => {
      queryClient.setQueryData(["tasks", projectId], context?.previousTasks)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
    },
})

  // Update task
  const updateTask = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      updateTaskFn(id, data as any), // ensure you cast or fix the expected type in `updateTask`
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
    },
  })

  // Delete task
  const deleteTask = useMutation({
    mutationFn: deleteTaskFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
    },
  })

  const moveTask = useMutation({
  mutationFn: ({
    taskId,
    newListId,
    position,
  }: {
    taskId: string
    newListId: string
    position: number
  }) => moveTaskFn(taskId, newListId, position),

  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
  },
})

  return {
    tasks,
    isLoading,
    error,
    createTask: createTask.mutate,
    isCreating: createTask.isPending,
    updateTask: updateTask.mutate,
    isUpdating: updateTask.isPending,
    deleteTask: deleteTask.mutate,
    isDeleting: deleteTask.isPending,
    moveTask: moveTask.mutate,
    isMoving: moveTask.isPending,
  }
}
