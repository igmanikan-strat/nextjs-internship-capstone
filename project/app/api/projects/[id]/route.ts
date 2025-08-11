//app/api/projects/[id]/route.ts
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const projectId = params.id;

  await db.delete(projects).where(eq(projects.id, projectId));
  return NextResponse.json({ success: true });
}
