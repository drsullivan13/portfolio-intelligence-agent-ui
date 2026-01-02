import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === "production";
const hasDatabaseUrl = !!process.env.DATABASE_URL;

export let pool: pg.Pool | null = null;
export let db: ReturnType<typeof drizzle> | null = null;

if (hasDatabaseUrl) {
  if (isProduction) {
    console.log("Connecting to production database...");
  }
  
  pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 30000,
  });
  
  db = drizzle(pool, { schema });
} else {
  console.log("DATABASE_URL not set - running without database connection");
  console.log("For production: Add 'Replit Postgres' service in Deployments > Configuration");
}

export async function waitForDatabase(maxRetries = 10, delayMs = 2000): Promise<boolean> {
  if (!pool) {
    console.log("No database configured - skipping database wait");
    return false;
  }
  
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
