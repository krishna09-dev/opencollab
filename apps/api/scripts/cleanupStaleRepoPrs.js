const path = require("path");
const { MongoClient } = require("mongodb");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set in apps/api/.env");

  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db();

    const approvedRepos = await db
      .collection("approvedrepos")
      .find({}, { projection: { fullName: 1, isActive: 1 } })
      .toArray();

    const activeRepoSet = new Set(
      approvedRepos
        .filter((repo) => repo.isActive)
        .map((repo) => String(repo.fullName || "").toLowerCase())
        .filter(Boolean)
    );

    const issues = await db
      .collection("issues")
      .find({}, { projection: { _id: 1, repoOwner: 1, repoName: 1 } })
      .toArray();

    const staleIssueIds = [];
    const staleRepoSet = new Set();

    for (const issue of issues) {
      const owner = String(issue.repoOwner || "").trim();
      const repo = String(issue.repoName || "").trim();
      if (!owner || !repo) continue;

      const fullName = `${owner}/${repo}`.toLowerCase();
      if (!activeRepoSet.has(fullName)) {
        staleIssueIds.push(issue._id);
        staleRepoSet.add(fullName);
      }
    }

    const staleRepos = Array.from(staleRepoSet);

    let prDeleteCount = 0;
    if (staleIssueIds.length > 0 || staleRepos.length > 0) {
      const deleteQuery = {
        $or: [
          ...(staleIssueIds.length > 0 ? [{ issueId: { $in: staleIssueIds } }] : []),
          ...(staleRepos.length > 0
            ? [
                {
                  $expr: {
                    $in: [{ $toLower: { $ifNull: ["$repoFullName", ""] } }, staleRepos]
                  }
                }
              ]
            : [])
        ]
      };

      if (deleteQuery.$or.length > 0) {
        const deleteResult = await db.collection("prtrackings").deleteMany(deleteQuery);
        prDeleteCount = deleteResult.deletedCount || 0;
      }
    }

    let issueResetCount = 0;
    if (staleIssueIds.length > 0) {
      const issueReset = await db.collection("issues").updateMany(
        { _id: { $in: staleIssueIds }, prStatus: { $ne: "NONE" } },
        {
          $set: {
            prStatus: "NONE",
            lastPrMessage: null
          }
        }
      );
      issueResetCount = issueReset.modifiedCount || 0;
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          dbName: db.databaseName,
          activeRepos: activeRepoSet.size,
          staleReposDetected: staleRepos.length,
          staleIssueCount: staleIssueIds.length,
          deletedPrTracking: prDeleteCount,
          issuesReset: issueResetCount
        },
        null,
        2
      )
    );
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Stale PR cleanup failed:", err.message);
  process.exit(1);
});
