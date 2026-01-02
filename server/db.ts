import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. For production deployments, configure DATABASE_URL in the Deployments > Configuration tab."
  );
}

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  console.log("Connecting to production database...");
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 30000,
});

export const db = drizzle(pool, { schema });
