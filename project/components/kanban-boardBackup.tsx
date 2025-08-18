// // components/kanban-board.tsx
// 'use client'

// import { useEffect, useState } from 'react'
// import {
//   DndContext,
//   closestCenter,
//   DragEndEvent,
//   PointerSensor,
//   useSensor,
//   useSensors,
//   DragOverlay,
//   DragStartEvent,
// } from '@dnd-kit/core'
// import {
//   SortableContext,
//   horizontalListSortingStrategy,
//   verticalListSortingStrategy,
//   arrayMove,
// } from '@dnd-kit/sortable'

// import { useBoardStore } from '@/stores/board-store'
// import { useLists, useCreateList } from '@/hooks/use-lists'
// import { useTaskModal } from '@/stores/task-modal-store'
// import { useTasks } from '@/hooks/use-tasks'
// import { Task } from '@/types'

// import SortableList from './SortableList'
// import SortableTask from './SortableTask'
// import { CreateListModal } from './modals/create-list-modal'
// import { CreateTaskModal } from './modals/create-task-modal'
// import { TaskDetailModal } from './modals/task-detail-modal' // ✅ import modal

// export default function KanbanBoard({ projectId }: { projectId: string }) {
//   const { lists, tasks, setLists, setTasks, addList } = useBoardStore()
//   const { data: listData } = useLists(projectId)
//   const { tasks: taskData } = useTasks(projectId)
//   const createListMutation = useCreateList(projectId)
//   const { open: openTaskModal } = useTaskModal()

//   const sensors = useSensors(useSensor(PointerSensor))
//   const [activeTask, setActiveTask] = useState<Task | null>(null)

//   // Sync server → store
//   useEffect(() => { if (listData) setLists(listData) }, [listData, setLists])
//   useEffect(() => { if (taskData) setTasks(taskData) }, [taskData, setTasks])

//   const handleAddList = () =>
//     createListMutation.mutate({ title: 'New List' }, { onSuccess: addList })

//   const handleAddTask = (listId: string) => openTaskModal(projectId, listId)

//   const handleDragStart = (event: DragStartEvent) => {
//     if (event.active.data.current?.type === 'task') {
//       const task = tasks.find(t => t.id === event.active.id)
//       if (task) setActiveTask(task)
//     }
//   }
//   const [selectedTask, setSelectedTask] = useState<Task | null>(null);
//   const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

//   const handleTaskClick = (task: Task) => {
//     setSelectedTask(task);
//     setIsTaskModalOpen(true);
//   };

//   const handleDragEnd = (event: DragEndEvent) => {
//   const { active, over } = event;
//   setActiveTask(null);
//   if (!over || active.id === over.id) return;

//   const activeType = active.data.current?.type;
//   const overType = over.data.current?.type;

//   // --- LIST REORDER ---
//   if (activeType === 'list' && overType === 'list') {
//     const oldIndex = lists.findIndex(l => l.id === active.id);
//     const newIndex = lists.findIndex(l => l.id === over.id);
//     if (oldIndex === -1 || newIndex === -1) return;

//     const newLists = arrayMove(lists, oldIndex, newIndex);
//     setLists(newLists);

//     fetch('/api/lists/reorder', {
//       method: 'PATCH',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(
//         newLists.map((l, idx) => ({ id: l.id, position: idx }))
//       ),
//     });
//     return;
//   }

//   // --- TASK REORDER (same list or cross-list) ---
//   if (activeType === 'task' && (overType === 'task' || overType === 'list')) {
//     const activeTaskObj = tasks.find(t => t.id === active.id);
//     if (!activeTaskObj) return;

//     const oldListId = activeTaskObj.listId;
//     // let targetListId = oldListId;
//     let overIndex = -1;

//     let targetListId: string = String(activeTaskObj.listId); // default to current list

// if (overType === 'task') {
//   const overTask = tasks.find(t => t.id === over.id);
//   if (!overTask) return;
//   targetListId = String(overTask.listId);

