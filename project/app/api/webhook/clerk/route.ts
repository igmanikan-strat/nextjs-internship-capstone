// app/api/webhook/clerk/route.ts
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
    const userId = user.id;

    if (email && userId) {
      const existing = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!existing) {
        await db.insert(users).values({
          id: userId,
          email,
          name,
          username,
          clerkId: userId,
        });

        console.log("✅ User added to database:", email);
      } else {
        console.log("ℹ️ User already exists:", email);
      }
    } else {
      console.error("❌ Missing required user data:", { email, userId });
    }
  }

  return NextResponse.json({ success: true });
}
