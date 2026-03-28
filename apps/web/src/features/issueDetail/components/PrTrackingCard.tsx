import { useState, useEffect } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import MSym from "../../resources/components/MSym";
import type { PrTrackingDto } from "../types";
import {
  submitPrForIssue,
  fetchPrTrackingByIssue,
  refreshPrTracking
} from "../api/issueDetailApi";

type Props = {
  issueId: string;
  showToast: (message: string, severity: "success" | "error" | "info") => void;
};

function statusChip(status: string) {
  if (status === "MERGED") {
    return { label: "MERGED", fg: "#c084fc", bg: "rgba(192,132,252,0.10)", bd: "rgba(192,132,252,0.20)" };
  }
  if (status === "CLOSED") {
    return { label: "CLOSED", fg: "#fb923c", bg: "rgba(251,146,60,0.10)", bd: "rgba(251,146,60,0.20)" };
  }
  return { label: "OPEN", fg: "#19e66b", bg: "rgba(25,230,107,0.10)", bd: "rgba(25,230,107,0.20)" };
}

function displayStatus(status: string) {
  if (status === "PR_OPEN") return "OPEN";
  return status;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PrTrackingCard({ issueId, showToast }: Props) {
  const [prUrl, setPrUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prData, setPrData] = useState<PrTrackingDto | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchPrTrackingByIssue(issueId);
        if (alive) setPrData(data);
      } catch {
        // No PR tracking yet — that's fine
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [issueId]);

  const handleSubmit = async () => {
    if (!prUrl.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await submitPrForIssue(issueId, prUrl.trim());
      setPrData(res.item);
      setPrUrl("");
      showToast("PR submitted successfully", "success");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to submit PR";
      setSubmitError(msg);
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    if (!prData?._id) return;
    setRefreshing(true);
    try {
      const res = await refreshPrTracking(prData._id);
      setPrData(res.item);
      showToast("PR refreshed", "success");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to refresh PR", "error");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Paper elevation={0} sx={{ bgcolor: "transparent", mb: 2.5, py: 2 }}>
        <Stack alignItems="center">
          <CircularProgress size={20} sx={{ color: "#19e66b" }} />
        </Stack>
      </Paper>
    );
  }

  // Show PR details if we have data
  if (prData) {
    const chip = statusChip(displayStatus(prData.status));
    const [owner, repo] = (prData.repoFullName || "").split("/");

    return (
      <Paper
        elevation={0}
        sx={{
          bgcolor: "transparent",
          borderTop: "1px solid #2c312a",
          pt: 2,
          mb: 2.5
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Pull Request
          </Typography>
          <Button
            size="small"
            onClick={handleRefresh}
            disabled={refreshing}
            startIcon={refreshing ? <CircularProgress size={12} color="inherit" /> : <MSym name="refresh" sx={{ fontSize: 14 }} />}
            sx={{
              textTransform: "none",
              fontSize: 12,
              fontWeight: 600,
              color: "#60a5fa",
              borderRadius: "8px",
              px: 1,
              minWidth: 0,
              "&:hover": { bgcolor: "rgba(96,165,250,0.10)" }
            }}
          >
            {refreshing ? "Refreshing" : "Refresh"}
          </Button>
        </Stack>

        {/* Title + link */}
        <Typography
          component="a"
          href={prData.prUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: "#60a5fa",
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "none",
            display: "block",
            mb: 1,
            "&:hover": { textDecoration: "underline" }
          }}
        >
          {prData.prTitle || `PR #${prData.prNumber}`}
        </Typography>

        {/* Repo + status chip */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <Typography sx={{ color: "#a1a1aa", fontSize: 12, fontFamily: "monospace" }}>
            {owner}/{repo}
          </Typography>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "6px",
              px: 1,
              py: 0.25,
              bgcolor: chip.bg,
              border: `1px solid ${chip.bd}`
            }}
          >
            <Typography sx={{ color: chip.fg, fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>
              {chip.label}
            </Typography>
          </Paper>
        </Stack>

        {/* Stats */}
        <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography sx={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>
              +{prData.additions ?? 0}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography sx={{ color: "#ef4444", fontSize: 12, fontWeight: 600 }}>
              -{prData.deletions ?? 0}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <MSym name="description" sx={{ fontSize: 13, color: "#a1a1aa" }} />
            <Typography sx={{ color: "#a1a1aa", fontSize: 12 }}>
              {prData.changedFiles ?? 0} files
            </Typography>
          </Stack>
        </Stack>

        {/* Dates */}
        <Stack spacing={0.5} sx={{ color: "#a1a1aa", fontSize: 12 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ fontSize: 12 }}>Created</Typography>
            <Typography sx={{ fontSize: 12, color: "#cbd5e1" }}>{formatDate(prData.createdAtGithub)}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ fontSize: 12 }}>Updated</Typography>
            <Typography sx={{ fontSize: 12, color: "#cbd5e1" }}>{formatDate(prData.updatedAtGithub)}</Typography>
          </Stack>
          {prData.mergedAtGithub && (
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ fontSize: 12 }}>Merged</Typography>
              <Typography sx={{ fontSize: 12, color: "#c084fc" }}>{formatDate(prData.mergedAtGithub)}</Typography>
            </Stack>
          )}
        </Stack>
      </Paper>
    );
  }

  // Show submit form
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "transparent",
        borderTop: "1px solid #2c312a",
        pt: 2,
        mb: 2.5
      }}
    >
      <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5 }}>
        Submit Pull Request
      </Typography>

      <TextField
        fullWidth
        size="small"
        value={prUrl}
        onChange={(e) => { setPrUrl(e.target.value); setSubmitError(null); }}
        placeholder="https://github.com/owner/repo/pull/123"
        onKeyDown={(e) => { if (e.key === "Enter" && !submitting) handleSubmit(); }}
        sx={{
          mb: 1,
          "& .MuiOutlinedInput-root": {
            bgcolor: "rgba(255,255,255,0.03)",
            borderRadius: "10px",
            color: "#fff",
            fontSize: 13,
            "& fieldset": { borderColor: "#27272a" },
            "&:hover fieldset": { borderColor: "#3f3f46" },
            "&.Mui-focused fieldset": { borderColor: "#19e66b" }
          },
          "& input::placeholder": { color: "#52525b", fontSize: 13 }
        }}
      />

      {submitError && (
        <Typography sx={{ color: "#fca5a5", fontSize: 12, mb: 1 }}>
          {submitError}
        </Typography>
      )}

      <Button
        fullWidth
        onClick={handleSubmit}
        disabled={!prUrl.trim() || submitting}
        sx={{
          height: 40,
          borderRadius: "10px",
          textTransform: "none",
          fontWeight: 700,
          fontSize: 14,
          bgcolor: "#19e66b",
          color: "#000",
          "&:hover": { bgcolor: "#22c55e" },
          "&.Mui-disabled": { bgcolor: "rgba(25,230,107,0.20)", color: "rgba(0,0,0,0.4)" }
        }}
      >
        {submitting ? <CircularProgress size={18} sx={{ color: "#000" }} /> : "Submit PR"}
      </Button>
    </Paper>
  );
}
