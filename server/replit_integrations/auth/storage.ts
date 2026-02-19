import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq, ilike, or, sql, and, desc, asc } from "drizzle-orm";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  listUsers(opts: { page: number; limit: number; search?: string; role?: string; status?: string; sort?: string; order?: string }): Promise<{ users: User[]; total: number; page: number; totalPages: number; stats?: { total: number; active: number; inactive: number; admins: number; superAdmins: number } }>;
  updateUserRole(id: string, role: string): Promise<User>;
  updateUserStatus(id: string, isActive: boolean): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async listUsers(opts: { page: number; limit: number; search?: string; role?: string; status?: string; sort?: string; order?: string }): Promise<{ users: User[]; total: number; page: number; totalPages: number; stats?: { total: number; active: number; inactive: number; admins: number; superAdmins: number } }> {
    const { page = 1, limit = 25, search, role, status, sort = "created_at", order = "desc" } = opts;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(users.displayName, `%${search}%`)
        )
      );
    }
    if (role && role !== "all") {
      conditions.push(eq(users.role, role));
    }
    if (status === "active") {
      conditions.push(eq(users.isActive, true));
    } else if (status === "inactive") {
      conditions.push(eq(users.isActive, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const dirFn = order === "asc" ? asc : desc;

    const sortColumn = sort === "name" ? users.firstName
      : sort === "email" ? users.email
      : sort === "role" ? users.role
      : users.createdAt;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    const userList = await db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(dirFn(sortColumn))
      .limit(limit)
      .offset(offset);

    const [statsResult] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where is_active = true)::int`,
        inactive: sql<number>`count(*) filter (where is_active = false)::int`,
        admins: sql<number>`count(*) filter (where role = 'admin')::int`,
        superAdmins: sql<number>`count(*) filter (where role = 'super_admin')::int`,
      })
      .from(users);

    return {
      users: userList,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: statsResult,
    };
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
}

export const authStorage = new AuthStorage();
