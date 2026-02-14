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
import { fetchPrDetail } from "../api/prTrackingApi";
import AppLayout from "../../../components/layout/AppLayout";
import type { PrDetailResponse, PrTimelineEntry } from "../types";

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
          <Stack key={commit.sha} direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1.25}>
              <Typography sx={{ color: "#64748b", fontSize: 14, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                {commit.sha}
              </Typography>
              <Typography sx={{ color: "#cbd5e1", fontSize: 14 }}>{commit.message}</Typography>
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
          <Typography sx={{ color: "#cbd5e1", fontSize: 16, lineHeight: "24px" }}>{item.summary}</Typography>
          <Box sx={{ mt: 2, borderRadius: "16px", border: "1px solid #1e293b", bgcolor: "rgba(2,6,23,0.5)", px: 2, py: 2 }}>
            <Typography sx={{ color: "#64748b", fontSize: 14, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>- {item.diffOld}</Typography>
            <Typography sx={{ color: "#19e66b", fontSize: 14, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>+ {item.diffNew}</Typography>
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
        <Typography sx={{ color: "#cbd5e1", fontSize: 14, lineHeight: "22.75px", mt: 1 }}>{item.body}</Typography>
      </Paper>
    );
  }

  return <Typography sx={{ color: "#64748b", fontSize: 14 }}>{item.body}</Typography>;
}

export default function PrTrackingDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<PrDetailResponse | null>(null);

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
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
              <Button
                onClick={() => navigate("/pr-tracking")}
                sx={{ minWidth: 32, width: 32, height: 32, borderRadius: "8px", p: 0, bgcolor: "#19e66b", color: "#050509" }}
              >
                <MSym name="chevron_left" sx={{ fontSize: 18 }} />
              </Button>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ color: "#64748b", fontSize: 14 }}>opencollab</Typography>
                <Typography sx={{ color: "#475569", fontSize: 14 }}>/</Typography>
                <Typography sx={{ color: "#64748b", fontSize: 14 }}>{detail.repo || "core-engine"}</Typography>
                <Typography sx={{ color: "#475569", fontSize: 14 }}>/</Typography>
                <Typography sx={{ color: "#fff", fontSize: 14 }}>Pull Request #{detail.number ?? "--"}</Typography>
              </Stack>
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
              <Box>
                <Typography sx={{ fontSize: 42 / 1.4, fontWeight: 700 }}>
                  {detail.title} <Box component="span" sx={{ color: "#64748b", fontWeight: 400 }}>#{detail.number}</Box>
                </Typography>

                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1 }}>
                  <Box sx={{ borderRadius: 999, px: 1.4, py: 0.55, bgcolor: statusChip.bg, border: `1px solid ${statusChip.bd}`, color: statusChip.color, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>
                    {statusChip.text}
                  </Box>
                  <Box sx={{ borderRadius: "6px", px: 1.4, py: 0.5, bgcolor: "rgba(30,41,59,0.5)", border: "1px solid #334155", display: "flex", alignItems: "center", gap: 1, color: "#94a3b8", fontSize: 14, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
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

              <Stack direction="row" spacing={1.5}>
                <Button sx={{ height: 40, borderRadius: "16px", px: 2.25, textTransform: "none", color: "#f1f5f9", border: "1px solid #334155" }} startIcon={<MSym name="share" sx={{ fontSize: 14 }} />}>
                  Share
                </Button>
                <Button onClick={() => navigate("/pr-tracking")} sx={{ height: 40, borderRadius: "16px", px: 2.25, textTransform: "none", bgcolor: "#19e66b", color: "#050509", fontWeight: 700 }}>
                  New Pull Request
                </Button>
              </Stack>
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
                    <Typography sx={{ color: "#cbd5e1", fontSize: 16, lineHeight: "24px" }}>{detail.overview.intro}</Typography>
                    <Stack component="ul" sx={{ mt: 2, mb: 0, pl: 2, color: "#cbd5e1", gap: 0.75 }}>
                      {detail.overview.changes.map((change) => (
                        <Typography component="li" key={change} sx={{ fontSize: 16, lineHeight: "24px" }}>{change}</Typography>
                      ))}
                    </Stack>

                    {detail.overview.note && (
                      <Box sx={{ mt: 2, height: 50, borderRadius: "8px", bgcolor: "rgba(30,41,59,0.5)", borderLeft: "4px solid #19e66b", px: 1.5, display: "flex", alignItems: "center" }}>
                        <Typography sx={{ color: "#94a3b8", fontSize: 16, lineHeight: "24px" }}>
                          <Box component="span" sx={{ fontWeight: 700 }}>Note:</Box> {detail.overview.note}
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ borderColor: "#1e293b", my: 2 }} />
                    <Typography sx={{ color: "#94a3b8", fontSize: 14 }}>
                      <MSym name="link" sx={{ fontSize: 12, mr: 0.8, verticalAlign: "middle" }} />
                      Fixes <Box component="span" sx={{ color: "#19e66b" }}>#{detail.overview.linkedIssue.number}</Box>: "{detail.overview.linkedIssue.title}"
                    </Typography>
                  </Box>
                </Paper>

                <Box sx={{ pl: 6, pb: 5, position: "relative" }}>
                  <Box sx={{ position: "absolute", left: 2.5, top: 0, bottom: 0, width: 2, bgcolor: "#1e293b" }} />
                  <Stack spacing={3}>
                    {detail.timeline.map((entry) => (
                      <Box key={entry.id} sx={{ position: "relative" }}>
                        <Box sx={{ position: "absolute", left: -57, top: 0, width: 40, height: 40, borderRadius: 999, border: "4px solid #050509", bgcolor: entry.type === "maintainerFeedback" ? "#19e66b" : "#0f172a", display: "grid", placeItems: "center", color: entry.type === "maintainerFeedback" ? "#050509" : "#94a3b8" }}>
                          <MSym name={entry.type === "commits" ? "commit" : entry.type === "reviewRequested" ? "person_add" : entry.type === "changesRequested" ? "warning" : entry.type === "maintainerFeedback" ? "check" : entry.type === "restriction" ? "lock" : "radio_button_checked"} sx={{ fontSize: 12 }} />
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
                    {detail.sidebar.reviewers.map((reviewer) => (
                      <Stack key={reviewer.id} direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ opacity: reviewer.status === "pending" ? 0.6 : 1 }}>
                          <Avatar sx={{ width: 32, height: 32, border: "1px solid #334155", bgcolor: reviewer.name === "john_dev" ? "#1e293b" : "#64748b" }}>
                            {reviewer.name === "john_dev" ? "JD" : reviewer.name[0].toUpperCase()}
                          </Avatar>
                          <Typography sx={{ color: "#cbd5e1", fontSize: 14 }}>{reviewer.name}</Typography>
                        </Stack>
                        <ReviewerStatus status={reviewer.status} />
                      </Stack>
                    ))}
                  </Stack>
                </Paper>

                <Paper elevation={0} sx={{ bgcolor: "#0b0f17", border: "1px solid #1e293b", borderRadius: "24px", p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ color: "#94a3b8", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.4 }}>Checks</Typography>
                    <Box sx={{ width: 13, height: 13, borderRadius: 999, bgcolor: "#19e66b" }} />
                  </Stack>

                  <Stack spacing={1.6} sx={{ mt: 2 }}>
                    {detail.sidebar.checks.map((check) => (
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
                    ))}
                  </Stack>
                </Paper>

                <Paper elevation={0} sx={{ bgcolor: "#0b0f17", border: "1px solid #1e293b", borderRadius: "24px", p: 2.5 }}>
                  <Typography sx={{ color: "#94a3b8", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.4 }}>Linked Issues</Typography>
                  <Box sx={{ mt: 2, borderRadius: "16px", border: "1px solid #1e293b", bgcolor: "rgba(15,23,42,0.5)", px: 1.6, py: 1.5 }}>
                    <Typography sx={{ color: "#e2e8f0", fontSize: 14, fontWeight: 500 }}>{detail.sidebar.linkedIssue.title}</Typography>
                    <Typography sx={{ color: "#64748b", fontSize: 11, mt: 0.5 }}>
                      #{detail.sidebar.linkedIssue.number} · Opened by {detail.sidebar.linkedIssue.openedBy}
                    </Typography>
                  </Box>
                </Paper>

                <Paper elevation={0} sx={{ bgcolor: "#0b0f17", border: "1px solid #1e293b", borderRadius: "24px", p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ color: "#94a3b8", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.4 }}>Files Changed</Typography>
                    <Typography sx={{ color: "#64748b", fontSize: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{detail.sidebar.filesChangedTotal} files</Typography>
                  </Stack>

                  <Stack spacing={1.25} sx={{ mt: 2 }}>
                    {detail.sidebar.filesChanged.map((file) => (
                      <Stack key={file.path} direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <MSym name="description" sx={{ fontSize: 12, color: "#94a3b8" }} />
                          <Typography sx={{ color: "#cbd5e1", fontSize: 12 }}>{file.path}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5}>
                          <Typography sx={{ color: "#19e66b", fontSize: 10, fontWeight: 700 }}>+{file.additions}</Typography>
                          <Typography sx={{ color: "#ef4444", fontSize: 10, fontWeight: 700 }}>-{file.deletions}</Typography>
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>

                  <Button sx={{ mt: 2, width: "100%", height: 36, borderRadius: "16px", textTransform: "none", color: "#94a3b8", border: "1px solid #334155" }}>
                    View All Changes
                  </Button>
                </Paper>
              </Stack>
            </Box>
          </>
        )}
      </Box>

      <Box sx={{ borderTop: "1px solid #1e293b", px: 3, py: 4, mt: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ maxWidth: 1440, mx: "auto" }}>
          <Stack direction="row" spacing={3}>
            <Typography sx={{ color: "#64748b", fontSize: 12 }}>© 2024 OpenCollab Inc.</Typography>
            <Typography sx={{ color: "#64748b", fontSize: 12 }}>Terms</Typography>
            <Typography sx={{ color: "#64748b", fontSize: 12 }}>Privacy</Typography>
            <Typography sx={{ color: "#64748b", fontSize: 12 }}>Security</Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 8, height: 8, borderRadius: 999, bgcolor: "#19e66b" }} />
            <Typography sx={{ color: "#64748b", fontSize: 12 }}>{detail?.sidebar.systemStatusLabel || "All systems operational"}</Typography>
          </Stack>
        </Stack>
      </Box>
    </AppLayout>
  );
}
