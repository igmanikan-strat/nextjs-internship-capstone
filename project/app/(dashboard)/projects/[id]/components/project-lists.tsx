// //app/(dashboard)/projects/[id]/components/project-lists.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { useTaskModal } from "@/stores/task-modal-store";
// import { List, Task } from "@/lib/db/schema";
// import { CreateTaskModal } from "@/components/modals/create-task-modal";
// import { CreateListModal } from "@/components/modals/create-list-modal";

// interface ProjectListsProps {
//   lists: List[];
//   projectId: string;
// }
// // helper to show priority label
// function priorityLabel(priority: number) {
//   switch (priority) {
//     case 1: return "Low";
//     case 2: return "Medium";
//     case 3: return "High";
//     default: return "Unknown";
//   }
// }
// export const ProjectLists = ({ lists, projectId }: ProjectListsProps) => {
//   const { open } = useTaskModal();
//   const [tasks, setTasks] = useState<Task[]>([]);

//   useEffect(() => {
//     async function loadTasks() {
//       const res = await fetch(`/api/projects/${projectId}/tasks`);
//       const data = await res.json();
//       console.log("Fetched tasks:", data);
//       setTasks(data);
//     }
//     loadTasks();
//   }, [projectId]);

//   const getTasksForList = (listId: string) =>
//     tasks.filter((task) => task.listId === listId);

//   return (
//     <>
//       <CreateTaskModal />
//       <CreateListModal projectId={projectId} />

//       <div className="bg-white dark:bg-outer_space-500 rounded-lg border p-6">
//         <div className="flex space-x-6 overflow-x-auto pb-4">
//           {lists.map((list) => {
//             const listTasks = getTasksForList(list.id);
//             return (
//               <div key={list.id} className="flex-shrink-0 w-80">
//                 <div className="bg-platinum-800 dark:bg-outer_space-400 rounded-lg border">
//                   <div className="p-4 border-b">
//                     <div className="flex items-center justify-between">
//                       <h3 className="font-semibold text-outer_space-500 dark:text-platinum-500">
//                         {list.title}
//                         <span className="ml-2 px-2 py-1 text-xs bg-french_gray-300 rounded-full">
//                           {listTasks.length}
//                         </span>
//                       </h3>
//                       <button
//                         onClick={() => open(projectId, list.id)}
//                         className="text-sm text-blue-500"
//                       >
//                         + Add task
//                       </button>
//                     </div>
//                   </div>

//                   <div className="p-4 space-y-3 min-h-[400px]">
//                     {listTasks.map((task) => (
//                       <div key={task.id} className="p-3 bg-white dark:bg-gray-700 rounded border">
//                         <h4 className="font-semibold">{task.title}</h4>
//                         <p className="text-sm text-gray-600 dark:text-gray-400">{task.description || "No description"}</p>
//                         <p className="text-xs mt-1">
//                           Priority: {priorityLabel(task.priority ?? 0)}
//                         </p>
//                       </div>
//                     ))}
//                     <button
//                       onClick={() => open(projectId, list.id)}
//                       className="w-full p-3 border-2 border-dashed rounded-lg text-payne's_gray-500 hover:border-blue_munsell-500 hover:text-blue_munsell-500 transition-colors"
//                     >
//                       + Add task
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </>
//   );
// };
