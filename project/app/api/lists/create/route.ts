// app/api/lists/create/route.ts
import { createListSchema } from "@/lib/validations";
import { createList } from "@/lib/db/queries";
import { auth } from "@clerk/nextjs/server";
import { getUserProjectRole, hasPermission } from "@/lib/authz";

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();
    const { title, projectId } = createListSchema.parse(body);

    const role = await getUserProjectRole(projectId, clerkUserId);
    if (!hasPermission(role, "list.create")) {
      return new Response("Forbidden", { status: 403 });
    }

    const list = await createList({ title, projectId });
    return Response.json(list);
  } catch (error) {
    console.error("List creation failed:", error);
    return new Response("Failed to create list", { status: 500 });
  }
}
