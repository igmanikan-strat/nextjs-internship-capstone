// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { users, projectMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) return new NextResponse("Unauthorized", { status: 401 });

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUserId),
    });
    if (!currentUser) return new NextResponse("Unauthorized", { status: 401 });

    if (currentUser.role !== "admin") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (currentUser.id === params.id) {
      return new NextResponse("Admins cannot delete themselves", { status: 400 });
    }

    // 🔎 Get target user
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, params.id),
    });
    if (!targetUser) return new NextResponse("User not found", { status: 404 });

    // 1. Remove from all project memberships
    await db.delete(projectMembers).where(eq(projectMembers.userId, params.id));

    // 2. Remove from local DB
    await db.delete(users).where(eq(users.id, params.id));

    // 3. Remove from Clerk via Admin API
    if (targetUser.clerkId) {
      try {
        await fetch(`https://api.clerk.com/v1/users/${targetUser.clerkId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        });
      } catch (err) {
        console.error("⚠ Clerk deletion failed, user still removed locally:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
