'use client'

import React, { ReactNode, useState } from 'react'
import { List, Task } from '@/types'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import SortableTask from './SortableTask'
import { useSortable } from '@dnd-kit/sortable'
import { useBoardStore } from '@/stores/board-store'
import { useDeleteList } from "@/hooks/use-lists";
import { hasPermission, ProjectRole } from "@/lib/permissions";
import { EditListModal } from "@/components/modals/edit-list-modal";

interface SortableListProps {
  list: List
  projectId: string
  tasks?: Task[]
  activeTaskId?: string
  onAddTask?: () => void
  children?: ReactNode
  role?: ProjectRole | null;
}

export default function SortableList({
  list,
  projectId,
  tasks,
  activeTaskId,
  onAddTask,
  children,
  role,
}: SortableListProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: list.id,
    data: { type: 'list' },
  })

  const { mutate: deleteList } = useDeleteList(projectId);
  const [editOpen, setEditOpen] = useState(false);
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
        className="w-80 
             bg-platinum-100 dark:bg-outer_space-700 
             rounded-lg p-3 flex-shrink-0 
             shadow-sm"
    >
      <div className="flex justify-between items-center mb-2">
        <h3
          className="font-bold cursor-grab text-outer_space-700 dark:text-platinum-100"
          {...attributes}
          {...listeners}
        >
          {list.name ?? list.title ?? "Untitled"}
        </h3>

        <div className="flex gap-2">
          {hasPermission(role ?? null, "list.update") && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditOpen(true);
              }}
              aria-label="Edit list"
            >
              ✏️
            </button>
          )}
          {hasPermission(role ?? null, "list.delete") && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteList(list.id);
              }}
              aria-label="Delete list"
            >
              🗑
            </button>
          )}
        </div>
        
      </div>


      {/* tasks or children */}
      {children ? (
        <div className="flex flex-col gap-2 min-h-[100px]">{children}</div>
      ) : (
        <SortableContext items={orderedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2 min-h-[100px]">
            {orderedTasks.map((task) => (
              <div key={task.id}>
                {activeTaskId === task.id ? (
                  <div className="h-20 bg-transparent border-2 border-dashed rounded" />
                ) : (
                  <SortableTask task={task} />
                )}
              </div>
            ))}
          </div>
        </SortableContext>
      )}

      {/* ✅ modal */}
      <EditListModal
        projectId={projectId}
        list={list}
        open={editOpen}
        setOpen={setEditOpen}
      />
      {/* Add Task Button */}
      {onAddTask && (
        <button
          onClick={onAddTask}
          className="w-full py-1 mt-2 text-sm font-medium 
                    text-outer_space-600 dark:text-platinum-200 
                    bg-platinum-200 dark:bg-outer_space-600 
                    rounded hover:bg-platinum-300 dark:hover:bg-outer_space-500"
        >
          + Add Task
        </button>
      )}

    </div>
  );
}
