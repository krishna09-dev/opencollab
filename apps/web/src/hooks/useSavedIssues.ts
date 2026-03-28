import { useState, useCallback } from "react";

export interface SavedIssueEntry {
  id: string;
  title: string;
  repoOwner: string;
  repoName: string;
  savedAt: number;
}

const STORAGE_KEY = "oc_saved_issues_v2";

function loadSaved(): SavedIssueEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(entries: SavedIssueEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useSavedIssues() {
  const [saved, setSaved] = useState<SavedIssueEntry[]>(loadSaved);

  const toggleSave = useCallback((
    issueId: string,
    meta?: { title: string; repoOwner: string; repoName: string }
  ) => {
    setSaved((prev) => {
      const exists = prev.some((e) => e.id === issueId);
      const next = exists
        ? prev.filter((e) => e.id !== issueId)
        : [
            ...prev,
            {
              id: issueId,
              title: meta?.title || "Untitled Issue",
              repoOwner: meta?.repoOwner || "",
              repoName: meta?.repoName || "",
              savedAt: Date.now()
            }
          ];
      persist(next);
      return next;
    });
  }, []);

  const isSaved = useCallback(
    (issueId: string) => saved.some((e) => e.id === issueId),
    [saved]
  );

  return {
    saved,
    savedIds: saved.map((e) => e.id),
    toggleSave,
    isSaved,
    savedCount: saved.length
  };
}
