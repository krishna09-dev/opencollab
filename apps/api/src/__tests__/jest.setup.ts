import mongoose from "mongoose";
import { closeTestDb, initTestDb } from "./testUtils";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "3600";
process.env.ALLOWED_ORIGINS = "http://localhost:5173";
process.env.GITHUB_SYSTEM_TOKEN = "test-system-token";

jest.setTimeout(60000);

beforeAll(async () => {
  await initTestDb();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

afterAll(async () => {
  await closeTestDb();
});
