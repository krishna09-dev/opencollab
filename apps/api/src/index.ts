import dotenv from "dotenv";
import { connectDB } from "./config/db";
import { createApp, getAllowedOrigins } from "./app";
import { startIssueIngestionWorker } from "./workers/issueIngestion.worker";
import { startPrSyncWorker } from "./workers/prSync.worker";

dotenv.config();

const app = createApp();
const PORT = Number(process.env.PORT) || 5001;

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