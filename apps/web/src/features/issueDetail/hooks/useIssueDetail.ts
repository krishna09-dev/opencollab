import { useEffect, useMemo, useState } from "react";
import { fetchIssue, claimIssue, abortIssue, notifyIssue } from "../api/issueDetailApi";
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

  const loadIssue = async () => {
    if (!id) return;
    setLoadingIssue(true);
    setError(null);
    try {
      const data = await fetchIssue(id);
      setIssue(data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to load issue.";
      setError(msg);
      setIssue(null);
    } finally {
      setLoadingIssue(false);
    }
  };

  const refreshStatusOnly = async () => {
    if (!id) return;
    setRefreshingStatus(true);
    try {
      const data = await fetchIssue(id);
      setIssue((prev) => {
        if (!prev) return data;
        return {
          ...prev,
          status: data.status,
          claimedAt: data.claimedAt,
          claimedByLogin: data.claimedByLogin,
          claimedByUserId: data.claimedByUserId,
          contributionTimeline: data.contributionTimeline,
          updates: data.updates,
          notifyWatchers: data.notifyWatchers,
          expectedOutcome: data.expectedOutcome,
          requiredSkills: data.requiredSkills,
          autoSetupCommands: data.autoSetupCommands,
          projectSetupCommands: data.projectSetupCommands
        };
      });
      showToast("Status refreshed.", "info");
    } catch {
      showToast("Failed to refresh status.", "error");
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
    loadIssue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isClaimedByMe =
    !!issue && !!currentUser && issue.status === "claimed" && issue.claimedByUserId === currentUser.id;

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

  const skills = (issue?.requiredSkills?.length ? issue.requiredSkills : ["Git", "Debugging", "Testing"]).slice(0, 6);
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
    skills,
    outcomes,
    projectSetup,
    loadIssue,
    handleClaim,
    handleAbort,
    handleNotify,
    refreshStatusOnly
  };
}
