// apps/api/src/routes/notifications.routes.ts
import { Router, Response } from "express";
import { AuthRequest, authRequired } from "../middleware/auth";
import { Notification, type NotificationDocument, type NotificationType } from "../models/Notification";

export interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationType;
  issueId?: string | null;
  issueTitle?: string | null;
  message?: string | null;
  createdAt: string;
  read: boolean;
}

function toNotificationDto(n: NotificationDocument): NotificationDto {
  return {
    id: String(n._id),
    userId: n.userId,
    type: n.type,
    issueId: n.issueId ?? null,
    issueTitle: n.issueTitle ?? null,
    message: n.message ?? null,
    createdAt: n.createdAt.toISOString(),
    read: n.read
  };
}

const router = Router();

/**
 * GET /api/notifications
 * Get all notifications for the logged-in user
 */
router.get(
  "/notifications",
  authRequired,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const userNotifications = await Notification.find({ userId })
        .sort({ createdAt: -1 });

      return res.json(userNotifications.map(toNotificationDto));
    } catch (err) {
      console.error("GET /api/notifications error:", err);
      return res.status(500).json({ message: "Failed to load notifications." });
    }
  }
);

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for current user
 */
router.post(
  "/notifications/read-all",
  authRequired,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      await Notification.updateMany(
        { userId, read: false },
        { $set: { read: true } }
      );

      const userNotifications = await Notification.find({ userId })
        .sort({ createdAt: -1 });

      return res.json({
        message: "All notifications marked as read.",
        notifications: userNotifications.map(toNotificationDto)
      });
    } catch (err) {
      console.error("POST /api/notifications/read-all error:", err);
      return res.status(500).json({ message: "Failed to update notifications." });
    }
  }
);

export default router;
