import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  FormControl,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import MSym from "../../resources/components/MSym";
import AdminLayout from "../components/AdminLayout";
import {
  fetchAdminPrs,
  fetchPrRepositories,
  fetchPrStats,
  verifyPr,
  detachPr,
  resetPrVerification,
  deleteAllPrs,
  type PrTrackingAdmin,
  type PrRepositorySummary,
  type PrStats,
  type Pagination as PaginationType
} from "../api/adminApi";

const EMPTY_PR_STATS: PrStats = {
  totalPrs: 0,
  pendingVerification: 0,
  verified: 0,
  validPrs: 0,
  invalidPrs: 0,
  merged: 0,
  prOpen: 0
};

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <Box sx={{ bgcolor: "#0b0f17", border: "1px solid #27272a", borderRadius: "12px", p: 2, flex: 1, minWidth: 120 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <MSym name={icon} sx={{ fontSize: 16, color }} />
        <Typography sx={{ color: "#71717a", fontSize: 11, fontWeight: 500 }}>{label}</Typography>
      </Stack>
      <Typography sx={{ color, fontSize: 24, fontWeight: 600 }}>{value}</Typography>
    </Box>
  );
}

export default function PrVerificationPage() {
  const location = useLocation();
  const isModeratorRoute = location.pathname.startsWith("/moderator");
  const canOverrideVerified = !isModeratorRoute;

  const [prs, setPrs] = useState<PrTrackingAdmin[]>([]);
  const [repoSummaries, setRepoSummaries] = useState<PrRepositorySummary[]>([]);
  const [stats, setStats] = useState<PrStats>(EMPTY_PR_STATS);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [repoSummaryLoading, setRepoSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [isVerified, setIsVerified] = useState("");
  const [isValid, setIsValid] = useState("");
  const [status, setStatus] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [repoFullName, setRepoFullName] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const [verifyDialog, setVerifyDialog] = useState<{ open: boolean; pr: PrTrackingAdmin | null; isValid: boolean; note: string; loading: boolean }>({
    open: false, pr: null, isValid: true, note: "", loading: false
  });
  const [detachDialog, setDetachDialog] = useState<{ open: boolean; pr: PrTrackingAdmin | null; loading: boolean }>({
    open: false, pr: null, loading: false
  });
  const [deleteAllDialog, setDeleteAllDialog] = useState<{ open: boolean; loading: boolean }>({
    open: false,
    loading: false
  });

  const loadPrs = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    let accessError: string | null = null;

    try {
      const prsRes = await fetchAdminPrs({
        page,
        limit: 20,
        search: search || undefined,
        isVerified: isVerified || undefined,
        isValid: isValid || undefined,
        status: status || undefined,
        difficulty: (difficulty || undefined) as "beginner" | "intermediate" | "advanced" | undefined,
        repoFullName: repoFullName || undefined
      });

      setPrs(prsRes.prs || []);
      setPagination(
        prsRes.pagination || {
          page,
          limit: 20,
          total: 0,
          totalPages: 0
        }
      );
    } catch (err: any) {
      const statusCode = err?.response?.status;
      setPrs([]);
      setPagination({ page, limit: 20, total: 0, totalPages: 0 });
      if (statusCode === 401 || statusCode === 403) {
        accessError = err.response?.data?.message || "Access denied";
      }
    }

    try {
      const statsRes = await fetchPrStats();
      setStats(statsRes || EMPTY_PR_STATS);
    } catch {
      setStats(EMPTY_PR_STATS);
    }

    if (accessError) {
      setError(accessError);
    }

    setLoading(false);
  }, [search, isVerified, isValid, status, difficulty, repoFullName]);

  const loadRepositorySummaries = useCallback(async () => {
    setRepoSummaryLoading(true);
    try {
      const reposRes = await fetchPrRepositories({
        search: search || undefined,
        isVerified: isVerified || undefined,
        isValid: isValid || undefined,
        status: status || undefined,
        difficulty: (difficulty || undefined) as "beginner" | "intermediate" | "advanced" | undefined
      });
      setRepoSummaries(reposRes.repositories || []);
    } catch {
      setRepoSummaries([]);
    } finally {
      setRepoSummaryLoading(false);
    }
  }, [search, isVerified, isValid, status, difficulty]);

  useEffect(() => {
    loadPrs(1);
    loadRepositorySummaries();
  }, [isVerified, isValid, status, difficulty, repoFullName]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadPrs(1);
      loadRepositorySummaries();
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function handleQuickVerify(pr: PrTrackingAdmin, valid: boolean) {
    try {
      setSuccess(null);
      await verifyPr(pr._id, valid);
      loadPrs(pagination.page);
      loadRepositorySummaries();
    } catch {
      setError(`Failed to ${valid ? "approve" : "reject"} PR`);
    }
  }

  async function handleQuickReset(pr: PrTrackingAdmin) {
    try {
      setSuccess(null);
      await resetPrVerification(pr._id);
      loadPrs(pagination.page);
      loadRepositorySummaries();
    } catch {
      setError("Failed to reset");
    }
  }

  async function handleVerifySubmit() {
    if (!verifyDialog.pr) return;
    setVerifyDialog((p) => ({ ...p, loading: true }));
    try {
      setSuccess(null);
      await verifyPr(verifyDialog.pr._id, verifyDialog.isValid, verifyDialog.note || undefined);
      setVerifyDialog({ open: false, pr: null, isValid: true, note: "", loading: false });
      loadPrs(pagination.page);
      loadRepositorySummaries();
    } catch {
      setError("Failed to verify PR");
      setVerifyDialog((p) => ({ ...p, loading: false }));
    }
  }

  async function handleDetach() {
    if (!detachDialog.pr) return;
    setDetachDialog((p) => ({ ...p, loading: true }));
    try {
      setSuccess(null);
      await detachPr(detachDialog.pr._id);
      setDetachDialog({ open: false, pr: null, loading: false });
      loadPrs(pagination.page);
      loadRepositorySummaries();
    } catch {
      setError("Failed to detach PR");
      setDetachDialog((p) => ({ ...p, loading: false }));
    }
  }

  function formatDate(d: string | null) {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function difficultyColors(level?: "beginner" | "intermediate" | "advanced") {
    if (level === "beginner") {
      return { label: "Beginner", bg: "rgba(34,197,94,0.2)", color: "#22c55e" };
    }
    if (level === "advanced") {
      return { label: "Advanced", bg: "rgba(239,68,68,0.2)", color: "#ef4444" };
    }
    return { label: "Intermediate", bg: "rgba(251,146,60,0.2)", color: "#fb923c" };
  }

  async function handleDeleteAll() {
    setDeleteAllDialog((p) => ({ ...p, loading: true }));
    setError(null);
    setSuccess(null);
    try {
      const result = await deleteAllPrs();
      setDeleteAllDialog({ open: false, loading: false });
      setSuccess(
        result.deletedCount > 0
          ? `Deleted ${result.deletedCount} PR records.`
          : "No PR records were available to delete."
      );
      loadPrs(1);
      loadRepositorySummaries();
    } catch {
      setError("Failed to delete all PR records");
      setDeleteAllDialog((p) => ({ ...p, loading: false }));
    }
  }

  return (
    <AdminLayout>
      <Stack spacing={3}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          flexWrap="wrap"
          useFlexGap
          gap={1.5}
        >
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 600 }}>PR Verification</Typography>
            <Typography sx={{ color: "#a1a1aa", fontSize: 14 }}>Verify and validate pull requests</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => loadPrs(1)} disabled={loading}
              startIcon={<MSym name="refresh" sx={{ fontSize: 16 }} />}
              sx={{ textTransform: "none", color: "#a1a1aa", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.05)" } }}>
              Refresh
            </Button>
            <Button
              onClick={() => setDeleteAllDialog({ open: true, loading: false })}
              disabled={loading || stats.totalPrs === 0}
              startIcon={<MSym name="delete_sweep" sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: "none",
                color: "#ef4444",
                borderColor: "rgba(239,68,68,0.4)",
                "&:hover": { bgcolor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.6)" }
              }}
              variant="outlined"
            >
              Delete All PRs
            </Button>
          </Stack>
        </Stack>

        {/* Stats */}
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <StatCard icon="fork_right" label="Total PRs" value={stats.totalPrs} color="#3b82f6" />
          <StatCard icon="pending" label="Pending Review" value={stats.pendingVerification} color="#fb923c" />
          <StatCard icon="verified" label="Valid PRs" value={stats.validPrs} color="#22c55e" />
          <StatCard icon="cancel" label="Invalid PRs" value={stats.invalidPrs} color="#ef4444" />
          <StatCard icon="check_circle" label="Merged" value={stats.merged} color="#22c55e" />
          <StatCard icon="radio_button_checked" label="PR Open" value={stats.prOpen} color="#a855f7" />
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ bgcolor: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", "& .MuiAlert-icon": { color: "#f87171" } }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ bgcolor: "rgba(34,197,94,0.1)", color: "#86efac", border: "1px solid rgba(34,197,94,0.2)", "& .MuiAlert-icon": { color: "#86efac" } }}>
            {success}
          </Alert>
        )}

        {/* Filters */}
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField placeholder="Search PRs..." size="small" value={search} onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 260, "& .MuiOutlinedInput-root": { bgcolor: "#0b0f17", color: "#fff", "& fieldset": { borderColor: "#27272a" } } }} />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel sx={{ color: "#71717a" }}>Verified</InputLabel>
            <Select value={isVerified} label="Verified" onChange={(e) => setIsVerified(e.target.value)}
              sx={{ bgcolor: "#0b0f17", color: "#fff", "& fieldset": { borderColor: "#27272a" } }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Verified</MenuItem>
              <MenuItem value="false">Pending</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel sx={{ color: "#71717a" }}>Validity</InputLabel>
            <Select value={isValid} label="Validity" onChange={(e) => setIsValid(e.target.value)}
              sx={{ bgcolor: "#0b0f17", color: "#fff", "& fieldset": { borderColor: "#27272a" } }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Valid</MenuItem>
              <MenuItem value="false">Invalid</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel sx={{ color: "#71717a" }}>Status</InputLabel>
            <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}
              sx={{ bgcolor: "#0b0f17", color: "#fff", "& fieldset": { borderColor: "#27272a" } }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="PR_OPEN">PR Open</MenuItem>
              <MenuItem value="MERGED">Merged</MenuItem>
              <MenuItem value="CLOSED">Closed</MenuItem>
              <MenuItem value="ACCEPTED">Accepted</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: "#71717a" }}>Difficulty</InputLabel>
            <Select value={difficulty} label="Difficulty" onChange={(e) => setDifficulty(e.target.value)}
              sx={{ bgcolor: "#0b0f17", color: "#fff", "& fieldset": { borderColor: "#27272a" } }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel sx={{ color: "#71717a" }}>Repository</InputLabel>
            <Select value={repoFullName} label="Repository" onChange={(e) => setRepoFullName(e.target.value)}
              sx={{ bgcolor: "#0b0f17", color: "#fff", "& fieldset": { borderColor: "#27272a" } }}>
              <MenuItem value="">All Repositories</MenuItem>
              {repoSummaries.map((repo) => (
                <MenuItem key={repo.repoFullName} value={repo.repoFullName}>
                  {repo.repoFullName} ({repo.totalPrs})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {repoFullName && (
            <Button
              size="small"
              onClick={() => setRepoFullName("")}
              sx={{ color: "#a1a1aa", textTransform: "none" }}
            >
              Clear Repo Filter
            </Button>
          )}
        </Stack>

        <Box sx={{ bgcolor: "#0b0f17", border: "1px solid #27272a", borderRadius: "12px", p: 2 }}>
          <Stack spacing={1.5}>
            <Box>
              <Typography sx={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>
                PRs By Repository
              </Typography>
              <Typography sx={{ color: "#71717a", fontSize: 12 }}>
                Repository buckets for your moderation scope. Click a repository to filter the table.
              </Typography>
            </Box>
            {repoSummaryLoading ? (
              <Stack alignItems="center" sx={{ py: 2 }}>
                <CircularProgress size={20} sx={{ color: "#38bdf8" }} />
              </Stack>
            ) : repoSummaries.length === 0 ? (
              <Typography sx={{ color: "#71717a", fontSize: 13 }}>
                No repository PR records found for current filters.
              </Typography>
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {repoSummaries.map((repo) => {
                  const selected = repo.repoFullName === repoFullName;
                  return (
                    <Button
                      key={repo.repoFullName}
                      onClick={() => setRepoFullName(repo.repoFullName)}
                      sx={{
                        textTransform: "none",
                        borderRadius: "999px",
                        border: selected ? "1px solid rgba(56,189,248,0.6)" : "1px solid #27272a",
                        bgcolor: selected ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.02)",
                        color: selected ? "#38bdf8" : "#e4e4e7",
                        px: 1.25,
                        py: 0.4,
                        minHeight: 0
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography sx={{ fontSize: 12 }}>{repo.repoFullName}</Typography>
                        <Chip
                          label={`${repo.pendingVerification} pending`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: 10,
                            bgcolor: "rgba(251,146,60,0.15)",
                            color: "#fb923c"
                          }}
                        />
                      </Stack>
                    </Button>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </Box>

        {/* Table */}
        <TableContainer sx={{ bgcolor: "#0b0f17", border: "1px solid #27272a", borderRadius: "12px" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>PR</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Repository</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Author</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Difficulty</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Verification</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Verified By</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} sx={{ color: "#fb923c" }} />
                  </TableCell>
                </TableRow>
              ) : prs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: "#71717a" }}>No PRs found</TableCell>
                </TableRow>
              ) : (
                prs.map((pr) => (
                  <TableRow key={pr._id} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}>
                    <TableCell>
                      {pr.prUrl ? (
                        <Link href={pr.prUrl} target="_blank" rel="noopener"
                          sx={{ color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                          #{pr.prNumber}
                        </Link>
                      ) : (
                        <Typography sx={{ color: "#71717a", fontSize: 13 }}>No PR</Typography>
                      )}
                      <Typography sx={{ color: "#71717a", fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {pr.prTitle || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, color: "#a1a1aa" }}>{pr.repoFullName}</Typography>
                      <Typography sx={{ fontSize: 11, color: "#71717a" }}>Issue #{pr.issueNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {pr.userId ? (
                          <>
                            <Avatar src={pr.userId.avatarUrl} sx={{ width: 24, height: 24 }} />
                            <Link href={`https://github.com/${pr.userId.login}`} target="_blank" rel="noopener"
                              sx={{ color: "#fff", fontSize: 13, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                              {pr.userId.login}
                            </Link>
                          </>
                        ) : (
                          <Typography sx={{ color: "#71717a", fontSize: 13 }}>-</Typography>
                        )}
                      </Stack>
                      {pr.prAuthor && pr.prAuthor !== pr.userId?.login && (
                        <Typography sx={{ fontSize: 11, color: "#fb923c" }}>PR by: {pr.prAuthor}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={pr.status} size="small" sx={{
                        fontSize: 11,
                        bgcolor: pr.status === "MERGED" ? "rgba(34,197,94,0.2)" : pr.status === "PR_OPEN" ? "rgba(59,130,246,0.2)" : pr.status === "CLOSED" ? "rgba(239,68,68,0.2)" : "rgba(107,114,128,0.2)",
                        color: pr.status === "MERGED" ? "#22c55e" : pr.status === "PR_OPEN" ? "#3b82f6" : pr.status === "CLOSED" ? "#ef4444" : "#a1a1aa"
                      }} />
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const style = difficultyColors(pr.difficulty);
                        return (
                          <Chip
                            label={style.label}
                            size="small"
                            sx={{
                              fontSize: 11,
                              bgcolor: style.bg,
                              color: style.color
                            }}
                          />
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <MSym name={!pr.isVerified ? "pending" : pr.isValid ? "verified" : "cancel"} sx={{
                          fontSize: 16,
                          color: !pr.isVerified ? "#71717a" : pr.isValid ? "#22c55e" : "#ef4444"
                        }} />
                        <Box>
                          <Typography sx={{ fontSize: 13, color: "#fff" }}>
                            {!pr.isVerified ? "Pending" : pr.isValid ? "Valid" : "Invalid"}
                          </Typography>
                          {pr.verificationNote && (
                            <Tooltip title={pr.verificationNote}>
                              <Typography sx={{ fontSize: 11, color: "#71717a", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {pr.verificationNote}
                              </Typography>
                            </Tooltip>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {pr.verifiedBy ? (
                        <Box>
                          <Typography sx={{ fontSize: 13, color: "#a1a1aa" }}>{pr.verifiedBy.login}</Typography>
                          <Typography sx={{ fontSize: 11, color: "#71717a" }}>{formatDate(pr.verifiedAt)}</Typography>
                        </Box>
                      ) : (
                        <Typography sx={{ color: "#71717a", fontSize: 13 }}>-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {!pr.isVerified ? (
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Mark Valid">
                            <IconButton size="small" onClick={() => handleQuickVerify(pr, true)} sx={{ color: "#22c55e" }}>
                              <MSym name="check_circle" sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Mark Invalid">
                            <IconButton size="small" onClick={() => setVerifyDialog({ open: true, pr, isValid: false, note: "", loading: false })} sx={{ color: "#ef4444" }}>
                              <MSym name="cancel" sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ) : (
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {canOverrideVerified && (
                            <>
                              <Tooltip title={pr.isValid ? "Keep Valid" : "Override to Valid"}>
                                <IconButton size="small" onClick={() => handleQuickVerify(pr, true)} sx={{ color: "#22c55e" }}>
                                  <MSym name="check_circle" sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={pr.isValid ? "Override to Invalid" : "Keep Invalid"}>
                                <IconButton size="small" onClick={() => setVerifyDialog({ open: true, pr, isValid: false, note: "", loading: false })} sx={{ color: "#ef4444" }}>
                                  <MSym name="cancel" sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip title="Reset Verification">
                            <IconButton size="small" onClick={() => handleQuickReset(pr)} sx={{ color: "#a1a1aa" }}>
                              <MSym name="undo" sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          {pr.isValid === false && (
                            <Tooltip title="Detach PR">
                              <IconButton size="small" onClick={() => setDetachDialog({ open: true, pr, loading: false })} sx={{ color: "#fb923c" }}>
                                <MSym name="link_off" sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Stack direction="row" justifyContent="center">
            <Pagination count={pagination.totalPages} page={pagination.page} onChange={(_, p) => loadPrs(p)}
              sx={{ "& .MuiPaginationItem-root": { color: "#a1a1aa" }, "& .Mui-selected": { bgcolor: "rgba(251,146,60,0.2) !important", color: "#fb923c" } }} />
          </Stack>
        )}
      </Stack>

      {/* Verify Dialog */}
      <Dialog open={verifyDialog.open}
        onClose={() => !verifyDialog.loading && setVerifyDialog({ open: false, pr: null, isValid: true, note: "", loading: false })}
        PaperProps={{ sx: { bgcolor: "#0b0f17", border: "1px solid #27272a", minWidth: 420 } }}>
        <DialogTitle sx={{ color: "#fff" }}>
          {verifyDialog.isValid ? "Mark PR as Valid" : "Mark PR as Invalid"}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#a1a1aa", fontSize: 14, mb: 2 }}>
            {verifyDialog.isValid ? "Confirm this PR is valid." : "Please provide a reason for marking as invalid."}
          </Typography>
          <TextField fullWidth placeholder={verifyDialog.isValid ? "Note (optional)" : "Reason (required)"}
            value={verifyDialog.note} onChange={(e) => setVerifyDialog((p) => ({ ...p, note: e.target.value }))}
            multiline rows={2} required={!verifyDialog.isValid}
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#050509", color: "#fff", "& fieldset": { borderColor: "#27272a" }, "&:hover fieldset": { borderColor: "#3f3f46" } } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setVerifyDialog({ open: false, pr: null, isValid: true, note: "", loading: false })} disabled={verifyDialog.loading} sx={{ color: "#a1a1aa" }}>Cancel</Button>
          <Button onClick={handleVerifySubmit} disabled={verifyDialog.loading || (!verifyDialog.isValid && !verifyDialog.note.trim())} variant="contained"
            sx={{ bgcolor: verifyDialog.isValid ? "#22c55e" : "#ef4444", "&:hover": { bgcolor: verifyDialog.isValid ? "#16a34a" : "#dc2626" } }}>
            {verifyDialog.loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : verifyDialog.isValid ? "Mark Valid" : "Mark Invalid"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detach Dialog */}
      <Dialog open={detachDialog.open}
        onClose={() => !detachDialog.loading && setDetachDialog({ open: false, pr: null, loading: false })}
        PaperProps={{ sx: { bgcolor: "#0b0f17", border: "1px solid #27272a", minWidth: 420 } }}>
        <DialogTitle sx={{ color: "#fff" }}>Detach PR</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#a1a1aa", fontSize: 14 }}>
            Detach PR <strong style={{ color: "#fff" }}>#{detachDialog.pr?.prNumber}</strong> from the issue? This will allow the user to submit a new PR.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDetachDialog({ open: false, pr: null, loading: false })} disabled={detachDialog.loading} sx={{ color: "#a1a1aa" }}>Cancel</Button>
          <Button onClick={handleDetach} disabled={detachDialog.loading} variant="contained"
            sx={{ bgcolor: "#fb923c", "&:hover": { bgcolor: "#f97316" } }}>
            {detachDialog.loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Detach PR"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete All Dialog */}
      <Dialog open={deleteAllDialog.open}
        onClose={() => !deleteAllDialog.loading && setDeleteAllDialog({ open: false, loading: false })}
        PaperProps={{ sx: { bgcolor: "#0b0f17", border: "1px solid #27272a", minWidth: 420 } }}>
        <DialogTitle sx={{ color: "#fff" }}>Delete All PRs</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#a1a1aa", fontSize: 14 }}>
            This will permanently delete all PR tracking records.
          </Typography>
          <Typography sx={{ color: "#f87171", fontSize: 13, mt: 1.5 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteAllDialog({ open: false, loading: false })} disabled={deleteAllDialog.loading} sx={{ color: "#a1a1aa" }}>Cancel</Button>
          <Button onClick={handleDeleteAll} disabled={deleteAllDialog.loading} variant="contained"
            sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}>
            {deleteAllDialog.loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Delete All"}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
