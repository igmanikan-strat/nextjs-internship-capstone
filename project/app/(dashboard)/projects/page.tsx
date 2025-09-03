'use client'

import { useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CreateProjectModal } from '@/components/modals/create-project-modal'
import { DashboardLayout } from '@/components/dashboard-layout'
import { useProjects, useDeleteProject } from '@/hooks/use-projects'
import { EditProjectModal } from '@/components/modals/edit-project-modal'
import type { EditableProject } from '@/types'
import { ProjectCard } from '@/components/project-card'

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteMode, setDeleteMode] = useState(false)
  const [editProject, setEditProject] = useState<EditableProject | null>(null)

  const { data: projects = [], isLoading } = useProjects()
  const { mutate: deleteProject } = useDeleteProject()

  // Deduplicate projects by ID in case API returns duplicates
  const uniqueProjects = Array.from(new Map(projects.map(p => [p.id, p])).values())

  // Filter projects for search
  const filteredProjects = uniqueProjects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h1 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">Projects</h1>
            <p className="text-payne's_gray-500 dark:text-french_gray-500 mt-2">
              Manage and organize your team projects
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsModalOpen(true)} className="inline-flex items-center">
              <Plus size={20} className="mr-2" />
              New Project
            </Button>
            <Button
              variant={deleteMode ? 'destructive' : 'outline'}
              onClick={() => setDeleteMode(!deleteMode)}
            >
              {deleteMode ? 'Exit Delete Mode' : 'Delete Projects'}
            </Button>
          </div>
        </div>

        {/* Modals */}
        <CreateProjectModal open={isModalOpen} onOpenChange={setIsModalOpen} />
        {editProject && (
          <EditProjectModal
            project={editProject}
            onClose={() => setEditProject(null)}
          />
        )}

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-payne's_gray-500 dark:text-french_gray-400" size={16} />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-outer_space-500 border border-french_gray-300 dark:border-payne's_gray-400 rounded-lg text-outer_space-500 dark:text-platinum-500 placeholder-payne's_gray-500 dark:placeholder-french_gray-400 focus:outline-none focus:ring-2 focus:ring-blue_munsell-500"
            />
          </div>
          <Button disabled variant="outline">
            <Filter size={16} className="mr-2" />
            Filter
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <p className="text-center text-gray-500 dark:text-gray-400">Loading projects...</p>
        )}

        {/* Projects Grid */}
        {!isLoading && filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id} // ✅ unique key
                project={{
                  id: project.id,
                  name: project.name,
                  description: project.description,
                  dueDate: project.dueDate ? new Date(project.dueDate) : undefined,
                  progress: 0.6,
                  memberCount: project.members?.length ?? 0,
                  status: 'active',
                }}
                onEdit={() =>
                  setEditProject({
                    id: project.id,
                    name: project.name,
                    description: project.description ?? '',
                    dueDate:
                      project.dueDate instanceof Date
                        ? project.dueDate.toISOString().split('T')[0]
                        : typeof project.dueDate === 'string'
                        ? new Date(project.dueDate).toISOString().split('T')[0]
                        : undefined,
                  })
                }
                onDelete={() => deleteProject(project.id)}
              />
            ))}
          </div>
        ) : (
          !isLoading && (
            <p className="text-center text-gray-500 dark:text-gray-400">No projects found.</p>
          )
        )}
      </div>
    </DashboardLayout>
  )
}
