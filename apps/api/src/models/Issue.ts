import mongoose, { Schema, Document } from "mongoose";
import { cleanupOptionalFieldsPlugin } from "./plugins/cleanupOptionalFields";

export type IssueStatus = "open" | "claimed" | "closed";
export type PrStatus = "NONE" | "PR_OPEN" | "MERGED" | "CLOSED";
export type IssueDifficulty = "beginner" | "intermediate" | "advanced";

// ML Scoring types
export interface MlFeatures {
  labelScore: number;           // Score from beginner-friendly labels
  descriptionLength: number;    // Normalized description length
  keywordScore: number;         // Score from beginner keywords
  complexityScore: number;      // Code complexity indicators
  clarityScore: number;         // How clear/well-structured the issue is
}

export interface MlScoring {
  beginnerScore: number;        // 0-1, overall beginner-friendliness
  confidence: number;           // 0-1, model confidence
  features: MlFeatures;         // Feature breakdown for explainability
  explanation: string;          // Human-readable explanation
  scoredAt: Date;               // When the score was computed
  modelVersion: string;         // Which model version computed this
}

export interface MlOverride {
  overriddenBy: string;         // User ID who overrode
  overriddenAt: Date;
  originalScore: number;
  newScore: number;
  reason: string;
}

export interface RepoHealth {
  healthScore: number;
  activityScore: number;
  openIssues: number;
  recentCommits: number;
}

export interface SetupInstruction {
  label: string;
  command: string;
}

export interface SuggestedResource {
  title: string;
  url: string;
  type?: string;
}

/**
 * This is what the frontend reads for the "UPDATES" accordion.
 * It includes GitHub comments + OpenCollab events (claim/abort/etc).
 */
export interface IssueUpdateItem {
  id: string; // unique id (we prefix github with gh_)
  actorLogin: string;
  actorRole?: string | null; // OWNER/MEMBER/CONTRIBUTOR/NONE/OPENCOLLAB/etc
  body: string; // markdown supported on frontend
  createdAt: Date;
}

export interface TimelineItem {
  id: string;
  title: string;
  status: string;
  at: Date;
  meta?: string | null;
}

export interface IssueDocument extends Document {
  githubNumber: number;
  repoOwner: string;
  repoName: string;
  repoLanguage: string | null;

  title: string;
  body: string;
  summary: string;
  labels: string[];

  status: IssueStatus;

  claimedByUserId?: string | null;
  claimedByLogin?: string | null;

  githubUrl: string;
  githubCreatedAt: Date;
  githubUpdatedAt: Date;

  openedAt: Date;
  claimedAt?: Date | null;

  requiredSkills: string[];
  expectedOutcome: string[];
  suggestedResources: SuggestedResource[];

  repoHealth: RepoHealth;
  beginnerFriendly: boolean;
  difficultyOverride?: IssueDifficulty | null;
  activeMaintainer: boolean;
  recentlyUpdated: boolean;

  autoSetupCommands: SetupInstruction[];
  projectSetupCommands: SetupInstruction[];
  maintainerSetupNotes?: string | null;
  repositoryReadme?: string | null;
  repositoryReadmeUrl?: string | null;

  prStatus: PrStatus;
  lastPrMessage?: string | null;

  updates: IssueUpdateItem[];
  contributionTimeline: TimelineItem[];
  lastSyncedAt?: Date | null;

  notifyWatchers: string[];

  isApproved: boolean;
  isVisible: boolean;

  // ML Scoring
  mlScoring?: MlScoring | null;
  mlOverride?: MlOverride | null;

  // Recommendation tracking
  recommendationClicks: number;
  recommendationClaims: number;
  recommendationCompletions: number;
}

const SetupInstructionSchema = new Schema<SetupInstruction>(
  {
    label: { type: String, required: true },
    command: { type: String, required: true }
  },
  { _id: false }
);

const RepoHealthSchema = new Schema<RepoHealth>(
  {
    healthScore: { type: Number, default: 80 },
    activityScore: { type: Number, default: 80 },
    openIssues: { type: Number, default: 0 },
    recentCommits: { type: Number, default: 0 }
  },
  { _id: false }
);

const SuggestedResourceSchema = new Schema<SuggestedResource>(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, default: undefined }
  },
  { _id: false }
);

const IssueUpdateSchema = new Schema<IssueUpdateItem>(
  {
    id: { type: String, required: true },
    actorLogin: { type: String, required: true },
    actorRole: { type: String, default: undefined },
    body: { type: String, default: "" },
    createdAt: { type: Date, required: true }
  },
  { _id: false }
);

