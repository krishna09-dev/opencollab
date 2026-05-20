import request from "supertest";
import { Notification } from "../models/Notification";
import { authHeaderForUserId, createUser, getTestApp } from "./testUtils";

describe("Notifications routes", () => {
  test("GET /api/notifications requires authentication", async () => {
    const app = getTestApp();

    const res = await request(app).get("/api/notifications");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token provided/i);
  });

  test("GET /api/notifications returns user-specific notifications sorted latest-first", async () => {
    const app = getTestApp();
    const user = await createUser();
    const auth = authHeaderForUserId(String(user._id));

    await Notification.create({
      userId: String(user._id),
      type: "ISSUE_AVAILABLE",
      issueId: "i1",
      issueTitle: "Older",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      read: false
    });
    await Notification.create({
      userId: String(user._id),
      type: "ISSUE_AVAILABLE",
      issueId: "i2",
      issueTitle: "Newer",
      createdAt: "2026-01-02T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      read: false
    });
    await Notification.create({
      userId: "other-user",
      type: "ISSUE_AVAILABLE",
      issueId: "i3",
      issueTitle: "Other",
      createdAt: "2026-01-03T00:00:00.000Z",
      updatedAt: "2026-01-03T00:00:00.000Z",
      read: false
    });

    const res = await request(app).get("/api/notifications").set(auth);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].issueTitle).toBe("Newer");
    expect(res.body[1].issueTitle).toBe("Older");
  });

  test("POST /api/notifications/read-all marks current user notifications as read", async () => {
    const app = getTestApp();
    const user = await createUser();
    const auth = authHeaderForUserId(String(user._id));

    await Notification.create({
      userId: String(user._id),
      type: "ISSUE_AVAILABLE",
      issueId: "i1",
      issueTitle: "Mine",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      read: false
    });
    const otherNotification = await Notification.create({
      userId: "someone-else",
      type: "ISSUE_AVAILABLE",
      issueId: "i2",
      issueTitle: "Other",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      read: false
    });

    const res = await request(app).post("/api/notifications/read-all").set(auth);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.notifications[0].read).toBe(true);

    const other = await Notification.findById(otherNotification._id);
    expect(other?.read).toBe(false);
  });
});
