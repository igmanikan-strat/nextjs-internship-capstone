// app/api/tasks/[id]/route.ts
import { NextResponse } from "next/server"
import { getTaskById, deleteTask as deleteTaskQuery } from "@/lib/db/queries"
import { taskUpdateSchema } from "@/lib/validations";
import { updateTask } from "@/lib/db/queries";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUserProjectRole, hasPermission, canMemberUpdateTaskFields, isTaskOwnedOrAssignedToUser } from "@/lib/authz";
import { taskActivity } from "@/lib/db/schema";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const task = await getTaskById(params.id)
    return NextResponse.json(task)
  } catch (error) {
    console.error("[TASK_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const t = await db.query.tasks.findFirst({ where: eq(tasks.id, params.id) });
    if (!t) return new NextResponse("Not Found", { status: 404 });

    const role = await getUserProjectRole(t.projectId, userId);
    if (!hasPermission(role, "task.delete")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // ❌ don't log here, deleteTaskQuery already does it
    await deleteTaskQuery(params.id);

    return new NextResponse("Deleted", { status: 200 });
  } catch (error) {
    console.error("[TASK_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}



export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const validated = taskUpdateSchema.parse(body);

    // Load task
    const existing = await db.query.tasks.findFirst({ where: eq(tasks.id, params.id) });
    if (!existing) return new NextResponse("Not Found", { status: 404 });

    const role = await getUserProjectRole(existing.projectId, userId);
    if (!role) return new NextResponse("Forbidden", { status: 403 });

    if (role === "member") {
      if (!canMemberUpdateTaskFields(validated)) {
        return new NextResponse("Forbidden (field-level)", { status: 403 });
      }
    } else {
      if ("assigneeId" in validated && !hasPermission(role, "task.assign")) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    const task = await updateTask(params.id, validated);

    // ---- log activity ----
    const changedFields = Object.keys(validated);
    for (const field of changedFields) {
      const oldValue = (existing as any)[field];
      const newValue = (task as any)[field];
      if (oldValue !== newValue) {
        await db.insert(taskActivity).values({
          taskId: params.id,
          userId,
          action: "task_updated",
          metadata: { field, oldValue, newValue },
        });
      }
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASK_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
