import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../app";
import { signUserJwt } from "../utils/jwt";
import { User, type UserRole } from "../models/User";
import { AdminUser } from "../models/AdminUser";
import { Issue } from "../models/Issue";
import { Resource } from "../models/Resource";

let mongoServer: MongoMemoryServer | null = null;
let userSeq = 0;
let issueSeq = 0;
let resourceSeq = 0;

export function getTestApp() {
  return createApp();
}

export async function initTestDb() {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      ip: "127.0.0.1"
    }
  });
  await mongoose.connect(mongoServer.getUri());
}

export async function clearTestDb() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

export async function closeTestDb() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

export function authHeaderForUserId(userId: string) {
  const token = signUserJwt({ userId });
  return { Authorization: `Bearer ${token}` };
}

export async function createUser(role: UserRole = "user") {
  userSeq += 1;
  return User.create({
    githubId: `gh-${userSeq}`,
    login: `user-${userSeq}`,
    email: `user-${userSeq}@test.dev`,
    role,
    preferredLanguages: [],
    areasOfInterest: []
  });
}

export async function createAdminUser(role: "admin" | "moderator" = "admin") {
  userSeq += 1;
  return AdminUser.create({
    username: `admin-${userSeq}`,
    passwordHash: "hashed-password",
    role
  });
}

export async function createIssue(overrides: Record<string, unknown> = {}) {
  issueSeq += 1;
  const now = new Date();

  return Issue.create({
    githubNumber: issueSeq,
    repoOwner: "octocat",
    repoName: "hello-world",
    repoLanguage: "TypeScript",
    title: `Issue ${issueSeq}`,
    body: "Issue body",
    summary: "Issue summary",
    labels: ["good first issue"],
    status: "open",
    githubUrl: `https://github.com/octocat/hello-world/issues/${issueSeq}`,
    githubCreatedAt: now,
    githubUpdatedAt: now,
    openedAt: now,
    beginnerFriendly: true,
    isApproved: true,
    isVisible: true,
    updates: [],
    contributionTimeline: [],
    ...overrides
  });
}

export async function createResource(overrides: Record<string, unknown> = {}) {
  resourceSeq += 1;

  return Resource.create({
    title: `Resource ${resourceSeq}`,
    url: `https://example.com/resource-${resourceSeq}`,
    description: "Resource description",
    category: "Programming Docs",
    type: "article",
    difficulty: "beginner",
    tags: [],
    topics: [],
    source: "official",
    status: "approved",
    ...overrides
  });
}
