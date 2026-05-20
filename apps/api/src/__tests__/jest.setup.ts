import mongoose from "mongoose";
import { closeTestDb, initTestDb } from "./testUtils";

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
