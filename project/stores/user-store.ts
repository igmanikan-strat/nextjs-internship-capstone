// stores/user-store.ts
import { create } from "zustand"

type UserRole = "admin" | "manager" | "member"

interface User {
  id: string
  name: string
  role: UserRole
}

interface UserState {
  currentUser: User | null
  role: UserRole | null

  setUser: (user: User) => void
  clearUser: () => void

  // access flags
  canCreateProject: boolean
  canAddList: boolean
  canManageTasks: boolean
  canDeleteTask: boolean
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  role: null,

  setUser: (user) =>
    set({
      currentUser: user,
      role: user.role, // ✅ expose role directly
      canCreateProject: user.role === "admin",
      canAddList: user.role === "admin" || user.role === "manager",
      canManageTasks: ["admin", "manager", "member"].includes(user.role),
      canDeleteTask: ["admin", "manager"].includes(user.role),
    }),

  clearUser: () =>
    set({
      currentUser: null,
      role: null,
      canCreateProject: false,
      canAddList: false,
      canManageTasks: false,
      canDeleteTask: false,
    }),

  canCreateProject: false,
  canAddList: false,
  canManageTasks: false,
  canDeleteTask: false,
}))
