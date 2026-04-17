import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes";
import adminAuthRoutes from "./routes/admin.auth.routes";
import userRoutes from "./routes/user.routes";
import issuesRouter from "./routes/issues.routes";
import notificationsRouter from "./routes/notifications.routes";
import resourcesRoutes from "./routes/resources.routes";
import prTrackingRoutes from "./routes/prTracking.routes";
import recommendationsRoutes from "./routes/recommendations.routes";
import ingestionRoutes from "./routes/ingestion.routes";
import adminReposRoutes from "./routes/admin.repos.routes";
import adminIssuesRoutes from "./routes/admin.issues.routes";
import adminClaimsRoutes from "./routes/admin.claims.routes";
import adminPrsRoutes from "./routes/admin.prs.routes";
import adminAnalyticsRoutes from "./routes/admin.analytics.routes";
import adminRequestsRoutes from "./routes/admin.requests.routes";
import mlRoutes from "./routes/ml.routes";
import reportsRoutes from "./routes/reports.routes";
import moderatorRequestsRoutes from "./routes/moderator.requests.routes";

dotenv.config();

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/+$/, "");
}

export function getAllowedOrigins(): string[] {
  return (
    process.env.ALLOWED_ORIGINS ||
    [
      "http://localhost:5173",
      "https://opencollab.tech",
      "https://www.opencollab.tech",
      "https://opencollab.vercel.app"
    ].join(",")
  )
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
}

export function createApp() {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(normalizeOrigin(origin))) {
          return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true
    })
  );

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRoutes);
  app.use("/auth/admin", adminAuthRoutes);
  app.use("/api", userRoutes);
  app.use("/api/issues", issuesRouter);
  app.use("/api", notificationsRouter);
  app.use("/api/resources", resourcesRoutes);
  app.use("/api/pr-tracking", prTrackingRoutes);
  app.use("/api/recommendations", recommendationsRoutes);
  app.use("/api/moderator", moderatorRequestsRoutes);
  app.use("/api/ingestion", ingestionRoutes);
  app.use("/api/admin", adminReposRoutes);
  app.use("/api/admin", adminIssuesRoutes);
  app.use("/api/admin", adminClaimsRoutes);
  app.use("/api/admin", adminPrsRoutes);
  app.use("/api/admin", adminAnalyticsRoutes);
  app.use("/api/admin", adminRequestsRoutes);
  app.use("/api/ml", mlRoutes);
  app.use("/api/reports", reportsRoutes);

  return app;
}