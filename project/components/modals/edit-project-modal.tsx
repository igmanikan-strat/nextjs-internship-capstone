//components/modals/edit-project-modal.tsx
'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createProjectSchema } from '@/lib/validations'
import { useUpdateProject } from '@/hooks/use-projects'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type EditProjectInput = z.infer<typeof createProjectSchema>

type EditProjectModalProps = {
  onClose: () => void
  project: {
    id: string
    name: string
    description?: string | null
    dueDate?: string | null
  }
}

export function EditProjectModal({ onClose, project }: EditProjectModalProps) {
  const [hasMounted, setHasMounted] = useState(false)
  const queryClient = useQueryClient()
  const { mutate: updateProject } = useUpdateProject()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<EditProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      dueDate: project?.dueDate || '',
      status: "ongoing",
    },
  })

  
  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description || '',
        dueDate: project.dueDate || '',
      })
    }
  }, [project, reset])

  if (!hasMounted || !project) return null

  const onSubmit = async (data: EditProjectInput) => {
    updateProject(
      {
        id: project.id,
        data: {
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['projects'] })
          onClose()
        },
        onError: (error) => {
          console.error('❌ Failed to update project', error)
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-outer_space-500 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-outer_space-500 dark:text-platinum-500 mb-4">
          Edit Project
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Project Name</label>
            <Input {...register('name')} />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <Textarea {...register('description')} />
          </div>

          <div>
            <label className="block text-sm font-medium">Due Date</label>
            <Input type="date" {...register('dueDate')} />
          </div>

          {/* Status toggle */}
          <Button
            type="button"
            variant={watch("status") === "completed" ? "secondary" : "outline"}
            onClick={() =>
              setValue("status", watch("status") === "ongoing" ? "completed" : "ongoing")
            }
          >
            {watch("status") === "ongoing" ? "Mark Completed ✅" : "Mark Ongoing 🔄"}
          </Button>

          {/* Save changes */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
