import type { Express, Request, Response, NextFunction } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

export const requireRole = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    if (!user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const dbUser = await authStorage.getUser(user.claims.sub);
    if (!dbUser || !dbUser.isActive) {
      return res.status(403).json({ message: "Account deactivated" });
    }
    if (!roles.includes(dbUser.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    (req as any).dbUser = dbUser;
    next();
  };
};

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, requireRole("admin", "super_admin"), async (req: any, res) => {
    try {
      const { page = "1", limit = "25", search, role, status } = req.query;
      const users = await authStorage.listUsers({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        role: role as string,
        status: status as string,
      });
      res.json(users);
    } catch (error) {
      console.error("Error listing users:", error);
      res.status(500).json({ message: "Failed to list users" });
    }
  });

  app.get("/api/admin/users/:id", isAuthenticated, requireRole("admin", "super_admin"), async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/admin/users/:id/role", isAuthenticated, requireRole("super_admin"), async (req: any, res) => {
    try {
      const { role } = req.body;
      if (!["user", "admin", "super_admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      if (req.params.id === req.user.claims.sub) {
        return res.status(400).json({ message: "Cannot change own role" });
      }
      const user = await authStorage.updateUserRole(req.params.id, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.patch("/api/admin/users/:id/status", isAuthenticated, requireRole("admin", "super_admin"), async (req: any, res) => {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      if (req.params.id === req.user.claims.sub) {
        return res.status(400).json({ message: "Cannot deactivate own account" });
      }
      const targetUser = await authStorage.getUser(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      if (targetUser.role === "super_admin" && (req as any).dbUser?.role !== "super_admin") {
        return res.status(403).json({ message: "Cannot modify super_admin status" });
      }
      const user = await authStorage.updateUserStatus(req.params.id, isActive);
      res.json(user);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, requireRole("super_admin"), async (req: any, res) => {
    try {
      if (req.params.id === req.user.claims.sub) {
        return res.status(400).json({ message: "Cannot delete own account" });
      }
      await authStorage.deleteUser(req.params.id);
      res.json({ message: "User deleted" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
}
