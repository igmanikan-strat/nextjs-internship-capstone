//app/api/projects/create/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db/client'
import { projectSchema } from '@/lib/validations'
import { projects } from '@/lib/db/schema'
import { ZodError, ZodIssue } from 'zod'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId } = auth()

    if (!userId) return new NextResponse("Unauthorized", { status: 401 })

    const parsed = projectSchema.parse({ ...body, ownerId: userId })
    console.log("🟩 Parsed project data:", parsed);

    const result = await db.insert(projects).values({
      name: parsed.name,
      description: parsed.description || null,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null, // ✅ convert here
      ownerId: parsed.ownerId,
    })

    return NextResponse.json({ success: true, result })
  } catch (err: any) {
  console.error("🟥 API Error:", err);
  if (err instanceof ZodError) {
    return NextResponse.json({ error: err.issues }, { status: 400 });
  }
  return new NextResponse("Internal Server Error", { status: 500 });
}

}
