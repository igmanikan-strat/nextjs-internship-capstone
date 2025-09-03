// app/api/lists/create/route.ts
import { createListSchema } from "@/lib/validations";
import { createList } from "@/lib/db/queries";
import { auth } from "@clerk/nextjs/server";
import { getUserProjectRole, hasPermission } from "@/lib/authz";
import { createNotification } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();
    const { title, projectId } = createListSchema.parse(body);
    
    const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, clerkUserId) });
    if (!dbUser) return new Response("User not found", { status: 404 });
    
    const role = await getUserProjectRole(projectId, clerkUserId);
    if (!hasPermission(role, "list.create")) {
      return new Response("Forbidden", { status: 403 });
    }

    const list = await createList({ title, projectId });

    try {
      await createNotification("list_created", dbUser.id, projectId, list.id);
    } catch (err) {
      console.error("Failed to send notification:", err);
    }
    return Response.json(list);
  } catch (error) {
    console.error("List creation failed:", error);
    return new Response("Failed to create list", { status: 500 });
  }
}
