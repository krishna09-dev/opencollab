import { GITHUB } from "../config/github";
import { ensureApprovedReposSeeded, getActiveApprovedRepos } from "../services/repoSyncState.service";
import { ingestAllApprovedRepos } from "../services/issueIngestion.service";

export function startIssueIngestionWorker() {
  const enabled = process.env.INGESTION_ENABLED !== "false";

  if (!enabled) {
    console.log("🟡 Issue ingestion worker disabled (INGESTION_ENABLED=false)");
    return;
  }

  const runOnce = async () => {
    await ensureApprovedReposSeeded();
    const repos = await getActiveApprovedRepos();

    if (!repos.length) {
      console.log("🟡 No active approved repos configured.");
      return;
    }

    console.log(`🚀 Ingestion run started for ${repos.length} repos...`);
    const summary = await ingestAllApprovedRepos(repos, GITHUB.repoConcurrency);
    console.log("✅ Ingestion run finished:", summary.runId);
  };

  // run immediately
  runOnce().catch((e) => console.error("❌ ingestion error:", e));

  // run on interval
  const intervalMs = GITHUB.intervalMinutes * 60 * 1000;
  setInterval(() => {
    runOnce().catch((e) => console.error("❌ ingestion error:", e));
  }, intervalMs);
}