//app/(dashboard)/projects/[id]/page.tsx
import { ArrowLeft, Settings, Users, Calendar, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getListsByProjectId, getProjectById } from "@/lib/db";
import { CreateTaskModal } from "@/components/modals/create-task-modal";
import { ProjectLists } from "@/app/(dashboard)/projects/[id]/components/project-lists";

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const project = await getProjectById(projectId);
  const lists = await getListsByProjectId(projectId);

  return (
    <>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Project Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/projects"
                className="p-2 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">{project?.name}</h1>
                <p className="text-payne's_gray-500 dark:text-french_gray-500 mt-1">
                  Kanban board view for project management
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400 rounded-lg transition-colors">
                <Users size={20} />
              </button>
              <button className="p-2 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400 rounded-lg transition-colors">
                <Calendar size={20} />
              </button>
              <button className="p-2 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400 rounded-lg transition-colors">
                <Settings size={20} />
              </button>
              <button className="p-2 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400 rounded-lg transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>

          {/* Implementation Tasks Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              🎯 Kanban Board Implementation Tasks
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Task 5.1: Design responsive Kanban board layout</li>
              <li>• Task 5.2: Implement drag-and-drop functionality with dnd-kit</li>
              <li>• Task 5.4: Implement optimistic UI updates for smooth interactions</li>
              <li>• Task 5.6: Create task detail modals and editing interfaces</li>
            </ul>
          </div>

          {/* Kanban Board Lists */}
          <ProjectLists lists={lists} projectId={projectId} />

          {/* Component Implementation Guide */}
          <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              🛠️ Components & Features to Implement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <strong className="block mb-2">Core Components:</strong>
                <ul className="space-y-1 list-disc list-inside">
                  <li>components/kanban-board.tsx</li>
                  <li>components/task-card.tsx</li>
                  <li>components/modals/create-task-modal.tsx</li>
                  <li>stores/board-store.ts (Zustand)</li>
                </ul>
              </div>
              <div>
                <strong className="block mb-2">Advanced Features:</strong>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Drag & drop with @dnd-kit/core</li>
                  <li>Real-time updates</li>
                  <li>Task assignments & due dates</li>
                  <li>Comments & activity history</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>

    </>
  );
}
