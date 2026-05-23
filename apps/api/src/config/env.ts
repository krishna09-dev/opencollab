import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const WEAK_JWT_SECRETS = new Set([
  "super_secret_jwt_string",
  "dev_secret",
  "replace_with_strong_secret"
]);

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5001),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default("604800"),
  FRONTEND_URL: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().optional(),
  GITHUB_SYSTEM_TOKEN: z.string().optional(),
  ML_SERVICE_URL: z.string().default("http://localhost:8001"),
  INGESTION_ENABLED: z.string().optional().default("true"),
  PR_SYNC_ENABLED: z.string().optional().default("true")
});

function isConfigured(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

const parsed = envSchema.parse(process.env);

if (parsed.NODE_ENV === "production") {
  const missing: string[] = [];
  if (!isConfigured(parsed.MONGODB_URI)) missing.push("MONGODB_URI");
  if (!isConfigured(parsed.JWT_SECRET)) missing.push("JWT_SECRET");
  if (!isConfigured(parsed.FRONTEND_URL)) missing.push("FRONTEND_URL");

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables in production: ${missing.join(", ")}`);
  }

  if (parsed.JWT_SECRET && WEAK_JWT_SECRETS.has(parsed.JWT_SECRET.trim())) {
    throw new Error("JWT_SECRET is weak. Generate a strong value before running in production.");
  }
}

export const env = {
  ...parsed,
  INGESTION_ENABLED: parsed.INGESTION_ENABLED !== "false",
  PR_SYNC_ENABLED: parsed.PR_SYNC_ENABLED !== "false"
};

export type Env = typeof env;
