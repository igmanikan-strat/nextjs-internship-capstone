// app/api/tasks/[id]/route.ts
import { NextResponse } from "next/server"
import { getTaskById, deleteTask } from "@/lib/db/queries"
import { taskUpdateSchema } from "@/lib/validations";
import { updateTask } from "@/lib/db/queries";

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
    await deleteTask(params.id)
    return new NextResponse("Deleted", { status: 200 })
  } catch (error) {
    console.error("[TASK_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const validated = taskUpdateSchema.parse(body);

    const task = await updateTask(params.id, validated);
    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASK_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}