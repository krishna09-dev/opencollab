import { useState, useCallback, useEffect } from "react";
import { api, authHeaders } from "../lib/api";

const STORAGE_KEY = "oc_recent_searches";
const MAX_RECENT_SEARCHES = 3;

function loadFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistToStorage(searches: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
}

function isAuthenticated(): boolean {
  return !!localStorage.getItem("oc_token");
}

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>(loadFromStorage);
  const [loading, setLoading] = useState(false);

  // Fetch from API on mount if authenticated
  useEffect(() => {
    if (!isAuthenticated()) return;

    const fetchRecentSearches = async () => {
      setLoading(true);
      try {
        const res = await api.get<{ recentSearches: string[] }>(
          "/api/me/recent-searches",
          { headers: authHeaders() }
        );
        const searches = res.data.recentSearches || [];
        setRecentSearches(searches);
        persistToStorage(searches);
      } catch (err) {
        console.error("Failed to fetch recent searches:", err);
        // Fall back to localStorage
      } finally {
        setLoading(false);
      }
    };

    fetchRecentSearches();
  }, []);

  const addSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // Optimistic update
    setRecentSearches((prev) => {
      // Remove if already exists
      const filtered = prev.filter(
        (s) => s.toLowerCase() !== trimmedQuery.toLowerCase()
      );
      // Add to front and limit to max
      const next = [trimmedQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      persistToStorage(next);
      return next;
    });

    // Sync to API if authenticated
    if (isAuthenticated()) {
      try {
        await api.post(
          "/api/me/recent-searches",
          { query: trimmedQuery },
          { headers: authHeaders() }
        );
      } catch (err) {
        console.error("Failed to save recent search:", err);
        // Local update already applied
      }
    }
  }, []);

  const clearSearches = useCallback(() => {
    setRecentSearches([]);
    persistToStorage([]);
  }, []);

  return {
    recentSearches,
    addSearch,
    clearSearches,
    loading
  };
}
