// app/api/lists/reorder/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { lists } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request) {
  try {
    // Expect an array of { id: string, position: number }
    const updates: { id: string; position: number }[] = await req.json();

    for (const list of updates) {
      await db.update(lists)
        .set({ position: list.position, updatedAt: new Date() })
        .where(eq(lists.id, list.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LISTS_REORDER]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
