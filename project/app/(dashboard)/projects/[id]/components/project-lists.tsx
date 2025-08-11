"use client";

import { useTaskModal } from "@/stores/task-modal-store";
import { List } from "@/lib/db/schema";
import { CreateTaskModal } from "@/components/modals/create-task-modal";
import { CreateListModal } from "@/components/modals/create-list-modal";

interface ProjectListsProps {
  lists: List[];
  projectId: string;
}

export const ProjectLists = ({ lists, projectId }: ProjectListsProps) => {
  const { open } = useTaskModal();

  return (
    <>
      {/* Modal components */}
      <CreateTaskModal />
      <CreateListModal projectId={projectId} />

      {/* Kanban board UI */}
      <div className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 p-6">
        <div className="flex space-x-6 overflow-x-auto pb-4">
          {lists.map((list) => (
            <div key={list.id} className="flex-shrink-0 w-80">
              <div className="bg-platinum-800 dark:bg-outer_space-400 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400">
                <div className="p-4 border-b border-french_gray-300 dark:border-payne's_gray-400">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-outer_space-500 dark:text-platinum-500">
                      {list.title}
                      <span className="ml-2 px-2 py-1 text-xs bg-french_gray-300 dark:bg-payne's_gray-400 rounded-full">
                        0
                      </span>
                    </h3>
                    <button
                      className="w-full p-3"
                      onClick={() => open(projectId, list.id)}
                    >
                      + Add task
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-3 min-h-[400px]">
                  <p className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
                    {list.description}
                  </p>
                  <button
                    onClick={() => open(projectId, list.id)}
                    className="w-full p-3 border-2 border-dashed border-french_gray-300 dark:border-payne's_gray-400 rounded-lg text-payne's_gray-500 dark:text-french_gray-400 hover:border-blue_munsell-500 hover:text-blue_munsell-500 transition-colors"
                  >
                    + Add task
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
