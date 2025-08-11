//lib/db/client.ts
// "use server";

import { drizzle } from "drizzle-orm/neon-http";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import * as schema from "./schema";

console.log("✅ DATABASE_URL from client.ts:", process.env.DATABASE_URL);
if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL in environment variables");
}

// Widen the type here to avoid narrow inference
const sql = neon(process.env.DATABASE_URL!) as NeonQueryFunction<boolean, boolean>;

export const db = drizzle(sql, { schema });
