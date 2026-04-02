import { useState, useEffect, useCallback } from "react";
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
  fetchClaimedIssues,
  fetchClaimStats,
  forceReleaseClaim,
  type ClaimedIssue,
  type ClaimStats,
  type Pagination as PaginationType
} from "../api/adminApi";

const EMPTY_CLAIM_STATS: ClaimStats = {
  totalClaimed: 0,
  stale7Days: 0,
  stale14Days: 0,
  withPrOpen: 0,
  withPrMerged: 0,
  activeClaims: 0
};

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <Box sx={{ bgcolor: "#0b0f17", border: "1px solid #27272a", borderRadius: "12px", p: 2, flex: 1, minWidth: 130 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <MSym name={icon} sx={{ fontSize: 16, color }} />
        <Typography sx={{ color: "#71717a", fontSize: 11, fontWeight: 500 }}>{label}</Typography>
      </Stack>
      <Typography sx={{ color, fontSize: 24, fontWeight: 600 }}>{value}</Typography>
    </Box>
  );
}

export default function ClaimsMonitoringPage() {
  const [claims, setClaims] = useState<ClaimedIssue[]>([]);
  const [stats, setStats] = useState<ClaimStats>(EMPTY_CLAIM_STATS);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [staleOnly, setStaleOnly] = useState("");
  const [staleDays, setStaleDays] = useState<number>(7);

  const [releaseDialog, setReleaseDialog] = useState<{ open: boolean; issue: ClaimedIssue | null; reason: string; loading: boolean }>({
    open: false, issue: null, reason: "", loading: false
  });

  const loadClaims = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    let accessError: string | null = null;

    try {
      const claimsRes = await fetchClaimedIssues({
        page,
        limit: 20,
        search: search || undefined,
        staleOnly: staleOnly || undefined,
        staleDays
      });
      setClaims(claimsRes.issues || []);
      setPagination(
        claimsRes.pagination || {
          page,
          limit: 20,
          total: 0,
          totalPages: 0
        }
      );
    } catch (err: any) {
      const status = err?.response?.status;
      setClaims([]);
      setPagination({ page, limit: 20, total: 0, totalPages: 0 });
      if (status === 401 || status === 403) {
        accessError = err.response?.data?.message || "Access denied";
      }
    }

    try {
      const statsRes = await fetchClaimStats();
      setStats(statsRes || EMPTY_CLAIM_STATS);
    } catch {
      setStats(EMPTY_CLAIM_STATS);
    }

    if (accessError) {
      setError(accessError);
    }

    setLoading(false);
  }, [search, staleOnly, staleDays]);

  useEffect(() => { loadClaims(1); }, [staleOnly, staleDays]);

  useEffect(() => {
    const t = setTimeout(() => loadClaims(1), 300);
    return () => clearTimeout(t);
  }, [search, loadClaims]);

  async function handleRelease() {
    if (!releaseDialog.issue) return;
    setReleaseDialog((p) => ({ ...p, loading: true }));
    try {
      await forceReleaseClaim(releaseDialog.issue._id, releaseDialog.reason);
      setReleaseDialog({ open: false, issue: null, reason: "", loading: false });
      loadClaims(1);
    } catch {
      setError("Failed to release claim");
      setReleaseDialog((p) => ({ ...p, loading: false }));
    }
  }

  function formatDate(d: string | null) {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
            <Typography sx={{ fontSize: 22, fontWeight: 600 }}>Claims Monitoring</Typography>
            <Typography sx={{ color: "#a1a1aa", fontSize: 14 }}>Track claimed issues and manage stale claims</Typography>
          </Box>
          <Button
            onClick={() => loadClaims(1)}
            disabled={loading}
            startIcon={<MSym name="refresh" sx={{ fontSize: 16 }} />}
            sx={{ textTransform: "none", color: "#a1a1aa", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.05)" } }}
          >
            Refresh
          </Button>
        </Stack>

        {/* Stats */}
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <StatCard icon="assignment_ind" label="Total Claimed" value={stats.totalClaimed} color="#3b82f6" />
          <StatCard icon="radio_button_checked" label="Active Claims" value={stats.activeClaims} color="#22c55e" />
          <StatCard icon="schedule" label="Stale (7+ days)" value={stats.stale7Days} color="#fb923c" />
          <StatCard icon="warning" label="Stale (14+ days)" value={stats.stale14Days} color="#ef4444" />
          <StatCard icon="fork_right" label="PR Open" value={stats.withPrOpen} color="#a855f7" />
          <StatCard icon="check_circle" label="PR Merged" value={stats.withPrMerged} color="#22c55e" />
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ bgcolor: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", "& .MuiAlert-icon": { color: "#f87171" } }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Search by title, user, repo..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: 260,
              "& .MuiOutlinedInput-root": { bgcolor: "#0b0f17", color: "#fff", "& fieldset": { borderColor: "#27272a" } }
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel sx={{ color: "#71717a" }}>Stale Filter</InputLabel>
            <Select value={staleOnly} label="Stale Filter" onChange={(e) => setStaleOnly(e.target.value)}
              sx={{ bgcolor: "#0b0f17", color: "#fff", "& fieldset": { borderColor: "#27272a" } }}>
              <MenuItem value="">All Claims</MenuItem>
              <MenuItem value="true">Stale Only</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: "#71717a" }}>Stale Days</InputLabel>
            <Select value={staleDays} label="Stale Days" onChange={(e) => setStaleDays(e.target.value as number)}
              sx={{ bgcolor: "#0b0f17", color: "#fff", "& fieldset": { borderColor: "#27272a" } }}>
              <MenuItem value={3}>3 days</MenuItem>
              <MenuItem value={7}>7 days</MenuItem>
              <MenuItem value={14}>14 days</MenuItem>
              <MenuItem value={30}>30 days</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Table */}
        <TableContainer sx={{ bgcolor: "#0b0f17", border: "1px solid #27272a", borderRadius: "12px" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Issue</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Repository</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Claimed By</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Claimed At</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Days</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>PR Status</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} sx={{ color: "#fb923c" }} />
                  </TableCell>
                </TableRow>
              ) : claims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: "#71717a" }}>
                    No claimed issues found
                  </TableCell>
                </TableRow>
              ) : (
                claims.map((claim) => (
                  <TableRow key={claim._id} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {claim.isStale && (
                          <Tooltip title={`Stale: ${claim.daysSinceClaim} days`}>
                            <MSym name="warning" sx={{ fontSize: 16, color: "#fb923c" }} />
                          </Tooltip>
                        )}
                        <Box>
                          <Link href={claim.githubUrl} target="_blank" rel="noopener"
                            sx={{ color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                            #{claim.githubNumber}
                          </Link>
                          <Typography sx={{ color: "#71717a", fontSize: 12, maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {claim.title}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, color: "#a1a1aa" }}>{claim.repoOwner}/{claim.repoName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar src={`https://github.com/${claim.claimedByLogin}.png`} sx={{ width: 24, height: 24 }} />
                        <Link href={`https://github.com/${claim.claimedByLogin}`} target="_blank" rel="noopener"
                          sx={{ color: "#fff", fontSize: 13, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                          {claim.claimedByLogin}
                        </Link>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ color: "#a1a1aa", fontSize: 13 }}>{formatDate(claim.claimedAt)}</TableCell>
                    <TableCell>
                      <Chip label={`${claim.daysSinceClaim}d`} size="small" sx={{
                        fontSize: 11,
                        bgcolor: claim.daysSinceClaim >= 14 ? "rgba(239,68,68,0.2)" : claim.daysSinceClaim >= 7 ? "rgba(251,146,60,0.2)" : "rgba(107,114,128,0.2)",
                        color: claim.daysSinceClaim >= 14 ? "#ef4444" : claim.daysSinceClaim >= 7 ? "#fb923c" : "#a1a1aa"
                      }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={claim.prStatus || "NONE"} size="small" sx={{
                        fontSize: 11,
                        bgcolor: claim.prStatus === "MERGED" ? "rgba(34,197,94,0.2)" : claim.prStatus === "PR_OPEN" ? "rgba(59,130,246,0.2)" : "rgba(107,114,128,0.2)",
                        color: claim.prStatus === "MERGED" ? "#22c55e" : claim.prStatus === "PR_OPEN" ? "#3b82f6" : "#71717a"
                      }} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Force Release Claim">
                        <IconButton size="small" onClick={() => setReleaseDialog({ open: true, issue: claim, reason: "", loading: false })}
                          sx={{ color: "#ef4444" }}>
                          <MSym name="person_remove" sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
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
            <Pagination count={pagination.totalPages} page={pagination.page} onChange={(_, p) => loadClaims(p)}
              sx={{
                "& .MuiPaginationItem-root": { color: "#a1a1aa" },
                "& .Mui-selected": { bgcolor: "rgba(251,146,60,0.2) !important", color: "#fb923c" }
              }}
            />
          </Stack>
        )}
      </Stack>

      {/* Release Dialog */}
      <Dialog open={releaseDialog.open}
        onClose={() => !releaseDialog.loading && setReleaseDialog({ open: false, issue: null, reason: "", loading: false })}
        PaperProps={{ sx: { bgcolor: "#0b0f17", border: "1px solid #27272a", minWidth: 420 } }}>
        <DialogTitle sx={{ color: "#fff" }}>Force Release Claim</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#a1a1aa", fontSize: 14, mb: 2 }}>
            Release the claim on issue <strong style={{ color: "#fff" }}>#{releaseDialog.issue?.githubNumber}</strong> by <strong style={{ color: "#fff" }}>{releaseDialog.issue?.claimedByLogin}</strong>?
          </Typography>
          <TextField
            fullWidth
            placeholder="Reason (optional)"
            value={releaseDialog.reason}
            onChange={(e) => setReleaseDialog((p) => ({ ...p, reason: e.target.value }))}
            multiline rows={2}
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#050509", color: "#fff", "& fieldset": { borderColor: "#27272a" }, "&:hover fieldset": { borderColor: "#3f3f46" } } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReleaseDialog({ open: false, issue: null, reason: "", loading: false })} disabled={releaseDialog.loading} sx={{ color: "#a1a1aa" }}>
            Cancel
          </Button>
          <Button onClick={handleRelease} disabled={releaseDialog.loading} variant="contained"
            sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}>
            {releaseDialog.loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Release Claim"}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
