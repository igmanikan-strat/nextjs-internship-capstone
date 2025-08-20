// drizzle.config.ts
import { config } from "dotenv";
config({ path: ".env.local" }); // explicitly load .env.local

import { defineConfig } from "drizzle-kit";

const dbUrl = new URL(process.env.DATABASE_URL!);

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: dbUrl.hostname,
    port: Number(dbUrl.port) || 5432,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.slice(1),
    ssl: true,
  },
});
