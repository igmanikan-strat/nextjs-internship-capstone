// lib/permissions.ts (✅ client-safe)
export type ProjectRole = "admin" | "manager" | "member";
export type ProjectAction =
  | "project.delete"
  | "project.update"
  | "list.create"
  | "list.update"
  | "list.delete"
  | "list.reorder"
  | "task.create"
  | "task.update"
  | "task.delete"
  | "task.reorder"
  | "task.assign";

// ✅ duplicate ROLE_PERMS but without db imports
const ROLE_PERMS: Record<ProjectRole, ProjectAction[]> = {
  admin: [
    "project.delete",
    "project.update",
    "list.create",
    "list.update",
    "list.delete",
    "list.reorder",
    "task.create",
    "task.update",
    "task.delete",
    "task.reorder",
    "task.assign",
  ],
  manager: [
    "list.create",
    "list.update",
    "list.delete",
    "list.reorder",
    "task.create",
    "task.update",
    "task.delete",
    "task.reorder",
    "task.assign",
  ],
  member: [
    "task.create",
    "task.update",
  ],
};

export function hasPermission(role: ProjectRole | null, action: ProjectAction) {
  if (!role) return false;
  return ROLE_PERMS[role].includes(action);
}
