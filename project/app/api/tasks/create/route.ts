// app/api/tasks/create/route.ts
import { NextResponse } from "next/server";
import { createTask } from "@/lib/db/queries";
import { taskSchema } from "@/lib/validations";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { hasPermission, getUserProjectRole } from "@/lib/authz";
import { ZodError } from "zod";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const validated = taskSchema.parse(body);

    const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, clerkUserId) });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    const role = await getUserProjectRole(validated.projectId, clerkUserId);
    if (!hasPermission(role, "task.create")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const task = await createTask(validated);
    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ message: "Validation Error", issues: error.issues }, { status: 400 });
    }
    console.error("Task creation failed:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
