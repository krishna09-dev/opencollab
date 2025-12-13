// apps/api/src/routes/notifications.routes.ts
import { Router, Response } from "express";
import { AuthRequest, authRequired } from "../middleware/auth";

export type NotificationType = "ISSUE_AVAILABLE";

export interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationType;
  issueId: string;
  issueTitle: string;
  createdAt: string;
  read: boolean;
}

export const notifications: NotificationDto[] = [];

const router = Router();

/**
 * GET /api/notifications
 * Get all notifications for the logged-in user
 */
router.get(
  "/notifications",
  authRequired,
  (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const userNotifications = notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return res.json(userNotifications);
  }
);

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for current user
 */
router.post(
  "/notifications/read-all",
  authRequired,
  (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    notifications.forEach((n) => {
      if (n.userId === userId) {
        n.read = true;
      }
    });

    const userNotifications = notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return res.json({
      message: "All notifications marked as read.",
      notifications: userNotifications
    });
  }
);

export default router;