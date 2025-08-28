// app/api/tasks/[id]/comments/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { taskComments, taskActivity, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const comments = await db
      .select({
        id: taskComments.id,
        content: taskComments.content,
        createdAt: taskComments.createdAt,
        username: users.username,
      })
      .from(taskComments)
      .leftJoin(users, eq(taskComments.userId, users.id))
      .where(eq(taskComments.taskId, params.id));

    return NextResponse.json(comments);
  } catch (error) {
    console.error("[TASK_COMMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { content } = await req.json();
    if (!content) return new NextResponse("Bad Request", { status: 400 });

    // find local user record
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const [comment] = await db
      .insert(taskComments)
      .values({ taskId: params.id, userId: user.id, content })
      .returning();

    // also log activity
    await db.insert(taskActivity).values({
      taskId: params.id,
      userId: user.id,
      action: "comment_added",
      metadata: { commentId: comment.id },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("[TASK_COMMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
