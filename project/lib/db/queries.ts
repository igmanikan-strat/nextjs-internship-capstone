// lib/db/queries.ts
import { eq, and, or, asc, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as schema from "./schema";
import { auth } from "@clerk/nextjs/server"; // ✅ Add this
import { projects, taskActivity } from "./schema" // ✅ ADD THIS at the top
import { taskSchema } from "@/lib/validations"
import { v4 as uuidv4 } from "uuid"
import { tasks } from "./schema"
import { z } from "zod"
import { lists } from "./schema";
import { taskUpdateSchema } from "@/lib/validations"; // import the new schema
import { Task } from "@/types"
import { projectMembers } from "@/lib/db/schema";
import { users as usersTable } from "./schema";
import { users } from "./schema";
import { userSettings, notifications } from "./schema";
// Fetch all projects for the logged-in user
// Fetch all projects for the logged-in user
export async function getAllProjects() {
  const { userId: clerkUserId } = auth();
  if (!clerkUserId) return [];

  // Get DB user
  const user = await db.query.users.findFirst({
    where: eq(usersTable.clerkId, clerkUserId),
  });
  if (!user) return [];

  // ✅ Use user.id (UUID) here
  const memberProjects = await db.query.projectMembers.findMany({
    where: eq(projectMembers.userId, user.id),
    columns: { projectId: true },
  });
  const memberProjectIds = memberProjects.map((p) => p.projectId);

  // ✅ Use user.id (UUID) as ownerId
  const projectsList = await db.query.projects.findMany({
    where: (project, { eq, or, inArray }) => {
      const conditions = [eq(project.ownerId, user.id)];
      if (memberProjectIds.length > 0) conditions.push(inArray(project.id, memberProjectIds));
      return or(...conditions);
    },
  });

  // Deduplicate
  const uniqueProjects = Array.from(new Map(projectsList.map((p) => [p.id, p])).values());

  // Fetch members for each project
  const projectsWithMembers = await Promise.all(
    uniqueProjects.map(async (project) => {
      const members = await db.query.projectMembers.findMany({
        where: eq(projectMembers.projectId, project.id),
      });
      return { ...project, members };
    })
  );

  return projectsWithMembers;
}


// Fetch a single project by ID for the logged-in user
export async function getProjectById(id: string) {
  const { userId: clerkUserId } = auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  // Get the user from DB using Clerk ID
  const user = await db.query.users.findFirst({
    where: eq(usersTable.clerkId, clerkUserId),
  });
  if (!user) throw new Error("Unauthorized");

  // ✅ Use user.id (UUID), not clerkUserId
  const memberProjects = await db.query.projectMembers.findMany({
    where: eq(projectMembers.userId, user.id),
    columns: { projectId: true },
  });
  const memberProjectIds = memberProjects.map((p) => p.projectId);

  const project = await db.query.projects.findFirst({
    where: (project, { eq, and, inArray, or }) => {
      const conditions = [
        and(eq(project.id, id), eq(project.ownerId, user.id)), // owner
      ];

      if (memberProjectIds.length > 0) {
        conditions.push(and(eq(project.id, id), inArray(project.id, memberProjectIds))); // member
      }

      if (user.role === "admin") {
        conditions.push(eq(project.id, id)); // admin override
      }

      return or(...conditions);
    },
  });

  if (!project) throw new Error("Project not found or forbidden");

  const members = await db.query.projectMembers.findMany({
    where: eq(projectMembers.projectId, project.id),
  });

  return { ...project, members };
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

export async function getTasksByProjectId(projectId: string): Promise<Task[]> {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  // ✅ Ensure user has access
  const project = await db.query.projects.findFirst({
    where: (p, { eq, or }) =>
      and(
        eq(p.id, projectId),
        or(
          eq(p.ownerId, userId),
          eq(schema.projectMembers.userId, userId)
        )
      ),
  });

  if (!project) throw new Error("Forbidden");

  // ✅ Fetch tasks directly by projectId
  const rows = await db.query.tasks.findMany({
    where: (t, { eq }) => eq(t.projectId, projectId),
    orderBy: (t, { asc }) => [asc(t.listId), asc(t.position)],
    columns: {
      id: true,
      title: true,
      description: true,
      userId: true,
      projectId: true,
      listId: true,
      assigneeId: true,
      priority: true,
      dueDate: true,
      position: true,
      createdAt: true,
      updatedAt: true,
      status: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    listId: row.listId,
    assigneeId: row.assigneeId ?? null,
    priority:
      row.priority === 1
        ? "low"
        : row.priority === 2
        ? "medium"
        : row.priority === 3
        ? "high"
        : "low",
    dueDate: row.dueDate ?? null,
    position: row.position,
    createdAt: row.createdAt ?? new Date(),
    updatedAt: row.updatedAt ?? new Date(),
    comments: [],
    userId: row.userId,
    projectId: row.projectId,
    status: row.status,
  }));
}



export async function getTaskById(id: string) {
  const { userId } = auth()
  if (!userId) throw new Error("Unauthorized")

  return await db.query.tasks.findFirst({
    where: (task, { eq }) => eq(task.id, id),
  })
}

export async function createTask(input: z.infer<typeof taskSchema>) {
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("Unauthorized");

  const validated = taskSchema.parse(input);

  const priorityMap = {
    low: 1,
    medium: 2,
    high: 3,
  } as const;

  const dbUser = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.clerkId, clerkId!),
  });
  if (!dbUser) throw new Error("User not found in database");

  let assigneeUuid: string | null = null;
  if (validated.assigneeId && validated.assigneeId !== "") {
    const dbAssignee = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.clerkId, validated.assigneeId!),
    });
    if (!dbAssignee) throw new Error("Assignee not found in database");
    assigneeUuid = dbAssignee.id;
  }

  // ✅ Use .returning() to get the inserted row
  const [insertedTask] = await db
    .insert(tasks)
    .values({
      id: uuidv4(),
      title: validated.title,
      description: validated.description,
      userId: dbUser.id,
      assigneeId: assigneeUuid,
      priority: priorityMap[validated.priority],
      dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
      listId: validated.listId,
      projectId: validated.projectId,
      position: validated.position,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning(); // <--- this is key

  return insertedTask;
}



const priorityMap = {
  low: 1,
  medium: 2,
  high: 3,
} as const

export async function updateTask(id: string, input: z.infer<typeof taskUpdateSchema>) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = taskUpdateSchema.parse(input);

  const priorityMap = {
    low: 1,
    medium: 2,
    high: 3,
  } as const;

  return await db.update(tasks)
    .set({
      ...validated,
      priority: validated.priority ? priorityMap[validated.priority] : undefined,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
      status: validated.status ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id));
}

