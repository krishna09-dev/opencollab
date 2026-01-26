import mongoose, { Schema, Document } from "mongoose";

export interface ApprovedRepoDocument extends Document {
  fullName: string; // owner/repo
  repoOwner: string;
  repoName: string;

  isActive: boolean;

  lastSyncedAt?: Date | null;
  lastRunAt?: Date | null;

  lastError?: string | null;
  lastErrorAt?: Date | null;
}

const ApprovedRepoSchema = new Schema<ApprovedRepoDocument>(
  {
    fullName: { type: String, required: true, unique: true },
    repoOwner: { type: String, required: true },
    repoName: { type: String, required: true },

    isActive: { type: Boolean, default: true },

    lastSyncedAt: { type: Date, default: null },
    lastRunAt: { type: Date, default: null },

    lastError: { type: String, default: null },
    lastErrorAt: { type: Date, default: null }
  },
  { timestamps: true }
);

ApprovedRepoSchema.index({ repoOwner: 1, repoName: 1 }, { unique: true });

export const ApprovedRepo = mongoose.model<ApprovedRepoDocument>(
  "ApprovedRepo",
  ApprovedRepoSchema
);