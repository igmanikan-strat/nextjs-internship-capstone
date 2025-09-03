//components/modals/create-project-modal.tsx
'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createProjectSchema } from '@/lib/validations'
import { useCreateProject } from '@/hooks/use-projects'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@clerk/nextjs'

type CreateProjectInput = z.infer<typeof createProjectSchema>

type CreateProjectModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectModal({ open, onOpenChange }: CreateProjectModalProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
  })

  const queryClient = useQueryClient()
  const { mutate: createProject } = useCreateProject()
  const { userId } = useAuth()

  if (!hasMounted || !open) return null

  const onSubmit = async (data: CreateProjectInput) => {
    if (!userId) {
      console.error('🚫 No user ID found')
      return
    }

    createProject(
      {
        ...data,
        ownerId: userId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['projects'] })
          onOpenChange(false)
        },
        onError: (error) => {
          console.error('❌ Failed to create project', error)
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-outer_space-500 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-outer_space-500 dark:text-platinum-500 mb-4">
          Create New Project
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

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
