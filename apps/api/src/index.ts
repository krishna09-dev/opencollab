// apps/api/src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";

import authRoutes from "./routes/auth.routes";
import adminAuthRoutes from "./routes/admin.auth.routes";
import userRoutes from "./routes/user.routes";
import issuesRouter from "./routes/issues.routes";
import notificationsRouter from "./routes/notifications.routes";
import resourcesRoutes from "./routes/resources.routes";
import prTrackingRoutes from "./routes/prTracking.routes";
import recommendationsRoutes from "./routes/recommendations.routes";

// Sprint 5
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
import { startIssueIngestionWorker } from "./workers/issueIngestion.worker";
import { startPrSyncWorker } from "./workers/prSync.worker";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Middleware
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true
  })
);
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/auth/admin", adminAuthRoutes);
app.use("/api", userRoutes);
app.use("/api/issues", issuesRouter);
app.use("/api", notificationsRouter);
app.use("/api/resources", resourcesRoutes);
app.use("/api/pr-tracking", prTrackingRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/moderator", moderatorRequestsRoutes);


// Internal/dev trigger endpoint: POST /api/ingestion/run
app.use("/api/ingestion", ingestionRoutes);

// Admin routes
app.use("/api/admin", adminReposRoutes);
app.use("/api/admin", adminIssuesRoutes);
app.use("/api/admin", adminClaimsRoutes);
app.use("/api/admin", adminPrsRoutes);
app.use("/api/admin", adminAnalyticsRoutes);
app.use("/api/admin", adminRequestsRoutes);

// ML routes
app.use("/api/ml", mlRoutes);

// Reports routes
app.use("/api/reports", reportsRoutes);

// Health Check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Start server
connectDB().then(() => {
  // Start workers after DB is ready
  startIssueIngestionWorker();
  startPrSyncWorker();

  app.listen(PORT, () => {
    console.log(`🚀 API running at http://localhost:${PORT}`);
  });
});