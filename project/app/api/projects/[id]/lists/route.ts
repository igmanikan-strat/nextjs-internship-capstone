// app/api/projects/[id]/lists/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { lists } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { asc } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const projectId = params.id;

    const projectLists = await db
      .select()
      .from(lists)
      .where(eq(lists.projectId, projectId))
      .orderBy(asc(lists.position));

    return NextResponse.json(projectLists);
  } catch (error) {
    console.error("[PROJECT_LISTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
