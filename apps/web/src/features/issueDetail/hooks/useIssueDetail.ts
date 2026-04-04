import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchIssue, refreshIssue, claimIssue, abortIssue, notifyIssue } from "../api/issueDetailApi";
import { detectDifficulty, statusPill, difficultyPill } from "../utils";
import type { IssueDto, CurrentUser, SetupInstruction } from "../types";

type ShowToast = (message: string, severity: "success" | "error" | "info") => void;

export function useIssueDetail(
  id: string | undefined,
  currentUser: CurrentUser | null,
  showToast: ShowToast,
  loadNotifications: () => Promise<void>
) {
  const [issue, setIssue] = useState<IssueDto | null>(null);
  const [loadingIssue, setLoadingIssue] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [claiming, setClaiming] = useState(false);
  const [aborting, setAborting] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);

  const loadIssueInternal = useCallback(async (background: boolean) => {
    if (!id) return;
    if (!background) {
      setLoadingIssue(true);
      setError(null);
    }

    try {
      const data = await fetchIssue(id);
      setIssue(data);
      if (!background) {
        setError(null);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to load issue.";
      if (!background) {
        setError(msg);
        setIssue(null);
      }
    } finally {
      if (!background) {
        setLoadingIssue(false);
      }
    }
  }, [id]);

  const loadIssue = useCallback(async () => {
    await loadIssueInternal(false);
  }, [loadIssueInternal]);

  const loadIssueInBackground = useCallback(async () => {
    await loadIssueInternal(true);
  }, [loadIssueInternal]);

  const refreshStatusOnly = async () => {
    if (!id) return;
    setRefreshingStatus(true);
    try {
      const data = await refreshIssue(id);
      setIssue(data.issue);
      showToast(data.message || "Status refreshed.", "info");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to refresh status.";
      const nextAllowedInSec = err?.response?.data?.nextAllowedInSec;
      if (typeof nextAllowedInSec === "number" && nextAllowedInSec > 0) {
        showToast(`${msg} Try again in ${nextAllowedInSec}s.`, "info");
      } else {
        showToast(msg, "error");
      }
    } finally {
      setRefreshingStatus(false);
    }
  };

  const handleClaim = async () => {
    if (!id) return;
    setClaiming(true);
    try {
      const data = await claimIssue(id);
      setIssue(data.issue);
      showToast(data.message || "Issue claimed.", "success");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to claim.";
      showToast(msg, "error");
    } finally {
      setClaiming(false);
    }
  };

  const handleAbort = async () => {
    if (!id) return;
    setAborting(true);
    try {
      const data = await abortIssue(id);
      setIssue(data.issue);
      showToast(data.message || "Aborted.", "info");
      await loadNotifications();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to abort.";
      showToast(msg, "error");
    } finally {
      setAborting(false);
    }
  };

  const handleNotify = async () => {
    if (!id) return;
    try {
      const data = await notifyIssue(id);
      setIssue(data.issue);
      showToast(data.message || "You'll be notified when available.", "info");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to watch.";
      showToast(msg, "error");
    }
  };

  useEffect(() => {
    void loadIssue();
  }, [loadIssue]);

  useEffect(() => {
    if (!id) return;

    const pollId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void loadIssueInBackground();
    }, 60_000);

    return () => {
      window.clearInterval(pollId);
    };
  }, [id, loadIssueInBackground]);

  const isClaimedByMe =
    !!issue &&
    !!currentUser &&
    (issue.status === "claimed" || issue.status === "closed") &&
    issue.claimedByUserId === currentUser.id;

  const isClaimedByOther =
    !!issue &&
    issue.status === "claimed" &&
    !!issue.claimedByUserId &&
    (!currentUser || issue.claimedByUserId !== currentUser.id);

  const isWatching =
    !!issue && !!currentUser && Array.isArray(issue.notifyWatchers) && issue.notifyWatchers.includes(currentUser.id);

  const uiDifficulty = useMemo(() => (issue ? detectDifficulty(issue) : "intermediate"), [issue]);
  const statusP = issue ? statusPill(issue) : null;
  const diffP = difficultyPill(uiDifficulty);

  const outcomes = issue?.expectedOutcome?.length ? issue.expectedOutcome : ["Open a PR with clear verification steps."];

  const projectSetup: SetupInstruction[] = (issue?.projectSetupCommands || []).length
    ? issue!.projectSetupCommands!
    : issue?.maintainerSetupNotes
    ? [{ label: "Notes", command: issue.maintainerSetupNotes }]
    : [];

  return {
    issue,
    loadingIssue,
    error,
    claiming,
    aborting,
    refreshingStatus,
    isClaimedByMe,
    isClaimedByOther,
    isWatching,
    statusP,
    diffP,
    outcomes,
    projectSetup,
    loadIssue,
    handleClaim,
    handleAbort,
    handleNotify,
    refreshStatusOnly
  };
}
