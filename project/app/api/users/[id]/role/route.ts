// app/api/users/[id]/role/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, id), // or eq(users.id, id)
    });

    if (!user) return new NextResponse("User not found", { status: 404 });

    return NextResponse.json({ role: user.role });
  } catch (err) {
    console.error(err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// ✅ Add PATCH for updating role
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    if (!body.role) {
      return new NextResponse("Role is required", { status: 400 });
    }

    // Update role by user.id (UUID) OR clerkId
    const updated = await db
      .update(users)
      .set({ role: body.role })
      .where(eq(users.id, id)) // 🔄 change to users.clerkId if frontend sends clerkId
      .returning({ id: users.id, role: users.role });

    if (updated.length === 0) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (err) {
    console.error("❌ Error updating role:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
