import { dedupeByIssueKey, issueKey } from "../utils/dedupe";
import { containsAllowedLabel, normalizeLabel } from "../utils/label";

describe("utility helpers", () => {
  test("issueKey builds owner/repo#number key", () => {
    expect(issueKey("octocat", "hello-world", 42)).toBe("octocat/hello-world#42");
  });

  test("dedupeByIssueKey removes duplicates while preserving first occurrence order", () => {
    const deduped = dedupeByIssueKey([
      { repoOwner: "o", repoName: "r", githubNumber: 1, title: "first" },
      { repoOwner: "o", repoName: "r", githubNumber: 1, title: "duplicate" },
      { repoOwner: "o", repoName: "r", githubNumber: 2, title: "second" }
    ]);

    expect(deduped).toHaveLength(2);
    expect(deduped[0].title).toBe("first");
    expect(deduped[1].githubNumber).toBe(2);
  });

  test("normalizeLabel lowercases and trims label text", () => {
    expect(normalizeLabel("  Good First Issue  ")).toBe("good first issue");
  });

  test("containsAllowedLabel matches labels case-insensitively", () => {
    expect(containsAllowedLabel(["Bug", "Help Wanted"], ["help wanted"])).toBe(true);
    expect(containsAllowedLabel(["enhancement"], ["good first issue"])).toBe(false);
  });
});
