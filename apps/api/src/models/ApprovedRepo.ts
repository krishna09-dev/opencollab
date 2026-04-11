import mongoose, { Schema, Document } from "mongoose";
import { cleanupOptionalFieldsPlugin } from "./plugins/cleanupOptionalFields";

export interface ApprovedRepoDocument extends Document {
  fullName: string; // owner/repo
  repoOwner: string;
  repoName: string;
  description?: string | null;
  htmlUrl?: string | null;
  language?: string | null;

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
    description: { type: String, default: undefined },
    htmlUrl: { type: String, default: undefined },
    language: { type: String, default: undefined },

    isActive: { type: Boolean, default: true },

    lastSyncedAt: { type: Date, default: undefined },
    lastRunAt: { type: Date, default: undefined },

    lastError: { type: String, default: undefined },
    lastErrorAt: { type: Date, default: undefined }
  },
  { timestamps: true }
);

ApprovedRepoSchema.plugin(cleanupOptionalFieldsPlugin);

ApprovedRepoSchema.index({ repoOwner: 1, repoName: 1 }, { unique: true });

export const ApprovedRepo = mongoose.model<ApprovedRepoDocument>(
  "ApprovedRepo",
  ApprovedRepoSchema
);