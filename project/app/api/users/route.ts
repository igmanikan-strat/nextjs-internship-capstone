import { db } from "@/lib/db"; // your drizzle client
import { users } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";

const userSchema = z.object({
  clerkId: z.string(),
  username: z.string(),
  email: z.string().email().optional(), // Clerk may provide later
  name: z.string().optional(),
  role: z.enum(["admin", "manager", "member"]).default("member"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = userSchema.parse(body);

    // Insert user into DB
    await db.insert(users).values({
      clerkId: parsed.clerkId,
      username: parsed.username,
      email: parsed.email || "",
      name: parsed.name || parsed.username,
      role: parsed.role,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error saving user:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
