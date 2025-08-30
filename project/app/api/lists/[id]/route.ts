// app/api/lists/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { tasks, lists } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { getUserProjectRole, hasPermission } from "@/lib/authz";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const projectLists = await db
      .select()
      .from(lists)
      .where(eq(lists.projectId, params.id));

    // ✅ mirror title → name
    const normalized = projectLists.map((list) => ({
      ...list,
      name: list.title,
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("[LISTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    // Find the list to know which project it belongs to
    const list = await db.query.lists.findFirst({ where: eq(lists.id, params.id) });
    if (!list) return new NextResponse("Not Found", { status: 404 });

    const role = await getUserProjectRole(list.projectId, userId);
    if (!hasPermission(role, "list.delete")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await db.delete(tasks).where(eq(tasks.listId, params.id));
    await db.delete(lists).where(eq(lists.id, params.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { title } = body; // ✅ source of truth

    const list = await db.query.lists.findFirst({ where: eq(lists.id, params.id) });
    if (!list) return new NextResponse("Not Found", { status: 404 });

    const role = await getUserProjectRole(list.projectId, userId);
    if (!hasPermission(role, "list.update")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const updated = await db
      .update(lists)
      .set({
        title,
        name: title,          // ✅ keep name in sync
        updatedAt: new Date(),
      })
      .where(eq(lists.id, params.id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("[LIST_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
