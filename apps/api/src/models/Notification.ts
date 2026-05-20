import mongoose, { Schema, type Document } from "mongoose";

export type NotificationType = "ISSUE_AVAILABLE" | "PR_UPDATED" | "SYSTEM";

export interface NotificationDocument extends Document {
  userId: string;
  type: NotificationType;
  issueId?: string | null;
  issueTitle?: string | null;
  message?: string | null;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["ISSUE_AVAILABLE", "PR_UPDATED", "SYSTEM"],
      required: true
    },
    issueId: { type: String, default: null },
    issueTitle: { type: String, default: null },
    message: { type: String, default: null },
    read: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

export const Notification = mongoose.model<NotificationDocument>(
  "Notification",
  NotificationSchema
);
