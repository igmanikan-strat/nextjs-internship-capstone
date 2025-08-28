// app/api/tasks/bulk/delete/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteTask } from "@/lib/db/queries";

const bulkDeleteSchema = z.object({
  taskIds: z.array(z.string().uuid()),
});

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { taskIds } = bulkDeleteSchema.parse(body);

    await Promise.all(taskIds.map((id) => deleteTask(id)));

    return NextResponse.json({ success: true, deleted: taskIds });
  } catch (error) {
    console.error("[TASKS_BULK_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
