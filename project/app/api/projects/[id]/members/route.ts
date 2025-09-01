// app/api/projects/[id]/members/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { projectMembers, users, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hasPermission, getUserProjectRole } from "@/lib/authz";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const role = await getUserProjectRole(params.id, userId);
  if (!role) return new NextResponse("Forbidden", { status: 403 });

  try {
    const rowsRaw = await db
      .select({
        id: projectMembers.id,
        userId: projectMembers.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        role: projectMembers.role,
      })
      .from(projectMembers)
      .leftJoin(users, eq(users.id, projectMembers.userId))
      .where(eq(projectMembers.projectId, params.id));

    const rows = rowsRaw.map(r => ({
      ...r,
      username: `${r.firstName} ${r.lastName}`,
    }));



    return NextResponse.json(rows);
  } catch (e) {
    console.error("❌ Failed to fetch project members:", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { userId: clerkUserId } = auth();
  if (!clerkUserId) return new NextResponse("Unauthorized", { status: 401 });

  const role = await getUserProjectRole(params.id, clerkUserId);

  const body = await req.json();
  if (!body.username) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.username, body.username), // ✅ match by username
  });

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  // Prevent duplicates
  const existing = await db.query.projectMembers.findFirst({
    where: and(
      eq(projectMembers.userId, user.id),   // ✅ use the found user's UUID
      eq(projectMembers.projectId, params.id)
    ),
  });
  if (existing) {
    return new NextResponse("User already a member", { status: 409 });
  }


  // Now use user.id (UUID)
  await db.insert(projectMembers).values({
    projectId: params.id,
    userId: user.id,
    role: user.role,
  });

  return NextResponse.json({ success: true });
}


export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { userId: clerkUserId } = auth();
  if (!clerkUserId) return new NextResponse("Unauthorized", { status: 401 });

  const role = await getUserProjectRole(params.id, clerkUserId);
  if (!hasPermission(role, "member.remove")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { userId } = await req.json();

  // Get local user record of the caller
  const currentUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkUserId),
  });
  if (!currentUser) return new NextResponse("Unauthorized", { status: 401 });

  // 🚫 Prevent admins from removing themselves
  if (currentUser.id === userId) {
    return new NextResponse("Admins cannot remove themselves", { status: 400 });
  }

  // ✅ Optional safeguard: ensure at least one admin remains
  const admins = await db
    .select()
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, params.id),
        eq(projectMembers.role, "admin")
      )
    );

  // Find the member being removed
  const memberToRemove = await db.query.projectMembers.findFirst({
    where: and(
      eq(projectMembers.projectId, params.id),
      eq(projectMembers.userId, userId)
    ),
  });

  if (!memberToRemove) {
    return new NextResponse("Member not found", { status: 404 });
  }

  // ✅ Only enforce safeguard if removing an admin
  if (memberToRemove.role === "admin") {
    const admins = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, params.id),
          eq(projectMembers.role, "admin")
        )
      );

    if (admins.length <= 1) {
      return new NextResponse("At least one admin must remain in the project", {
        status: 400,
      });
    }
  }


  // Proceed with deletion
  await db
    .delete(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, params.id),
        eq(projectMembers.userId, userId)
      )
    );

  return NextResponse.json({ success: true });
}