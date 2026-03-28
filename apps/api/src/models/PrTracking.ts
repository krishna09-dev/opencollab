import mongoose, { Schema, Document, Types } from "mongoose";

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
  prAuthor?: string;
  prParticipants?: string[];

  // Linked issue (MongoDB ObjectId)
  issueId?: Types.ObjectId | null;

  status: PrStatus;

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

    prUrlInput: { type: String, default: null },

    repoFullName: { type: String, required: true, trim: true, index: true },
    issueNumber: { type: Number, default: null, index: true },
    issueTitle: { type: String, default: "" },

    prNumber: { type: Number, default: null, index: true },
    prTitle: { type: String, default: null },
    prUrl: { type: String, default: null },

    prState: { type: String, enum: ["open", "closed", null], default: null },
    mergedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    prUpdatedAt: { type: Date, default: null },

    prBody: { type: String, default: null },
    primaryLanguage: { type: String, default: null },
    requestedReviewersCount: { type: Number, default: 0 },
    reviewState: {
      type: String,
      enum: ["APPROVED", "CHANGES_REQUESTED", "COMMENTED", null],
      default: null
    },
    commentsCount: { type: Number, default: 0 },
    reviewCommentsCount: { type: Number, default: 0 },

    additions: { type: Number, default: 0 },
    deletions: { type: Number, default: 0 },
    changedFiles: { type: Number, default: 0 },

    createdAtGithub: { type: Date, default: null },
    updatedAtGithub: { type: Date, default: null },
    mergedAtGithub: { type: Date, default: null },

    prAuthor: { type: String, default: null },
    prParticipants: [{ type: String }],

    issueId: { type: Schema.Types.ObjectId, ref: "Issue", default: null, index: true },

    status: { type: String, enum: ["ACCEPTED", "PR_OPEN", "MERGED", "CLOSED"], default: "ACCEPTED", index: true },

    lastSyncAt: { type: Date, default: null },
    lastSystemSyncAt: { type: Date, default: null },
    syncSource: { type: String, enum: ["manual", "worker"], default: "manual" }
  },
  { timestamps: true }
);

// Unique constraint: one tracking record per user per repo+PR (either by issue or by PR number)
PrTrackingSchema.index({ userId: 1, repoFullName: 1, prNumber: 1 }, { unique: true, sparse: true });
PrTrackingSchema.index({ userId: 1, repoFullName: 1, issueNumber: 1 }, { unique: true, sparse: true });
// Index for system sync queries
PrTrackingSchema.index({ lastSystemSyncAt: 1, status: 1 });

export const PrTracking = mongoose.model<IPrTracking>("PrTracking", PrTrackingSchema);