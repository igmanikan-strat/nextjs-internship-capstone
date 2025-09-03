// app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { users, notifications, userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getNotificationsForUser } from "@/lib/db/queries";

export async function GET() {
  try {
    const { userId: clerkUserId } = auth();
    // console.log("[notifications] clerkUserId:", clerkUserId);
    if (!clerkUserId) return NextResponse.json([], { status: 200 });

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUserId),
    });
    // console.log("[notifications] dbUser:", dbUser);
    if (!dbUser) return NextResponse.json([], { status: 200 });

    const notifs = await getNotificationsForUser(dbUser.id);
    console.log("[notifications] fetched notifications:", notifs.length);

    return NextResponse.json(notifs);
  } catch (err) {
    console.error("[notifications] GET failed:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUserId),
    });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { notificationsEnabled } = body;

    if (typeof notificationsEnabled !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Upsert: create or update userSettings
    await db.insert(userSettings)
      .values({
        userId: dbUser.id,
        notificationsEnabled,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { notificationsEnabled },
      });

    return NextResponse.json({ success: true, notificationsEnabled });
  } catch (err) {
    console.error("[notifications] PATCH failed:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
