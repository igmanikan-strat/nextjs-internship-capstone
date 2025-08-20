// app/api/lists/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { tasks, lists } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const projectLists = await db
      .select()
      .from(lists)
      .where(eq(lists.projectId, params.id)); // id is treated as projectId here

    return NextResponse.json(projectLists);
  } catch (error) {
    console.error("[LISTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    // Delete all tasks in the list first
    await db.delete(tasks).where(eq(tasks.listId, params.id));

    // Then delete the list itself
    await db.delete(lists).where(eq(lists.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LIST_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
