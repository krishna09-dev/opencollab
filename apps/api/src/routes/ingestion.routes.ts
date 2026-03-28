import { Router } from "express";
import { ensureApprovedReposSeeded, getActiveApprovedRepos } from "../services/repoSyncState.service";
import { ingestAllApprovedRepos } from "../services/issueIngestion.service";
import { GITHUB } from "../config/github";

const router = Router();

// No admin UI — but a safe internal endpoint for testing/dev
router.post("/run", async (req, res) => {
  await ensureApprovedReposSeeded();
  const repos = await getActiveApprovedRepos();

  const summary = await ingestAllApprovedRepos(repos, GITHUB.repoConcurrency);
  res.json({ ok: true, summary });
});

export default router;