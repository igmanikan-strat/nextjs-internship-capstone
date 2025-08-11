// app/api/projects/update/[id]/route.ts
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { updateProject } from "@/lib/db"
import { projectSchema } from "@/lib/validations"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const id = params.id
  const body = await req.json()
  const validated = projectSchema.safeParse({ ...body, ownerId: userId });

  if (!validated.success) {
    return NextResponse.json({ error: validated.error.format() }, { status: 400 });
  }

  const { dueDate, ...rest } = validated.data;

  try {
    const updated = await updateProject(id, {
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : null,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return new NextResponse("Server Error", { status: 500 });
  }

}
