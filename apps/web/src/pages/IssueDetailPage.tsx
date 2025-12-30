import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, authHeaders } from "../lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  GlobalStyles,
  IconButton,
  InputBase,
  Paper,
  Snackbar,
  Stack,
  Typography
} from "@mui/material";

type IssueStatus = "open" | "claimed" | "closed";
type PrStatus = "NONE" | "PR_OPEN" | "MERGED" | "CLOSED";

type SuggestedResource = { title: string; url: string; type?: string | null };
type IssueUpdateItem = {
  id: string;
  actorLogin: string;
  actorRole?: string | null;
  body: string;
  createdAt: string | Date;
};
type TimelineItem = {
  id: string;
  title: string;
  status: string;
  at: string | Date;
  meta?: string | null;
};

interface RepoHealth {
  healthScore: number;
  activityScore: number;
  openIssues: number;
  recentCommits: number;
}

interface SetupInstruction {
  label: string;
  command: string;
}

interface IssueDto {
  _id: string;
  githubNumber: number;
  repoOwner: string;
  repoName: string;

  title: string;
  body: string;
  summary: string;
  labels: string[];

  status: IssueStatus;
  claimedByUserId?: string | null;
  claimedByLogin?: string | null;

  githubUrl: string;
  githubCreatedAt: string | Date;
  githubUpdatedAt: string | Date;

  openedAt: string | Date;
  claimedAt?: string | Date | null;

  requiredSkills: string[];
  expectedOutcome: string[];
  suggestedResources: SuggestedResource[];

  repoHealth: RepoHealth;
  beginnerFriendly: boolean;
  activeMaintainer: boolean;
  recentlyUpdated: boolean;

  autoSetupCommands: SetupInstruction[];
  projectSetupCommands?: SetupInstruction[];
  maintainerSetupNotes?: string | null;

  prStatus: PrStatus;
  lastPrMessage?: string | null;

  updates: IssueUpdateItem[];
  contributionTimeline: TimelineItem[];

  notifyWatchers: string[];
}

interface CurrentUser {
  id: string;
  login: string;
  email?: string;
  avatarUrl?: string;
}

interface NotificationDto {
  id: string;
  type: "ISSUE_AVAILABLE";
  issueId: string;
  issueTitle: string;
  createdAt: string;
  read: boolean;
}

function MSym({ name, sx }: { name: string; sx?: any }) {
  return (
    <Box
      component="span"
      className="material-symbols-outlined"
      sx={{
        fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24',
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...sx
      }}
    >
      {name}
    </Box>
  );
}

