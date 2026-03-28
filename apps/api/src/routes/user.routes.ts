// apps/api/src/routes/user.routes.ts
import { Router, Response } from "express";
import { AuthRequest, authRequired } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { updatePreferencesSchema } from "../validators/user.validator";
import { User } from "../models/User";

const router = Router();

// GET /api/me
router.get("/me", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select("-__v");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: user._id,
      login: user.login,
      email: user.email,
      avatarUrl: user.avatarUrl,
      preferredLanguages: user.preferredLanguages,
      experienceLevel: user.experienceLevel,
      areasOfInterest: user.areasOfInterest
    });
  } catch (err) {
    console.error("GET /me error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/me/preferences (onboarding)
router.put(
  "/me/preferences",
  authRequired,
  validate(updatePreferencesSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { preferredLanguages, experienceLevel, areasOfInterest } = req.validated!.body;

      const user = await User.findByIdAndUpdate(
        req.userId,
        {
          preferredLanguages,
          experienceLevel,
          areasOfInterest
        },
        { new: true }
      ).select("-__v");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json({
        message: "Preferences updated",
        user
      });
    } catch (err) {
      console.error("PUT /me/preferences error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
