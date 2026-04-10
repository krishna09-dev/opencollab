const path = require("path");
const { MongoClient } = require("mongodb");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not set in apps/api/.env");
  }

  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db();

    const prDelete = await db.collection("prtrackings").deleteMany({});

    const issueReset = await db.collection("issues").updateMany(
      { prStatus: { $ne: "NONE" } },
      {
        $set: {
          prStatus: "NONE",
          lastPrMessage: null
        }
      }
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          dbName: db.databaseName,
          deletedPrTracking: prDelete.deletedCount || 0,
          issuesReset: issueReset.modifiedCount || 0
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
  console.error("PR cleanup failed:", err.message);
  process.exit(1);
});
