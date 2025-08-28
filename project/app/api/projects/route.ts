// app/api/projects/route.ts
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { projectMembers } from "@/lib/db/schema";
import { NextResponse } from "next/server";

// --- GET all projects for a user ---
// --- GET all projects for a user ---
export async function GET() {
  try {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) return NextResponse.json([], { status: 200 });

    const dbUser = await db.query.users.findFirst({
      where: eq(schema.users.clerkId, clerkUserId),
    });
    if (!dbUser) return NextResponse.json([], { status: 200 });

    // 1. Projects owned by the user
    const ownedProjects = await db.query.projects.findMany({
      where: eq(schema.projects.ownerId, dbUser.id), // ✅ UUID
      with: { members: true },
    });

    // 2. Projects where the user is a member
    const memberProjects = await db.query.projects.findMany({
      where: (projects, { inArray }) =>
        inArray(
          projects.id,
          db
            .select({ projectId: projectMembers.projectId })
            .from(projectMembers)
            .where(eq(projectMembers.userId, dbUser.id)) // ✅ UUID not clerkUserId
        ),
      with: { members: true },
    });

    const allProjects = [...ownedProjects, ...memberProjects];
    return NextResponse.json(allProjects, { status: 200 });
  } catch (err) {
    console.error("Error fetching projects:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


// --- POST create a new project ---
export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await db.query.users.findFirst({
      where: eq(schema.users.clerkId, clerkUserId),
    });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    const body = await req.json();

    // 1. Create project (ownerId = UUID from users table)
    const [project] = await db
      .insert(schema.projects)
      .values({
        name: body.name,
        description: body.description,
        ownerId: dbUser.id, // ✅ store UUID not clerkId
      })
      .returning();

    // 2. Add creator as a member (admin)
    await db.insert(projectMembers).values({
      projectId: project.id,
      userId: dbUser.id, // ✅ UUID
      role: "admin",
    });

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    console.error("Error creating project:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
