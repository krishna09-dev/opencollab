import { notifications } from "../routes/notifications.routes";
import { clearTestDb, closeTestDb, initTestDb } from "./testUtils";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "3600";
process.env.ALLOWED_ORIGINS = "http://localhost:5173";

jest.setTimeout(60000);

beforeAll(async () => {
  await initTestDb();
});

afterEach(async () => {
  notifications.length = 0;
  await clearTestDb();
  jest.restoreAllMocks();
});

afterAll(async () => {
  await closeTestDb();
});
