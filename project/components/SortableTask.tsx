'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Task } from '@/types'
import { useBoardStore } from '@/stores/board-store'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, CheckCircle, Clock } from "lucide-react"
import { useUserStore } from "@/stores/user-store"
import { hasPermission, ProjectRole } from "@/lib/permissions";
interface SortableTaskProps {
  task: Task
  onClick?: (e?: React.MouseEvent) => void
  role?: ProjectRole | null;
}

export default function SortableTask({ task, onClick, role }: SortableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task' }
  })
  const { deleteTask } = useBoardStore()
  // const { role } = useUserStore()
  const {
    selectedTaskIds,
    lastSelectedId,
    toggleTaskSelection,
    selectSingleTask,
    selectRange,
    setLastSelected,
  } = useBoardStore()

  const selected = selectedTaskIds.has(task.id)
  const canDeleteTask = hasPermission(role ?? null, "task.delete");

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

  // ✅ status styles
  const statusLabel =
    task.status === "completed" ? "Completed" : "Ongoing"

  const statusColor =
    task.status === "completed"
      ? "bg-blue-200 text-blue-800"
      : "bg-purple-200 text-purple-800"

  const statusIcon =
    task.status === "completed" ? (
      <CheckCircle className="w-3 h-3 mr-1 text-blue-700" />
    ) : (
      <Clock className="w-3 h-3 mr-1 text-purple-700" />
    )

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`flex flex-col p-3 gap-1 rounded-lg 
                bg-platinum-50 dark:bg-outer_space-600 
                text-outer_space-700 dark:text-platinum-100 
                border ${selected ? "border-blue-500 bg-blue-50 dark:bg-outer_space-500" : "border-transparent"} 
                shadow-sm`}
    >
      <div className="flex justify-between items-center">
        {/* ✅ Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            e.stopPropagation();
            const syntheticEvent = e.nativeEvent as MouseEvent;

            if (syntheticEvent.shiftKey) {
              selectRange(lastSelectedId, task.id);
            } else if (syntheticEvent.ctrlKey || syntheticEvent.metaKey) {
              toggleTaskSelection(task.id, !selected);
            } else {
              selectSingleTask(task.id);
            }

            setLastSelected(task.id);
          }}
          className="mr-2 cursor-pointer"
        />

        {/* ✅ Drag handle */}
        <span
          {...attributes}
          {...listeners}
          className="flex-1 font-semibold cursor-grab select-none"
        >
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
            {canDeleteTask && (
              <DropdownMenuItem
                className="cursor-pointer bg-white hover:bg-red-100 focus:bg-red-100 text-red-500"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteTask(task.id)
                }}
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Body */}
      <div
        onClick={(e) => {
          e.stopPropagation()
          onClick?.(e)
        }}
        className="cursor-pointer"
      >
        {task.description && (
          <p className="text-sm text-outer_space-500 dark:text-french_gray-400">{task.description}</p>
        )}
      </div>
      {task.assignee && (
        <span className="text-xs text-outer_space-400 dark:text-french_gray-500">
          Assigned to {task.assignee.name || task.assignee.email}
        </span>
      )}

      <div className="flex justify-between items-start mt-1 text-xs">
        {/* Left side: Priority badge */}
        <span
          className={`text-xs px-2 py-0.5 rounded ${priorityColor[priorityString]}`}
        >
          {priorityString === "default"
            ? "No priority"
            : priorityString.charAt(0).toUpperCase() + priorityString.slice(1)}
        </span>

        {/* Right side: Status + Due Date stacked */}
        <div className="flex flex-col items-end text-xs">
          <span
            className={`${
              task.status === "completed"
                ? "text-green-600 dark:text-green-400 font-medium"
                : "text-yellow-600 dark:text-yellow-400 font-medium"
            }`}
          >
            {task.status === "completed" ? "Completed" : "Ongoing"}
          </span>
          {task.dueDate && (
            <span className="text-outer_space-400 dark:text-french_gray-500">
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

    </Card>
  )
}
