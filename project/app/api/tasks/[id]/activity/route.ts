// app/api/tasks/[id]/activity/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { taskActivity, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const activity = await db
      .select({
        id: taskActivity.id,
        action: taskActivity.action,
        metadata: taskActivity.metadata,
        createdAt: taskActivity.createdAt,
        username: users.username,
      })
      .from(taskActivity)
      .leftJoin(users, eq(taskActivity.userId, users.id))
      .where(eq(taskActivity.taskId, params.id))
      .orderBy(asc(taskActivity.createdAt));

    return NextResponse.json(activity);
  } catch (error) {
    console.error("[TASK_ACTIVITY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
