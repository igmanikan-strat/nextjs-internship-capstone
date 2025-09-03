// app/api/tasks/bulk/delete/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { deleteTask as deleteTaskQuery } from "@/lib/db/queries"; // ✅ import the real one

const bulkDeleteSchema = z.object({
  taskIds: z.array(z.string().uuid()),
});

export async function DELETE(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { taskIds } = bulkDeleteSchema.parse(body);

    // delete each task using the shared query (handles logging too)
    for (const id of taskIds) {
      await deleteTaskQuery(id);
    }

    return NextResponse.json({ success: true, deleted: taskIds });
  } catch (error) {
    console.error("[TASKS_BULK_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
