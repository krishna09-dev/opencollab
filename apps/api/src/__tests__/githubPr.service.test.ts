import axios from "axios";
import {
  computeStatusFromPR,
  fetchPrByNumber,
  parsePrUrl
} from "../services/githubPr.service";
let getSpy: jest.SpiedFunction<typeof axios.get>;

describe("githubPr.service", () => {
  beforeEach(() => {
    getSpy = jest.spyOn(axios, "get");
  });

  test("parsePrUrl supports full GitHub URL and shorthand formats", () => {
    expect(parsePrUrl("https://github.com/octocat/hello-world/pull/123")).toEqual({
      owner: "octocat",
      repo: "hello-world",
      prNumber: 123
    });

    expect(parsePrUrl("octocat/hello-world#45")).toEqual({
      owner: "octocat",
      repo: "hello-world",
      prNumber: 45
    });

    expect(parsePrUrl("octocat/hello-world/77")).toEqual({
      owner: "octocat",
      repo: "hello-world",
      prNumber: 77
    });
  });

  test("parsePrUrl returns null for unsupported input", () => {
    expect(parsePrUrl("not-a-pr")).toBeNull();
    expect(parsePrUrl("https://example.com/octocat/hello-world/pull/1")).toBeNull();
  });

  test("computeStatusFromPR prioritizes merged then closed then open", () => {
    expect(computeStatusFromPR(null)).toBe("ACCEPTED");
    expect(computeStatusFromPR({ merged_at: "2025-01-01", state: "closed" })).toBe("MERGED");
    expect(computeStatusFromPR({ merged_at: null, state: "closed" })).toBe("CLOSED");
    expect(computeStatusFromPR({ merged_at: null, state: "open" })).toBe("PR_OPEN");
  });

  test("fetchPrByNumber returns normalized PR payload with participants and latest review state", async () => {
    getSpy
      .mockResolvedValueOnce({
        data: {
          number: 99,
          title: "Fix race condition",
          body: "PR body",
          html_url: "https://github.com/octocat/hello-world/pull/99",
          state: "open",
          merged_at: null,
          closed_at: null,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-02T00:00:00Z",
          additions: 12,
          deletions: 4,
          changed_files: 3,
          comments: 5,
          review_comments: 2,
          requested_reviewers: [{ login: "pending-reviewer" }],
          base: { repo: { language: "TypeScript" } },
          user: { login: "author-user" }
        }
      } as any)
      .mockResolvedValueOnce({
        data: [
          {
            state: "COMMENTED",
            submitted_at: "2026-01-02T09:00:00Z"
          },
          {
            state: "APPROVED",
            submitted_at: "2026-01-02T10:00:00Z"
          }
        ]
      } as any)
      .mockResolvedValueOnce({
        data: [{ user: { login: "reviewer-1" } }]
      } as any)
      .mockResolvedValueOnce({
        data: [{ user: { login: "commenter-1" } }]
      } as any)
      .mockResolvedValueOnce({
        data: [{ user: { login: "review-commenter" } }]
      } as any);

    const pr = await fetchPrByNumber({
      githubToken: "token",
      owner: "octocat",
      repo: "hello-world",
      prNumber: 99
    });

    expect(pr).not.toBeNull();
    expect(pr?.number).toBe(99);
    expect(pr?.review_state).toBe("APPROVED");
    expect(pr?.requested_reviewers_count).toBe(1);
    expect(pr?.language).toBe("TypeScript");
    expect(pr?.author).toBe("author-user");
    expect(pr?.participants).toEqual(
      expect.arrayContaining(["reviewer-1", "commenter-1", "review-commenter"])
    );
  });

  test("fetchPrByNumber returns null when GitHub responds with 404", async () => {
    getSpy.mockRejectedValueOnce({ response: { status: 404 } });

    const pr = await fetchPrByNumber({
      githubToken: "token",
      owner: "octocat",
      repo: "hello-world",
      prNumber: 404
    });

    expect(pr).toBeNull();
  });
});
