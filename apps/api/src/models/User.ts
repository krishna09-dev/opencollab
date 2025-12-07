import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  githubId: string;
  login: string;
  email?: string;
  avatarUrl?: string;
  preferredLanguages: string[];
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  areasOfInterest: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    githubId: { type: String, required: true, unique: true },
    login: { type: String, required: true },
    email: { type: String },
    avatarUrl: { type: String },
    preferredLanguages: { type: [String], default: [] },
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner"
    },
    areasOfInterest: { type: [String], default: [] }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model<IUser>("User", UserSchema);