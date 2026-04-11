import mongoose, { Schema, Document } from "mongoose";
import { cleanupOptionalFieldsPlugin } from "./plugins/cleanupOptionalFields";

export interface IngestionRunDocument extends Document {
  startedAt: Date;
  finishedAt?: Date | null;

  reposAttempted: number;
  reposSucceeded: number;
  reposFailed: number;

  issuesFetched: number;
  issuesUnique: number;
  issuesUpserted: number;

  // ✅ renamed to avoid clash with mongoose Document.errors
  errorMessages: string[];
}

const IngestionRunSchema = new Schema<IngestionRunDocument>(
  {
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, default: undefined },

    reposAttempted: { type: Number, default: 0 },
    reposSucceeded: { type: Number, default: 0 },
    reposFailed: { type: Number, default: 0 },

    issuesFetched: { type: Number, default: 0 },
    issuesUnique: { type: Number, default: 0 },
    issuesUpserted: { type: Number, default: 0 },

    errorMessages: { type: [String], default: [] }
  },
  { timestamps: true }
);

IngestionRunSchema.plugin(cleanupOptionalFieldsPlugin);

export const IngestionRun = mongoose.model<IngestionRunDocument>(
  "IngestionRun",
  IngestionRunSchema
);