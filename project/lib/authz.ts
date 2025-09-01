// lib/authz.ts
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { projects, projectMembers, tasks as tasksTbl, users } from "@/lib/db/schema";

export type ProjectRole = "admin" | "manager" | "member";
export type ProjectAction =
  | "project.create"
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
  | "task.assign"
  | "member.remove"; // ← add these;

// ✅ single source of truth
const ROLE_PERMS: Record<ProjectRole, ProjectAction[]> = {
  admin: [
    "project.create",
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
    "member.remove",
  ],
  manager: [
    "list.create",
    "list.update",
    "list.delete",  // ✅ managers can delete lists
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

// --- Role resolution ---
export async function getUserProjectRole(
  projectId: string,
  clerkUserId: string
): Promise<ProjectRole | null> {
  // Step 1: lookup local user by clerkId
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkUserId),
  });
  if (!user) return null;

  // Step 2: check if they're the project owner → admin
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

  return (membership?.role as ProjectRole) ?? null;
}

// --- Permission check ---
export function hasPermission(role: ProjectRole | null, action: ProjectAction) {
  if (!role) return false;
  return ROLE_PERMS[role].includes(action);
}

// --- Fine-grained rules for members ---
export function canMemberUpdateTaskFields(body: any) {
  // Disallow changes to sensitive fields for members
  const forbidden = [
    "assigneeId",
    "listId",
    "position",
    "userId",
    "projectId",
    "id",
    "createdAt",
    "updatedAt",
  ];
  return !forbidden.some((k) => k in body);
}

export async function isTaskOwnedOrAssignedToUser(taskId: string, userId: string) {
  const t = await db.query.tasks.findFirst({ where: eq(tasksTbl.id, taskId) });
  if (!t) return false;
  return t.userId === userId || t.assigneeId === userId;
}
