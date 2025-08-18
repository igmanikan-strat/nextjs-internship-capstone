// app/api/tasks/route.ts
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { eq, asc } from "drizzle-orm"
import { tasks } from "@/lib/db/schema"

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) return new NextResponse("Unauthorized", { status: 401 })

    const userTasks = await db.query.tasks.findMany({
      where: eq(tasks.userId, userId),
      orderBy: [asc(tasks.listId), asc(tasks.position)], // ✅
    })

    return NextResponse.json(userTasks)
  } catch (error) {
    console.error("[TASKS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
