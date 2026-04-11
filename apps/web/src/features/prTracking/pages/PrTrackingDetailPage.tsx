import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from "@mui/material";

import MSym from "../../resources/components/MSym";
import { fetchPrDetail, refreshSinglePr } from "../api/prTrackingApi";
import AppLayout from "../../../components/layout/AppLayout";
import type { PrDetailResponse, PrTimelineEntry } from "../types";

const breakLongTextSx = {
  overflowWrap: "anywhere",
  wordBreak: "break-word"
} as const;

function statusChipSx(status: PrDetailResponse["status"]) {
  if (status === "CHANGES_REQUESTED") {
    return { color: "#f59e0b", bg: "rgba(245,158,11,0.2)", bd: "rgba(245,158,11,0.3)", text: "OPEN" };
  }
  if (status === "IN_REVIEW") {
    return { color: "#60a5fa", bg: "rgba(59,130,246,0.2)", bd: "rgba(59,130,246,0.3)", text: "IN REVIEW" };
  }
  if (status === "MERGED") {
    return { color: "#c084fc", bg: "rgba(192,132,252,0.2)", bd: "rgba(192,132,252,0.3)", text: "MERGED" };
  }
  return { color: "#19e66b", bg: "rgba(25,230,107,0.2)", bd: "rgba(25,230,107,0.3)", text: "OPEN" };
}

function ReviewerStatus({ status }: { status: "approved" | "changes_requested" | "pending" }) {
  if (status === "approved") {
    return <MSym name="check_circle" sx={{ fontSize: 16, color: "#19e66b" }} />;
  }
  if (status === "changes_requested") {
    return <MSym name="error" sx={{ fontSize: 16, color: "#f59e0b" }} />;
  }
  return <MSym name="radio_button_unchecked" sx={{ fontSize: 16, color: "#334155" }} />;
}

function CheckIcon({ status }: { status: "success" | "running" | "failed" }) {
  if (status === "success") return <MSym name="check" sx={{ fontSize: 14, color: "#19e66b" }} />;
  if (status === "failed") return <MSym name="close" sx={{ fontSize: 14, color: "#ef4444" }} />;
  return <MSym name="autorenew" sx={{ fontSize: 14, color: "#f59e0b" }} />;
}