//   const targetTasks = tasks
//     .filter(t => t.listId === targetListId)
//     .sort((a, b) => a.position - b.position);
//   overIndex = targetTasks.findIndex(t => t.id === overTask.id);
// } else if (overType === 'list') {
//   targetListId = String(over.id); // cast the UniqueIdentifier to string
//   const targetTasks = tasks
//     .filter(t => t.listId === targetListId)
//     .sort((a, b) => a.position - b.position);
//   overIndex = targetTasks.length; // add at the end
// }


//     // --- Create new task state ---
//     const newTasksMap = new Map(tasks.map(t => [t.id, { ...t }]));
//     newTasksMap.delete(activeTaskObj.id); // remove from old position

//     const newActiveTask = { ...activeTaskObj, listId: targetListId };
    
//     // Tasks for target list
//     const targetListTasks = [...newTasksMap.values()]
//       .filter(t => t.listId === targetListId)
//       .sort((a, b) => a.position - b.position);
    
//     targetListTasks.splice(overIndex, 0, newActiveTask); // insert active task

//     // Tasks for old list
//     const oldListTasks = [...newTasksMap.values()]
//       .filter(t => t.listId === oldListId)
//       .sort((a, b) => a.position - b.position);

//     // Normalize positions
//     oldListTasks.forEach((t, idx) => newTasksMap.set(t.id, { ...t, position: idx }));
//     targetListTasks.forEach((t, idx) => newTasksMap.set(t.id, { ...t, position: idx }));

//     const finalTasks = [...newTasksMap.values()];
//     setTasks(finalTasks);

//     // Send to server (exclude temp tasks)
//     const finalTasksToSend = finalTasks
//       .filter(t => !t.id.startsWith("temp-"))
//       .map(t => ({ id: t.id, listId: t.listId, position: t.position }));

//     fetch('/api/tasks/reorder', {
//       method: 'PATCH',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(finalTasksToSend),
//     });
//   }
// };



//   return (
//     <>
//       <CreateListModal projectId={projectId} />
//       <CreateTaskModal />

//       <DndContext
//         sensors={sensors}
//         collisionDetection={closestCenter}
//         onDragEnd={handleDragEnd}
//         onDragStart={handleDragStart}
//       >
//         {/* Wrap all lists in SortableContext */}
//         <SortableContext
//           items={lists.map(l => l.id)}
//           strategy={horizontalListSortingStrategy}
//         >
//           <div className="flex gap-4 overflow-x-auto p-4">
//             {lists.map(list => {
//   const listTasks = tasks
//     .filter(t => t.listId === list.id)
//     .sort((a, b) => a.position - b.position)

//   return (
//     <SortableList
//       key={list.id}
//       list={list}
//       onAddTask={() => handleAddTask(list.id)}
//     >
//       <SortableContext
//         items={listTasks.map(t => t.id)}
//         strategy={verticalListSortingStrategy}
//       >
//         {listTasks.map(task => (
//           <SortableTask 
//             key={task.id} 
//             task={task} 
//             onClick={() => handleTaskClick(task)} 
//             />
//         ))}
        

//       </SortableContext>
//     </SortableList>
//   )
// })}

//       <TaskDetailModal
//           task={selectedTask}
//           open={isTaskModalOpen}
//           onClose={() => setIsTaskModalOpen(false)}
//           projectId={projectId}
//         />
//             {/* Add List button */}
//             <div className="flex-shrink-0 w-80 flex items-center justify-center">
//               <button
//                 onClick={handleAddList}
//                 className="w-full p-3 border-2 border-dashed rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
//               >
//                 + Add List
//               </button>
//             </div>
//           </div>
//         </SortableContext>

//         {/* Drag Preview */}
//         <DragOverlay>
//           {activeTask ? <SortableTask task={activeTask} /> : null}
//         </DragOverlay>
//       </DndContext>
//     </>
//   )
// }
