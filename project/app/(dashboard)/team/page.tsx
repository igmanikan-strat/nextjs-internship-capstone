"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { DashboardLayout } from "@/components/dashboard-layout"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { UserManageModal } from "@/components/modals/user-manage-modal"
import { useUser } from "@clerk/nextjs"
import { DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { Dialog, DialogContent, DialogTitle } from "@radix-ui/react-dialog"
import { ProjectListModal } from "@/components/modals/project-list-modal"

export default function TeamPage() {
  const queryClient = useQueryClient()
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const { user } = useUser()
  const [projectModalUser, setProjectModalUser] = useState<any>(null)
  // fetch company-wide users
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      return res.json()
    },
  })

  // fetch current user's role (only run when we have a user ID)
  const { data: currentUserRole } = useQuery({
    queryKey: ["currentUserRole", user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const res = await fetch(`/api/users/${user.id}/role`)
      if (!res.ok) throw new Error("Failed to fetch role")
      return res.json()
    },
    enabled: !!user?.id, // prevents running until Clerk user is loaded
  })

  if (isLoading) {
    return (
      <DashboardLayout>
        <p className="p-6">Loading team members...</p>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">
              Team
            </h1>
            <p className="text-payne's_gray-500 dark:text-french_gray-500 mt-2">
              Manage team members and permissions
            </p>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users?.map((userItem: any, index: number) => (
            <div
              key={index}
              className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 p-6"
            >
              {/* Header with name + role */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue_munsell-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {userItem.name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-outer_space-500 dark:text-platinum-500">
                      {`${userItem.firstName ?? ""} ${userItem.lastName ?? ""}`.trim()}
                    </h3>

                    <p className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
                      {userItem.role}
                    </p>
                  </div>
                </div>

                {/* Admin-only actions */}
                {currentUserRole?.role === "admin" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="p-1 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400 rounded"
                      >
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white dark:bg-outer_space-500 rounded-md shadow-md">
                      <DropdownMenuItem
                        onClick={() => setSelectedUser(userItem)}
                      >
                        Manage User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Username */}
              <div className="text-sm text-payne's_gray-500 dark:text-french_gray-400 mb-4">
                @{userItem.username}
              </div>

              {/* Projects */}
              <div className="flex items-center justify-between text-sm text-payne's_gray-500 dark:text-french_gray-400">
                <button
                  onClick={() => setProjectModalUser(userItem)}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {userItem.projects?.length || 0} Projects
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manage User Modal */}
      {selectedUser && (
        <UserManageModal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          user={selectedUser}
          currentUserRole={currentUserRole?.role}
          onUpdateRole={async (userId, newRole) => {
            await fetch(`/api/users/${userId}/role`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ role: newRole }),
            })
            queryClient.invalidateQueries({ queryKey: ["users"] })
          }}
          onDeleteUser={async (userId) => {
            await fetch(`/api/users/${userId}`, { method: "DELETE" })
            queryClient.invalidateQueries({ queryKey: ["users"] })
          }}
        />
      )}

      {/* Projects Modal */}
      <ProjectListModal
  isOpen={!!projectModalUser}
  onClose={() => setProjectModalUser(null)}
  user={projectModalUser}
/>
      
    </DashboardLayout>
  )
}
