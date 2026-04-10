import { useState, useCallback, useEffect } from "react";
import { api, authHeaders } from "../lib/api";

export interface SavedIssueEntry {
  id: string;
  title: string;
  repoOwner: string;
  repoName: string;
  repoLanguage?: string | null;
  labels?: string[];
  beginnerFriendly?: boolean;
  savedAt: number;
}

const STORAGE_KEY = "oc_saved_issues_v2";

function loadSavedFromStorage(): SavedIssueEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistToStorage(entries: SavedIssueEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function isAuthenticated(): boolean {
  return !!localStorage.getItem("oc_token");
}

export function useSavedIssues() {
  const [saved, setSaved] = useState<SavedIssueEntry[]>(loadSavedFromStorage);
  const [loading, setLoading] = useState(false);

  // Fetch from API on mount if authenticated
  useEffect(() => {
    if (!isAuthenticated()) return;

    const fetchSavedIssues = async () => {
      setLoading(true);
      try {
        const res = await api.get<{ savedIssues: Array<{
          issueId: string;
          title: string;
          repoOwner: string;
          repoName: string;
          repoLanguage?: string | null;
          labels?: string[];
          beginnerFriendly?: boolean;
          savedAt: string;
        }> }>("/api/me/saved-issues", { headers: authHeaders() });

        const entries: SavedIssueEntry[] = res.data.savedIssues.map((s) => ({
          id: s.issueId,
          title: s.title,
          repoOwner: s.repoOwner,
          repoName: s.repoName,
          repoLanguage: s.repoLanguage,
          labels: s.labels || [],
          beginnerFriendly: s.beginnerFriendly || false,
          savedAt: new Date(s.savedAt).getTime()
        }));

        setSaved(entries);
        persistToStorage(entries);
      } catch (err) {
        console.error("Failed to fetch saved issues:", err);
        // Fall back to localStorage
      } finally {
        setLoading(false);
      }
    };

    fetchSavedIssues();
  }, []);

  const toggleSave = useCallback(async (
    issueId: string,
    meta?: { title: string; repoOwner: string; repoName: string; repoLanguage?: string | null; labels?: string[]; beginnerFriendly?: boolean }
  ) => {
    const exists = saved.some((e) => e.id === issueId);

    if (isAuthenticated()) {
      try {
        if (exists) {
          // Unsave
          await api.delete(`/api/me/saved-issues/${issueId}`, { headers: authHeaders() });
          setSaved((prev) => {
            const next = prev.filter((e) => e.id !== issueId);
            persistToStorage(next);
            return next;
          });
        } else {
          // Save
          await api.post("/api/me/saved-issues", {
            issueId,
            title: meta?.title || "Untitled Issue",
            repoOwner: meta?.repoOwner || "",
            repoName: meta?.repoName || "",
            repoLanguage: meta?.repoLanguage || null,
            labels: meta?.labels || [],
            beginnerFriendly: meta?.beginnerFriendly || false
          }, { headers: authHeaders() });

          setSaved((prev) => {
            const next = [
              ...prev,
              {
                id: issueId,
                title: meta?.title || "Untitled Issue",
                repoOwner: meta?.repoOwner || "",
                repoName: meta?.repoName || "",
                repoLanguage: meta?.repoLanguage,
                labels: meta?.labels || [],
                beginnerFriendly: meta?.beginnerFriendly || false,
                savedAt: Date.now()
              }
            ];
            persistToStorage(next);
            return next;
          });
        }
      } catch (err) {
        console.error("Failed to toggle save:", err);
        // Fallback to local-only
        toggleSaveLocal(issueId, meta);
      }
    } else {
      toggleSaveLocal(issueId, meta);
    }
  }, [saved]);

  const toggleSaveLocal = useCallback((
    issueId: string,
    meta?: { title: string; repoOwner: string; repoName: string; repoLanguage?: string | null; labels?: string[]; beginnerFriendly?: boolean }
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
              repoLanguage: meta?.repoLanguage,
              labels: meta?.labels || [],
              beginnerFriendly: meta?.beginnerFriendly || false,
              savedAt: Date.now()
            }
          ];
      persistToStorage(next);
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
    savedCount: saved.length,
    loading
  };
}
