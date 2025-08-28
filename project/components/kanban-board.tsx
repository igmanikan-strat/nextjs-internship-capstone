// components/kanban-board.tsx
'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'

import { useBoardStore } from '@/stores/board-store'
import { useLists, useCreateList } from '@/hooks/use-lists'
import { useTaskModal } from '@/stores/task-modal-store'
import { useTasks } from '@/hooks/use-tasks'
import { Task } from '@/types'

import SortableList from './SortableList'
import SortableTask from './SortableTask'
import { CreateListModal } from './modals/create-list-modal'
import { CreateTaskModal } from './modals/create-task-modal'
import { TaskDetailModal } from './modals/task-detail-modal' // ✅ import modal
import { useProjectRole } from "@/hooks/use-project-role";

export default function KanbanBoard({ projectId }: { projectId: string }) {
  const { lists, tasks, setLists, setTasks, addList } = useBoardStore()
  const { data: listData } = useLists(projectId)
  const { tasks: taskData, bulkDeleteMutation } = useTasks(projectId)
  const createListMutation = useCreateList(projectId)
  const { open: openTaskModal } = useTaskModal()

  const { data: roleData } = useProjectRole(projectId);
  const role = roleData?.role; // "admin" | "manager" | "member" | null
  const canCreateList = role === "admin" || role === "manager";
  const canReorder = role === "admin" || role === "manager";
  const canDeleteTask = role === "admin" || role === "manager";

  const sensors = useSensors(useSensor(PointerSensor))
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const { selectedTaskIds, selectAllTasks, clearSelection } = useBoardStore();
  const {
    lastSelectedId,
    toggleTaskSelection,
    selectSingleTask,
    selectRange,
    setLastSelected,
  } = useBoardStore();
  const { moveTasks } = useBoardStore();

  const handleMoveSelected = (targetListId: string) => {
    moveTasks(Array.from(selectedTaskIds), targetListId);
  };

  // Sync server → store
  useEffect(() => { if (listData) setLists(listData) }, [listData, setLists])
  useEffect(() => { if (taskData) setTasks(taskData) }, [taskData, setTasks])
  // 👇 keyboard shortcuts go here
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "a" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        selectAllTasks(); // ✅ from store
      }

      if (e.key === "Delete" && selectedTaskIds.size > 0 && canDeleteTask) {
        e.preventDefault();
        const ids = Array.from(selectedTaskIds);
        bulkDeleteMutation.mutate(ids);
        clearSelection(); // ✅ from store
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTaskIds, bulkDeleteMutation, canDeleteTask, selectAllTasks, clearSelection]);




  
  const handleAddList = () =>
    createListMutation.mutate({ title: 'New List' }, { onSuccess: addList })

  const handleAddTask = (listId: string) => openTaskModal(projectId, listId)

  const handleDragStart = (event: DragStartEvent) => {
    if (!canReorder) return;

    const activeType = event.active.data.current?.type;
    if (activeType === 'task') {
      const task = tasks.find(t => t.id === event.active.id);
      if (task) setActiveTask(task);
    }
  };
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const handleTaskClick = (task: Task, e?: React.MouseEvent) => {
    if (e?.ctrlKey || e?.metaKey) {
      // ✅ Ctrl/⌘ → toggle selection
      toggleTaskSelection(task.id);
      setLastSelected(task.id);
    } else if (e?.shiftKey && lastSelectedId) {
      // ✅ Shift → select range (within same list)
      selectRange(lastSelectedId, task.id);
    } else {
      // ✅ Normal click → single select + open modal
      selectSingleTask(task.id);
      setLastSelected(task.id);
      setSelectedTask(task);
      setIsTaskModalOpen(true);
    }
  };


  // --- Drag End ---
  const handleDragEnd = async (event: DragEndEvent) => {
    if (!canReorder) return;

    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // --- LIST REORDER ---
    if (activeType === 'list' && overType === 'list') {
      const oldIndex = lists.findIndex(l => l.id === active.id);
      const newIndex = lists.findIndex(l => l.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newLists = arrayMove(lists, oldIndex, newIndex);

      const projectId = newLists[0]?.projectId;
      if (!projectId) return;

      const payload = newLists.map((l, idx) => ({
        id: l.id,
        position: idx,
        projectId: l.projectId || projectId,
      }));

      try {
        const res = await fetch('/api/lists/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to reorder lists');

        // Only update state if server succeeded
        setLists(newLists);
      } catch (err) {
        console.error('List reorder error:', err);
        // Optionally show toast to user
      }

      return;
    }

    // --- TASK REORDER ---
    if (activeType === 'task' && (overType === 'task' || overType === 'list')) {
      const { tasks, lists, selectedTaskIds, moveTasks, moveTask } = useBoardStore.getState();
      const activeTaskObj = tasks.find(t => t.id === String(active.id));
      if (!activeTaskObj) return;

      const oldListId = activeTaskObj.listId; // ✅ fix

      let targetListId: string;
      let overIndex: number;

      if (overType === 'task') {
        const overTask = tasks.find(t => t.id === String(over.id));
        if (!overTask) return;
        targetListId = overTask.listId;

        const targetTasks = tasks
          .filter(t => t.listId === targetListId)
          .sort((a, b) => a.position - b.position);

        overIndex = targetTasks.findIndex(t => t.id === overTask.id);
      } else {
        targetListId = String(over.id);
        const targetTasks = tasks
          .filter(t => t.listId === targetListId)
          .sort((a, b) => a.position - b.position);

        overIndex = targetTasks.length;
      }

      // --- batch move if multiple selected ---
      const selectedIds = Array.from(selectedTaskIds);
      const isMulti = selectedIds.includes(String(active.id)) && selectedIds.length > 1;

      if (isMulti) {
        moveTasks(selectedIds, targetListId);
      } else {
        moveTask(String(active.id), targetListId, overIndex);
      }

      // Rebuild new task state
      const taskMap = new Map(tasks.map(t => [t.id, { ...t }]));
      taskMap.delete(activeTaskObj.id);

      const newActiveTask = { ...activeTaskObj, listId: targetListId };

      const targetTasks = [...taskMap.values()]
        .filter(t => t.listId === targetListId)
        .sort((a, b) => a.position - b.position);

      targetTasks.splice(overIndex, 0, newActiveTask);

      const oldTasks = [...taskMap.values()]
        .filter(t => t.listId === oldListId) // ✅ fixed
        .sort((a, b) => a.position - b.position);

      // Normalize positions
      oldTasks.forEach((t, idx) => taskMap.set(t.id, { ...t, position: idx }));
      targetTasks.forEach((t, idx) => taskMap.set(t.id, { ...t, position: idx }));

      const finalTasks = [...taskMap.values()];
      const projectId = lists.find(l => l.id === targetListId)?.projectId;
      if (!projectId) return;

      const payload = finalTasks
        .filter(t => !t.id.startsWith('temp-'))
        .map(t => ({ id: t.id, listId: t.listId, position: t.position, projectId }));

      try {
        const res = await fetch('/api/tasks/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to reorder tasks');

        setTasks(finalTasks); // update state only on success
      } catch (err) {
        console.error('Task reorder error:', err);
      }
    }
  };
  



  return (
    <>
      <CreateListModal projectId={projectId} />
      <CreateTaskModal />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        {/* Wrap all lists in SortableContext */}
        <SortableContext
          items={lists.map(l => l.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-4 overflow-x-auto p-4">
            {lists.map(list => {
  const listTasks = tasks
    .filter(t => t.listId === list.id)
    .sort((a, b) => a.position - b.position)

  return (
    <SortableList
      key={list.id}
      list={list}
      onAddTask={() => handleAddTask(list.id)}
    >
      <SortableContext
        items={listTasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {listTasks.map(task => (
          <SortableTask 
            key={task.id} 
            task={task} 
            // selected={selectedTaskIds.includes(task.id)}
            onClick={() => handleTaskClick(task)} 
            />
        ))}
        

      </SortableContext>
    </SortableList>
  )
})}

      <TaskDetailModal
          task={selectedTask}
          open={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          projectId={projectId}
        />
            {/* Add List button
            {canCreateList && (
            <div className="flex-shrink-0 w-80 flex items-center justify-center">
              <button
                onClick={handleAddList}
                className="w-full p-3 border-2 border-dashed rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                + Add List
              </button>
            </div>
              )} */}
          </div>
        </SortableContext>

        {/* Drag Preview */}
        <DragOverlay>
          {activeTask ? <SortableTask task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
    </>
  )
}
