'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { Task } from '@/types'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, GripVertical } from 'lucide-react'

interface TaskCardProps {
  task: Task
  projectId: string
  isDragging?: boolean
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function TaskCard({ task, projectId, isDragging, onClick, onEdit, onDelete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
    data: { type: 'task' }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'default',
    opacity: isDragging ? 0.8 : 1,
  } as React.CSSProperties

  const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date() : false

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded border p-3 bg-white dark:bg-neutral-800 hover:shadow"
      // clicking anywhere in the body opens the modal
      onClick={(e) => {
        // ignore clicks on menu/handle area
        const target = e.target as HTMLElement
        if (target.closest('[data-ignore-card-click]')) return
        onClick?.()
      }}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Title + description */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                task.priority === 'high'
                  ? 'bg-red-500'
                  : task.priority === 'medium'
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
            />
            <h3 className="font-medium truncate">{task.title}</h3>
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground truncate mt-1">
              {task.description}
            </p>
          )}
        </div>

        {/* Drag handle + menu */}
        <div className="flex items-center gap-1" data-ignore-card-click>
          <button
            className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted cursor-grab"
            aria-label="Drag"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted"
                aria-label="More"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} className="bg-popover">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.() }}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={(e) => { e.stopPropagation(); onDelete?.() }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Footer: due date, labels, comments */}
      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={isOverdue ? 'text-red-500 font-semibold' : ''}>
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {task.labels?.map((label: string) => (
            <span
              key={label}
              className="bg-gray-200 dark:bg-neutral-700 px-2 py-0.5 rounded text-[10px] font-medium"
            >
              {label}
            </span>
          ))}
          {task.commentsCount !== undefined && <span>{task.commentsCount} 💬</span>}
        </div>
      </div>
    </div>
  )
}
