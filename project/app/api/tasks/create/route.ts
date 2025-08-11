// app/api/tasks/create/route.ts
import { NextResponse } from "next/server"
import { createTask } from "@/lib/db/queries"
import { taskSchema } from "@/lib/validations"
import { ZodError, ZodIssue } from 'zod'

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = taskSchema.parse(body);

    const task = await createTask(validated);
    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASK_CREATE]", error);

    if (error instanceof ZodError) {
      return NextResponse.json({ message: "Validation Error", issues: error.issues }, { status: 400 });
    }

    return new NextResponse("Internal Error", { status: 500 });
  }
}