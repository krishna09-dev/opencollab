import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { User } from "../models/User";
import { AdminUser } from "../models/AdminUser";

export async function adminRequired(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    // Check regular User collection first
    const user = await User.findById(req.userId).select("role");
    if (user && user.role === "admin") {
      return next();
    }

    // Check AdminUser collection
    const adminUser = await AdminUser.findById(req.userId).select("role");
    if (adminUser && adminUser.role === "admin") {
      return next();
    }

    return res.status(403).json({ message: "Admin access required" });
  } catch (err) {
    console.error("Admin auth check failed:", err);
    return res.status(500).json({ message: "Authorization check failed" });
  }
}

export async function moderatorOrAdminRequired(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const user = await User.findById(req.userId).select("role");
    if (user && (user.role === "admin" || user.role === "moderator")) {
      return next();
    }

    const adminUser = await AdminUser.findById(req.userId).select("role");
    if (adminUser && (adminUser.role === "admin" || adminUser.role === "moderator")) {
      return next();
    }

    return res.status(403).json({ message: "Moderator or admin access required" });
  } catch (err) {
    console.error("Moderator auth check failed:", err);
    return res.status(500).json({ message: "Authorization check failed" });
  }
}
