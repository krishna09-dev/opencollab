import mongoose, { Document, Schema } from "mongoose";

export interface IAdminUser extends Document {
  username: string;
  passwordHash: string;
  role: "admin" | "moderator";
  githubId?: string;
  githubLogin?: string;
  githubEmail?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "moderator"], default: "admin" },
    githubId: { type: String, unique: true, sparse: true },
    githubLogin: { type: String },
    githubEmail: { type: String },
    avatarUrl: { type: String }
  },
  { timestamps: true }
);

export const AdminUser = mongoose.model<IAdminUser>("AdminUser", AdminUserSchema);
