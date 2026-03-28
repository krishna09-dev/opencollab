import { Issue } from "../models/Issue";
import { IngestionRun } from "../models/IngestionRun";
import { fetchBeginnerOpenIssuesForRepo } from "./githubIssues.service";
import { dedupeByIssueKey } from "../utils/dedupe";
import { markRepoError, markRepoRun, markRepoSuccess } from "./repoSyncState.service";

export async function ingestSingleRepo(params: {
  fullName: string;
  repoOwner: string;
  repoName: string;
  lastSyncedAt?: Date | null;
}) {
  await markRepoRun(params.fullName);

  const sinceISO = params.lastSyncedAt ? params.lastSyncedAt.toISOString() : undefined;

  try {
    const { issues, fetchedCount } = await fetchBeginnerOpenIssuesForRepo({
      owner: params.repoOwner,
      repo: params.repoName,
      sinceISO
    });

    const unique = dedupeByIssueKey(issues);

    let upserted = 0;

    for (const dto of unique) {
      await Issue.updateOne(
        { repoOwner: dto.repoOwner, repoName: dto.repoName, githubNumber: dto.githubNumber },
        {
          $set: {
            title: dto.title,
            body: dto.body,
            labels: dto.labels,
            githubUrl: dto.githubUrl,
            githubCreatedAt: dto.githubCreatedAt,
            githubUpdatedAt: dto.githubUpdatedAt,
            status: "open",
            openedAt: dto.openedAt,
            beginnerFriendly: true,
            recentlyUpdated: true,
            lastSyncedAt: new Date()
          },
          $setOnInsert: {
            summary: "",
            requiredSkills: [],
            expectedOutcome: [],
            suggestedResources: [],
            notifyWatchers: []
          }
        },
        { upsert: true }
      );

      upserted++;
    }

    await markRepoSuccess(params.fullName, new Date());

    return {
      repo: params.fullName,
      fetched: fetchedCount,
      unique: unique.length,
      upserted
    };
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Unknown ingestion error";

    await markRepoError(params.fullName, msg);

    return {
      repo: params.fullName,
      fetched: 0,
      unique: 0,
      upserted: 0,
      error: msg
    };
  }
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<any>
) {
  const queue = [...items];
  const results: any[] = [];

  const workers = Array.from({ length: limit }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      results.push(await fn(item));
    }
  });

  await Promise.all(workers);
  return results;
}

export async function ingestAllApprovedRepos(
  repos: Array<any>,
  concurrency: number
) {
  // use errorMessages, NOT errors
  const run = await IngestionRun.create({
    startedAt: new Date(),
    reposAttempted: repos.length,
    reposSucceeded: 0,
    reposFailed: 0,
    issuesFetched: 0,
    issuesUnique: 0,
    issuesUpserted: 0,
    errorMessages: []
  });

  const results = await runWithConcurrency(repos, concurrency, async (r) => {
    return ingestSingleRepo({
      fullName: r.fullName,
      repoOwner: r.repoOwner,
      repoName: r.repoName,
      lastSyncedAt: r.lastSyncedAt
    });
  });

  let reposSucceeded = 0;
  let reposFailed = 0;
  let issuesFetched = 0;
  let issuesUnique = 0;
  let issuesUpserted = 0;

  const errorMessages: string[] = [];

  for (const r of results) {
    if (r?.error) {
      reposFailed++;
      errorMessages.push(`${r.repo}: ${r.error}`);
    } else {
      reposSucceeded++;
    }

    issuesFetched += r.fetched || 0;
    issuesUnique += r.unique || 0;
    issuesUpserted += r.upserted || 0;
  }

  run.finishedAt = new Date();
  run.reposSucceeded = reposSucceeded;
  run.reposFailed = reposFailed;
  run.issuesFetched = issuesFetched;
  run.issuesUnique = issuesUnique;
  run.issuesUpserted = issuesUpserted;

  // use errorMessages, NOT errors
  run.errorMessages = errorMessages;

  await run.save();

  return { runId: run._id, results };
}