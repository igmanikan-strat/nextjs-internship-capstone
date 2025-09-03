// app/api/calendar/tasks/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tasks, lists, projects, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1️⃣ Find internal UUID by Clerk ID
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!dbUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // 2️⃣ Use internal UUID when querying tasks
    const userTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        status: tasks.status,
        projectName: projects.name,
        listName: lists.name,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(lists, eq(tasks.listId, lists.id))
      .where(eq(tasks.userId, dbUser.id)); // ✅ UUID, not Clerk string

    return NextResponse.json(userTasks);
  } catch (error) {
    console.error("[CALENDAR_TASKS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
