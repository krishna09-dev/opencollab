// apps/api/src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import issuesRouter from "./routes/issues.routes";
import notificationsRouter from "./routes/notifications.routes";
import resourcesRoutes from "./routes/resources.routes";
import prTrackingRoutes from "./routes/prTracking.routes";

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
app.use("/api", userRoutes);
app.use("/api/issues", issuesRouter);
app.use("/api", notificationsRouter);
app.use("/api/resources", resourcesRoutes);
app.use("/api/pr-tracking", prTrackingRoutes);

// Health Check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 API running at http://localhost:${PORT}`);
  });
});