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

export async function waitForDatabase(maxRetries = 10, delayMs = 2000): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log("Database connection established");
      return true;
    } catch (error) {
      console.log(`Database connection attempt ${i + 1}/${maxRetries} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  console.error("Failed to connect to database after maximum retries");
  return false;
}
