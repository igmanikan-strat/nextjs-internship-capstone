// app/api/projects/[id]/role/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserProjectRole } from "@/lib/authz";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const role = await getUserProjectRole(params.id, userId);
  return NextResponse.json({ role });
}
