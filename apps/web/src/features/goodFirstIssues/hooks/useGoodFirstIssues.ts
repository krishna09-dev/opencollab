import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchGoodFirstIssues,
  fetchRecommendedGoodFirstIssues,
  fetchDifficultyCounts
} from "../api/goodFirstIssuesApi";
import type {
  GoodFirstIssue,
  GoodFirstIssuesFilters,
  GoodFirstIssuesPagination,
  DifficultyLevel
} from "../types";

export function useGoodFirstIssues() {
  const navigate = useNavigate();

  // User's selected skill level
  const [userLevel, setUserLevel] = useState<DifficultyLevel>(() => {
    const saved = localStorage.getItem("oc_skill_level");
    return (saved as DifficultyLevel) || "beginner";
  });

  // Issues state
  const [issues, setIssues] = useState<GoodFirstIssue[]>([]);
  const [pagination, setPagination] = useState<GoodFirstIssuesPagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recommended issues state
  const [recommended, setRecommended] = useState<GoodFirstIssue[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);

  // Global difficulty counts (across all issues, not just current page)
  const [difficultyCounts, setDifficultyCounts] = useState({ beginner: 0, intermediate: 0, advanced: 0 });

  // View mode: "recommended" or "browse"
  const [viewMode, setViewMode] = useState<"recommended" | "browse">("recommended");

  // Filters for browse mode
  const [filters, setFilters] = useState<GoodFirstIssuesFilters>({
    page: 1,
    limit: 10,
    difficulty: undefined
  });

  // Save user level to localStorage
  useEffect(() => {
    localStorage.setItem("oc_skill_level", userLevel);
  }, [userLevel]);

  // Load recommended issues when user level changes
  const loadRecommended = useCallback(async () => {
    setRecommendedLoading(true);
    try {
      const data = await fetchRecommendedGoodFirstIssues(userLevel, 10);
      setRecommended(data);
    } catch (err) {
      console.error("Failed to load recommendations:", err);
      setRecommended([]);
    } finally {
      setRecommendedLoading(false);
    }
  }, [userLevel]);

  // Load issues with filters
  const loadIssues = useCallback(async (f: GoodFirstIssuesFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGoodFirstIssues(f);
      setIssues(data.issues);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error("Failed to load issues:", err);
      const msg = err?.response?.data?.message || "Failed to load issues.";
      setError(msg);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    const token = localStorage.getItem("oc_token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    loadRecommended();
    loadIssues();
    fetchDifficultyCounts().then(setDifficultyCounts).catch(() => {});
  }, [navigate, loadRecommended, loadIssues]);

  // Reload recommendations when user level changes
  useEffect(() => {
    loadRecommended();
  }, [userLevel, loadRecommended]);

  const updateFilters = useCallback((newFilters: Partial<GoodFirstIssuesFilters>) => {
    const merged = { ...filters, ...newFilters };
    setFilters(merged);
    loadIssues(merged);
  }, [filters, loadIssues]);

  const goToPage = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  const changeUserLevel = useCallback((level: DifficultyLevel) => {
    setUserLevel(level);
  }, []);

  const switchToRecommended = useCallback(() => {
    setViewMode("recommended");
  }, []);

  const switchToBrowse = useCallback(() => {
    setViewMode("browse");
  }, []);

  const filterByDifficulty = useCallback((difficulty?: DifficultyLevel) => {
    updateFilters({ difficulty, page: 1 });
  }, [updateFilters]);

  return {
    // User level
    userLevel,
    changeUserLevel,

    // View mode
    viewMode,
    switchToRecommended,
    switchToBrowse,

    // Recommended issues
    recommended,
    recommendedLoading,
    loadRecommended,

    // Browse issues
    issues,
    pagination,
    loading,
    error,
    filters,
    updateFilters,
    goToPage,
    loadIssues,
    filterByDifficulty,

    // Stats
    difficultyCounts
  };
}
