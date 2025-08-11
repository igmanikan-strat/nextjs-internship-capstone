import { getListsByProjectId } from "@/lib/db/queries";

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const lists = await getListsByProjectId(params.projectId);
    return Response.json(lists);
  } catch {
    return new Response("Failed to fetch lists", { status: 500 });
  }
}
