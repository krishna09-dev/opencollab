export const GITHUB = {
  apiBaseUrl: "https://api.github.com",
  perPage: 100,

  // Conservative defaults for 50–100 repos
  repoConcurrency: Number(process.env.INGESTION_REPO_CONCURRENCY || 3),
  maxPagesPerRepo: Number(process.env.INGESTION_MAX_PAGES || 10),
  maxPagesPerLabel: Number(process.env.INGESTION_MAX_PAGES || 10),

  // Legacy list retained for compatibility with older ingestion flows.
  allowedLabels: ["good first issue", "beginner", "easy", "help wanted"],

  // worker loop
  intervalMinutes: Number(process.env.INGESTION_INTERVAL_MINUTES || 15)
};