import { type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
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
    console.log("Using mock storage - no database connection");
  }
}

export const storage = new MockStorage();
