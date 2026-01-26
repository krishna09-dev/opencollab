import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMe, fetchIssueStats, fetchIssues } from "../api/homeApi";
import type { IssueStatsResponse, IssueRow } from "../types";

export function useHomeFeed() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [stats, setStats] = useState<IssueStatsResponse | null>(null);

  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesError, setIssuesError] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadIssues = async () => {
    setIssuesLoading(true);
    setIssuesError(null);
    try {
      const data = await fetchIssues();
      setIssues(data);
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || "Failed to load issues list.";
      setIssuesError(msg);
      setIssues([]);
    } finally {
      setIssuesLoading(false);
    }
  };

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

  const headline = isNewUser
    ? `Welcome, ${username}!`
    : `Welcome back, ${username}!`;

  const tableRows = useMemo(() => {
    return issues.map((it, idx) => ({
      sno: idx + 1,
      ...it
    }));
  }, [issues]);

  return {
    loading,
    headline,
    stats,
    issues,
    issuesLoading,
    issuesError,
    tableRows,
    loadIssues
  };
}
