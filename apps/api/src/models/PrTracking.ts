import mongoose, { Schema, Document, Types } from "mongoose";

export type PrStatus = "ACCEPTED" | "PR_OPEN" | "MERGED" | "CLOSED";
export type SyncSource = "manual" | "worker";

export interface IPrTracking extends Document {
  userId: Types.ObjectId;

  repoFullName: string; // "owner/repo"
  issueNumber: number;
  issueTitle?: string;

  // PR info (optional because ACCEPTED can have no PR)
  prNumber?: number | null;
  prTitle?: string | null;
  prUrl?: string | null;

  // raw PR state
  prState?: "open" | "closed" | null;
  mergedAt?: Date | null;
  closedAt?: Date | null;

  status: PrStatus;

  lastSyncAt?: Date | null;
  syncSource?: SyncSource;

  createdAt: Date;
  updatedAt: Date;
}

const PrTrackingSchema = new Schema<IPrTracking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    repoFullName: { type: String, required: true, trim: true, index: true },
    issueNumber: { type: Number, required: true, index: true },
    issueTitle: { type: String, default: "" },

    prNumber: { type: Number, default: null },
    prTitle: { type: String, default: null },
    prUrl: { type: String, default: null },

    prState: { type: String, enum: ["open", "closed", null], default: null },
    mergedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },

    status: { type: String, enum: ["ACCEPTED", "PR_OPEN", "MERGED", "CLOSED"], default: "ACCEPTED", index: true },

    lastSyncAt: { type: Date, default: null },
    syncSource: { type: String, enum: ["manual", "worker"], default: "manual" }
  },
  { timestamps: true }
);

// ✅ one tracking record per user per repo issue
PrTrackingSchema.index({ userId: 1, repoFullName: 1, issueNumber: 1 }, { unique: true });

export const PrTracking = mongoose.model<IPrTracking>("PrTracking", PrTrackingSchema);