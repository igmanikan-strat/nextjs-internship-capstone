// app/api/projects/route.ts
import { getAllProjects } from "@/lib/db/queries";
import { NextResponse } from "next/server";


export async function GET() {
  const data = await getAllProjects();
  return NextResponse.json(data);
}