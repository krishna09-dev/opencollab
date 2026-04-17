import request from "supertest";
import { Resource } from "../models/Resource";
import { authHeaderForUserId, createResource, createUser, getTestApp } from "./testUtils";

describe("Resources routes", () => {
  test("GET /api/resources returns approved items only", async () => {
    const app = getTestApp();
    const user = await createUser();
    const auth = authHeaderForUserId(String(user._id));

    await createResource({ title: "Approved One", status: "approved", source: "official" });
    await createResource({ title: "Pending One", status: "pending", source: "community" });

    const res = await request(app).get("/api/resources").set(auth);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].title).toBe("Approved One");
  });

  test("GET /api/resources supports source filter", async () => {
    const app = getTestApp();
    const user = await createUser();
    const auth = authHeaderForUserId(String(user._id));

    await createResource({ title: "Official Guide", source: "official", status: "approved" });
    await createResource({ title: "Community Guide", source: "community", status: "approved" });

    const res = await request(app).get("/api/resources?source=community").set(auth);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].title).toBe("Community Guide");
    expect(res.body.items[0].source).toBe("community");
  });

  test("POST /api/resources/suggest creates pending community resource", async () => {
    const app = getTestApp();
    const user = await createUser();

    const res = await request(app)
      .post("/api/resources/suggest")
      .set(authHeaderForUserId(String(user._id)))
      .send({
        title: "Great Guide",
        url: "https://example.com/great-guide",
        description: "A useful guide",
        category: "Programming Docs",
        type: "docs",
        difficulty: "beginner",
        tags: ["guide"],
        topics: ["setup"],
        language: "en"
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();

    const created = await Resource.findOne({ url: "https://example.com/great-guide" });
    expect(created?.status).toBe("pending");
    expect(created?.source).toBe("community");
  });

  test("POST /api/resources/suggest rejects duplicate URL", async () => {
    const app = getTestApp();
    const user = await createUser();

    await createResource({ url: "https://example.com/dup", status: "approved" });

    const res = await request(app)
      .post("/api/resources/suggest")
      .set(authHeaderForUserId(String(user._id)))
      .send({
        title: "Duplicate URL",
        url: "https://example.com/dup",
        description: "duplicate",
        category: "Programming Docs"
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test("POST /api/resources/suggest validates URL format", async () => {
    const app = getTestApp();
    const user = await createUser();

    const res = await request(app)
      .post("/api/resources/suggest")
      .set(authHeaderForUserId(String(user._id)))
      .send({
        title: "Broken URL",
        url: "not-a-url",
        description: "invalid",
        category: "Programming Docs"
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/validation failed/i);
  });
});
