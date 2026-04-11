import mongoose, { Document, Schema, Types } from "mongoose";
import { cleanupOptionalFieldsPlugin } from "./plugins/cleanupOptionalFields";

export type RepoRequestStatus = "pending" | "approved" | "rejected";
export type IdentityModel = "User" | "AdminUser";
export type ModeratorRole = "moderator" | "admin";

export interface RepoRequestDocument extends Document {
  fullName: string;
  fullNameNormalized: string;
  repoOwner: string;
  repoName: string;
  description?: string | null;
  htmlUrl?: string | null;
  language?: string | null;
  requestNotes?: string | null;

  requestedById: Types.ObjectId;
  requestedByModel: IdentityModel;
  requestedByLogin: string;
  requestedByRole: ModeratorRole;

  status: RepoRequestStatus;

  approvedRepoId?: Types.ObjectId | null;

  reviewedById?: Types.ObjectId | null;
  reviewedByModel?: IdentityModel | null;
  reviewedByLogin?: string | null;
  reviewedAt?: Date | null;
  reviewNotes?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

const RepoRequestSchema = new Schema<RepoRequestDocument>(
  {
    fullName: { type: String, required: true },
    fullNameNormalized: { type: String, required: true, index: true },
    repoOwner: { type: String, required: true },
    repoName: { type: String, required: true },
    description: { type: String, default: undefined },
    htmlUrl: { type: String, default: undefined },
    language: { type: String, default: undefined },
    requestNotes: { type: String, default: undefined },

    requestedById: { type: Schema.Types.ObjectId, required: true, index: true },
    requestedByModel: { type: String, enum: ["User", "AdminUser"], required: true },
    requestedByLogin: { type: String, required: true },
    requestedByRole: { type: String, enum: ["moderator", "admin"], required: true },

    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },

    approvedRepoId: { type: Schema.Types.ObjectId, ref: "ApprovedRepo", default: undefined },

    reviewedById: { type: Schema.Types.ObjectId, default: undefined },
    reviewedByModel: { type: String, enum: ["User", "AdminUser"], default: undefined },
    reviewedByLogin: { type: String, default: undefined },
    reviewedAt: { type: Date, default: undefined },
    reviewNotes: { type: String, default: undefined }
  },
  { timestamps: true }
);

RepoRequestSchema.plugin(cleanupOptionalFieldsPlugin);

RepoRequestSchema.index(
  { fullNameNormalized: 1, requestedById: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" }
  }
);

export const RepoRequest = mongoose.model<RepoRequestDocument>("RepoRequest", RepoRequestSchema);
