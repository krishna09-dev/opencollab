import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";

import MSym from "../../resources/components/MSym";
import { usePrTracking } from "../hooks/usePrTracking";
import { addPrByUrl, manualRefreshAll } from "../api/prTrackingApi";
import AppLayout from "../../../components/layout/AppLayout";
import type { PrDisplayStatus, PrFilterState, PrTrackingItem } from "../types";

const PAGE_SIZE = 4;

type SortValue = "newest" | "oldest";

const STATUS_OPTIONS: Array<{ label: string; value: PrDisplayStatus }> = [
  { label: "Open", value: "OPEN" },
  { label: "In Review", value: "IN_REVIEW" },
  { label: "Changes Requested", value: "CHANGES_REQUESTED" },
  { label: "Merged", value: "MERGED" }
];

function statusMeta(status: PrDisplayStatus) {
  if (status === "IN_REVIEW") {
    return { label: "In Review", fg: "#60a5fa", bg: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.20)" };
  }
  if (status === "CHANGES_REQUESTED") {
    return { label: "Changes Requested", fg: "#fb923c", bg: "rgba(251,146,60,0.10)", border: "rgba(251,146,60,0.20)" };
  }
  if (status === "MERGED") {
    return { label: "Merged", fg: "#c084fc", bg: "rgba(192,132,252,0.10)", border: "rgba(192,132,252,0.20)" };
  }
  return { label: "Open", fg: "#19e66b", bg: "rgba(25,230,107,0.10)", border: "rgba(25,230,107,0.20)" };
}

function toDisplayStatus(item: PrTrackingItem): PrDisplayStatus {
  if (item.displayStatus) return item.displayStatus;
  if (item.status === "MERGED") return "MERGED";
  return "OPEN";
}

function parseRelative(relative?: string): string {
  if (!relative) return "";
  const text = relative.trim();
  if (!text) return "";
  if (text.endsWith("ago")) return text;
  if (text.endsWith("m")) return `${text.slice(0, -1)} minutes ago`;
  if (text.endsWith("h")) return `${text.slice(0, -1)} hours ago`;
  if (text.endsWith("d")) return `${text.slice(0, -1)} days ago`;
  if (text.endsWith("w")) return `${text.slice(0, -1)} weeks ago`;
  return text;
}


