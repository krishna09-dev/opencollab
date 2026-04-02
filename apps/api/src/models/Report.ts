import mongoose, { Schema, Document, Types } from "mongoose";

export type ReportTargetType = "issue" | "pr" | "user";
export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";
export type ReportReason =
  | "spam"
  | "inappropriate"
  | "misleading"
  | "duplicate"
  | "outdated"
  | "harassment"
  | "other";

export interface IReport extends Document {
  // Who reported
  reporterId: Types.ObjectId;
  reporterLogin: string;

  // What was reported
  targetType: ReportTargetType;
  targetId: Types.ObjectId;
  targetRef?: string; // e.g., "owner/repo#123" for issues

  // Report details
  reason: ReportReason;
  description: string;
  evidence?: string; // Optional link or additional context

  // Status
  status: ReportStatus;
  priority: "low" | "medium" | "high";

  // Resolution
  reviewedBy?: Types.ObjectId | null;
  reviewedByLogin?: string | null;
  reviewedAt?: Date | null;
  resolution?: string | null;
  actionTaken?: string | null; // e.g., "issue hidden", "user warned", "no action"

  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    reporterLogin: { type: String, required: true },

    targetType: {
      type: String,
      enum: ["issue", "pr", "user"],
      required: true,
      index: true
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },
    targetRef: { type: String, default: null },

    reason: {
      type: String,
      enum: ["spam", "inappropriate", "misleading", "duplicate", "outdated", "harassment", "other"],
      required: true
    },
    description: { type: String, required: true, maxlength: 2000 },
    evidence: { type: String, default: null, maxlength: 1000 },

    status: {
      type: String,
      enum: ["pending", "reviewing", "resolved", "dismissed"],
      default: "pending",
      index: true
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },

    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedByLogin: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
    resolution: { type: String, default: null, maxlength: 1000 },
    actionTaken: { type: String, default: null }
  },
  { timestamps: true }
);

// Indexes for common queries
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ targetType: 1, targetId: 1 });
ReportSchema.index({ reporterId: 1, createdAt: -1 });

// Prevent duplicate reports from same user on same target
ReportSchema.index(
  { reporterId: 1, targetType: 1, targetId: 1 },
  { unique: true }
);

export const Report = mongoose.model<IReport>("Report", ReportSchema);
