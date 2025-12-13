import mongoose, { Schema, Document } from "mongoose";

export type IssueStatus = "open" | "claimed" | "closed";
export type PrStatus = "NONE" | "PR_OPEN" | "MERGED" | "CLOSED";

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
  activeMaintainer: boolean;
  recentlyUpdated: boolean;

  autoSetupCommands: SetupInstruction[];
  projectSetupCommands: SetupInstruction[];
  maintainerSetupNotes?: string | null;

  prStatus: PrStatus;
  lastPrMessage?: string | null;

  updates: IssueUpdateItem[];
  contributionTimeline: TimelineItem[];
  lastSyncedAt?: Date | null;

  notifyWatchers: string[];
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
    type: { type: String, default: null }
  },
  { _id: false }
);

const IssueUpdateSchema = new Schema<IssueUpdateItem>(
  {
    id: { type: String, required: true },
    actorLogin: { type: String, required: true },
    actorRole: { type: String, default: null },
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
    meta: { type: String, default: null }
  },
  { _id: false }
);

const IssueSchema = new Schema<IssueDocument>(
  {
    githubNumber: { type: Number, required: true },
    repoOwner: { type: String, required: true },
    repoName: { type: String, required: true },
    lastSyncedAt: { type: Date },
    

    title: { type: String, required: true },
    body: { type: String, default: "" },
    summary: { type: String, default: "" },
    labels: [{ type: String }],

    status: { type: String, enum: ["open", "claimed", "closed"], default: "open" },

    claimedByUserId: { type: String, default: null },
    claimedByLogin: { type: String, default: null },

    githubUrl: { type: String, required: true },
    githubCreatedAt: { type: Date, required: true },
    githubUpdatedAt: { type: Date, required: true },

    openedAt: { type: Date, required: true },
    claimedAt: { type: Date, default: null },

    requiredSkills: { type: [String], default: [] },
    expectedOutcome: { type: [String], default: [] },
    suggestedResources: { type: [SuggestedResourceSchema], default: [] },

    repoHealth: { type: RepoHealthSchema, default: () => ({}) },
    beginnerFriendly: { type: Boolean, default: false },
    activeMaintainer: { type: Boolean, default: false },
    recentlyUpdated: { type: Boolean, default: false },

    autoSetupCommands: { type: [SetupInstructionSchema], default: [] },
    projectSetupCommands: { type: [SetupInstructionSchema], default: [] },
    maintainerSetupNotes: { type: String, default: null },

    prStatus: { type: String, enum: ["NONE", "PR_OPEN", "MERGED", "CLOSED"], default: "NONE" },
    lastPrMessage: { type: String, default: null },

    updates: { type: [IssueUpdateSchema], default: [] },
    contributionTimeline: { type: [TimelineItemSchema], default: [] },

    notifyWatchers: { type: [String], default: [] }
  },
  { timestamps: true }
);

IssueSchema.index({ repoOwner: 1, repoName: 1, githubNumber: 1 }, { unique: true });

export const Issue = mongoose.model<IssueDocument>("Issue", IssueSchema);