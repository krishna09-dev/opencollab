import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { AdminUser } from "../models/AdminUser";
import { signUserJwt } from "../utils/jwt";

const router = Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL;

// GET /auth/admin/github
// Starts moderator/admin GitHub login and uses state to branch in shared callback.
router.get("/github", (_req: Request, res: Response) => {
  if (!GITHUB_CLIENT_ID || !GITHUB_CALLBACK_URL) {
    return res.status(500).json({
      message: "GitHub OAuth is not configured correctly on the server."
    });
  }

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK_URL,
    scope: "read:user user:email public_repo",
    state: "moderation"
  });

  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  return res.redirect(githubAuthUrl);
});

// POST /auth/admin/register
router.post("/register", async (req: Request, res: Response) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (username.length < 3) {
    return res.status(400).json({ message: "Username must be at least 3 characters" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  let normalizedRole: "admin" | "moderator" = "admin";
  if (role !== undefined) {
    if (role !== "admin" && role !== "moderator") {
      return res.status(400).json({ message: "Role must be admin or moderator" });
    }
    normalizedRole = role;
  }

  try {
    const existing = await AdminUser.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await AdminUser.create({
      username,
      passwordHash,
      role: normalizedRole
    });

    const token = signUserJwt({ userId: admin._id.toString() });

    return res.status(201).json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (err) {
    console.error("Admin register error:", err);
    return res.status(500).json({ message: "Registration failed" });
  }
});

// POST /auth/admin/login
router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const admin = await AdminUser.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = signUserJwt({ userId: admin._id.toString() });

    return res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ message: "Login failed" });
  }
});

// GET /auth/admin/me — validate token and return admin info
router.get("/me", async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const { verifyUserJwt } = await import("../utils/jwt");
  const decoded = verifyUserJwt(header.split(" ")[1]);

  if (!decoded || !decoded.userId) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  try {
    const admin = await AdminUser.findById(decoded.userId).select("-passwordHash");
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    return res.json({
      id: admin._id,
      username: admin.username,
      role: admin.role
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to verify admin" });
  }
});

export default router;
