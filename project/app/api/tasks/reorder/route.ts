// app/api/tasks/reorder/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { getUserProjectRole, hasPermission } from "@/lib/authz";

export async function PATCH(req: Request) {
  try {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) return new NextResponse("Unauthorized", { status: 401 });

    const updates: { id: string; listId: string; position: number; projectId: string }[] = await req.json();
    if (!updates.length) return new NextResponse("No updates", { status: 400 });

    const projectId = updates[0].projectId;
    const role = await getUserProjectRole(projectId, clerkUserId);
    if (!hasPermission(role, "task.reorder")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    for (const t of updates) {
      await db.update(tasks).set({ listId: t.listId, position: t.position, updatedAt: new Date() }).where(eq(tasks.id, t.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Task reorder error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
