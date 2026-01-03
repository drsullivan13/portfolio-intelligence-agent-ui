import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import bcrypt from "bcrypt";
import { Express, Request, Response, NextFunction } from "express";

const SALT_ROUNDS = 12;

declare module "express-session" {
  interface SessionData {
    userId: string;
    username: string;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function setupAuth(app: Express) {
  if (!pool) {
    console.log("No database pool available - using memory session store");
    const MemoryStore = require("memorystore")(session);
    app.use(
      session({
        store: new MemoryStore({ checkPeriod: 86400000 }),
        secret: process.env.SESSION_SECRET || "portfolio-intelligence-secret-key",
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: "lax",
        },
      })
    );
    return;
  }

  const PgStore = connectPgSimple(session);

  app.use(
    session({
      store: new PgStore({
        pool: pool,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "portfolio-intelligence-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: "lax",
      },
    })
  );
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    next();
  } else {
    res.status(401).json({ success: false, error: "Authentication required" });
  }
}

export function getCurrentUser(req: Request) {
  if (req.session?.userId) {
    return {
      id: req.session.userId,
      username: req.session.username,
    };
  }
  return null;
}
