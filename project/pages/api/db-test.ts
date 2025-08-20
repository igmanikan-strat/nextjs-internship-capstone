// pages/api/db-test.ts
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

async function getUsers() {
  const result = await db.select().from(users);
  console.log(result);
}
