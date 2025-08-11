// lib/db/queries.ts
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as schema from "./schema";
import { auth } from "@clerk/nextjs/server"; // ✅ Add this
import { projects } from "./schema" // ✅ ADD THIS at the top
import { taskSchema } from "@/lib/validations"
import { v4 as uuidv4 } from "uuid"
import { tasks } from "./schema"
import { z } from "zod"
import { lists } from "./schema";

export async function getAllProjects() {
  const { userId } = auth(); // ✅ Get Clerk user

  if (!userId) return []; // Optional: handle unauthenticated

  return await db.query.projects.findMany({
    where: eq(schema.projects.ownerId, userId),
  });
}

export async function getProjectById(id: string) {
  return await db.query.projects.findFirst({
    where: eq(schema.projects.id, id),
  });
}

export async function createProject(data: typeof schema.projects.$inferInsert) {
  return await db.insert(schema.projects).values(data).returning();
}

// lib/db/queries.ts
export async function updateProject(id: string, data: Partial<typeof projects.$inferInsert>) {
  return await db.update(projects).set(data).where(eq(projects.id, id)).returning();
}
export async function deleteProject(id: string) {
  return await db.delete(schema.projects).where(eq(schema.projects.id, id));
}

export async function getTasksByProjectId(projectId: string) {
  const { userId } = auth()
  if (!userId) throw new Error("Unauthorized")

  return await db.query.tasks.findMany({
    where: (task, { eq }) => eq(task.projectId, projectId),
    orderBy: (task, { asc }) => asc(task.createdAt),
  })
}

export async function getTaskById(id: string) {
  const { userId } = auth()
  if (!userId) throw new Error("Unauthorized")

  return await db.query.tasks.findFirst({
    where: (task, { eq }) => eq(task.id, id),
  })
}

export async function createTask(input: z.infer<typeof taskSchema>) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = taskSchema.parse(input);

  const priorityMap = {
    low: 1,
    medium: 2,
    high: 3,
  } as const;

  return await db.insert(tasks).values({
    id: uuidv4(),
    title: validated.title,
    description: validated.description,
    userId,
    assigneeId: validated.assigneeId,
    priority: priorityMap[validated.priority], // 💡 convert "low" → 1
    dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
    listId: validated.listId,
    projectId: validated.projectId,
    position: validated.position,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

const priorityMap = {
  low: 1,
  medium: 2,
  high: 3,
} as const

export async function updateTask(id: string, input: z.infer<typeof taskSchema>) {
  const { userId } = auth()
  if (!userId) throw new Error("Unauthorized")

  const validated = taskSchema.parse(input)

  return await db.update(tasks)
    .set({
      ...validated,
      priority: priorityMap[validated.priority],
      dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))
}

export async function deleteTask(id: string) {
  const { userId } = auth()
  if (!userId) throw new Error("Unauthorized")

  return await db.delete(tasks).where(eq(tasks.id, id))
}

export async function moveTask(taskId: string, newListId: string, position: number) {
  const { userId } = auth()
  if (!userId) throw new Error("Unauthorized")

  return await db.update(tasks)
    .set({
      listId: newListId,
      position,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId))
}

export async function createList({
  title,
  projectId,
}: {
  title: string;
  projectId: string;
}) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const newList = await db.insert(lists).values({
    title,
    name: title, // or a separate name input
    description: "", // or pass actual description if using a form
    projectId,
    position: 0,
  }).returning();

  return newList[0];
}

export async function getListsByProjectId(projectId: string) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const data = await db.query.lists.findMany({
    where: (list, { eq }) => eq(list.projectId, projectId),
    orderBy: (list, { asc }) => [asc(list.createdAt)],
  });

  return data;
}