export async function deleteTask(id: string) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  // 1️⃣ Fetch task before deleting (to log metadata)
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
  });

  if (!task) throw new Error("Task not found");

  // 2️⃣ Delete task
  await db.delete(tasks).where(eq(tasks.id, id));

  // 3️⃣ Log deletion activity
  await db.insert(taskActivity).values({
    taskId: id,          // still reference deleted task
    userId,
    action: "task_deleted",
    metadata: {
      title: task.title,
      listId: task.listId,
      projectId: task.projectId,
    },
  });
  console.log("Deleting task", id);

  return true;
}

export async function deleteTasksBulk(taskIds: string[], userId: string) {
  // 1️⃣ Fetch tasks before deletion
  const existingTasks = await db.query.tasks.findMany({
    where: inArray(tasks.id, taskIds),
  });

  if (existingTasks.length === 0) return [];

  // 2️⃣ Delete them all at once
  await db.delete(tasks).where(inArray(tasks.id, taskIds));

  // 3️⃣ Log in one insert (no duplicates)
  await db.insert(taskActivity).values(
    existingTasks.map((t) => ({
      taskId: t.id,
      userId,
      action: "task_deleted",
      metadata: {
        title: t.title,
        listId: t.listId,
        projectId: t.projectId,
      },
    }))
  );

  return existingTasks.map((t) => t.id);
}

export async function deleteList(listId: string) {
  const user = await auth();
  if (!user) throw new Error("Unauthorized");

  return await db.delete(lists).where(eq(lists.id, listId)).returning();
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

  // ensure user has access to project
  const project = await db.query.projects.findFirst({
    where: (p, { eq, or }) =>
      and(
        eq(p.id, projectId),
        or(
          eq(p.ownerId, userId),
          eq(schema.projectMembers.userId, userId)
        )
      ),
  });

  if (!project) throw new Error("Forbidden");

  return await db.query.lists.findMany({
    where: (list, { eq }) => eq(list.projectId, projectId),
    orderBy: (list, { asc }) => [asc(list.createdAt)],
  });
}


// Get a user's role in a project
export async function getUserProjectRole(projectId: string, userId: string) {
  return await db.query.projectMembers.findFirst({
    where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)),
  });
}

// Add a member to a project (Admin-only)
export async function addMemberToProject(projectId: string, userId: string, role: "member" | "manager") {
  return await db.insert(projectMembers).values({
    projectId,
    userId,
    role,
  }).returning();
}

//notification
export async function getRecipients(actorId?: string, includeActor = false) {
  let recipients = await db.query.users.findMany({
    columns: { id: true }, // fetch all users
  });

  if (!includeActor && actorId) {
    recipients = recipients.filter((r) => r.id !== actorId);
  }

  console.log("[getRecipients] Recipients:", recipients.map((r) => r.id));
  return recipients.map(r => ({ userId: r.id }));
}



export async function generateMessage(
  type: "project_created" | "list_created" | "task_created",
  actorId: string,
  projectId?: string,
  listId?: string,
  taskId?: string
) {
  const actor = await db.query.users.findFirst({ where: eq(users.id, actorId) });
  const actorName = actor ? `${actor.firstName} ${actor.lastName}` : "Someone";

  switch (type) {
    case "project_created":
      return `${actorName} created a new project`;
    case "list_created":
      return `${actorName} created a new list`;
    case "task_created":
      return `${actorName} created a new task`;
  }
}


export async function createNotification(
  type: "project_created" | "list_created" | "task_created",
  actorId: string,
  projectId?: string,
  listId?: string,
  taskId?: string,
  includeActor = false // whether the actor also receives the notification
) {
  console.log(`[createNotification] Called with type=${type}, actorId=${actorId}, projectId=${projectId}, listId=${listId}, taskId=${taskId}`);

  // Fetch recipients
  const recipients = await getRecipients(actorId, includeActor);

  if (recipients.length === 0) {
    console.log("[createNotification] No recipients found. Skipping notification creation.");
    return;
  }

  // Generate message
  const message = await generateMessage(type, actorId, projectId, listId, taskId);
  console.log("[createNotification] Message:", message);

  // Insert into DB
  await db.insert(notifications).values(
    recipients.map((r) => ({
      recipientId: r.userId,
      actorId,
      projectId,
      listId,
      taskId,
      type,
      message,
      read: false,
      createdAt: new Date(),
    }))
  );

  console.log("[createNotification] Notifications created for recipients:", recipients.map(r => r.userId));
}


export async function getNotificationsForUser(userId: string) {
  return await db.query.notifications.findMany({
    where: eq(notifications.recipientId, userId),
    orderBy: (n, { desc }) => desc(n.createdAt)
  });
}