export default function PrTrackingPage() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<PrFilterState>({ q: "", status: "All", repo: "All" });
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const [statusAnchor, setStatusAnchor] = useState<null | HTMLElement>(null);
  const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);

  // Add PR dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [prUrlInput, setPrUrlInput] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);

  const { loading, error, data, reload } = usePrTracking(filters);

  const handleAddPr = async () => {
    if (!prUrlInput.trim()) return;

    setAddLoading(true);
    setAddError(null);

    try {
      await addPrByUrl(prUrlInput.trim());
      setPrUrlInput("");
      setAddDialogOpen(false);
      reload();
    } catch (err: any) {
      setAddError(err?.response?.data?.message || "Failed to add PR. Please check the URL and try again.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await manualRefreshAll();
      reload();
    } catch (err) {
      console.error("Failed to refresh:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const sortedItems = useMemo(() => {
    if (sortBy === "newest") return data.items;
    return [...data.items].reverse();
  }, [data.items, sortBy]);

  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [filters.q, filters.status, filters.repo, sortBy, sortedItems.length]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pagedItems = sortedItems.slice(start, start + PAGE_SIZE);

  const showingFrom = sortedItems.length ? start + 1 : 0;
  const showingTo = sortedItems.length ? Math.min(start + PAGE_SIZE, sortedItems.length) : 0;

  const selectedStatusLabel =
    filters.status === "All"
      ? "All"
      : STATUS_OPTIONS.find((x) => x.value === filters.status)?.label || String(filters.status);

  const summaryCards = [
    { label: "Total PRs", value: data.summary.total || 0, color: "#ffffff" },
    { label: "Open", value: data.summary.open || 0, color: "#ffffff" },
    { label: "In Review", value: data.summary.inReview || 0, color: "#60a5fa" },
    { label: "Changes Requested", value: data.summary.changesRequested || 0, color: "#fb923c" },
    { label: "Merged", value: data.summary.merged || 0, color: "#c084fc" }
  ];

  const clearFilters = () => {
    setFilters({ q: "", status: "All", repo: "All" });
    setSortBy("newest");
  };

  return (
    <AppLayout activePage="pr-tracking">
      <Box sx={{ maxWidth: 1152, mx: "auto", px: 3, py: 5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography sx={{ fontSize: 42, lineHeight: "48px", fontWeight: 700, letterSpacing: -0.8 }}>
              My Pull Requests
            </Typography>
            <Typography sx={{ color: "#a1a1aa", mt: 1, fontSize: 22 / 1.375 }}>
              Track your contributions and monitor review progress.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              startIcon={refreshing ? <CircularProgress size={16} sx={{ color: "#60a5fa" }} /> : <MSym name="refresh" sx={{ fontSize: 18 }} />}
              sx={{
                height: 44,
                borderRadius: "14px",
                px: 2.5,
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "rgba(96,165,250,0.1)",
                border: "1px solid rgba(96,165,250,0.25)",
                color: "#60a5fa",
                "&:hover": { bgcolor: "rgba(96,165,250,0.18)" },
                "&.Mui-disabled": { color: "rgba(96,165,250,0.5)" }
              }}
            >
              {refreshing ? "Syncing..." : "Sync from GitHub"}
            </Button>
            <Button
              onClick={() => setAddDialogOpen(true)}
              startIcon={<MSym name="add" sx={{ fontSize: 18 }} />}
              sx={{
                height: 44,
                borderRadius: "14px",
                px: 2.5,
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "#19e66b",
                color: "#000",
                boxShadow: "0 0 10px rgba(25,230,107,0.20)",
                "&:hover": { bgcolor: "#22c55e" }
              }}
            >
              Add PR
            </Button>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={2} sx={{ mt: 3, flexWrap: "wrap", rowGap: 1.5 }}>
          {summaryCards.map((card) => (
            <Paper
              key={card.label}
              elevation={0}
              sx={{ bgcolor: "#0b0f17", border: "1px solid #27272a", borderRadius: "16px", px: 2.5, py: 1.5, minWidth: 120 }}
            >
              <Typography sx={{ color: "#a1a1aa", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {card.label}
              </Typography>
              <Typography sx={{ color: card.color, fontSize: 34 / 1.4, fontWeight: 700, lineHeight: "32px", mt: 0.5 }}>
                {card.value}
              </Typography>
            </Paper>
          ))}
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mt: 3, alignItems: "center" }}>
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              width: "100%",
              borderRadius: "999px",
              border: "1px solid #27272a",
              bgcolor: "#0b0f17",
              px: 1.5,
              py: 1.1,
              display: "flex",
              alignItems: "center",
              gap: 1
            }}
          >
            <MSym name="search" sx={{ color: "#a1a1aa", fontSize: 18 }} />
            <InputBase
              value={filters.q}
              onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
              placeholder="Search pull requests..."
              sx={{ color: "#fff", fontSize: 14, width: "100%" }}
            />
          </Paper>

          <Stack direction="row" spacing={1}>
            <Button
              onClick={(e) => setStatusAnchor(e.currentTarget)}
              sx={{ height: 46, borderRadius: "16px", textTransform: "none", px: 2, color: "#fff", border: "1px solid #27272a", bgcolor: "#0b0f17", gap: 0.75 }}
              startIcon={<MSym name="filter_list" sx={{ fontSize: 18 }} />}
              endIcon={<MSym name="keyboard_arrow_down" sx={{ fontSize: 16 }} />}
            >
              Status
            </Button>
            <Button
              onClick={(e) => setSortAnchor(e.currentTarget)}
              sx={{ height: 46, borderRadius: "16px", textTransform: "none", px: 2, color: "#fff", border: "1px solid #27272a", bgcolor: "#0b0f17", gap: 0.75 }}
              startIcon={<MSym name="sort" sx={{ fontSize: 18 }} />}
              endIcon={<MSym name="keyboard_arrow_down" sx={{ fontSize: 16 }} />}
            >
              Sort
            </Button>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5, alignItems: "center" }}>
          <Paper
            elevation={0}
            sx={{ borderRadius: "999px", border: "1px solid rgba(25,230,107,0.20)", bgcolor: "rgba(25,230,107,0.10)", px: 1.5, py: 0.5, display: "flex", alignItems: "center", gap: 0.75 }}
          >
            <Typography sx={{ color: "#19e66b", fontSize: 12, fontWeight: 500 }}>
              Status: {selectedStatusLabel}
            </Typography>
            <IconButton size="small" sx={{ p: 0, color: "#19e66b" }} onClick={() => setFilters((prev) => ({ ...prev, status: "All" }))}>
              <MSym name="close" sx={{ fontSize: 14 }} />
            </IconButton>
          </Paper>

          <Button
            onClick={clearFilters}
            sx={{ borderRadius: "999px", textTransform: "none", color: "#a1a1aa", border: "1px solid #27272a", bgcolor: "#0b0f17", px: 1.5, py: 0.6, fontSize: 12, minWidth: 0 }}
          >
            Clear all filters
          </Button>
        </Stack>

        <Stack spacing={2} sx={{ mt: 2 }}>
          {loading && (
            <Stack sx={{ py: 8 }} alignItems="center">
              <CircularProgress size={28} sx={{ color: "#19e66b" }} />
              <Typography sx={{ color: "#a1a1aa", mt: 1.5, fontSize: 14 }}>Loading pull requests...</Typography>
            </Stack>
          )}

          {!loading && error && (
            <Paper elevation={0} sx={{ bgcolor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "14px", px: 2, py: 1.5 }}>
              <Typography sx={{ color: "#fecaca", fontSize: 14, fontWeight: 500 }}>{error}</Typography>
            </Paper>
          )}

          {!loading && !error && pagedItems.length === 0 && (
            <Paper
              elevation={0}
              sx={{
                bgcolor: "#0b0f17",
                border: "1px solid #27272a",
                borderRadius: "20px",
                px: 4,
                py: 6,
                textAlign: "center"
              }}
            >
              <MSym name="fork_right" sx={{ fontSize: 56, color: "#27272a", mb: 2 }} />
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#fff", mb: 1 }}>
                No pull requests yet
              </Typography>
              <Typography sx={{ color: "#a1a1aa", fontSize: 14, mb: 3, maxWidth: 400, mx: "auto" }}>
                Add a GitHub pull request to track its progress. Only users involved in the PR will be able to see it.
              </Typography>
              <Button
                onClick={() => setAddDialogOpen(true)}
                startIcon={<MSym name="add" sx={{ fontSize: 18 }} />}
                sx={{
                  height: 44,
                  borderRadius: "14px",
                  px: 3,
                  textTransform: "none",
                  fontWeight: 700,
                  bgcolor: "#19e66b",
                  color: "#000",
                  boxShadow: "0 0 10px rgba(25,230,107,0.20)",
                  "&:hover": { bgcolor: "#22c55e" }
                }}
              >
                Add Your First PR
              </Button>
            </Paper>
          )}

          {!loading && !error && pagedItems.length > 0 && pagedItems.map((item) => {
            const displayStatus = toDisplayStatus(item);
            const status = statusMeta(displayStatus);

            return (
              <Paper
                key={item.id}
                elevation={0}
                sx={{ bgcolor: "#0b0f17", border: "1px solid #27272a", borderRadius: "20px", px: 3, py: 3, display: "flex", gap: 3, alignItems: "center" }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
                    <Typography sx={{ fontSize: 12, color: "#a1a1aa", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                      {item.repoFullName}
                    </Typography>
                    {item.prNumber ? (
                      <Typography sx={{ fontSize: 12, color: "#a1a1aa", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                        #{item.prNumber}
                      </Typography>
                    ) : null}
                    <Typography sx={{ fontSize: 12, color: "#a1a1aa" }}>• {parseRelative(item.updatedAtLabel) || "Recently"}</Typography>
                    <Paper
                      elevation={0}
                      sx={{ borderRadius: "8px", px: 1, py: 0.35, bgcolor: status.bg, border: `1px solid ${status.border}` }}
                    >
                      <Typography sx={{ color: status.fg, fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>
                        {status.label}
                      </Typography>
                    </Paper>
                  </Stack>

                  <Typography sx={{ mt: 1, fontSize: 31 / 1.55, fontWeight: 700, color: "#fff", lineHeight: "28px" }}>
                    {item.title}
                  </Typography>

                  <Typography sx={{ mt: 1, color: "#a1a1aa", fontSize: 14, lineHeight: "22px" }}>
                    {item.shortSummary || "No summary available for this pull request yet."}
                  </Typography>

                  <Stack direction="row" spacing={2} sx={{ mt: 1.5, color: "#a1a1aa", alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <MSym name="link" sx={{ fontSize: 14 }} />
                      <Typography sx={{ fontSize: 11, fontWeight: 500 }}>Fixes #{item.issueNumber}</Typography>
                    </Stack>

                    {item.primaryLanguage ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <MSym name="code" sx={{ fontSize: 14 }} />
                        <Typography sx={{ fontSize: 11, fontWeight: 500 }}>{item.primaryLanguage}</Typography>
                      </Stack>
                    ) : null}

                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <MSym name="chat_bubble_outline" sx={{ fontSize: 14 }} />
                        <Typography sx={{ fontSize: 11, fontWeight: 500 }}>{item.commentsCount ?? 0}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <MSym name="forum" sx={{ fontSize: 14 }} />
                        <Typography sx={{ fontSize: 11, fontWeight: 500 }}>{item.reviewCommentsCount ?? 0}</Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </Box>

                <Button
                  onClick={() => navigate(`/pr-tracking/${item.id}`)}
                  sx={{
                    height: 40,
                    borderRadius: "14px",
                    px: 3,
                    textTransform: "none",
                    fontWeight: 700,
                    bgcolor: "#19e66b",
                    color: "#000",
                    whiteSpace: "nowrap",
                    boxShadow: "0 0 10px rgba(25,230,107,0.20)",
                    "&:hover": { bgcolor: "#22c55e" },
                    "&.Mui-disabled": { bgcolor: "rgba(25,230,107,0.25)", color: "rgba(0,0,0,0.45)" }
                  }}
                >
                  View Details
                </Button>
              </Paper>
            );
          })}
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          sx={{ mt: 3, pt: 3, borderTop: "1px solid #27272a" }}
          spacing={1.5}
        >
          <Typography sx={{ color: "#a1a1aa", fontSize: 14 }}>
            Showing <Box component="span" sx={{ color: "#fff", fontWeight: 500 }}>{showingFrom}</Box> to{" "}
            <Box component="span" sx={{ color: "#fff", fontWeight: 500 }}>{showingTo}</Box> of{" "}
            <Box component="span" sx={{ color: "#fff", fontWeight: 500 }}>{sortedItems.length}</Box> PRs
          </Typography>

          <Pagination
            count={totalPages}
            page={safePage}
            onChange={(_event, value) => setPage(value)}
            siblingCount={1}
            boundaryCount={1}
            showFirstButton
            showLastButton
            shape="rounded"
            sx={{
              "& .MuiPaginationItem-root": {
                color: "#a1a1aa",
                border: "1px solid #27272a",
                bgcolor: "#0b0f17",
                minWidth: 36,
                height: 36,
                borderRadius: "14px",
                fontSize: 13,
                fontWeight: 500
              },
              "& .MuiPaginationItem-root:hover": {
                bgcolor: "#111827"
              },
              "& .MuiPaginationItem-root.Mui-selected": {
                bgcolor: "#19e66b",
                color: "#000",
                borderColor: "#19e66b",
                fontWeight: 700
              },
              "& .MuiPaginationItem-root.Mui-disabled": {
                color: "#52525b",
                borderColor: "#27272a",
                opacity: 0.5
              },
              "& .MuiPaginationItem-ellipsis": {
                border: "none",
                bgcolor: "transparent"
              }
            }}
          />
        </Stack>

        <Typography sx={{ mt: 4, color: "#a1a1aa", fontSize: 12, textAlign: "center" }}>
          © 2023 OpenCollab Inc. · Terms · Privacy
        </Typography>
      </Box>

      <Menu
        anchorEl={statusAnchor}
        open={Boolean(statusAnchor)}
        onClose={() => setStatusAnchor(null)}
        PaperProps={{ sx: { mt: 1, bgcolor: "#0b0f17", border: "1px solid #27272a", color: "#fff", minWidth: 190 } }}
      >
        <MenuItem
          onClick={() => { setFilters((prev) => ({ ...prev, status: "All" })); setStatusAnchor(null); }}
          selected={filters.status === "All"}
        >
          All
        </MenuItem>
        {STATUS_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => { setFilters((prev) => ({ ...prev, status: option.value })); setStatusAnchor(null); }}
            selected={filters.status === option.value}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={sortAnchor}
        open={Boolean(sortAnchor)}
        onClose={() => setSortAnchor(null)}
        PaperProps={{ sx: { mt: 1, bgcolor: "#0b0f17", border: "1px solid #27272a", color: "#fff", minWidth: 190 } }}
      >
        <MenuItem onClick={() => { setSortBy("newest"); setSortAnchor(null); }} selected={sortBy === "newest"}>
          Most Recent
        </MenuItem>
        <MenuItem onClick={() => { setSortBy("oldest"); setSortAnchor(null); }} selected={sortBy === "oldest"}>
          Oldest
        </MenuItem>
      </Menu>

      {/* Add PR Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => { setAddDialogOpen(false); setAddError(null); setPrUrlInput(""); }}
        PaperProps={{
          sx: {
            bgcolor: "#0b0f17",
            border: "1px solid #27272a",
            borderRadius: "20px",
            minWidth: 480,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ color: "#fff", fontWeight: 700, fontSize: 22, pb: 1 }}>
          Add Pull Request
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#a1a1aa", fontSize: 14, mb: 2.5 }}>
            Enter the GitHub PR URL to track it. Only PRs from repositories approved in OpenCollab can be added.
          </Typography>

          <TextField
            fullWidth
            value={prUrlInput}
            onChange={(e) => setPrUrlInput(e.target.value)}
            placeholder="https://github.com/owner/repo/pull/123"
            onKeyDown={(e) => { if (e.key === "Enter" && !addLoading) handleAddPr(); }}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#050509",
                borderRadius: "14px",
                color: "#fff",
                "& fieldset": { borderColor: "#27272a" },
                "&:hover fieldset": { borderColor: "#3f3f46" },
                "&.Mui-focused fieldset": { borderColor: "#19e66b" }
              },
              "& input::placeholder": { color: "#52525b" }
            }}
          />

          {addError && (
            <Paper
              elevation={0}
              sx={{ mt: 2, bgcolor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px", px: 2, py: 1 }}
            >
              <Typography sx={{ color: "#fecaca", fontSize: 13 }}>{addError}</Typography>
            </Paper>
          )}

          <Typography sx={{ color: "#52525b", fontSize: 12, mt: 2 }}>
            Supported formats: https://github.com/owner/repo/pull/123, owner/repo#123
          </Typography>

          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button
              onClick={() => { setAddDialogOpen(false); setAddError(null); setPrUrlInput(""); }}
              sx={{ textTransform: "none", color: "#a1a1aa", borderRadius: "12px", px: 2.5 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPr}
              disabled={!prUrlInput.trim() || addLoading}
              sx={{
                textTransform: "none",
                borderRadius: "12px",
                px: 3,
                fontWeight: 700,
                bgcolor: "#19e66b",
                color: "#000",
                "&:hover": { bgcolor: "#22c55e" },
                "&.Mui-disabled": { bgcolor: "rgba(25,230,107,0.25)", color: "rgba(0,0,0,0.45)" }
              }}
            >
              {addLoading ? <CircularProgress size={18} sx={{ color: "#000" }} /> : "Add PR"}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
