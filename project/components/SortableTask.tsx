'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Task } from '@/types'
import { useBoardStore } from '@/stores/board-store'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"

interface SortableTaskProps {
  task: Task
  onClick?: () => void; // opens modal
}

export default function SortableTask({ task, onClick }: SortableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task' }
  })
  const { deleteTask } = useBoardStore()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab'
  }

  const priorityColor = {
    low: 'bg-green-200 text-green-800',
    medium: 'bg-yellow-200 text-yellow-800',
    high: 'bg-red-200 text-red-800',
    default: 'bg-gray-200 text-gray-800'
  } as const

  let priorityString: "low" | "medium" | "high" | "default" = "default"
  if (task.priority === "low" || task.priority === "medium" || task.priority === "high") {
    priorityString = task.priority
  } else if (task.priority === 1) priorityString = "low"
  else if (task.priority === 2) priorityString = "medium"
  else if (task.priority === 3) priorityString = "high"

  return (
    <Card
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className="flex flex-col p-2 gap-1"
    >
      <div className="flex justify-between items-center">
        <span {...attributes} {...listeners} className="flex-1 font-semibold cursor-grab">
          {task.title}
        </span>

        {/* 3-dot menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="cursor-pointer bg-white hover:bg-gray-100 focus:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation()
                onClick?.()
              }}
            >
              Edit
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer bg-white hover:bg-red-100 focus:bg-red-100 text-red-500"
              onClick={(e) => {
                e.stopPropagation()
                deleteTask(task.id)
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600">{task.description}</p>
      )}

      <div className="flex justify-between items-center mt-1">
        <span className={`text-xs px-2 py-0.5 rounded ${priorityColor[priorityString]}`}>
          {priorityString === "default"
            ? "No priority"
            : priorityString.charAt(0).toUpperCase() + priorityString.slice(1)}
        </span>

        {task.dueDate && (
          <span className="text-xs text-gray-500">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </Card>
  )
}
