// app/api/tasks/bulk/update/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { updateTask } from "@/lib/db/queries";

const bulkUpdateSchema = z.object({
  taskIds: z.array(z.string().uuid()),
  updates: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    status: z.enum(["ongoing", "completed"]).optional(),
    assigneeId: z.string().uuid().optional(),
    listId: z.string().uuid().optional(),
  }),
});

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { taskIds, updates } = bulkUpdateSchema.parse(body);

    // Loop over all task IDs and update them
    const results = await Promise.all(
      taskIds.map((id) => updateTask(id, updates))
    );

    return NextResponse.json({ success: true, updated: results });
  } catch (error) {
    console.error("[TASKS_BULK_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
