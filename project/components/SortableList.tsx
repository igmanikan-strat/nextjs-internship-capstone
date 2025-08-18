'use client'

import React, { ReactNode } from 'react'
import { List, Task } from '@/types'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import SortableTask from './SortableTask'
import { useSortable } from '@dnd-kit/sortable'
import { useBoardStore } from '@/stores/board-store'

interface SortableListProps {
  list: List
  // keep old API working
  tasks?: Task[]
  activeTaskId?: string
  onAddTask?: () => void
  // new: allow children so the parent can inject its own SortableContext
  children?: ReactNode
}

export default function SortableList({
  list,
  tasks,
  activeTaskId,
  onAddTask,
  children,
}: SortableListProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: list.id,
    data: { type: 'list' },
  })
  const { removeList } = useBoardStore()

  // ensure DOM order matches positions when using the legacy `tasks` prop
  const orderedTasks = tasks ? [...tasks].sort((a, b) => a.position - b.position) : []

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms ease',
  } as React.CSSProperties

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-80 bg-gray-100 rounded p-2 flex-shrink-0"
    >
      <div className="flex justify-between items-center mb-2 cursor-grab" {...attributes} {...listeners}>
        <h3 className="font-bold">{(list as any).name ?? (list as any).title ?? 'Untitled'}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation()
            removeList(list.id)
          }}
          aria-label="Delete list"
        >
          🗑
        </button>
      </div>

      {/* If children are provided, render them directly (parent controls SortableContext).
          Otherwise, keep backward compatibility by managing the tasks + SortableContext here. */}
      {children ? (
        <div className="flex flex-col gap-2 min-h-[100px]">
          {children}
          {onAddTask && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddTask()
              }}
              className="mt-2 w-full text-sm text-gray-600 hover:text-blue-500"
            >
              + Add Task
            </button>
          )}
        </div>
      ) : (
        <SortableContext
          items={orderedTasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2 min-h-[100px]">
            {orderedTasks.map(task => (
              <div key={task.id}>
                {activeTaskId === task.id ? (
                  <div className="h-20 bg-transparent border-2 border-dashed rounded" />
                ) : (
                  <SortableTask task={task} />
                )}
              </div>
            ))}

            {onAddTask && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAddTask()
                }}
                className="mt-2 w-full text-sm text-gray-600 hover:text-blue-500"
              >
                + Add Task
              </button>
            )}
          </div>
        </SortableContext>
      )}
    </div>
  )
}