function timeAgo(input: string | Date | null | undefined) {
  if (!input) return "";
  const d = typeof input === "string" ? new Date(input) : input;
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days} days ago`;
}

function labelColorDot(label: string) {
  const x = label.toLowerCase();
  if (x.includes("bug")) return "#ef4444";
  if (x.includes("core")) return "#60a5fa";
  if (x.includes("ssr")) return "#a78bfa";
  if (x.includes("docs")) return "#34d399";
  return "#a3a3a3";
}

function detectDifficulty(issue: IssueDto): "beginner" | "intermediate" | "advanced" {
  const labels = (issue.labels || []).map((l) => l.toLowerCase());
  if (labels.some((l) => l.includes("good first issue") || l.includes("beginner") || l.includes("easy"))) return "beginner";
  if (labels.some((l) => l.includes("hard") || l.includes("advanced"))) return "advanced";
  return "intermediate";
}

function statusPill(issue: IssueDto) {
  if (issue.status === "open") {
    return { text: "Open", icon: "adjust", fg: "#19e66b", bg: "rgba(25,230,107,0.10)", bd: "rgba(25,230,107,0.20)" };
  }
  if (issue.status === "claimed") {
    return { text: "Accepted", icon: "adjust", fg: "#19e66b", bg: "rgba(25,230,107,0.10)", bd: "rgba(25,230,107,0.20)" };
  }
  return { text: "Closed", icon: "adjust", fg: "#fb923c", bg: "rgba(251,146,60,0.10)", bd: "rgba(251,146,60,0.20)" };
}

function difficultyPill(level: "beginner" | "intermediate" | "advanced") {
  if (level === "beginner") return { text: "Beginner", icon: "bolt", fg: "#19e66b", bg: "rgba(25,230,107,0.10)", bd: "rgba(25,230,107,0.20)" };
  if (level === "advanced") return { text: "Advanced", icon: "bolt", fg: "#fb7185", bg: "rgba(251,113,133,0.10)", bd: "rgba(251,113,133,0.20)" };
  return { text: "Intermediate", icon: "bolt", fg: "#fb923c", bg: "rgba(251,146,60,0.10)", bd: "rgba(251,146,60,0.20)" };
}

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [issue, setIssue] = useState<IssueDto | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [loadingIssue, setLoadingIssue] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);

  const [refreshingStatus, setRefreshingStatus] = useState(false); //refresh timeline block

  const [claiming, setClaiming] = useState(false);
  const [aborting, setAborting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
        open: false,
    message: "",
    severity: "success"
  });

  const showToast = (message: string, severity: "success" | "error" | "info" = "success") =>
    setToast({ open: true, message, severity });

  const closeToast = () => setToast((p) => ({ ...p, open: false }));

  const loadCurrentUser = async () => {
    setLoadingUser(true);
    try {
      const res = await api.get<CurrentUser>("/api/me", { headers: authHeaders() });
      setCurrentUser(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUser(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await api.get<NotificationDto[]>("/api/notifications", { headers: authHeaders() });
      setNotifications(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadIssue = async () => {
    if (!id) return;
    setLoadingIssue(true);
    setError(null);
    try {
      const res = await api.get<IssueDto>(`/api/issues/${id}`, { headers: authHeaders() });
      setIssue(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to load issue.";
      setError(msg);
      setIssue(null);
    } finally {
      setLoadingIssue(false);
    }
  };



  function GitHubMark({ size = 18 }: { size?: number }) {
    // GitHub icon (SVG) because Material Symbols does not include GitHub mark
    return (
      <Box
        component="span"
        sx={{
          width: size,
          height: size,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
          <path
            fill="currentColor"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
            0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52
            -.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2
            -3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82
            .64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08
            2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07
            -.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
          />
        </svg>
      </Box>
    );
  }

  // refresh ONLY timeline/status-related fields
  const refreshStatusOnly = async () => {
    if (!id) return;
    setRefreshingStatus(true);
    try {
      const res = await api.get<IssueDto>(`/api/issues/${id}`, { headers: authHeaders() });
      setIssue((prev) => {
        if (!prev) return res.data;
        return {
          ...prev,
          status: res.data.status,
          claimedAt: res.data.claimedAt,
          claimedByLogin: res.data.claimedByLogin,
          claimedByUserId: res.data.claimedByUserId,
          contributionTimeline: res.data.contributionTimeline,
          updates: res.data.updates,
          notifyWatchers: res.data.notifyWatchers,
          // optional refresh: expectedOutcome/skills/setup if you want
          expectedOutcome: res.data.expectedOutcome,
          requiredSkills: res.data.requiredSkills,
          autoSetupCommands: res.data.autoSetupCommands,
          projectSetupCommands: res.data.projectSetupCommands
        };
      });
      showToast("Status refreshed.", "info");
    } catch (e) {
      showToast("Failed to refresh status.", "error");
    } finally {
      setRefreshingStatus(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleClaim = async () => {
    if (!id) return;
    setClaiming(true);
    try {
      const res = await api.post<{ message: string; issue: IssueDto }>(
        `/api/issues/${id}/claim`,
        {},
        { headers: authHeaders() }
      );
      setIssue(res.data.issue);
      showToast(res.data.message || "Issue claimed.", "success");
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
      const res = await api.post<{ message: string; issue: IssueDto }>(
        `/api/issues/${id}/abort`,
        {},
        { headers: authHeaders() }
      );
      setIssue(res.data.issue);
      showToast(res.data.message || "Aborted.", "info");
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
      const res = await api.post<{ message: string; issue: IssueDto }>(
        `/api/issues/${id}/notify`,
        {},
        { headers: authHeaders() }
      );
      setIssue(res.data.issue);
      showToast(res.data.message || "You’ll be notified when available.", "info");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to watch.";
      showToast(msg, "error");
    }
  };

  const copyToClipboard = (value: string) => navigator.clipboard?.writeText(value).catch(console.error);

  const uiDifficulty = useMemo(() => (issue ? detectDifficulty(issue) : "intermediate"), [issue]);
  const statusP = issue ? statusPill(issue) : null;
  const diffP = difficultyPill(uiDifficulty);

  // ✅ always show even if empty
  const skills = (issue?.requiredSkills?.length ? issue.requiredSkills : ["Git", "Debugging", "Testing"]).slice(0, 6);
  const outcomes = issue?.expectedOutcome?.length ? issue.expectedOutcome : ["Open a PR with clear verification steps."];

  const projectSetup = (issue?.projectSetupCommands || []).length
    ? issue!.projectSetupCommands!
    : issue?.maintainerSetupNotes
    ? [{ label: "Notes", command: issue.maintainerSetupNotes }]
    : [];

  const pageLoading = loadingIssue || loadingUser;

  const iconRing = (color: string) => ({
  width: 40,
  height: 40,
  minWidth: 40,
  minHeight: 40,
  borderRadius: "50%",
  border: `3px solid ${color}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  boxSizing: "border-box"
});

