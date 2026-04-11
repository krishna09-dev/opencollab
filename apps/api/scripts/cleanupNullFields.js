const path = require("path");
const { MongoClient } = require("mongodb");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const TARGET_COLLECTIONS = [
  "adminusers",
  "approvedrepos",
  "issues",
  "ingestionruns",
  "prtrackings",
  "reporequests",
  "reports",
  "resources",
  "users"
];

const SAMPLE_LIMIT = 20;

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function markRemoved(report, pathLabel) {
  report.removedFields += 1;
  if (report.samplePaths.length < SAMPLE_LIMIT) {
    report.samplePaths.push(pathLabel);
  }
}

function pruneNullFieldsInPlace(target, pathPrefix, report) {
  let changed = false;

  for (const key of Object.keys(target)) {
    if (key === "_id") {
      continue;
    }

    const value = target[key];
    const fieldPath = pathPrefix ? `${pathPrefix}.${key}` : key;

    if (value === null) {
      delete target[key];
      markRemoved(report, fieldPath);
      changed = true;
      continue;
    }

    if (Array.isArray(value)) {
      let arrayChanged = false;
      const nextArray = [];

      for (let index = 0; index < value.length; index += 1) {
        const entry = value[index];
        const entryPath = `${fieldPath}[${index}]`;

        if (entry === null) {
          markRemoved(report, entryPath);
          arrayChanged = true;
          continue;
        }

        if (isPlainObject(entry)) {
          const entryChanged = pruneNullFieldsInPlace(entry, entryPath, report);

          if (Object.keys(entry).length === 0) {
            markRemoved(report, entryPath);
            arrayChanged = true;
            continue;
          }

          nextArray.push(entry);
          if (entryChanged) {
            arrayChanged = true;
          }
          continue;
        }

        nextArray.push(entry);
      }

      if (arrayChanged) {
        target[key] = nextArray;
        changed = true;
      }
      continue;
    }

    if (isPlainObject(value)) {
      const nestedChanged = pruneNullFieldsInPlace(value, fieldPath, report);

      if (Object.keys(value).length === 0) {
        delete target[key];
        markRemoved(report, fieldPath);
        changed = true;
        continue;
      }

      if (nestedChanged) {
        changed = true;
      }
    }
  }

  return changed;
}

async function cleanupCollection(db, collectionName, dryRun) {
  const collection = db.collection(collectionName);
  const cursor = collection.find({});

  let scanned = 0;
  let changedDocuments = 0;
  let removedFields = 0;
  const samplePaths = [];

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc || !doc._id) {
      continue;
    }

    scanned += 1;

    const report = {
      removedFields: 0,
      samplePaths: []
    };

    const changed = pruneNullFieldsInPlace(doc, "", report);
    if (!changed) {
      continue;
    }

    changedDocuments += 1;
    removedFields += report.removedFields;

    for (const samplePath of report.samplePaths) {
      if (samplePaths.length >= SAMPLE_LIMIT) {
        break;
      }
      samplePaths.push(samplePath);
    }

    if (!dryRun) {
      await collection.replaceOne({ _id: doc._id }, doc);
    }
  }

  return {
    name: collectionName,
    scanned,
    changedDocuments,
    removedFields,
    samplePaths
  };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in apps/api/.env");
  }

  const dryRun = process.argv.includes("--dry-run");

  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db();

    const existingCollections = await db.listCollections().toArray();
    const existingNames = new Set(existingCollections.map((c) => c.name));

    const collectionsSummary = [];
    let totalScanned = 0;
    let totalChangedDocuments = 0;
    let totalRemovedFields = 0;

    for (const collectionName of TARGET_COLLECTIONS) {
      if (!existingNames.has(collectionName)) {
        collectionsSummary.push({
          name: collectionName,
          skipped: true,
          reason: "collection_not_found"
        });
        continue;
      }

      const result = await cleanupCollection(db, collectionName, dryRun);
      collectionsSummary.push(result);

      totalScanned += result.scanned;
      totalChangedDocuments += result.changedDocuments;
      totalRemovedFields += result.removedFields;
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          dbName: db.databaseName,
          dryRun,
          totals: {
            scanned: totalScanned,
            changedDocuments: totalChangedDocuments,
            removedFields: totalRemovedFields
          },
          collections: collectionsSummary
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
  console.error("Null-field cleanup failed:", err.message);
  process.exit(1);
});
