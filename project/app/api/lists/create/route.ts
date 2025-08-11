// app/api/lists/create/route.ts
import { createListSchema } from "@/lib/validations";
import { createList } from "@/lib/db/queries";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, projectId } = createListSchema.parse(body);

    const list = await createList({ title, projectId });

    return Response.json(list);
  } catch (error) {
    return new Response("Failed to create list", { status: 500 });
  }
}
