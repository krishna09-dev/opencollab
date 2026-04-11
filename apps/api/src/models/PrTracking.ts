import mongoose, { Schema, Document, Types } from "mongoose";
import { cleanupOptionalFieldsPlugin } from "./plugins/cleanupOptionalFields";

export type PrStatus = "ACCEPTED" | "PR_OPEN" | "MERGED" | "CLOSED";
export type SyncSource = "manual" | "worker";

export interface IPrTracking extends Document {
  userId: Types.ObjectId;
  allowedUserIds: Types.ObjectId[]; // Users who can see this PR

  // Original input URL for direct PR tracking
  prUrlInput?: string;

  repoFullName: string; // "owner/repo"
  issueNumber?: number; // Optional - not required for direct PR tracking
  issueTitle?: string;

  // PR info
  prNumber?: number | null;
  prTitle?: string | null;
  prUrl?: string | null;

  // raw PR state
  prState?: "open" | "closed" | null;
  mergedAt?: Date | null;
  closedAt?: Date | null;
  prUpdatedAt?: Date | null;

  // PR metadata used by UI cards/status grouping
  prBody?: string | null;
  primaryLanguage?: string | null;
  requestedReviewersCount?: number;
  reviewState?: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | null;
  commentsCount?: number;
  reviewCommentsCount?: number;

  // PR diff stats
  additions?: number;
  deletions?: number;
  changedFiles?: number;

  // GitHub timestamps
  createdAtGithub?: Date | null;
  updatedAtGithub?: Date | null;
  mergedAtGithub?: Date | null;

  // PR participants (author + reviewers + commenters)
  prAuthor?: string | null;
  prParticipants?: string[];

  // Linked issue (MongoDB ObjectId)
  issueId?: Types.ObjectId | null;

  status: PrStatus;

  // Verification fields
  isVerified: boolean;
  verifiedBy?: Types.ObjectId | null;
  verifiedAt?: Date | null;
  isValid?: boolean | null;
  verificationNote?: string | null;

  lastSyncAt?: Date | null;
  lastSystemSyncAt?: Date | null; // For scheduled worker syncs
  syncSource?: SyncSource;

  createdAt: Date;
  updatedAt: Date;
}

const PrTrackingSchema = new Schema<IPrTracking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    allowedUserIds: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],

    prUrlInput: { type: String, default: undefined },

    repoFullName: { type: String, required: true, trim: true, index: true },
    issueNumber: { type: Number, default: undefined, index: true },
    issueTitle: { type: String, default: "" },

    prNumber: { type: Number, default: undefined, index: true },
    prTitle: { type: String, default: undefined },
    prUrl: { type: String, default: undefined },

    prState: { type: String, enum: ["open", "closed", null], default: undefined },
    mergedAt: { type: Date, default: undefined },
    closedAt: { type: Date, default: undefined },
    prUpdatedAt: { type: Date, default: undefined },

    prBody: { type: String, default: undefined },
    primaryLanguage: { type: String, default: undefined },
    requestedReviewersCount: { type: Number, default: 0 },
    reviewState: {
      type: String,
      enum: ["APPROVED", "CHANGES_REQUESTED", "COMMENTED", null],
      default: undefined
    },
    commentsCount: { type: Number, default: 0 },
    reviewCommentsCount: { type: Number, default: 0 },

    additions: { type: Number, default: 0 },
    deletions: { type: Number, default: 0 },
    changedFiles: { type: Number, default: 0 },

    createdAtGithub: { type: Date, default: undefined },
    updatedAtGithub: { type: Date, default: undefined },
    mergedAtGithub: { type: Date, default: undefined },

    prAuthor: { type: String, default: undefined },
    prParticipants: [{ type: String }],

    issueId: { type: Schema.Types.ObjectId, ref: "Issue", default: undefined, index: true },

    status: { type: String, enum: ["ACCEPTED", "PR_OPEN", "MERGED", "CLOSED"], default: "ACCEPTED", index: true },

    // Verification fields
    isVerified: { type: Boolean, default: false, index: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: undefined },
    verifiedAt: { type: Date, default: undefined },
    isValid: { type: Boolean, default: undefined },
    verificationNote: { type: String, default: undefined },

    lastSyncAt: { type: Date, default: undefined },
    lastSystemSyncAt: { type: Date, default: undefined },
    syncSource: { type: String, enum: ["manual", "worker"], default: "manual" }
  },
  { timestamps: true }
);

PrTrackingSchema.plugin(cleanupOptionalFieldsPlugin);

// Unique constraint: one tracking record per user per repo+PR (either by issue or by PR number)
PrTrackingSchema.index({ userId: 1, repoFullName: 1, prNumber: 1 }, { unique: true, sparse: true });
PrTrackingSchema.index({ userId: 1, repoFullName: 1, issueNumber: 1 }, { unique: true, sparse: true });
// Index for system sync queries
PrTrackingSchema.index({ lastSystemSyncAt: 1, status: 1 });

export const PrTracking = mongoose.model<IPrTracking>("PrTracking", PrTrackingSchema);