import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("❌ MONGODB_URI missing in .env");
    }

    await mongoose.connect(uri);
    console.log("✅ MongoDB connected successfully");

    // 🔒 Type-safe access to db
    const db = mongoose.connection.db;
    if (!db) {
      console.warn("⚠️ MongoDB db instance not ready, skipping index setup");
      return;
    }

    // ✅ Ensure text index for resources collection
    try {
      const collections = await db
        .listCollections({ name: "resources" })
        .toArray();

      if (collections.length > 0) {
        await db.collection("resources").createIndex(
          {
            title: "text",
            description: "text",
            tags: "text",
            topics: "text"
          },
          {
            name: "ResourceTextIndex",
            // 🚫 Avoid Mongo default "language" override
            language_override: "resourceTextLang"
          }
        );

        console.log("🔍 Resource text index ensured (safe override)");
      }
    } catch (indexErr) {
      console.warn("⚠️ Resource index creation skipped:", indexErr);
    }
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};