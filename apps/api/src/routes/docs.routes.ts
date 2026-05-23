import { Router } from "express";

const router = Router();

router.get("/docs-info", (_req, res) => {
  return res.json({
    service: "OpenCollab API",
    version: "1.0.0",
    modules: [
      {
        name: "Authentication",
        basePath: "/auth",
        description: "GitHub OAuth and user authentication"
      },
      {
        name: "Issues",
        basePath: "/api/issues",
        description: "Issue discovery, detail view, claim, abort, and refresh"
      },
      {
        name: "Resources",
        basePath: "/api/resources",
        description: "Curated learning resources for contributors"
      },
      {
        name: "PR Tracking",
        basePath: "/api/pr-tracking",
        description: "Pull request submission and tracking"
      },
      {
        name: "Notifications",
        basePath: "/api/notifications",
        description: "Persistent user notifications"
      }
    ]
  });
});

export default router;
