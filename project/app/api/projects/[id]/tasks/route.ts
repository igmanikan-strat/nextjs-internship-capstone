//app/api/projects/[id]/tasks/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tasks, lists } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const projectId = params.id;

    // 1️⃣ Get all lists for the project
    const projectLists = await db
      .select()
      .from(lists)
      .where(eq(lists.projectId, projectId));

    const listIds = projectLists.map((list) => list.id);

    if (listIds.length === 0) {
      return NextResponse.json([]);
    }

    // 2️⃣ Get all tasks for these lists
    const projectTasks = await db
      .select()
      .from(tasks)
      .where(inArray(tasks.listId, listIds))
      .orderBy(tasks.position);

    return NextResponse.json(projectTasks);
  } catch (error) {
    console.error("[PROJECT_TASKS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
