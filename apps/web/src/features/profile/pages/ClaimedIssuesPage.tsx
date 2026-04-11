import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowBack,
  ArrowForward,
  OpenInNew,
  Search
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  InputBase,
  Stack,
  Typography
} from "@mui/material";
import AppLayout from "../../../components/layout/AppLayout";
import { fetchMyClaimedIssues } from "../api/profileApi";
import type {
  ClaimedIssueItem,
  ClaimedIssuesPagination
} from "../types";

function timeAgo(input?: string | null): string {
  if (!input) return "-";
  const diff = Date.now() - new Date(input).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(input?: string | null): string {
  if (!input) return "-";
  return new Date(input).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function claimAge(claimedAt?: string | null) {
  if (!claimedAt) return null;
  const ms = Date.now() - new Date(claimedAt).getTime();
  if (ms < 0) return "today";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days === 0) return "today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function statusChipSx(status: ClaimedIssueItem["status"]) {
  if (status === "claimed") {
    return {
      color: "#d8b4fe",
      bgcolor: "rgba(168,85,247,0.15)",
      border: "1px solid rgba(168,85,247,0.3)"
    };
  }

  if (status === "closed") {
    return {
      color: "#fca5a5",
      bgcolor: "rgba(239,68,68,0.12)",
      border: "1px solid rgba(239,68,68,0.25)"
    };
  }

  return {
    color: "#86efac",
    bgcolor: "rgba(34,197,94,0.12)",
    border: "1px solid rgba(34,197,94,0.25)"
  };
}

function prStatusChipSx(prStatus?: ClaimedIssueItem["prStatus"]) {
  if (prStatus === "MERGED") {
    return {
      color: "#86efac",
      bgcolor: "rgba(34,197,94,0.12)",
      border: "1px solid rgba(34,197,94,0.25)"
    };
  }

  if (prStatus === "PR_OPEN") {
    return {
      color: "#93c5fd",
      bgcolor: "rgba(59,130,246,0.14)",
      border: "1px solid rgba(59,130,246,0.3)"
    };
  }

  if (prStatus === "CLOSED") {
    return {
      color: "#fca5a5",
      bgcolor: "rgba(239,68,68,0.12)",
      border: "1px solid rgba(239,68,68,0.25)"
    };
  }

  return {
    color: "#a1a1aa",
    bgcolor: "rgba(113,113,122,0.12)",
    border: "1px solid rgba(113,113,122,0.25)"
  };
}

export default function ClaimedIssuesPage() {
  const navigate = useNavigate();

  const [issues, setIssues] = useState<ClaimedIssueItem[]>([]);
  const [pagination, setPagination] = useState<ClaimedIssuesPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"all" | "claimed" | "closed">("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadClaimedIssues = useCallback(async (
    page: number,
    query: string,
    status: "all" | "claimed" | "closed"
  ) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchMyClaimedIssues({
        page,
        limit: 10,
        search: query || undefined,
        status
      });
      setIssues(data.issues);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error("Failed to load claimed issues:", err);
      const message = err?.response?.data?.message || "Failed to load claimed issues.";
      setError(message);
      setIssues([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClaimedIssues(1, searchQuery, statusFilter);
  }, [loadClaimedIssues, searchQuery, statusFilter]);

  const handleSearch = () => {
    setSearchQuery(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  const goToPage = (page: number) => {
    loadClaimedIssues(page, searchQuery, statusFilter);
  };

  return (
    <AppLayout activePage="claimed-issues">
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#050509",
          px: { xs: 2, md: 4 },
          py: 4
        }}
      >
        <Box sx={{ maxWidth: 1050, mx: "auto" }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography sx={{ fontSize: 32, fontWeight: 900, color: "#fff" }}>
                My Claimed Issues
              </Typography>
              <Typography sx={{ fontSize: 15, color: "#a1a1aa", mt: 0.4 }}>
                View every issue you claimed and jump straight into PR tracking.
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2 }}>
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "#0b0f17",
                border: "1px solid #27272a",
                borderRadius: "16px",
                px: 1.5,
                py: 0.7
              }}
            >
              <Search sx={{ color: "#a1a1aa", fontSize: 20 }} />
              <InputBase
                fullWidth
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                placeholder="Search by issue title or repository"
                sx={{ color: "#fff", fontSize: 14, "& input::placeholder": { color: "#a1a1aa" } }}
              />
              {searchQuery && (
                <Button
                  onClick={handleClearSearch}
                  sx={{
                    minWidth: 0,
                    px: 1,
                    textTransform: "none",
                    color: "#a1a1aa",
                    fontSize: 12
                  }}
                >
                  Clear
                </Button>
              )}
            </Box>
            <Button
              onClick={handleSearch}
              sx={{
                textTransform: "none",
                borderRadius: "14px",
                px: 2,
                border: "1px solid #27272a",
                color: "#fff",
                bgcolor: "#0b0f17"
              }}
            >
              Search
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
            {[
              { value: "all" as const, label: "All" },
              { value: "claimed" as const, label: "Active Claimed" },
              { value: "closed" as const, label: "Closed" }
            ].map((option) => {
              const isActive = statusFilter === option.value;
              return (
                <Chip
                  key={option.value}
                  label={option.label}
                  onClick={() => setStatusFilter(option.value)}
                  sx={{
                    height: 30,
                    borderRadius: "14px",
                    bgcolor: isActive ? "rgba(25,230,107,0.12)" : "#0b0f17",
                    border: isActive ? "1px solid rgba(25,230,107,0.25)" : "1px solid #27272a",
                    color: isActive ? "#19e66b" : "#a1a1aa",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                />
              );
            })}
          </Stack>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress sx={{ color: "#19e66b" }} />
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography sx={{ color: "#fca5a5", mb: 2 }}>{error}</Typography>
              <Button
                onClick={() => loadClaimedIssues(1, searchQuery, statusFilter)}
                sx={{ textTransform: "none", color: "#19e66b" }}
              >
                Retry
              </Button>
            </Box>
          ) : issues.length === 0 ? (
            <Box
              sx={{
                border: "1px solid #27272a",
                borderRadius: "20px",
                bgcolor: "#0b0f17",
                px: 3,
                py: 6,
                textAlign: "center"
              }}
            >
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 18, mb: 1 }}>
                No claimed issues found
              </Typography>
              <Typography sx={{ color: "#a1a1aa", fontSize: 14 }}>
                Try changing filters or searching with a different keyword.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {issues.map((issue) => {
                const age = claimAge(issue.claimedAt);
                return (
                  <Box
                    key={issue._id}
                    sx={{
                      p: 2.2,
                      borderRadius: "18px",
                      border: "1px solid #27272a",
                      bgcolor: "#0b0f17"
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", lg: "row" }}
                      spacing={2}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", lg: "center" }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 12, color: "#a1a1aa", mb: 0.6, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                          {issue.repoOwner}/{issue.repoName}
                          {issue.repoLanguage ? ` • ${issue.repoLanguage}` : ""}
                          {` • #${issue.githubNumber}`}
                          {` • updated ${timeAgo(issue.githubUpdatedAt)}`}
                        </Typography>
                        <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#fff", mb: 0.7 }}>
                          {issue.title}
                        </Typography>
                        <Typography sx={{ fontSize: 14, color: "#a1a1aa", lineHeight: "21px", mb: 1.4 }}>
                          {issue.summary || issue.body?.slice(0, 180)}
                        </Typography>

                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          <Chip
                            label={issue.status.toUpperCase()}
                            sx={{
                              height: 24,
                              borderRadius: "8px",
                              fontWeight: 700,
                              fontSize: 11,
                              ...statusChipSx(issue.status)
                            }}
                          />
                          {issue.prStatus && issue.prStatus !== "NONE" && (
                            <Chip
                              label={`PR ${issue.prStatus}`}
                              sx={{
                                height: 24,
                                borderRadius: "8px",
                                fontWeight: 700,
                                fontSize: 11,
                                ...prStatusChipSx(issue.prStatus)
                              }}
                            />
                          )}
                          {age && (
                            <Chip
                              label={`Claimed ${age} ago`}
                              sx={{
                                height: 24,
                                borderRadius: "8px",
                                fontWeight: 600,
                                fontSize: 11,
                                color: "#a1a1aa",
                                bgcolor: "rgba(113,113,122,0.12)",
                                border: "1px solid rgba(113,113,122,0.25)"
                              }}
                            />
                          )}
                          <Chip
                            label={`Claimed on ${formatDate(issue.claimedAt)}`}
                            sx={{
                              height: 24,
                              borderRadius: "8px",
                              fontWeight: 600,
                              fontSize: 11,
                              color: "#a1a1aa",
                              bgcolor: "rgba(113,113,122,0.12)",
                              border: "1px solid rgba(113,113,122,0.25)"
                            }}
                          />
                        </Stack>
                      </Box>

                      <Stack direction={{ xs: "row", lg: "column" }} spacing={1}>
                        <Button
                          onClick={() => navigate(`/issues/${issue._id}`, {
                            state: { fromPath: "/profile/claimed-issues", fromPage: "claimed-issues", fromLabel: "claimed issues" }
                          })}
                          sx={{
                            minHeight: 36,
                            textTransform: "none",
                            borderRadius: "12px",
                            px: 2,
                            fontWeight: 700,
                            bgcolor: "#19e66b",
                            color: "#000",
                            whiteSpace: "nowrap",
                            "&:hover": { bgcolor: "#22c55e" }
                          }}
                        >
                          Track
                        </Button>
                        <Button
                          component="a"
                          href={issue.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                          sx={{
                            minHeight: 36,
                            textTransform: "none",
                            borderRadius: "12px",
                            px: 2,
                            fontWeight: 600,
                            border: "1px solid #27272a",
                            color: "#fff",
                            bgcolor: "transparent",
                            whiteSpace: "nowrap"
                          }}
                        >
                          GitHub
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}

          {pagination && pagination.totalPages > 1 && !loading && !error && (
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mt: 3, pt: 3, borderTop: "1px solid #27272a" }}
            >
              <Button
                startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
                disabled={pagination.page <= 1}
                onClick={() => goToPage(pagination.page - 1)}
                sx={{ textTransform: "none", color: "#a1a1aa" }}
              >
                Previous
              </Button>

              <Typography sx={{ color: "#a1a1aa", fontSize: 13 }}>
                Page {pagination.page} of {pagination.totalPages}
              </Typography>

              <Button
                endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => goToPage(pagination.page + 1)}
                sx={{ textTransform: "none", color: "#a1a1aa" }}
              >
                Next
              </Button>
            </Stack>
          )}

          {pagination && !loading && !error && (
            <Typography sx={{ mt: 3, color: "#71717a", fontSize: 12, textAlign: "center" }}>
              Showing {issues.length} of {pagination.total} claimed issues
            </Typography>
          )}
        </Box>
      </Box>
    </AppLayout>
  );
}
