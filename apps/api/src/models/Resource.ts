import mongoose, { Schema, Document, Types } from "mongoose";

export type ResourceType = "docs" | "article" | "video" | "tool" | "repo";
export type ResourceDifficulty = "beginner" | "intermediate" | "advanced";

export type ResourceSource = "official" | "community";
export type ResourceStatus = "approved" | "pending" | "rejected";

export interface IResource extends Document {
  title: string;
  url: string;
  description?: string;

  type: ResourceType;
  difficulty: ResourceDifficulty;

  tags: string[];
  topics: string[];
  language?: string | null;

  isFeatured: boolean;
  qualityScore: number;

  // ✅ NEW
  source: ResourceSource;   // official/community
  status: ResourceStatus;   // approved/pending/rejected
  submittedBy?: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: "" },

    type: {
      type: String,
      enum: ["docs", "article", "video", "tool", "repo"],
      default: "article"
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner"
    },

    tags: { type: [String], default: [] },
    topics: { type: [String], default: [] },

    language: { type: String, default: null },

    isFeatured: { type: Boolean, default: false },
    qualityScore: { type: Number, default: 70 },

    // ✅ NEW
    source: { type: String, enum: ["official", "community"], default: "official", index: true },
    status: { type: String, enum: ["approved", "pending", "rejected"], default: "approved", index: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

// Text search index (keep your Atlas fix)
ResourceSchema.index(
  { title: "text", description: "text", tags: "text", topics: "text" },
  { language_override: "languageOverride" }
);

ResourceSchema.index({ type: 1, difficulty: 1, isFeatured: 1, source: 1, status: 1 });

export const Resource = mongoose.model<IResource>("Resource", ResourceSchema);