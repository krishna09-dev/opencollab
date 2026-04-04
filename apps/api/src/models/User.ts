import mongoose, { Document, Schema } from "mongoose";

export interface SavedIssueEntry {
  issueId: string;
  title: string;
  repoOwner: string;
  repoName: string;
  repoLanguage?: string | null;
  labels?: string[];
  beginnerFriendly?: boolean;
  savedAt: Date;
}

export type UserRole = "user" | "moderator" | "admin";

export interface IUser extends Document {
  githubId: string;
  login: string;
  email?: string;
  avatarUrl?: string;
  role: UserRole;
  preferredLanguages: string[];
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  areasOfInterest: string[];
  savedIssues: SavedIssueEntry[];
  recentSearches: string[];
  createdAt: Date;
  githubAccessToken?: string;
  updatedAt: Date;
}

const SavedIssueSchema = new Schema({
  issueId: { type: String, required: true },
  title: { type: String, required: true },
  repoOwner: { type: String, required: true },
  repoName: { type: String, required: true },
  repoLanguage: { type: String, default: null },
  labels: { type: [String], default: [] },
  beginnerFriendly: { type: Boolean, default: false },
  savedAt: { type: Date, default: Date.now }
}, { _id: false });

const UserSchema = new Schema<IUser>(
  {
    githubId: { type: String, required: true, unique: true },
    login: { type: String, required: true },
    email: { type: String },
    avatarUrl: { type: String },
    role: { type: String, enum: ["user", "moderator", "admin"], default: "user" },
    githubAccessToken: { type: String },
    preferredLanguages: { type: [String], default: [] },
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner"
    },
    areasOfInterest: { type: [String], default: [] },
    savedIssues: { type: [SavedIssueSchema], default: [] },
    recentSearches: { type: [String], default: [] }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model<IUser>("User", UserSchema);