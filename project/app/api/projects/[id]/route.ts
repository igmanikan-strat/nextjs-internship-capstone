//app/api/projects/[id]/route.ts
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getUserProjectRole, hasPermission } from "@/lib/authz";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const role = await getUserProjectRole(params.id, userId);
  if (!hasPermission(role, "project.delete")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  await db.delete(projects).where(eq(projects.id, params.id));
  return NextResponse.json({ success: true });
}

