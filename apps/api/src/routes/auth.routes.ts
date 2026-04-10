// apps/api/src/routes/auth.routes.ts
import { Router, Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import { User } from "../models/User";
import { signUserJwt } from "../utils/jwt";

dotenv.config(); // make sure .env is loaded in this module too

const router = Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function moderationErrorRedirect(code: string) {
  return `${FRONTEND_URL}/moderation?error=${encodeURIComponent(code)}`;
}

// Optional: log once if something critical is missing
if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_CALLBACK_URL) {
  console.error("⚠️ Missing GitHub OAuth env vars", {
    GITHUB_CLIENT_ID,
    GITHUB_CALLBACK_URL
  });
}

// 1) Start GitHub OAuth flow
router.get("/github", (_req: Request, res: Response) => {
  if (!GITHUB_CLIENT_ID || !GITHUB_CALLBACK_URL) {
    return res.status(500).json({
      message: "GitHub OAuth is not configured correctly on the server."
    });
  }

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK_URL,
    scope: "read:user user:email public_repo"
  });

  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  return res.redirect(githubAuthUrl);
});

// 2) GitHub callback
router.get("/github/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  const loginState = typeof req.query.state === "string" ? req.query.state : "";

  if (!code) {
    return res.status(400).json({ message: "Missing `code` from GitHub" });
  }

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_CALLBACK_URL) {
    return res.status(500).json({
      message: "GitHub OAuth is not configured correctly on the server."
    });
  }

  try {
    // 2.1 Exchange code → access token
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_CALLBACK_URL
      },
      {
        headers: { Accept: "application/json" }
      }
    );

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) {
      return res.status(400).json({ message: "No access token from GitHub" });
    }

    // 2.2 Get GitHub user profile
    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const ghUser = userRes.data;

    // 2.3 Try to get primary email
    let primaryEmail: string | undefined;
    try {
      const emailRes = await axios.get("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const emails: any[] = emailRes.data;
      const primary = emails.find((e) => e.primary) || emails[0];
      primaryEmail = primary?.email;
    } catch {
      primaryEmail = undefined;
    }

    if (loginState === "moderation") {
      const githubId = String(ghUser.id || "");
      const githubLogin = String(ghUser.login || "").trim();

      if (!githubId || !githubLogin) {
        return res.redirect(moderationErrorRedirect("github_profile_invalid"));
      }

      let moderatorUser = await User.findOne({ githubId });

      if (!moderatorUser) {
        moderatorUser = await User.create({
          githubId,
          login: githubLogin,
          email: primaryEmail,
          avatarUrl: ghUser.avatar_url,
          githubAccessToken: accessToken,
          role: "moderator"
        });
      } else {
        moderatorUser.login = githubLogin;
        moderatorUser.email = primaryEmail;
        moderatorUser.avatarUrl = ghUser.avatar_url;
        moderatorUser.githubAccessToken = accessToken;

        // Keep existing admins as admin, otherwise grant moderator access for moderation login.
        if (moderatorUser.role !== "admin") {
          moderatorUser.role = "moderator";
        }

        await moderatorUser.save();
      }

      const token = signUserJwt({ userId: moderatorUser._id.toString() });
      const redirectUrl = `${FRONTEND_URL}/moderation/callback?token=${token}`;
      return res.redirect(redirectUrl);
    }

    // 2.4 Upsert user in MongoDB
    let user = await User.findOne({ githubId: ghUser.id.toString() });

    if (!user) {
      user = await User.create({
        githubId: ghUser.id.toString(),
        login: ghUser.login,
        email: primaryEmail,
        avatarUrl: ghUser.avatar_url,
        githubAccessToken: accessToken,
      });
    } else {
      //  update token in case user re-logs in
      user.githubAccessToken = accessToken;
      await user.save();
    }

    // 2.5 Sign JWT
    const token = signUserJwt({ userId: user._id.toString() });

    const redirectUrl = `${FRONTEND_URL}/auth/callback?token=${token}`;
    return res.redirect(redirectUrl);
     // 🔧 TEMP: for backend testing (Postman / browser JSON)
    // return res.json({ token, user });
  } catch (err) {
    console.error("GitHub OAuth error:", err);
    if (loginState === "moderation") {
      return res.redirect(moderationErrorRedirect("oauth_failed"));
    }
    return res.status(500).json({ message: "GitHub auth failed" });
  }
});

export default router;