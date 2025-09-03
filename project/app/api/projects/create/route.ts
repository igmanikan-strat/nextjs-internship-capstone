// app/api/projects/create/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db/client";
import { projectSchema } from "@/lib/validations";
import { projects, projectMembers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import { hasPermission } from "@/lib/authz";
import { createNotification } from "@/lib/db/queries";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId: clerkUserId } = auth();

    

    if (!clerkUserId) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, clerkUserId) });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    const userRole = dbUser.role; // fetch the actual role from your DB

    if (!hasPermission(userRole, "project.create")) {
      return new NextResponse("Forbidden: Only admins can create projects", { status: 403 });
    }

    const parsed = projectSchema.parse(body);


    const [proj] = await db.insert(projects).values({
      name: parsed.name,
      description: parsed.description || null,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      ownerId: dbUser.id,
    }).returning();

    await db.insert(projectMembers).values({
      projectId: proj.id,
      userId: dbUser.id,
      role: "admin",
    }).onConflictDoNothing();

    try {
      await createNotification("project_created", dbUser.id, proj.id);
    } catch (err) {
      console.error("Failed to send notification:", err);
    }
    return NextResponse.json({ success: true, project: proj });

  } catch (err: any) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error("Project creation failed:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
