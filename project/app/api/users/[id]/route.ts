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

    // Get caller from DB
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUserId),
    });
    if (!currentUser) return new NextResponse("Unauthorized", { status: 401 });

    // 🚫 Only admins can delete company users
    if (currentUser.role !== "admin") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Prevent self-delete
    if (currentUser.id === params.id) {
      return new NextResponse("Admins cannot delete themselves", { status: 400 });
    }

    // First remove from all project memberships
    await db.delete(projectMembers).where(eq(projectMembers.userId, params.id));

    // Then remove user from company
    await db.delete(users).where(eq(users.id, params.id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
