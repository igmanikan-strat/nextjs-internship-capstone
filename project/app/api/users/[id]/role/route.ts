import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, id), // or eq(users.id, id) depending on your DB
    });

    if (!user) return new NextResponse("User not found", { status: 404 });

    return NextResponse.json({ role: user.role }); // "admin" | "manager" | "member"
  } catch (err) {
    console.error(err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
