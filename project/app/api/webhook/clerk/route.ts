import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const body = await req.json();
  const eventType = body.type;
  const user = body.data;

  console.log(`Received webhook: ${eventType}`, user);

  if (eventType === "user.created") {
    const email = user.email_addresses?.[0]?.email_address ?? null;
    const name =
      [user.first_name, user.last_name].filter(Boolean).join(" ") || "Unnamed";
    const username = user.username ?? null;
    const clerkId = user.id; // <- Clerk ID

    if (clerkId) {
      try {
        // 🔹 Query by clerkId, not id
        const existing = await db.query.users.findFirst({
          where: eq(users.clerkId, clerkId),
        });

        if (!existing) {
          await db.insert(users).values({
            clerkId,       // 🔹 keep Clerk ID here
            email,
            name,
            username,
            // id will auto-generate UUID, don't touch it
          });

          console.log("✅ User added to database:", { email, username });
        } else {
          console.log("ℹ️ User already exists:", { email, username });
        }
      } catch (e) {
        console.error("❌ DB insert failed:", e);
      }
    }
  }
  
  if (eventType === "user.updated") {
    const email = user.email_addresses?.[0]?.email_address ?? null;
    const name =
      [user.first_name, user.last_name].filter(Boolean).join(" ") || "Unnamed";
    const username = user.username ?? null;
    const clerkId = user.id;

    await db
      .update(users)
      .set({ email, name, username, updatedAt: new Date() })
      .where(eq(users.clerkId, clerkId));
  }

  if (eventType === "user.deleted") {
    const clerkId = user.id;
    await db.delete(users).where(eq(users.clerkId, clerkId));
  }

  return NextResponse.json({ success: true });
}
