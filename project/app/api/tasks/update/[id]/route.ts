// app/api/tasks/update/[id]/route.ts
import { NextResponse } from "next/server";
import { updateTask } from "@/lib/db/queries";
import { taskUpdateSchema } from "@/lib/validations";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const validated = taskUpdateSchema.parse(body);

    const task = await updateTask(params.id, validated);
    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASK_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
