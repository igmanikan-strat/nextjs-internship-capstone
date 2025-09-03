// app/api/tasks/create/route.ts
import { NextResponse } from "next/server";
import { createTask } from "@/lib/db/queries";
import { taskSchema } from "@/lib/validations";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { users, taskActivity } from "@/lib/db/schema";
import { hasPermission, getUserProjectRole } from "@/lib/authz";
import { ZodError } from "zod";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/db/queries";

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const validated = taskSchema.parse(body);

    const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, clerkUserId) });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    const role = await getUserProjectRole(validated.projectId, clerkUserId);
    if (!hasPermission(role, "task.create")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const task = await createTask(validated);

    // Log activity
    await db.insert(taskActivity).values({
      taskId: task.id,
      userId: dbUser.id, // make sure you use your DB user ID
      action: "task_created",
      metadata: { title: task.title },
    });
    try {
      await createNotification("task_created", dbUser.id, validated.projectId, validated.listId, task.id);
      } catch (err) {
      console.error("Failed to send notification:", err);
    }
    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ message: "Validation Error", issues: error.issues }, { status: 400 });
    }
    console.error("Task creation failed:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
