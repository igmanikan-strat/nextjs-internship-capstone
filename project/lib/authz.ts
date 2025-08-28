// lib/authz.ts
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { projects, projectMembers, tasks as tasksTbl, users } from "@/lib/db/schema";

export type ProjectRole = "admin" | "manager" | "member";
export type ProjectAction =
  | "project.delete"
  | "project.update"
  | "list.create"
  | "list.delete"
  | "list.reorder"
  | "task.create"
  | "task.update"
  | "task.delete"
  | "task.reorder"
  | "task.assign"; // changing assignee

const ROLE_PERMS: Record<ProjectRole, ProjectAction[]> = {
  admin: [
    "project.delete",
    "project.update",
    "list.create",
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
    "list.reorder",
    "task.create",
    "task.update",
    "task.delete",
    "task.reorder",
    "task.assign",
  ],
  member: [
    "task.create",
    "task.update", // limited fields; enforced below
    // no delete/reorder/assign
  ],
};

export async function getUserProjectRole(
  projectId: string,
  clerkUserId: string
): Promise<ProjectRole | null> {
  // Step 1: lookup local user by clerkId
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkUserId),
  });
  if (!user) return null;

  // Step 2: check if they're the project owner
  const proj = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });
  if (proj?.ownerId === user.id) return "admin";

  // Step 3: check membership table
  const membership = await db.query.projectMembers.findFirst({
    where: and(
      eq(projectMembers.projectId, projectId),
      eq(projectMembers.userId, user.id)
    ),
  });

  return membership?.role ?? null;
}

// export function hasPermission(role: ProjectRole | null, action: ProjectAction) {
//   if (!role) return false;
//   return ROLE_PERMS[role].includes(action);
// }

/**
 * Additional “fine-grained” checks:
 * - Members can only update certain fields (title/description/priority/dueDate)
 * - Members cannot reassign tasks or delete tasks
 * - Optionally: restrict members to tasks they created or are assigned to (toggle via param)
 */
export function canMemberUpdateTaskFields(body: any) {
  // Disallow changes to assigneeId, listId, position for members
  const forbidden = ["assigneeId", "listId", "position", "userId", "projectId", "id", "createdAt", "updatedAt"];
  return !forbidden.some((k) => k in body);
}

// optional: if you want members to edit only "their" tasks
export async function isTaskOwnedOrAssignedToUser(taskId: string, userId: string) {
  const t = await db.query.tasks.findFirst({ where: eq(tasksTbl.id, taskId) });
  if (!t) return false;
  return t.userId === userId || t.assigneeId === userId;
}

export const permissions = {
  admin: ["project.create", "list.create", "list.reorder", "task.create", "task.reorder", "member.add", "member.remove" ],
  manager: ["list.create", "list.reorder", "task.create", "task.reorder"],
  member: ["task.create", "task.reorder"],
};

export function hasPermission(role: string | null, action: string) {
  if (!role) return false;
  const perms = permissions[role as keyof typeof permissions] || [];
  return perms.includes(action);
}

// export function hasPermission(role: "admin" | "manager" | "member", action: string) {
//   return permissions[role]?.includes(action);  
// }