const TimelineItemSchema = new Schema<TimelineItem>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    status: { type: String, required: true },
    at: { type: Date, required: true },
    meta: { type: String, default: undefined }
  },
  { _id: false }
);

const MlFeaturesSchema = new Schema<MlFeatures>(
  {
    labelScore: { type: Number, default: 0 },
    descriptionLength: { type: Number, default: 0 },
    keywordScore: { type: Number, default: 0 },
    complexityScore: { type: Number, default: 0 },
    clarityScore: { type: Number, default: 0 }
  },
  { _id: false }
);

const MlScoringSchema = new Schema<MlScoring>(
  {
    beginnerScore: { type: Number, required: true },
    confidence: { type: Number, required: true },
    features: { type: MlFeaturesSchema, required: true },
    explanation: { type: String, required: true },
    scoredAt: { type: Date, required: true },
    modelVersion: { type: String, required: true }
  },
  { _id: false }
);

const MlOverrideSchema = new Schema<MlOverride>(
  {
    overriddenBy: { type: String, required: true },
    overriddenAt: { type: Date, required: true },
    originalScore: { type: Number, required: true },
    newScore: { type: Number, required: true },
    reason: { type: String, required: true }
  },
  { _id: false }
);

const IssueSchema = new Schema<IssueDocument>(
  {
    githubNumber: { type: Number, required: true },
    repoOwner: { type: String, required: true },
    repoName: { type: String, required: true },
    repoLanguage: { type: String, default: undefined },
    lastSyncedAt: { type: Date },

    title: { type: String, required: true },
    body: { type: String, default: "" },
    summary: { type: String, default: "" },
    labels: [{ type: String }],

    status: { type: String, enum: ["open", "claimed", "closed"], default: "open" },

    claimedByUserId: { type: String, default: undefined },
    claimedByLogin: { type: String, default: undefined },

    githubUrl: { type: String, required: true },
    githubCreatedAt: { type: Date, required: true },
    githubUpdatedAt: { type: Date, required: true },

    openedAt: { type: Date, required: true },
    claimedAt: { type: Date, default: undefined },

    requiredSkills: { type: [String], default: [] },
    expectedOutcome: { type: [String], default: [] },
    suggestedResources: { type: [SuggestedResourceSchema], default: [] },

    repoHealth: { type: RepoHealthSchema, default: () => ({}) },
    beginnerFriendly: { type: Boolean, default: false },
    difficultyOverride: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: undefined
    },
    activeMaintainer: { type: Boolean, default: false },
    recentlyUpdated: { type: Boolean, default: false },

    autoSetupCommands: { type: [SetupInstructionSchema], default: [] },
    projectSetupCommands: { type: [SetupInstructionSchema], default: [] },
    maintainerSetupNotes: { type: String, default: undefined },
    repositoryReadme: { type: String, default: undefined },
    repositoryReadmeUrl: { type: String, default: undefined },

    prStatus: { type: String, enum: ["NONE", "PR_OPEN", "MERGED", "CLOSED"], default: "NONE" },
    lastPrMessage: { type: String, default: undefined },

    updates: { type: [IssueUpdateSchema], default: [] },
    contributionTimeline: { type: [TimelineItemSchema], default: [] },

    notifyWatchers: { type: [String], default: [] },

    isApproved: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: false },

    // ML Scoring
    mlScoring: { type: MlScoringSchema, default: undefined },
    mlOverride: { type: MlOverrideSchema, default: undefined },

    // Recommendation tracking
    recommendationClicks: { type: Number, default: 0 },
    recommendationClaims: { type: Number, default: 0 },
    recommendationCompletions: { type: Number, default: 0 }
  },
  { timestamps: true }
);

IssueSchema.plugin(cleanupOptionalFieldsPlugin);

// Unique key for upsert / dedupe
IssueSchema.index({ repoOwner: 1, repoName: 1, githubNumber: 1 }, { unique: true });
IssueSchema.index({ status: 1 });
IssueSchema.index({ beginnerFriendly: 1 });
IssueSchema.index({ githubUpdatedAt: -1 });
IssueSchema.index({ repoOwner: 1, repoName: 1 });

// list screens (fast sorting/filtering)
IssueSchema.index({ beginnerFriendly: 1, status: 1, githubUpdatedAt: -1 });
IssueSchema.index({ difficultyOverride: 1, status: 1, githubUpdatedAt: -1 });

// ML scoring queries
IssueSchema.index({ "mlScoring.beginnerScore": -1, status: 1 });
IssueSchema.index({ "mlScoring.scoredAt": 1 });

export const Issue = mongoose.model<IssueDocument>("Issue", IssueSchema);
