import { type User, type InsertUser, users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  seedAdminUser(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not configured");
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not configured");
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not configured");
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    if (!db) throw new Error("Database not configured");
    return db.select().from(users);
  }

  async seedAdminUser(): Promise<void> {
    if (!db) {
      console.log("Database not configured - skipping admin user seeding");
      return;
    }
    const existingAdmin = await this.getUserByUsername("admin");
    if (!existingAdmin) {
      await db.insert(users).values({
        id: "admin-001",
        username: "admin",
        password: "admin123",
      }).onConflictDoNothing();
      console.log("Admin user seeded successfully (id: admin-001, username: admin)");
    } else {
      console.log("Admin user already exists");
    }
  }
}

export class MockStorage implements IStorage {
  private users: Map<string, User> = new Map([
    ["admin-001", { id: "admin-001", username: "admin", password: "admin123" }]
  ]);

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { id: `user-${Date.now()}`, username: insertUser.username, password: insertUser.password };
    this.users.set(user.id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async seedAdminUser(): Promise<void> {
    console.log("Using mock storage with pre-seeded admin user");
  }
}

let storageInstance: IStorage | null = null;

export function initializeStorage(dbReady: boolean): IStorage {
  if (dbReady && db) {
    console.log("Using DatabaseStorage with PostgreSQL");
    storageInstance = new DatabaseStorage();
  } else {
    console.log("Using MockStorage (in-memory)");
    storageInstance = new MockStorage();
  }
  return storageInstance;
}

export function getStorage(): IStorage {
  if (!storageInstance) {
    throw new Error("Storage not initialized. Call initializeStorage first.");
  }
  return storageInstance;
}
