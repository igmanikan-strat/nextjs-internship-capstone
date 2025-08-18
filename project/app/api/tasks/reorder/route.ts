// app/api/tasks/reorder/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request) {
  try {
    const updates: { id: string; listId: string; position: number }[] = await req.json();

    if (!updates || updates.length === 0) {
      return new NextResponse("No updates provided", { status: 400 });
    }

    for (const t of updates) {
      await db.update(tasks)
        .set({
          listId: t.listId,
          position: t.position,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, t.id));
    }

    const listIds = [...new Set(updates.map(t => t.listId))];
    const reorderedTasks = await db.query.tasks.findMany({
      where: (task, { inArray }) => inArray(task.listId, listIds),
      orderBy: (task, { asc }) => asc(task.position),
    });

    return NextResponse.json(reorderedTasks);
  } catch (error) {
    console.error("[TASKS_REORDER]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

