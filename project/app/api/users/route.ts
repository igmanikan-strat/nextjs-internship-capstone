import { db } from "@/lib/db"; // drizzle client
import { users, projects, projectMembers } from "@/lib/db/schema"; // ✅ import missing tables
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

const userSchema = z.object({
  clerkId: z.string(),
  username: z.string(),
  email: z.string().email().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["admin", "manager", "member"]).default("member"),
});

// --- POST: create user ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = userSchema.parse(body);

    await db.insert(users).values({
      clerkId: parsed.clerkId,
      username: parsed.username,
      email: parsed.email || "",
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      role: parsed.role,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error saving user:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// --- GET: fetch all users with their projects ---
export async function GET() {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        role: users.role,
      })
      .from(users);

    const usersWithProjects = await Promise.all(
      allUsers.map(async (u) => {
        const userProjects = await db
          .select({
            id: projects.id,
            name: projects.name,
          })
          .from(projects)
          .innerJoin(
            projectMembers,
            eq(projectMembers.projectId, projects.id)
          )
          .where(eq(projectMembers.userId, u.id));

        return { ...u, projects: userProjects };
      })
    );

    return NextResponse.json(usersWithProjects);
  } catch (err: any) {
    console.error("Error fetching users:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
