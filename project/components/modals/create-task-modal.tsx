"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTaskModal } from "@/stores/task-modal-store"
import { taskSchema } from "@/lib/validations"
import { z } from "zod"
import { useUser } from "@clerk/nextjs"
import { useEffect } from "react"

type TaskFormValues = z.infer<typeof taskSchema>

const createTask = async (data: TaskFormValues) => {
  console.log("Submitting task data:", data);

  const res = await fetch("/api/tasks/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Task creation failed:", errorText);
    throw new Error(errorText);
  }

  return res.json();
};


export function CreateTaskModal() {
  const { isOpen, close, projectId, listId } = useTaskModal()
  const { user } = useUser()
  const queryClient = useQueryClient()

  const form = useForm<TaskFormValues>({
    // resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      dueDate: undefined,
      assigneeId: user?.id ?? "",
      projectId: "",
      listId: "",
      position: 0,
      status: "ongoing",
    },
  })

  useEffect(() => {
    if (isOpen && projectId && listId && user?.id) {
      form.setValue("projectId", projectId);
      form.setValue("listId", listId);
      form.setValue("assigneeId", user.id); // ✅ set this dynamically too
    }
  }, [isOpen, projectId, listId, user?.id, form]);


  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form

  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
      close()
    },
    onError: (err) => {
      console.error("Task creation failed:", err)
    },
  })

  const onSubmit = (data: TaskFormValues) => {
    console.log("Creating task with data:", data); // Debug
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="bg-white dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>

        <form
            onSubmit={handleSubmit(onSubmit, (err) => {
              console.error("❌ Validation failed", err);
            })}
          >
          <div>
            <Input {...register("title")} placeholder="Task title" />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Textarea
              {...register("description")}
              placeholder="Description (optional)"
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Priority</label>
              <Select
                value={watch("priority")}
                onValueChange={(val) =>
                  setValue("priority", val as "low" | "medium" | "high")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm mb-1">Due Date</label>
              <Input
                type="date"
                value={watch("dueDate")?.slice(0, 10) || ""}
                onChange={(e) =>
                  setValue(
                    "dueDate",
                    new Date(e.target.value).toISOString()
                  )
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" type="button" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              Create Task
            </Button>
            {mutation.isError && (
              <p className="text-sm text-red-500">Failed to create task. Check console for details.</p>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
