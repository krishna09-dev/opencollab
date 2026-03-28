import { prTrackingService } from "../services/prTracking.service";

const PR_SYNC_INTERVAL_MINUTES = 15;

export function startPrSyncWorker() {
  const enabled = process.env.PR_SYNC_ENABLED !== "false";
  const systemToken = process.env.GITHUB_SYSTEM_TOKEN;

  if (!enabled) {
    console.log("🟡 PR sync worker disabled (PR_SYNC_ENABLED=false)");
    return;
  }

  if (!systemToken) {
    console.log("🟡 PR sync worker disabled: GITHUB_SYSTEM_TOKEN not configured");
    return;
  }

  const runOnce = async () => {
    console.log("🔄 PR sync worker started...");
    try {
      const result = await prTrackingService.systemSyncAll(systemToken);
      console.log(`✅ PR sync complete: ${result.synced} synced, ${result.errors} errors`);
    } catch (err) {
      console.error("❌ PR sync error:", err);
    }
  };

  // Run immediately on startup
  runOnce();

  // Run every 15 minutes
  const intervalMs = PR_SYNC_INTERVAL_MINUTES * 60 * 1000;
  setInterval(() => {
    runOnce();
  }, intervalMs);

  console.log(`🟢 PR sync worker started (interval: ${PR_SYNC_INTERVAL_MINUTES}min)`);
}
