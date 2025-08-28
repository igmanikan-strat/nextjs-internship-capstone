import { ArrowLeft, Settings, Users, Calendar, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import KanbanBoard from "@/components/kanban-board";
import { getProjectById } from "@/lib/db/queries";
import { ManageMembersButton } from "@/components/manage-members-button";

type Project = {
  id: string;
  name: string;
  description?: string;
};

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const project = await getProjectById(projectId);

  if (!project) {
    return (
      <DashboardLayout>
        <p>Project not found.</p>
      </DashboardLayout>
    );
  }

  return (
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
              <h1 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">
                Project {project.name}
              </h1>
              <p className="text-payne's_gray-500 dark:text-french_gray-500 mt-1">
                Kanban board view for project management
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* 🔹 Client-side button for modal */}
            <ManageMembersButton projectId={project.id} />

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

        {/* Kanban Board */}
        <KanbanBoard projectId={project.id} />
      </div>
    </DashboardLayout>
  );
}