const iconDot = (color: string) => ({
  width: 10,
  height: 10,
  borderRadius: "50%",
  bgcolor: color,
  boxShadow: `0 0 0 8px ${color}33`
});

  return (
    <Box sx={{ minHeight: "100vh",width:"100%", bgcolor: "#0b0b10", position: "relative", color: "#e5e7eb", fontFamily: '"poppins", sans-serif' }}>
    <GlobalStyles styles={{ body: { backgroundColor: "#0b0b10" } }} />

      {/* ✅ Background blobs (whole page) */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          // zIndex: 1,
          background: `
            radial-gradient(900px 700px at 95% 2%, rgba(34,197,94,0.26), rgba(34,197,94,0) 60%),
            radial-gradient(900px 700px at 15% 10%, rgba(255,255,255,0.06), rgba(255,255,255,0) 60%)
          `
        }}
      />

      {/* Header */}
      <Box
        component="header"
        sx={{
          position: "relative",
          top: 0,
          zIndex: 50,
          px: 3,
          py: 1.5,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          // bgcolor: "rgba(11,11,16,0.80)",
          backdropFilter: "blur(12px)"
        }}
      >

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={3}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{ cursor: "pointer" }}
              onClick={() => navigate("/feed")}
            >
              <Box
                sx={{
                      width: 34,
                      height: 34,
                      borderRadius: "10px",
                      border: "1px solid rgba(25,230,107,0.35)",
                      bgcolor: "rgba(17,17,26,0.35)",
                      backdropFilter: "blur(14px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.35)"
                }}
              >
                <MSym name="terminal" sx={{ fontSize: 20, color: "#19e66b" }} />
              </Box>
              <Typography sx={{ color: "#fff", fontSize: 18, fontWeight: 700, letterSpacing: -0.2 }}>
                OpenCollab
              </Typography>
            </Stack>

            {/* Search */}
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <Paper
                elevation={0}
                sx={{
                  width: 420,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.08)",
                  bgcolor: "#11111a",
                  px: 1.5,
                  py: 0.75,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2)"
                }}
              >
                <MSym name="search" sx={{ fontSize: 20, color: "#6b7280" }} />
                <InputBase placeholder="Search issues, repos, users..." sx={{ color: "#cbd5e1", flex: 1, fontSize: 14 }} />
                <Box
                  component="kbd"
                  sx={{
                    border: "1px solid #374151",
                    borderRadius: 1,
                    px: 1,
                    fontSize: 12,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    color: "#6b7280"
                  }}
                >
                  ⌘K
                </Box>
              </Paper>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton
              sx={{
                width: 36,
                height: 36,
                borderRadius: 999,
                color: "#9ca3af",
                "&:hover": { bgcolor: "rgba(255,255,255,0.10)", color: "#fff" }
              }}
            >
              <Badge
                variant={unreadCount > 0 ? "dot" : "standard"}
                color="success"
                overlap="circular"
                sx={{
                  "& .MuiBadge-badge": {
                    bgcolor: "#19e66b",
                    border: "2px solid #0b0b10",
                    right: 10,
                    top: 10
                  }
                }}
              >
                <MSym name="notifications" sx={{ fontSize: 22 }} />
              </Badge>
            </IconButton>

            <Button
              variant="text"
              sx={{
                borderRadius: 999,
                textTransform: "none",
                px: 1,
                py: 0.5,
                color: "#e5e7eb",
                "&:hover": { bgcolor: "rgba(255,255,255,0.10)" }
              }}
              startIcon={
                <Avatar
                  src={currentUser?.avatarUrl}
                  sx={{
                    width: 28,
                    height: 28,
                    background: "linear-gradient(135deg, #a855f7, #3b82f6)"
                  }}
                />
              }
            >
              <Typography sx={{ fontSize: 14, fontWeight: 600, display: { xs: "none", sm: "block" } }}>
                {currentUser?.login || "user"}
              </Typography>
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Container maxWidth={false} sx={{ maxWidth: 1440, py: 3, px: { xs: 2, md: 3, lg: 5 } }}>
        {pageLoading ? (
          <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Stack spacing={2} sx={{ minHeight: "50vh" }} alignItems="center" justifyContent="center">
            <Typography sx={{ color: "#fca5a5", fontWeight: 600 }}>{error}</Typography>
            <Button
              onClick={loadIssue}
              variant="outlined"
              sx={{ borderColor: "rgba(255,255,255,0.20)", color: "#fff", borderRadius: 999, textTransform: "none" }}
            >
              Retry
            </Button>
          </Stack>
        ) : !issue ? (
          <Typography>Issue not found.</Typography>
        ) : (
          <Stack direction={{ xs: "column", lg: "row" }} spacing={4} sx={{ alignItems: "flex-start" }}>
            {/* LEFT */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Breadcrumb + title */}
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "#6b7280", fontSize: 13, fontFamily: "monospace", mb: 1.5 }}>
                  <Box component="span">{issue.repoOwner}</Box>
                  <Box sx={{ color: "#374151" }}>/</Box>
                  <Box component="span">{issue.repoName}</Box>
                  <Box sx={{ color: "#374151" }}>/</Box>
                  <Box sx={{ color: "#9ca3af" }}>#{issue.githubNumber}</Box>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                  <Typography sx={{ color: "#fff", fontSize: { xs: 26, md: 34 }, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.15 }}>
                    {issue.title}
                  </Typography>

                  <IconButton
                    onClick={() => copyToClipboard(window.location.href)}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.08)",
                      bgcolor: "#11111a",
                      color: "#9ca3af",
                      "&:hover": { bgcolor: "#1a1a24", color: "#fff" }
                    }}
                  >
                    <MSym name="ios_share" sx={{ fontSize: 20 }} />
                  </IconButton>
                </Stack>
              </Box>

              {/* Pills row */}
              <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, borderRadius: 999, bgcolor: statusP!.bg, border: `1px solid ${statusP!.bd}`, color: statusP!.fg, fontSize: 11, fontWeight: 800, letterSpacing: 0.9, textTransform: "uppercase" }}>
                  <MSym name={statusP!.icon} sx={{ fontSize: 16, color: statusP!.fg }} />
                  {statusP!.text}
                </Box>

                {/* Difficulty (shows Intermediate too) */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, borderRadius: 999, bgcolor: diffP.bg, border: `1px solid ${diffP.bd}`, color: diffP.fg, fontSize: 11, fontWeight: 800, letterSpacing: 0.9, textTransform: "uppercase" }}>
                  <MSym name={diffP.icon} sx={{ fontSize: 16, color: diffP.fg }} />
                  {diffP.text}
                </Box>

                {(issue.labels || []).slice(0, 3).map((l) => (
                  <Box key={l} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, borderRadius: 999, bgcolor: "#11111a", border: "1px solid rgba(255,255,255,0.05)", color: "#d1d5db", fontSize: 13 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: 999, bgcolor: labelColorDot(l) }} />
                    {l}
                  </Box>
                ))}
              </Stack>

              {/* Main card */}
              <Paper elevation={0} sx={{ borderRadius: "24px", bgcolor: "#101110", border: "1px solid rgba(255,255,255,0.08)", p: { xs: 2.5, md: 3.5 } }}>
                {/* Markdown body */}
                <Box sx={{ color: "#d1d5db", fontSize: 16, lineHeight: 1.75 }}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <Typography sx={{ fontSize: 22, fontWeight: 900, color: "#fff", mt: 1.5, mb: 1 }}>{children}</Typography>,
                      h2: ({ children }) => <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#fff", mt: 1.5, mb: 1 }}>{children}</Typography>,
                      p: ({ children }) => <Typography sx={{ mb: 1.25, color: "#d1d5db" }}>{children}</Typography>,
                      li: ({ children }) => <Box component="li" sx={{ mb: 0.75 }}>{children}</Box>,
                      ul: ({ children }) => <Box component="ul" sx={{ pl: 2.5, mb: 1.25 }}>{children}</Box>,
                      code: ({ children }) => (
                        <Box component="code" sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", bgcolor: "rgba(255,255,255,0.06)", px: 0.75, py: 0.25, borderRadius: 1, color: "#e5e7eb" }}>
                          {children}
                        </Box>
                      ),
                      pre: ({ children }) => (
                        <Box sx={{ my: 2, p: 2, borderRadius: 2, bgcolor: "#0d0d12", border: "1px solid rgba(255,255,255,0.08)", overflowX: "auto" }}>
                          <Box sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 13, color: "#9ca3af", whiteSpace: "pre" }}>
                            {children}
                          </Box>
                        </Box>
                      ),
                      a: ({ href, children }) => (
                        <Box component="a" href={href} target="_blank" rel="noreferrer" style={{ color: "#60a5fa", textDecoration: "none" }}>
                          {children}
                        </Box>
                      )
                    }}
                  >
                    {issue.body?.trim() ? issue.body : issue.summary}
                  </ReactMarkdown>
                </Box>

                {/* Expected Outcome */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2, mb: 1 }}>
                  <MSym name="check_circle" sx={{ fontSize: 22, color: "#19e66b" }} />
                  <Typography sx={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>Expected Outcome</Typography>
                </Stack>

                <Box component="ul" sx={{ pl: 2.5, mt: 1, mb: 3, color: "#d1d5db" }}>
                  {outcomes.map((x, idx) => (
                    <Box component="li" key={idx} sx={{ mb: 1, lineHeight: 1.7 }}>{x}</Box>
                  ))}
                </Box>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 2.5 }} />

                {/* Required Skills */}
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#6b7280", letterSpacing: 1.6, textTransform: "uppercase", mb: 1 }}>
                  Required Skills
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {skills.map((s) => (
                    <Box key={s} sx={{ px: 1.25, py: 0.6, borderRadius: 1.5, bgcolor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)", color: "#d1d5db", fontSize: 11 }}>
                      {s}
                    </Box>
                  ))}
                </Stack>
              </Paper>

              {/* SETUP INSTRUCTIONS */}
              <Box sx={{ mt: 5 }}>
                <Typography sx={{ color: "#fff", fontWeight: 900,fontSize:32,  letterSpacing: 0.5, mb: 1.5 }}>
                  SETUP INSTRUCTIONS
                </Typography>

                {/* Git Flow */}
                <Accordion disableGutters elevation={0} sx={{ bgcolor: "transparent", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", "&:before": { display: "none" } }}>
                  <AccordionSummary expandIcon={<MSym name="expand_more" sx={{ color: "#9ca3af" }} />} sx={{ px: 0, minHeight: 56 }}>
                    <Typography sx={{ color: "#fff", fontWeight: 900 }}>GIT FLOW</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0, pb: 2 }}>
                    <Stack spacing={2}>
                      {(issue.autoSetupCommands || []).map((c) => (
                        <Box key={c.label + c.command}>
                          <Typography sx={{ color: "#e5e7eb", fontSize: 12, mb: 0.75 }}>{c.label}</Typography>
                          <Paper elevation={0} sx={{ bgcolor: "#0d0d12", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, px: 2, py: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                            <Typography sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {c.command}
                            </Typography>
                            <IconButton onClick={() => copyToClipboard(c.command)} sx={{ width: 32, height: 32, borderRadius: 2, border: "1px solid rgba(255,255,255,0.08)", bgcolor: "#11111a", color: "#9ca3af", "&:hover": { bgcolor: "#1a1a24", color: "#fff" } }}>
                              <MSym name="content_copy" sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Paper>
                        </Box>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                {/* Project-specific setup */}
                <Accordion disableGutters elevation={0} sx={{ bgcolor: "transparent", borderBottom: "1px solid rgba(255,255,255,0.08)", "&:before": { display: "none" } }}>
                  <AccordionSummary expandIcon={<MSym name="expand_more" sx={{ color: "#9ca3af" }} />} sx={{ px: 0, minHeight: 56 }}>
                    <Typography sx={{ color: "#fff", fontWeight: 900 }}>PROJECT-SPECIFIC SETUP</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0, pb: 2 }}>
                    {projectSetup.length === 0 ? (
                      <Typography sx={{ color: "#9ca3af", fontSize: 13 }}>No project-specific setup provided.</Typography>
                    ) : (
                      <Stack spacing={2}>
                        {projectSetup.map((c) => (
                          <Box key={c.label + c.command}>
                            <Typography sx={{ color: "#e5e7eb", fontSize: 12, mb: 0.75 }}>{c.label}</Typography>
                            <Paper elevation={0} sx={{ bgcolor: "#0d0d12", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, px: 2, py: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                              <Typography sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {c.command}
                              </Typography>
                              <IconButton onClick={() => copyToClipboard(c.command)} sx={{ width: 32, height: 32, borderRadius: 2, border: "1px solid rgba(255,255,255,0.08)", bgcolor: "#11111a", color: "#9ca3af", "&:hover": { bgcolor: "#1a1a24", color: "#fff" } }}>
                                <MSym name="content_copy" sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Paper>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Box>


              {/* UPDATES / DISCUSSION */}
              <Box sx={{ mt: 5 }}>
                <Accordion
                  disableGutters
                  elevation={0}
                  defaultExpanded
                  sx={{
                    bgcolor: "transparent",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    "&:before": { display: "none" }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<MSym name="expand_more" sx={{ color: "#9ca3af" }} />}
                    sx={{ px: 0, minHeight: 56 }}
                  >
                    <Typography sx={{ color: "#fff", fontWeight: 900 }}>UPDATES</Typography>
                  </AccordionSummary>

                  <AccordionDetails sx={{ px: 0, pb: 2 }}>
                    {(issue.updates || []).length === 0 ? (
                      <Typography sx={{ color: "#9ca3af", fontSize: 13 }}>No updates yet.</Typography>
                    ) : (
                      <Stack spacing={3}>
                        {(issue.updates || [])
                          .slice()
                          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                          .map((u, idx, arr) => {
                            // ---- classify item type (so OpenCollab claim/abort never becomes a bubble) ----
                            const isOpened = u.id.startsWith("gh_opened");
                            const isOpenCollab = u.actorRole === "OPENCOLLAB";
                            const body = (u.body || "").toLowerCase();

                            const isClaimed = isOpenCollab && (u.id.startsWith("claim") || body.includes("claimed this issue"));
                            const isAborted = isOpenCollab && (u.id.startsWith("abort") || body.includes("aborted this issue"));

                            const isSystemEvent = isOpened || isClaimed || isAborted;

                            // GitHub comments (gh_123...) become bubbles
                            const isGithubComment = u.id.startsWith("gh_") && !isOpened;

                            const isMaintainer = u.actorRole === "OWNER" || u.actorRole === "MEMBER";

                            // ---- icon styles ----
                            const ring = (color: string) => ({
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              border: `2px solid ${color}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              boxSizing: "border-box"
                            });

                            const dot = (color: string) => ({
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: color,
                              boxShadow: `0 0 0 8px ${color}22`
                            });

                            const iconNode = isOpened ? (
                              <Box sx={ring("#22c55e")}>
                                <Box sx={dot("#22c55e")} />
                              </Box>
                            ) : isClaimed ? (
                              <Box sx={ring("#22c55e")}>
                                <MSym name="back_hand" sx={{ fontSize: 12, color: "#22c55e" }} />
                              </Box>
                            ) : isAborted ? (
                              <Box sx={ring("#ef4444")}>
                                <Box sx={dot("#ef4444")} />
                              </Box>
                            ) : (
                              <Avatar
                                sx={{
                                  width: 24,
                                  height: 24,
                                  bgcolor: "rgba(255,255,255,0.08)",
                                  fontWeight: 900,
                                  color: "#e5e7eb"
                                }}
                              >
                                {u.actorLogin?.[0]?.toUpperCase() || "?"}
                              </Avatar>
                            );

                            const actionText = isOpened
                              ? "opened this issue"
                              : isClaimed
                              ? "claimed this issue"
                              : isAborted
                              ? "aborted this issue"
                              : "";

                            return (
                              <Stack key={u.id} direction="row" spacing={2} alignItems="center">
                                {/* Timeline column */}
                                <Box
                                  sx={{
                                    position: "relative",
                                    width: 64,
                                    minWidth: 64,
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "flex-start"
                                  }}
                                >
                                  {iconNode}

                                  {/* vertical connector line */}
                                  {idx < arr.length - 1 && (
                                    <Box
                                      sx={{
                                        position: "absolute",
                                        top: 46,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        width: 2,
                                        height: 44,
                                        bgcolor: "rgba(255,255,255,0.14)"
                                      }}
                                    />
                                  )}
                                </Box>

                                {/* Content */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  {/* ===== SYSTEM EVENTS: single line, no bubble ===== */}
                                  {isSystemEvent ? (
                                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                      <Typography sx={{ fontSize: 16, fontWeight: 500, color: "#fff", lineHeight: 1 }}>
                                        {u.actorLogin}
                                      </Typography>

                                      <Typography sx={{ fontSize: 16, fontWeight: 500, color: "#9ca3af", lineHeight: 1 }}>
                                        {actionText}
                                      </Typography>

                                      <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6b7280", lineHeight: 1 }}>
                                        • {timeAgo(u.createdAt)}
                                      </Typography>
                                    </Stack>
                                  ) : (
                                    <>
                                      {/* ===== COMMENT HEADER ===== */}
                                      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                        <Typography sx={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                                          {u.actorLogin}
                                        </Typography>

                                        {isMaintainer && (
                                          <Chip
                                            label="MAINTAINER"
                                            size="small"
                                            sx={{
                                              height: 20,
                                              fontSize: 10,
                                              fontWeight: 900,
                                              borderRadius: 999,
                                              bgcolor: "rgba(59,130,246,0.16)",
                                              color: "#60a5fa"
                                            }}
                                          />
                                        )}

                                        <Typography sx={{ fontSize: 18, fontWeight: 500, color: "#6b7280", lineHeight: 1 }}>
                                          {timeAgo(u.createdAt)}
                                        </Typography>
                                      </Stack>

                                      {/* ===== COMMENT BUBBLE (ONLY for real comments) ===== */}
                                      <Box
                                        sx={{
                                          mt: 1.25,
                                          px: 2.5,
                                          py: 1.75,
                                          borderRadius: "18px",
                                          bgcolor: isGithubComment ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.04)",
                                          border: isGithubComment
                                            ? "1px solid rgba(59,130,246,0.22)"
                                            : "1px solid rgba(255,255,255,0.10)"
                                        }}
                                      >
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                          {u.body}
                                        </ReactMarkdown>
                                      </Box>
                                    </>
                                  )}
                                </Box>
                              </Stack>
                            );
                          })}
                      </Stack>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Box>


              {/* CONTRIBUTION TIMELINE (refresh only this block) */}
              <Box sx={{ mt: 4 }}>
                <Accordion disableGutters elevation={0} defaultExpanded sx={{ bgcolor: "transparent", borderTop: "1px solid rgba(255,255,255,0.08)", "&:before": { display: "none" } }}>
                  <AccordionSummary expandIcon={<MSym name="expand_more" sx={{ color: "#9ca3af" }} />} sx={{ px: 0, minHeight: 56 }}>
                    <Typography sx={{ color: "#fff", fontWeight: 900 }}>CONTRIBUTION TIMELINE</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0, pb: 3 }}>
                    <Stack spacing={2}>
                      {(issue.contributionTimeline || []).length === 0 ? (
                        <Typography sx={{ color: "#9ca3af", fontSize: 13 }}>No timeline yet.</Typography>
                      ) : (
                        (issue.contributionTimeline || []).map((t) => (
                          <Stack key={t.id} direction="row" spacing={2} alignItems="center">
                            <Box sx={{ width: 18, height: 18, borderRadius: 999, bgcolor: "rgba(25,230,107,0.10)", border: "1px solid rgba(25,230,107,0.25)" }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ color: "#e5e7eb", fontWeight: 700, fontSize: 13 }}>{t.title}</Typography>
                              <Typography sx={{ color: "#6b7280", fontSize: 12 }}>{timeAgo(t.at)}</Typography>
                            </Box>
                            <Chip label={t.status} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 800, borderRadius: 999, bgcolor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#d1d5db" }} />
                          </Stack>
                        ))
                      )}
 
                      <Button
                        variant="contained"
                        disabled={refreshingStatus}
                        sx={{ mt: 2, alignSelf: "flex-end", bgcolor: "#19e66b", color: "#000", borderRadius: "12px", px: 2.5, textTransform: "none", fontWeight: 900, "&:hover": { bgcolor: "#22c55e" } }}
                        onClick={refreshStatusOnly}
                        startIcon={refreshingStatus ? <CircularProgress size={14} /> : undefined}
                      >
                        Refresh Status
                      </Button>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </Box>
            </Box>

            {/* RIGHT */}
            <Box sx={{ width: { xs: "100%", lg: 360 }, flexShrink: 0 }}>
              {/* Status card */}
              <Paper
                elevation={0}
                sx={{
                  bgcolor: "transparent",
                  paddingTop: 2.5,
                  position: "relative",
                  overflow: "hidden",
                  mb: 2.5
                }}
              >
                <Box sx={{ position: "absolute", inset: 0, opacity: 0.5 }} />
                <Box sx={{ position: "relative", zIndex: 1 }}>
                  <Button
                    fullWidth
                    onClick={isClaimedByMe ? handleAbort : handleClaim}
                    disabled={
                      claiming ||
                      aborting ||
                      (isClaimedByOther && !isClaimedByMe) ||
                      issue.status === "closed"
                    }
                    sx={{
                      mb: 2,
                      height: 40,
                      borderRadius: 999,
                      textTransform: "none",
                      fontWeight: 900,
                      bgcolor: isClaimedByMe ? "#fb7185" : "#19e66b",
                      color: "#000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      "&:hover": {
                        bgcolor: isClaimedByMe ? "#f43f5e" : "#22c55e"
                      },
                      "&.Mui-disabled": {
                        bgcolor: "rgba(255,255,255,0.08)",
                        color: "#6b7280"
                      }
                    }}
                  >
                    {/* Icon */}
                    {issue.status !== "closed" && (
                      <MSym
                        name={isClaimedByMe ? "close" : "attribution"}
                        sx={{ fontSize: 24, lineHeight: 1 }}
                      />
                    )}

                    {/* Label */}
                    {issue.status === "closed"
                      ? "Issue Closed"
                      : isClaimedByMe
                      ? aborting
                        ? "Aborting..."
                        : "Abort Issue"
                      : isClaimedByOther
                      ? "Already Claimed"
                      : claiming
                      ? "Claiming..."
                      : "Claim Issue"}
                  </Button>

                  <Stack spacing={1} sx={{ color: "#cbd5e1", fontSize: 13 }}>
                    {/* Always show opened */}
                    <Stack direction="row" justifyContent="space-between">
                      <Typography sx={{ color: "#9ca3af", fontWeight: 300, fontSize: 14 }}>
                        Issue Opened on :
                      </Typography>
                      <Typography sx={{ color: "#e5e7eb", fontWeight: 500, fontSize: 14 }}>
                        {timeAgo(issue.openedAt)}
                      </Typography>
                    </Stack>

                    {/* Show claimed rows ONLY if issue is claimed (or has claimedAt) */}
                    {(issue.status === "claimed" || !!issue.claimedAt || !!issue.claimedByLogin) && (
                      <>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography sx={{ color: "#9ca3af", fontWeight: 300, fontSize: 14 }}>
                            Issue Claimed on :
                          </Typography>
                          <Typography sx={{ color: "#e5e7eb", fontWeight: 500, fontSize: 14 }}>
                            {issue.claimedAt ? timeAgo(issue.claimedAt) : "-"}
                          </Typography>
                        </Stack>

                        <Stack direction="row" justifyContent="space-between">
                          <Typography sx={{ color: "#9ca3af", fontWeight: 300, fontSize: 14 }}>
                            Issue Claimed By :
                          </Typography>
                          <Typography sx={{ color: "#e5e7eb", fontWeight: 500, fontSize: 14 }}>
                            {issue.claimedByLogin || "-"}
                          </Typography>
                        </Stack>
                      </>
                    )}
                  </Stack>

                  {isClaimedByOther && (
                    <Button
                      fullWidth
                      onClick={handleNotify}
                      disabled={isWatching}
                      sx={{
                        mt: 2,
                        height: 40,
                        borderRadius: 999,
                        textTransform: "none",
                        fontWeight: 900,
                        bgcolor: "rgba(25,230,107,0.10)",
                        border: "1px solid rgba(25,230,107,0.20)",
                        color: "#19e66b",
                        "&:hover": { bgcolor: "rgba(25,230,107,0.14)" },
                        "&.Mui-disabled": {
                          color: "#6b7280",
                          borderColor: "rgba(255,255,255,0.08)"
                        }
                      }}
                    >
                      {isWatching ? "You will be notified" : "Notify when available"}
                    </Button>
                  )}
                </Box>
              </Paper>

              {/* Suggested resources */}
              <Paper elevation={0} sx={{ borderRadius: "24px", bgcolor: "#101110", border: "1px solid rgba(255,255,255,0.08)", p: 2.5, mb: 2.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <MSym name="library_books" sx={{ fontSize: 18, color: "#9ca3af" }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 900, color: "#9ca3af", letterSpacing: 1.2, textTransform: "uppercase" }}>
                    Suggested Resources
                  </Typography>
                </Stack>

                <Stack spacing={1.25}>
                  {(issue.suggestedResources || []).slice(0, 3).map((r) => (
                    <Box
                      key={r.url}
                      component="a"
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      sx={{
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        p: 1.25,
                        borderRadius: "16px",
                        color: "#d1d5db",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }
                      }}
                    >
                      <Box sx={{ width: 32, height: 32, borderRadius: "10px", bgcolor: "#0b0b10", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa" }}>
                        <MSym name="article" sx={{ fontSize: 18 }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#d1d5db", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {r.title}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {r.url.replace("https://", "").replace("http://", "")}
                        </Typography>
                      </Box>
                      <MSym name="arrow_outward" sx={{ fontSize: 16, color: "#4b5563" }} />
                    </Box>
                  ))}
                  {/* Find more */}
                  <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      onClick={() => navigate("/resources")}
                      endIcon={<MSym name="arrow_outward" sx={{ fontSize: 16 }} />}
                      sx={{
                        textTransform: "none",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#9ca3af",
                        px: 0,
                        paddingRight:2,
                        minWidth: "auto",
                        "& .MuiButton-endIcon": {
                          ml: 0.5
                        },
                        "&:hover": {
                          bgcolor: "transparent",
                          color: "#e5e7eb",
                        }
                      }}
                    >
                      Find more
                    </Button>
                  </Box>
                </Stack>
              </Paper>

              {/* Actions */}
              <Stack spacing={1.25} sx={{ mb: 2.5 }}>
                {/* Open in GitHub */}
                <Button
                  fullWidth
                  component="a"
                  href={issue.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  startIcon={<GitHubMark />}
                  sx={{
                    height: 50,
                    borderRadius: "14px",
                    justifyContent: "flex-start",
                    px: 2,
                    gap: 1.25,
                    bgcolor: "#101110",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#d1d5db",
                    fontWeight: 900,
                    textTransform: "none",
                    "& .MuiButton-startIcon": { ml: 0 },
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.08)",
                      color: "#fff"
                    }
                  }}
                >
                  Open in GitHub
                </Button>

                {/* Share link */}
                <Button
                  fullWidth
                  onClick={() => copyToClipboard(window.location.href)}
                  startIcon={<MSym name="share" sx={{ fontSize: 18 }} />}
                  sx={{
                    height: 50,
                    borderRadius: "14px",
                    justifyContent: "flex-start",
                    px: 2,
                    gap: 1.25,
                    bgcolor: "#101110",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#d1d5db",
                    fontWeight: 900,
                    textTransform: "none",
                    "& .MuiButton-startIcon": { ml: 0 },
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.08)",
                      color: "#fff"
                    }
                  }}
                >
                  Share link
                </Button>

                {/* Report */}
                <Button
                  fullWidth
                  startIcon={<MSym name="report_problem" sx={{ fontSize: 18 }} />}
                  sx={{
                    height: 50,
                    borderRadius: "14px",
                    justifyContent: "flex-start",
                    px: 2,
                    gap: 1.25,
                    bgcolor: "rgba(239,68,68,0.10)",
                    border: "1px solid rgba(239,68,68,0.35)",
                    color: "#f87171",
                    fontWeight: 900,
                    textTransform: "none",
                    "& .MuiButton-startIcon": { ml: 0 },
                    "&:hover": {
                      bgcolor: "rgba(239,68,68,0.14)"
                    }
                  }}
                >
                  Report
                </Button>
              </Stack>
            </Box>
          </Stack>
        )}
      </Container>

      <Snackbar open={toast.open} autoHideDuration={3500} onClose={closeToast} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={closeToast} severity={toast.severity} sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}