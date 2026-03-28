import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMe, fetchIssueStats, fetchFeed, fetchRecommendations } from "../api/homeApi";
import { fetchPrList, manualRefreshAll } from "../../prTracking/api/prTrackingApi";
import type { RecommendationItem } from "../api/homeApi";
import type { IssueStatsResponse, IssueRow, FeedPagination, FeedFilters } from "../types";
import type { PrTrackingItem, PrSummary } from "../../prTracking/types";

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

  // ML Recommendations
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [useRecommendations, setUseRecommendations] = useState(false);

  // PR Tracking
  const [prItems, setPrItems] = useState<PrTrackingItem[]>([]);
  const [prSummary, setPrSummary] = useState<PrSummary | null>(null);
  const [prLoading, setPrLoading] = useState(false);
  const [prError, setPrError] = useState<string | null>(null);
  const [usePrFeed, setUsePrFeed] = useState(false);
  const [prRefreshing, setPrRefreshing] = useState(false);

  const navigate = useNavigate();

  const loadRecommendations = useCallback(async () => {
    setRecommendationsLoading(true);
    try {
      const data = await fetchRecommendations(5);
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error("Failed to load recommendations:", err);
      setRecommendations([]);
    } finally {
      setRecommendationsLoading(false);
    }
  }, []);

  const loadPrs = useCallback(async () => {
    setPrLoading(true);
    setPrError(null);
    try {
      const data = await fetchPrList({ q: "", status: "All", repo: "All" });
      setPrItems(data.items);
      setPrSummary(data.summary);
    } catch (err: any) {
      console.error("Failed to load PRs:", err);
      setPrError(err?.response?.data?.message || "Failed to load PRs");
      setPrItems([]);
    } finally {
      setPrLoading(false);
    }
  }, []);

  const refreshPrs = useCallback(async () => {
    setPrRefreshing(true);
    try {
      await manualRefreshAll();
      await loadPrs();
    } catch (err: any) {
      console.error("Failed to refresh PRs:", err);
    } finally {
      setPrRefreshing(false);
    }
  }, [loadPrs]);

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

        // Load issues, recommendations, and PRs
        await Promise.all([
          loadIssues(),
          loadRecommendations(),
          loadPrs()
        ]);
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
    setUseRecommendations(false);
    setUsePrFeed(false);
    loadIssues(merged);
  }, [filters, loadIssues]);

  const goToPage = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  const toggleRecommendations = useCallback(() => {
    setUseRecommendations((prev) => !prev);
    setUsePrFeed(false);
  }, []);

  const togglePrFeed = useCallback(() => {
    setUsePrFeed(true);
    setUseRecommendations(false);
  }, []);

  const showAllIssues = useCallback(() => {
    setUseRecommendations(false);
    setUsePrFeed(false);
  }, []);

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
    loadIssues: () => loadIssues(filters),
    // Recommendations
    recommendations,
    recommendationsLoading,
    useRecommendations,
    toggleRecommendations,
    loadRecommendations,
    // PR Tracking
    prItems,
    prSummary,
    prLoading,
    prError,
    usePrFeed,
    prRefreshing,
    togglePrFeed,
    showAllIssues,
    refreshPrs,
    loadPrs
  };
}
