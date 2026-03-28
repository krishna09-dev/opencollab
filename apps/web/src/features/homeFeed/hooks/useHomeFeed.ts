import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMe, fetchIssueStats, fetchFeed } from "../api/homeApi";
import type { IssueStatsResponse, IssueRow, FeedPagination, FeedFilters } from "../types";

export function useHomeFeed() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [stats, setStats] = useState<IssueStatsResponse | null>(null);

  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [pagination, setPagination] = useState<FeedPagination | null>(null);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesError, setIssuesError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FeedFilters>({ page: 1, limit: 10 });

  const navigate = useNavigate();

  const loadIssues = useCallback(async (f: FeedFilters = filters) => {
    setIssuesLoading(true);
    setIssuesError(null);
    try {
      const data = await fetchFeed(f);
      setIssues(data.issues);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || "Failed to load issues list.";
      setIssuesError(msg);
      setIssues([]);
    } finally {
      setIssuesLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const token = localStorage.getItem("oc_token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const flag = localStorage.getItem("oc_first_time") === "true";
    setIsNewUser(flag);

    const run = async () => {
      try {
        const me = await fetchMe();
        setUsername(me.login);

        try {
          const s = await fetchIssueStats();
          setStats(s);
        } catch {
          // ignore
        }

        await loadIssues();
      } catch (err) {
        console.error(err);
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    if (isNewUser) {
      localStorage.removeItem("oc_first_time");
    }
  }, [isNewUser]);

  const updateFilters = useCallback((newFilters: Partial<FeedFilters>) => {
    const merged = { ...filters, ...newFilters };
    setFilters(merged);
    loadIssues(merged);
  }, [filters, loadIssues]);

  const goToPage = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  const headline = isNewUser
    ? `Welcome, ${username}!`
    : `Welcome back, ${username}!`;

  return {
    loading,
    headline,
    stats,
    issues,
    pagination,
    issuesLoading,
    issuesError,
    filters,
    updateFilters,
    goToPage,
    loadIssues: () => loadIssues(filters)
  };
}
