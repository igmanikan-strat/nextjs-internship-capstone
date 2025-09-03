// app/(dashboard)/dashboard/page.tsx
"use client"

import { TrendingUp, Users, CheckCircle, Clock } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useProjects } from "@/hooks/use-projects"
import { useQuery } from "@tanstack/react-query"
import { useState, useEffect } from "react" // ⬅️ add useEffect here
import { CreateProjectModal } from "@/components/modals/create-project-modal"


// Types
type Task = {
  id: string
  title: string
  status?: "completed" | "ongoing"
  updatedAt?: string
  projectName?: string
  dueDate?: string
}

export default function DashboardPage() {
  const { data: projects = [] } = useProjects()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // ✅ Fetch team members
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      return res.json()
    },
  })

  // ✅ Fetch tasks from calendar endpoint
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await fetch("/api/calendar/tasks")
      if (!res.ok) throw new Error("Failed to fetch tasks")
      return res.json()
    },
  })
  // 🔎 Debug: log raw statuses
  useEffect(() => {
    if (tasks.length > 0) {
      console.log(
        "Statuses in dashboard:",
        tasks.map((t) => ({ id: t.id, status: t.status }))
      )
    }
  }, [tasks])
  // 🔹 Normalize stats
  const completedTasks = tasks.filter((t) =>
    ["completed", "done"].includes(t.status?.toLowerCase() ?? "")
  ).length

  const pendingTasks = tasks.filter((t) =>
    !["completed", "done"].includes(t.status?.toLowerCase() ?? "")
  ).length


  // 🔹 Recent Tasks (sort by updatedAt or dueDate fallback)
  const recentTasks = [...tasks]
    .sort((a, b) => {
      const aDate = new Date(a.updatedAt ?? a.dueDate ?? "").getTime()
      const bDate = new Date(b.updatedAt ?? b.dueDate ?? "").getTime()
      return bDate - aDate
    })
    .slice(0, 5)

  return (
      <><div>
      <h1 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">
        Dashboard
      </h1>
      <p className="text-payne's_gray-500 dark:text-french_gray-500 mt-2">
        Welcome back! Here's an overview of your projects and tasks.
      </p>
    </div><div className="space-y-6">
        {/* Modal */}
        <CreateProjectModal open={isModalOpen} onOpenChange={setIsModalOpen} />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              name: "Active Projects",
              value: projects.length.toString(),
              icon: TrendingUp,
            },
            {
              name: "Team Members",
              value: users.length.toString(),
              icon: Users,
            },
            {
              name: "Completed Tasks",
              value: completedTasks.toString(),
              icon: CheckCircle,
            },
            {
              name: "Pending Tasks",
              value: pendingTasks.toString(),
              icon: Clock,
            },
          ].map((stat) => (
            <div
              key={stat.name}
              className="bg-white dark:bg-outer_space-500 overflow-hidden rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 p-6"
            >
              <div className="flex items-center">

                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue_munsell-100 dark:bg-blue_munsell-900 rounded-lg flex items-center justify-center">
                    <stat.icon className="text-blue_munsell-500" size={20} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-payne's_gray-500 dark:text-french_gray-400 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-2xl font-semibold text-outer_space-500 dark:text-platinum-500">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Projects & Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <div className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 p-6">
            <h3 className="text-lg font-semibold text-outer_space-500 dark:text-platinum-500 mb-4">
              Recent Projects
            </h3>
            <div className="space-y-3">
              {projects.length > 0 ? (
                projects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 bg-platinum-100 dark:bg-outer_space-400 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-outer_space-500 dark:text-platinum-500">
                        {project.name}
                      </div>
                      <div className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
                        {project.updatedAt
                          ? `Last updated ${new Date(
                            project.updatedAt
                          ).toLocaleString()}`
                          : "No update info"}
                      </div>
                    </div>
                    <div className="w-12 h-2 bg-french_gray-300 dark:bg-payne's_gray-400 rounded-full">
                      <div className="w-8 h-2 bg-blue_munsell-500 rounded-full"></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  No recent projects.
                </p>
              )}
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 p-6">
            <h3 className="text-lg font-semibold text-outer_space-500 dark:text-platinum-500 mb-4">
              Recent Tasks
            </h3>
            <div className="space-y-3">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-platinum-100 dark:bg-outer_space-400 rounded-lg">
                    <div>
                      <div className="font-medium text-outer_space-500 dark:text-platinum-500">
                        {task.title}
                      </div>
                      <div className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
                        {task.projectName ?? "Unassigned Project"}
                      </div>
                    </div>
                    <div className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
                      {task.updatedAt
                        ? new Date(task.updatedAt).toLocaleDateString()
                        : task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : "No update info"}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  No recent tasks.
                </p>
              )}
            </div>
          </div>
        </div>
      </div></>

  )
}