function TimelineItem({ item }: { item: PrTimelineEntry }) {
  if (item.type === "opened") {
    return (
      <Stack spacing={1}>
        <Typography sx={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>
          {item.actor} <Box component="span" sx={{ color: "#94a3b8", fontWeight: 400 }}>{item.text} {item.atLabel}</Box>
        </Typography>
      </Stack>
    );
  }

  if (item.type === "commits") {
    return (
      <Stack spacing={1}>
        {item.commits.map((commit) => (
          <Stack
            key={commit.sha}
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={0.75}
            sx={{ minWidth: 0 }}
          >
            <Stack direction="row" spacing={1.25} sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ color: "#64748b", fontSize: 14, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                {commit.sha}
              </Typography>
              <Typography sx={{ color: "#cbd5e1", fontSize: 14, ...breakLongTextSx }}>{commit.message}</Typography>
            </Stack>
            <Typography sx={{ color: "#64748b", fontSize: 12 }}>{commit.atLabel}</Typography>
          </Stack>
        ))}
      </Stack>
    );
  }

  if (item.type === "reviewRequested") {
    return (
      <Typography sx={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>
        {item.actor} <Box component="span" sx={{ color: "#94a3b8", fontWeight: 400 }}>requested a review from </Box>
        <Box component="span" sx={{ color: "#fff" }}>{item.reviewers.join(" and ")}</Box>
      </Typography>
    );
  }

  if (item.type === "changesRequested") {
    return (
      <Paper elevation={0} sx={{ bgcolor: "#0b0f17", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "24px", overflow: "hidden", boxShadow: "0 0 0 1px rgba(245,158,11,0.1)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2, borderBottom: "1px solid #1e293b", bgcolor: "rgba(245,158,11,0.05)" }}>
          <Typography sx={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>
            {item.actor} <Box component="span" sx={{ color: "#f1f5f9", fontWeight: 500 }}>requested changes {item.atLabel}</Box>
          </Typography>
          <Box sx={{ borderRadius: 999, px: 1, py: 0.3, bgcolor: "rgba(245,158,11,0.2)", color: "#f59e0b", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
            Changes Requested
          </Box>
        </Stack>

        <Box sx={{ px: 3, py: 3 }}>
          <Typography sx={{ color: "#cbd5e1", fontSize: 16, lineHeight: "24px", ...breakLongTextSx }}>{item.summary}</Typography>
          <Box sx={{ mt: 2, borderRadius: "16px", border: "1px solid #1e293b", bgcolor: "rgba(2,6,23,0.5)", px: 2, py: 2 }}>
            <Typography sx={{ color: "#64748b", fontSize: 14, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", ...breakLongTextSx }}>- {item.diffOld}</Typography>
            <Typography sx={{ color: "#19e66b", fontSize: 14, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", ...breakLongTextSx }}>+ {item.diffNew}</Typography>
          </Box>
        </Box>
      </Paper>
    );
  }

  if (item.type === "maintainerFeedback") {
    return (
      <Paper elevation={0} sx={{ bgcolor: "rgba(25,230,107,0.05)", border: "1px solid rgba(25,230,107,0.2)", borderRadius: "24px", px: 3, py: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <MSym name="subdirectory_arrow_left" sx={{ fontSize: 14, color: "#19e66b" }} />
          <Typography sx={{ color: "#19e66b", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7 }}>{item.title}</Typography>
        </Stack>
        <Typography sx={{ color: "#cbd5e1", fontSize: 14, lineHeight: "22.75px", mt: 1, ...breakLongTextSx }}>{item.body}</Typography>
      </Paper>
    );
  }

  if (item.type === "comment") {
    return (
      <Paper elevation={0} sx={{ bgcolor: "#0b0f17", border: "1px solid #1e293b", borderRadius: "24px", overflow: "hidden", minWidth: 0, maxWidth: "100%" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2, borderBottom: "1px solid #1e293b", bgcolor: "rgba(15,23,42,0.5)" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 24, height: 24, bgcolor: "#64748b" }}>{item.actor[0]?.toUpperCase()}</Avatar>
            <Typography sx={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>
              {item.actor} <Box component="span" sx={{ color: "#94a3b8", fontWeight: 400 }}>commented {item.atLabel}</Box>
            </Typography>
          </Stack>
          {item.isReview && (
            <Box sx={{ borderRadius: 999, px: 1, py: 0.3, bgcolor: "rgba(96,165,250,0.2)", color: "#60a5fa", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
              Code Review
            </Box>
          )}
        </Stack>
        <Box sx={{ px: 3, py: 3, minWidth: 0, maxWidth: "100%" }}>
          <Typography sx={{ color: "#cbd5e1", fontSize: 14, lineHeight: "22px", whiteSpace: "pre-wrap", ...breakLongTextSx }}>
            {item.body}
          </Typography>
        </Box>
      </Paper>
    );
  }

  return <Typography sx={{ color: "#64748b", fontSize: 14, ...breakLongTextSx }}>{item.body}</Typography>;
}

export default function PrTrackingDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<PrDetailResponse | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!id) return;

    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchPrDetail(id);
        if (!alive) return;
        setDetail(res);
        setLastSyncedAt(new Date());
      } catch (e: any) {
        if (!alive) return;
        setError(e?.response?.data?.message || "Failed to load PR detail.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const handleSync = async () => {
    if (!id || syncing) return;
    setSyncing(true);
    setSyncError(null);
    try {
      // Write-through refresh: pull the latest PR state from GitHub into Mongo
      // so the list page stays in sync too, then re-fetch the detail payload
      // (which itself enriches timeline/comments/checks live from GitHub).
      await refreshSinglePr(id);
      const res = await fetchPrDetail(id);
      setDetail(res);
      setLastSyncedAt(new Date());
    } catch (e: any) {
      setSyncError(e?.response?.data?.message || "Failed to sync from GitHub.");
    } finally {
      setSyncing(false);
    }
  };

  const handleViewAllChanges = () => {
    if (!detail) return;
    const owner = detail.owner?.trim();
    const repo = detail.repo?.trim();
    if (!owner || !repo) return;

    const url =
      typeof detail.number === "number" && Number.isFinite(detail.number)
        ? `https://github.com/${owner}/${repo}/pull/${detail.number}/files`
        : `https://github.com/${owner}/${repo}/pulls`;

    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      window.location.assign(url);
    }
  };

  const handleViewIssue = () => {
    const linkedIssue = detail?.sidebar.linkedIssue;
    if (!linkedIssue) return;

    if (linkedIssue.id) {
      navigate(`/issues/${linkedIssue.id}`);
      return;
    }

    if (linkedIssue.githubUrl) {
      const opened = window.open(linkedIssue.githubUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        window.location.assign(linkedIssue.githubUrl);
      }
    }
  };

  const formatIssueDate = (value?: string | Date | null) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const statusChip = useMemo(() => (detail ? statusChipSx(detail.status) : statusChipSx("OPEN")), [detail]);

  return (
    <AppLayout activePage="pr-detail">
      <Box sx={{ maxWidth: 1440, mx: "auto", px: 3, py: 4 }}>
        {loading && (
          <Stack alignItems="center" sx={{ py: 12 }}>
            <CircularProgress size={28} sx={{ color: "#19e66b" }} />
            <Typography sx={{ mt: 1.5, color: "#94a3b8" }}>Loading pull request details...</Typography>
          </Stack>
        )}

        {error && !loading && (
          <Paper elevation={0} sx={{ bgcolor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "14px", px: 2, py: 1.5 }}>
            <Typography sx={{ color: "#fecaca", fontSize: 14, fontWeight: 500 }}>{error}</Typography>
          </Paper>
        )}

        {!loading && !error && detail && (
          <>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
              sx={{ mb: 3 }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                <Button
                  onClick={() => navigate("/pr-tracking")}
                  sx={{ minWidth: 32, width: 32, height: 32, borderRadius: "8px", p: 0, bgcolor: "#19e66b", color: "#050509" }}
                >
                  <MSym name="chevron_left" sx={{ fontSize: 18 }} />
                </Button>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: "#fff", fontSize: 14, ...breakLongTextSx }}>
                    {detail.owner && detail.repo ? `${detail.owner}/${detail.repo}` : detail.repo || detail.owner || "--"}
                  </Typography>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={1.25} alignItems="center">
                {lastSyncedAt && !syncing && (
                  <Typography sx={{ color: "#64748b", fontSize: 11 }}>
                    Last synced {lastSyncedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Typography>
                )}
                <Button
                  onClick={handleSync}
                  disabled={syncing}
                  startIcon={
                    syncing
                      ? <CircularProgress size={14} sx={{ color: "#60a5fa" }} />
                      : <MSym name="refresh" sx={{ fontSize: 16 }} />
                  }
                  sx={{
                    height: 34,
                    borderRadius: "10px",
                    px: 1.75,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: 12,
                    bgcolor: "rgba(96,165,250,0.1)",
                    border: "1px solid rgba(96,165,250,0.25)",
                    color: "#60a5fa",
                    "&:hover": { bgcolor: "rgba(96,165,250,0.18)" },
                    "&.Mui-disabled": { color: "rgba(96,165,250,0.5)" }
                  }}
                >
                  {syncing ? "Syncing..." : "Sync from GitHub"}
                </Button>
              </Stack>
            </Stack>

            {syncError && (
              <Paper elevation={0} sx={{ mb: 2, bgcolor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px", px: 2, py: 1 }}>
                <Typography sx={{ color: "#fecaca", fontSize: 13 }}>{syncError}</Typography>
              </Paper>
            )}

            <Stack direction="row" alignItems="flex-start" spacing={2} sx={{ minWidth: 0 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 42 / 1.4, fontWeight: 700, ...breakLongTextSx }}>
                  {detail.title} <Box component="span" sx={{ color: "#64748b", fontWeight: 400 }}>#{detail.number}</Box>
                </Typography>

                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1, flexWrap: "wrap", rowGap: 1, minWidth: 0 }}>
                  <Box sx={{ borderRadius: 999, px: 1.4, py: 0.55, bgcolor: statusChip.bg, border: `1px solid ${statusChip.bd}`, color: statusChip.color, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>
                    {statusChip.text}
                  </Box>
                  <Box sx={{ borderRadius: "6px", px: 1.4, py: 0.5, bgcolor: "rgba(30,41,59,0.5)", border: "1px solid #334155", display: "flex", alignItems: "center", gap: 1, color: "#94a3b8", fontSize: 14, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", maxWidth: "100%", ...breakLongTextSx }}>
                    {detail.sourceBranch}
                    <MSym name="arrow_right_alt" sx={{ fontSize: 14 }} />
                    <Box component="span" sx={{ color: "#19e66b" }}>{detail.targetBranch}</Box>
                  </Box>

                  {detail.tags.map((tag) => (
                    <Box key={tag} sx={{ borderRadius: "8px", px: 1.1, py: 0.35, bgcolor: tag === "Enhancement" ? "rgba(168,85,247,0.2)" : "rgba(59,130,246,0.2)", border: `1px solid ${tag === "Enhancement" ? "rgba(168,85,247,0.3)" : "rgba(59,130,246,0.3)"}`, color: tag === "Enhancement" ? "#c084fc" : "#60a5fa", fontSize: 12, fontWeight: 500 }}>
                      {tag}
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Stack>

            <Box sx={{ mt: 3, display: "grid", gridTemplateColumns: { xs: "1fr", lg: "7fr 3fr" }, gap: 4 }}>
              <Stack spacing={3}>
                <Paper elevation={0} sx={{ bgcolor: "#0b0f17", border: "1px solid #1e293b", borderRadius: "24px", overflow: "hidden" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2, borderBottom: "1px solid #1e293b", bgcolor: "rgba(15,23,42,0.5)" }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 24, height: 24, bgcolor: "#64748b" }}>{detail.overview.author[0]?.toUpperCase()}</Avatar>
                      <Typography sx={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>
                        {detail.overview.author} <Box component="span" sx={{ color: "#f1f5f9", fontWeight: 500 }}>commented {detail.overview.commentedAtLabel}</Box>
                      </Typography>
                    </Stack>
                    <IconButton size="small" sx={{ color: "#64748b" }}><MSym name="more_horiz" sx={{ fontSize: 14 }} /></IconButton>
                  </Stack>

                  <Box sx={{ px: 3, py: 3 }}>
                    <Typography sx={{ color: "#cbd5e1", fontSize: 16, lineHeight: "24px", ...breakLongTextSx }}>{detail.overview.intro}</Typography>
                    <Stack component="ul" sx={{ mt: 2, mb: 0, pl: 2, color: "#cbd5e1", gap: 0.75 }}>
                      {detail.overview.changes.map((change) => (
                        <Typography component="li" key={change} sx={{ fontSize: 16, lineHeight: "24px", ...breakLongTextSx }}>{change}</Typography>
                      ))}
                    </Stack>

                    {detail.overview.note && (
                      <Box sx={{ mt: 2, height: 50, borderRadius: "8px", bgcolor: "rgba(30,41,59,0.5)", borderLeft: "4px solid #19e66b", px: 1.5, display: "flex", alignItems: "center" }}>
                        <Typography sx={{ color: "#94a3b8", fontSize: 16, lineHeight: "24px", ...breakLongTextSx }}>
                          <Box component="span" sx={{ fontWeight: 700 }}>Note:</Box> {detail.overview.note}
                        </Typography>
                      </Box>
                    )}

                    {detail.overview.linkedIssue ? (
                      <>
                        <Divider sx={{ borderColor: "#1e293b", my: 2 }} />
                        <Typography sx={{ color: "#94a3b8", fontSize: 14, ...breakLongTextSx }}>
                          <MSym name="link" sx={{ fontSize: 12, mr: 0.8, verticalAlign: "middle" }} />
                          Fixes <Box component="span" sx={{ color: "#19e66b" }}>#{detail.overview.linkedIssue.number}</Box>: "{detail.overview.linkedIssue.title}"
                        </Typography>
                      </>
                    ) : null}
                  </Box>
                </Paper>

                <Box sx={{ pl: 6, pb: 5, position: "relative" }}>
                  <Box sx={{ position: "absolute", left: 2.5, top: 0, bottom: 0, width: 2, bgcolor: "#1e293b" }} />
                  <Stack spacing={3}>
                    {detail.timeline.map((entry) => (
                      <Box key={entry.id} sx={{ position: "relative" }}>
                        <Box sx={{ position: "absolute", left: -57, top: 0, width: 40, height: 40, borderRadius: 999, border: "4px solid #050509", bgcolor: entry.type === "maintainerFeedback" ? "#19e66b" : "#0f172a", display: "grid", placeItems: "center", color: entry.type === "maintainerFeedback" ? "#050509" : "#94a3b8" }}>
                          <MSym name={entry.type === "commits" ? "commit" : entry.type === "reviewRequested" ? "person_add" : entry.type === "changesRequested" ? "warning" : entry.type === "maintainerFeedback" ? "check" : entry.type === "restriction" ? "lock" : entry.type === "comment" ? "chat_bubble" : "radio_button_checked"} sx={{ fontSize: 12 }} />
                        </Box>
                        <TimelineItem item={entry} />
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Stack>

              <Stack spacing={3}>
                <Paper elevation={0} sx={{ bgcolor: "#0b0f17", border: "1px solid #1e293b", borderRadius: "24px", p: 2.5 }}>
                  <Typography sx={{ color: "#94a3b8", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.4 }}>Reviewers</Typography>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {detail.sidebar.reviewers.length > 0 ? (
                      detail.sidebar.reviewers.map((reviewer) => (
                        <Stack key={reviewer.id} direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ opacity: reviewer.status === "pending" ? 0.6 : 1 }}>
                            <Avatar sx={{ width: 32, height: 32, border: "1px solid #334155", bgcolor: reviewer.name === "john_dev" ? "#1e293b" : "#64748b" }}>
                              {reviewer.name === "john_dev" ? "JD" : reviewer.name[0].toUpperCase()}
                            </Avatar>
                            <Typography sx={{ color: "#cbd5e1", fontSize: 14 }}>{reviewer.name}</Typography>
                          </Stack>
                          <ReviewerStatus status={reviewer.status} />
                        </Stack>
                      ))
                    ) : (
                      <Typography sx={{ color: "#64748b", fontSize: 13 }}>No reviewers yet.</Typography>
                    )}
                  </Stack>
                </Paper>

                <Paper elevation={0} sx={{ bgcolor: "#0b0f17", border: "1px solid #1e293b", borderRadius: "24px", p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ color: "#94a3b8", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.4 }}>Checks</Typography>
                    <Box sx={{ width: 13, height: 13, borderRadius: 999, bgcolor: "#19e66b" }} />
                  </Stack>

                  <Stack spacing={1.6} sx={{ mt: 2 }}>
                    {detail.sidebar.checks.length > 0 ? (
                      detail.sidebar.checks.map((check) => (
                        <Box key={check.id}>
                          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <CheckIcon status={check.status} />
                              <Typography sx={{ color: "#cbd5e1", fontSize: 14 }}>{check.name}</Typography>
                            </Stack>
                            <Typography sx={{ color: "#64748b", fontSize: 10 }}>{check.durationLabel}</Typography>
                          </Stack>
                          {check.status !== "running" ? (
                            <LinearProgress variant="determinate" value={check.progress} sx={{ mt: 0.8, height: 4, borderRadius: 999, bgcolor: "rgba(25,230,107,0.15)", "& .MuiLinearProgress-bar": { bgcolor: "#19e66b" } }} />
                          ) : null}
                        </Box>
                      ))
                    ) : (
                      <Typography sx={{ color: "#64748b", fontSize: 13 }}>No checks found for this pull request.</Typography>
                    )}
                  </Stack>
                </Paper>

                <Paper elevation={0} sx={{ bgcolor: "#0b0f17", border: "1px solid #1e293b", borderRadius: "24px", p: 2.5 }}>
                  <Typography sx={{ color: "#94a3b8", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.4 }}>Linked Issues</Typography>
                  {detail.sidebar.linkedIssue ? (
                    <Box sx={{ mt: 2, borderRadius: "16px", border: "1px solid #1e293b", bgcolor: "rgba(15,23,42,0.5)", px: 1.6, py: 1.5 }}>
                      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start" sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600, ...breakLongTextSx }}>
                          {detail.sidebar.linkedIssue.title}
                        </Typography>
                        {detail.sidebar.linkedIssue.status ? (
                          <Box
                            sx={{
                              borderRadius: "999px",
                              px: 1,
                              py: 0.25,
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              border: "1px solid #334155",
                              color: "#93c5fd",
                              bgcolor: "rgba(59,130,246,0.12)",
                              flexShrink: 0
                            }}
                          >
                            {detail.sidebar.linkedIssue.status}
                          </Box>
                        ) : null}
                      </Stack>

                      <Typography sx={{ color: "#64748b", fontSize: 11, mt: 0.5, ...breakLongTextSx }}>
                        #{detail.sidebar.linkedIssue.number} · Opened by {detail.sidebar.linkedIssue.openedBy}
                      </Typography>

                      {(detail.sidebar.linkedIssue.repoOwner || detail.sidebar.linkedIssue.repoName || detail.sidebar.linkedIssue.repoLanguage) ? (
                        <Typography sx={{ color: "#64748b", fontSize: 11, mt: 0.5, ...breakLongTextSx }}>
                          Repo: {detail.sidebar.linkedIssue.repoOwner || "-"}/{detail.sidebar.linkedIssue.repoName || "-"}
                          {detail.sidebar.linkedIssue.repoLanguage ? ` · ${detail.sidebar.linkedIssue.repoLanguage}` : ""}
                        </Typography>
                      ) : null}

                      {detail.sidebar.linkedIssue.summary ? (
                        <Typography sx={{ color: "#cbd5e1", fontSize: 12, mt: 1, lineHeight: "20px", ...breakLongTextSx }}>
                          {detail.sidebar.linkedIssue.summary}
                        </Typography>
                      ) : null}

                      <Stack direction="row" spacing={0.75} sx={{ mt: 1.1, flexWrap: "wrap", rowGap: 0.75 }}>
                        {detail.sidebar.linkedIssue.prStatus ? (
                          <Box sx={{ borderRadius: "999px", px: 1, py: 0.25, fontSize: 10, fontWeight: 700, color: "#19e66b", border: "1px solid rgba(25,230,107,0.35)", bgcolor: "rgba(25,230,107,0.12)" }}>
                            PR {detail.sidebar.linkedIssue.prStatus}
                          </Box>
                        ) : null}

                        {detail.sidebar.linkedIssue.difficulty ? (
                          <Box sx={{ borderRadius: "999px", px: 1, py: 0.25, fontSize: 10, fontWeight: 700, color: "#fbbf24", border: "1px solid rgba(251,191,36,0.35)", bgcolor: "rgba(251,191,36,0.12)", textTransform: "capitalize" }}>
                            {detail.sidebar.linkedIssue.difficulty}
                          </Box>
                        ) : null}

                        {detail.sidebar.linkedIssue.beginnerFriendly ? (
                          <Box sx={{ borderRadius: "999px", px: 1, py: 0.25, fontSize: 10, fontWeight: 700, color: "#93c5fd", border: "1px solid rgba(147,197,253,0.35)", bgcolor: "rgba(147,197,253,0.12)" }}>
                            Beginner Friendly
                          </Box>
                        ) : null}
                      </Stack>

                      {detail.sidebar.linkedIssue.labels && detail.sidebar.linkedIssue.labels.length > 0 ? (
                        <Stack direction="row" spacing={0.75} sx={{ mt: 1.1, flexWrap: "wrap", rowGap: 0.75 }}>
                          {detail.sidebar.linkedIssue.labels.map((label) => (
                            <Box
                              key={label}
                              sx={{
                                borderRadius: "999px",
                                px: 1,
                                py: 0.25,
                                fontSize: 10,
                                fontWeight: 600,
                                color: "#a5b4fc",
                                border: "1px solid rgba(165,180,252,0.35)",
                                bgcolor: "rgba(165,180,252,0.12)",
                                ...breakLongTextSx
                              }}
                            >
                              {label}
                            </Box>
                          ))}
                        </Stack>
                      ) : null}

                      {detail.sidebar.linkedIssue.requiredSkills && detail.sidebar.linkedIssue.requiredSkills.length > 0 ? (
                        <Typography sx={{ color: "#94a3b8", fontSize: 11, mt: 1, ...breakLongTextSx }}>
                          Skills: {detail.sidebar.linkedIssue.requiredSkills.join(", ")}
                        </Typography>
                      ) : null}

                      {detail.sidebar.linkedIssue.expectedOutcome && detail.sidebar.linkedIssue.expectedOutcome.length > 0 ? (
                        <Typography sx={{ color: "#94a3b8", fontSize: 11, mt: 0.6, ...breakLongTextSx }}>
                          Expected: {detail.sidebar.linkedIssue.expectedOutcome.join(" | ")}
                        </Typography>
                      ) : null}

                      {detail.sidebar.linkedIssue.suggestedResources && detail.sidebar.linkedIssue.suggestedResources.length > 0 ? (
                        <Stack spacing={0.45} sx={{ mt: 0.9 }}>
                          <Typography sx={{ color: "#94a3b8", fontSize: 11 }}>Resources:</Typography>
                          {detail.sidebar.linkedIssue.suggestedResources.slice(0, 3).map((resource) => (
                            <Typography key={`${resource.title}-${resource.url}`} sx={{ fontSize: 11, color: "#93c5fd", ...breakLongTextSx }}>
                              • <Box component="a" href={resource.url} target="_blank" rel="noreferrer" sx={{ color: "#93c5fd", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>{resource.title}</Box>
                            </Typography>
                          ))}
                        </Stack>
                      ) : null}

                      {(detail.sidebar.linkedIssue.githubCreatedAt || detail.sidebar.linkedIssue.githubUpdatedAt || detail.sidebar.linkedIssue.claimedByLogin) ? (
                        <Typography sx={{ color: "#64748b", fontSize: 11, mt: 0.8, ...breakLongTextSx }}>
                          {detail.sidebar.linkedIssue.claimedByLogin ? `Claimed by ${detail.sidebar.linkedIssue.claimedByLogin}` : "Not claimed"}
                          {formatIssueDate(detail.sidebar.linkedIssue.githubCreatedAt) ? ` · Created ${formatIssueDate(detail.sidebar.linkedIssue.githubCreatedAt)}` : ""}
                          {formatIssueDate(detail.sidebar.linkedIssue.githubUpdatedAt) ? ` · Updated ${formatIssueDate(detail.sidebar.linkedIssue.githubUpdatedAt)}` : ""}
                        </Typography>
                      ) : null}

                      <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: "wrap", rowGap: 0.75 }}>
                        <Button
                          onClick={handleViewIssue}
                          disabled={!detail.sidebar.linkedIssue.id && !detail.sidebar.linkedIssue.githubUrl}
                          sx={{
                            height: 32,
                            borderRadius: "10px",
                            px: 1.5,
                            textTransform: "none",
                            fontSize: 12,
                            fontWeight: 700,
                            bgcolor: "rgba(25,230,107,0.12)",
                            color: "#19e66b",
                            border: "1px solid rgba(25,230,107,0.35)",
                            "&:hover": { bgcolor: "rgba(25,230,107,0.18)" }
                          }}
                        >
                          View Issue
                        </Button>

                        {detail.sidebar.linkedIssue.githubUrl ? (
                          <Button
                            component="a"
                            href={detail.sidebar.linkedIssue.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            sx={{
                              height: 32,
                              borderRadius: "10px",
                              px: 1.5,
                              textTransform: "none",
                              fontSize: 12,
                              fontWeight: 700,
                              bgcolor: "rgba(255,255,255,0.06)",
                              color: "#cbd5e1",
                              border: "1px solid rgba(255,255,255,0.18)",
                              "&:hover": { bgcolor: "rgba(255,255,255,0.10)" }
                            }}
                          >
                            Open on GitHub
                          </Button>
                        ) : null}
                      </Stack>
                    </Box>
                  ) : (
                    <Typography sx={{ color: "#64748b", fontSize: 13, mt: 2 }}>No linked issue metadata available.</Typography>
                  )}
                </Paper>

                <Paper elevation={0} sx={{ bgcolor: "#0b0f17", border: "1px solid #1e293b", borderRadius: "24px", p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ color: "#94a3b8", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.4 }}>Files Changed</Typography>
                    <Typography sx={{ color: "#64748b", fontSize: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{detail.sidebar.filesChangedTotal} files</Typography>
                  </Stack>

                  <Stack spacing={1.25} sx={{ mt: 2 }}>
                    {detail.sidebar.filesChanged.length > 0 ? (
                      detail.sidebar.filesChanged.map((file) => (
                        <Stack key={file.path} direction="row" justifyContent="space-between" alignItems="center" sx={{ minWidth: 0, gap: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                            <MSym name="description" sx={{ fontSize: 12, color: "#94a3b8" }} />
                            <Typography sx={{ color: "#cbd5e1", fontSize: 12, ...breakLongTextSx }}>{file.path}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                            <Typography sx={{ color: "#19e66b", fontSize: 10, fontWeight: 700 }}>+{file.additions}</Typography>
                            <Typography sx={{ color: "#ef4444", fontSize: 10, fontWeight: 700 }}>-{file.deletions}</Typography>
                          </Stack>
                        </Stack>
                      ))
                    ) : (
                      <Typography sx={{ color: "#64748b", fontSize: 13 }}>No changed files data available yet.</Typography>
                    )}
                  </Stack>

                  <Button
                    onClick={handleViewAllChanges}
                    sx={{ mt: 2, width: "100%", height: 36, borderRadius: "16px", textTransform: "none", color: "#94a3b8", border: "1px solid #334155" }}
                  >
                    View All Changes
                  </Button>
                </Paper>
              </Stack>
            </Box>
          </>
        )}
      </Box>

      <Box sx={{ borderTop: "1px solid #1e293b", px: 3, py: 4, mt: 3 }}>
        <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ maxWidth: 1440, mx: "auto" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 8, height: 8, borderRadius: 999, bgcolor: "#19e66b" }} />
            <Typography sx={{ color: "#64748b", fontSize: 12 }}>{detail?.sidebar.systemStatusLabel || "All systems operational"}</Typography>
          </Stack>
        </Stack>
      </Box>
    </AppLayout>
  );
}
