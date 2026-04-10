import { APPROVED_REPOS, toFullName } from "../config/approvedRepos";
import { ApprovedRepo } from "../models/ApprovedRepo";

export async function ensureApprovedReposSeeded() {
  for (const r of APPROVED_REPOS) {
    const fullName = toFullName(r.owner, r.repo);

    await ApprovedRepo.updateOne(
      { fullName },
      {
        $setOnInsert: {
          fullName,
          repoOwner: r.owner,
          repoName: r.repo,
          isActive: r.isActive !== false,
          lastSyncedAt: null
        }
      },
      { upsert: true }
    );
  }
}

export async function getActiveApprovedRepos() {
  return ApprovedRepo.find({ isActive: true }).lean();
}

export async function markRepoRun(fullName: string) {
  await ApprovedRepo.updateOne({ fullName }, { $set: { lastRunAt: new Date() } });
}

export async function markRepoSuccess(fullName: string, lastSyncedAt: Date) {
  await ApprovedRepo.updateOne(
    { fullName },
    { $set: { lastSyncedAt, lastError: null, lastErrorAt: null } }
  );
}

export async function markRepoError(fullName: string, err: string) {
  await ApprovedRepo.updateOne(
    { fullName },
    { $set: { lastError: err, lastErrorAt: new Date() } }
  );
}