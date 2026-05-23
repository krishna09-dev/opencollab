import { connectDB } from "./config/db";
import { createApp, getAllowedOrigins } from "./app";
import { startIssueIngestionWorker } from "./workers/issueIngestion.worker";
import { startPrSyncWorker } from "./workers/prSync.worker";
import { env } from "./config/env";

const app = createApp();
const PORT = env.PORT;

async function startServer() {
  await connectDB();

  startIssueIngestionWorker();
  startPrSyncWorker();

  app.listen(PORT, () => {
    console.log(`🚀 API running at http://localhost:${PORT}`);
    console.log(`✅ Allowed CORS origins:`, getAllowedOrigins());
  });
}

void startServer();
