import { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Pagination,
  Paper,
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
  fetchAdminIssues,
  fetchIssueRepositories,
  fetchIssueStats,
  approveIssue,
  rejectIssue,
  updateIssue,
  toggleIssueVisibility,
  bulkApproveIssues,
  bulkSetVisibility,
  type AdminIssue,
  type IssueRepositorySummary,
  type IssueDifficulty,
  type Pagination as PaginationType,
  type IssueStats
} from "../api/adminApi";

const EMPTY_ISSUE_STATS: IssueStats = {
  total: 0,
  approved: 0,
  visible: 0,
  pending: 0,
  beginnerFriendly: 0
};

function IssueModerationPage() {
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [repoSummaries, setRepoSummaries] = useState<IssueRepositorySummary[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState<IssueStats>(EMPTY_ISSUE_STATS);
  const [loading, setLoading] = useState(true);
  const [repoSummaryLoading, setRepoSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterApproved, setFilterApproved] = useState<string>("");
  const [filterVisible, setFilterVisible] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("");
  const [filterRepoFullName, setFilterRepoFullName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadIssues = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit: 20 };
      if (filterApproved) params.isApproved = filterApproved;
      if (filterVisible) params.isVisible = filterVisible;
      if (filterStatus) params.status = filterStatus;
      if (filterDifficulty) params.difficulty = filterDifficulty;
      if (filterRepoFullName) params.repoFullName = filterRepoFullName;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await fetchAdminIssues(params);
      setIssues(data.issues);
      setPagination(data.pagination);
      setError(null);
    } catch (err: any) {
      const status = err?.response?.status;
      setIssues([]);
      setPagination({
        page,
        limit: 20,
        total: 0,
        totalPages: 0
      });
      if (status === 401 || status === 403) {
        setError(err.response?.data?.message || "Access denied");
      } else {
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, [filterApproved, filterVisible, filterStatus, filterDifficulty, filterRepoFullName, searchQuery]);

  const loadRepositorySummaries = useCallback(async () => {
    try {
      setRepoSummaryLoading(true);
      const params: Record<string, any> = {};
      if (filterApproved) params.isApproved = filterApproved;
      if (filterVisible) params.isVisible = filterVisible;
      if (filterStatus) params.status = filterStatus;
      if (filterDifficulty) params.difficulty = filterDifficulty;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await fetchIssueRepositories(params);
      setRepoSummaries(data.repositories || []);
    } catch (err) {
      console.error("Failed to load repository summaries:", err);
      setRepoSummaries([]);
    } finally {
      setRepoSummaryLoading(false);
    }
  }, [filterApproved, filterVisible, filterStatus, filterDifficulty, searchQuery]);

  const loadStats = async () => {
    try {
      const data = await fetchIssueStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats:", err);
      setStats(EMPTY_ISSUE_STATS);
    }
  };

  useEffect(() => {
    loadIssues(1);
    loadStats();
    loadRepositorySummaries();
  }, [filterApproved, filterVisible, filterStatus, filterDifficulty, filterRepoFullName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadIssues(1);
      loadRepositorySummaries();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadIssues, loadRepositorySummaries]);

  const handleApprove = async (issue: AdminIssue) => {
    try {
      setActionLoading(issue._id);
      const updated = await approveIssue(issue._id);
      setIssues((prev) => prev.map((i) => (i._id === issue._id ? { ...i, ...updated } : i)));
      loadStats();
    } catch (err) {
      console.error("Failed to approve:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (issue: AdminIssue) => {
    try {
      setActionLoading(issue._id);
      const updated = await rejectIssue(issue._id);
      setIssues((prev) => prev.map((i) => (i._id === issue._id ? { ...i, ...updated } : i)));
      loadStats();
    } catch (err) {
      console.error("Failed to reject:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleVisibility = async (issue: AdminIssue) => {
    try {
      setActionLoading(issue._id);
      const updated = await toggleIssueVisibility(issue._id);
      setIssues((prev) =>
        prev.map((i) => (i._id === issue._id ? { ...i, isVisible: updated.isVisible } : i))
      );
      loadStats();
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const getDifficulty = (issue: AdminIssue): IssueDifficulty => {
    if (issue.difficulty === "beginner" || issue.difficulty === "intermediate" || issue.difficulty === "advanced") {
      return issue.difficulty;
    }
    return issue.beginnerFriendly ? "beginner" : "intermediate";
  };

  const handleDifficultyChange = async (issue: AdminIssue, difficulty: IssueDifficulty) => {
    try {
      setActionLoading(issue._id);
      const updated = await updateIssue(issue._id, { difficulty });
      setIssues((prev) => prev.map((i) => (i._id === issue._id ? { ...i, ...updated } : i)));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update issue difficulty");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === issues.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(issues.map((i) => i._id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    try {
      setActionLoading("bulk");
      await bulkApproveIssues(Array.from(selectedIds));
      setSelectedIds(new Set());
      loadIssues(pagination.page);
      loadStats();
    } catch (err) {
      console.error("Bulk approve failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkVisibility = async (visible: boolean) => {
    if (selectedIds.size === 0) return;
    try {
      setActionLoading("bulk");
      await bulkSetVisibility(Array.from(selectedIds), visible);
      setSelectedIds(new Set());
      loadIssues(pagination.page);
      loadStats();
    } catch (err) {
      console.error("Bulk visibility failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewRepoIssues = (repoFullName: string) => {
    setFilterRepoFullName(repoFullName);
    setSelectedIds(new Set());
  };

  return (
    <AdminLayout>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Issue Moderation
          </Typography>
          <Typography sx={{ color: "#a1a1aa", fontSize: 14 }}>
            Review and moderate issues before they appear to users
          </Typography>
        </Box>

        {/* Stats */}
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <StatCard label="Total Issues" value={stats.total} color="#a1a1aa" />
          <StatCard label="Pending Review" value={stats.pending} color="#fb923c" />
          <StatCard label="Approved" value={stats.approved} color="#22c55e" />
          <StatCard label="Visible" value={stats.visible} color="#3b82f6" />
          <StatCard label="Beginner Friendly" value={stats.beginnerFriendly} color="#a855f7" />
        </Stack>

        {/* Filters */}
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Search issues..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              width: 250,
              "& .MuiOutlinedInput-root": {
                bgcolor: "#0b0f17",
                color: "#fff",
                "& fieldset": { borderColor: "#27272a" }
              }
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel sx={{ color: "#71717a" }}>Approval</InputLabel>
            <Select
              value={filterApproved}
              label="Approval"
              onChange={(e) => setFilterApproved(e.target.value)}
              sx={{
                bgcolor: "#0b0f17",
                color: "#fff",
                "& fieldset": { borderColor: "#27272a" }
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Approved</MenuItem>
              <MenuItem value="false">Pending</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel sx={{ color: "#71717a" }}>Visibility</InputLabel>
            <Select
              value={filterVisible}
              label="Visibility"
              onChange={(e) => setFilterVisible(e.target.value)}
              sx={{
                bgcolor: "#0b0f17",
                color: "#fff",
                "& fieldset": { borderColor: "#27272a" }
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Visible</MenuItem>
              <MenuItem value="false">Hidden</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel sx={{ color: "#71717a" }}>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{
                bgcolor: "#0b0f17",
                color: "#fff",
                "& fieldset": { borderColor: "#27272a" }
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="claimed">Claimed</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel sx={{ color: "#71717a" }}>Difficulty</InputLabel>
            <Select
              value={filterDifficulty}
              label="Difficulty"
              onChange={(e) => setFilterDifficulty(e.target.value)}
              sx={{
                bgcolor: "#0b0f17",
                color: "#fff",
                "& fieldset": { borderColor: "#27272a" }
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel sx={{ color: "#71717a" }}>Repository</InputLabel>
            <Select
              value={filterRepoFullName}
              label="Repository"
              onChange={(e) => setFilterRepoFullName(e.target.value)}
              sx={{
                bgcolor: "#0b0f17",
                color: "#fff",
                "& fieldset": { borderColor: "#27272a" }
              }}
            >
              <MenuItem value="">All Repositories</MenuItem>
              {repoSummaries.map((repo) => (
                <MenuItem key={repo.fullName} value={repo.fullName}>
                  {repo.fullName} ({repo.totalIssues})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {filterRepoFullName && (
            <Button
              size="small"
              onClick={() => setFilterRepoFullName("")}
              sx={{ color: "#a1a1aa", textTransform: "none" }}
            >
              Clear Repo Filter
            </Button>
          )}
        </Stack>

        {/* Repository Summary */}
        <Paper sx={{ bgcolor: "#0b0f17", border: "1px solid #27272a", p: 2 }}>
          <Stack spacing={1.5}>
            <Box>
              <Typography sx={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>
                Issues By Repository
              </Typography>
              <Typography sx={{ color: "#71717a", fontSize: 12 }}>
                Browse repository-level totals and jump directly into a repository issue list.
              </Typography>
            </Box>

            <TableContainer sx={{ border: "1px solid #27272a", borderRadius: "10px" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Repository</TableCell>
                    <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }} align="right">Total</TableCell>
                    <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }} align="right">Open</TableCell>
                    <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }} align="right">Claimed</TableCell>
                    <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }} align="right">Closed</TableCell>
                    <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }} align="right">Pending</TableCell>
                    <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }} align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {repoSummaryLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 2.5 }}>
                        <CircularProgress size={20} sx={{ color: "#fb923c" }} />
                      </TableCell>
                    </TableRow>
                  ) : repoSummaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 2.5, color: "#71717a" }}>
                        No repositories found for current filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    repoSummaries.map((repo) => (
                      <TableRow key={repo.fullName} hover>
                        <TableCell sx={{ color: "#fff", fontWeight: 500 }}>{repo.fullName}</TableCell>
                        <TableCell align="right" sx={{ color: "#a1a1aa" }}>{repo.totalIssues}</TableCell>
                        <TableCell align="right" sx={{ color: "#22c55e" }}>{repo.openIssues}</TableCell>
                        <TableCell align="right" sx={{ color: "#3b82f6" }}>{repo.claimedIssues}</TableCell>
                        <TableCell align="right" sx={{ color: "#6b7280" }}>{repo.closedIssues}</TableCell>
                        <TableCell align="right" sx={{ color: "#fb923c" }}>{repo.pendingIssues}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => handleViewRepoIssues(repo.fullName)}
                            sx={{
                              color: filterRepoFullName === repo.fullName ? "#fb923c" : "#a1a1aa",
                              textTransform: "none"
                            }}
                          >
                            {filterRepoFullName === repo.fullName ? "Viewing" : "View Issues"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </Paper>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ color: "#a1a1aa", fontSize: 14 }}>
              {selectedIds.size} selected
            </Typography>
            <Button
              size="small"
              onClick={handleBulkApprove}
              disabled={actionLoading === "bulk"}
              sx={{ color: "#22c55e", textTransform: "none" }}
            >
              Approve All
            </Button>
            <Button
              size="small"
              onClick={() => handleBulkVisibility(true)}
              disabled={actionLoading === "bulk"}
              sx={{ color: "#3b82f6", textTransform: "none" }}
            >
              Make Visible
            </Button>
            <Button
              size="small"
              onClick={() => handleBulkVisibility(false)}
              disabled={actionLoading === "bulk"}
              sx={{ color: "#71717a", textTransform: "none" }}
            >
              Hide
            </Button>
          </Stack>
        )}

        {/* Error */}
        {error && <Alert severity="error">{error}</Alert>}

        {/* Table */}
        <TableContainer component={Paper} sx={{ bgcolor: "#0b0f17", border: "1px solid #27272a" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.size === issues.length && issues.length > 0}
                    indeterminate={selectedIds.size > 0 && selectedIds.size < issues.length}
                    onChange={handleSelectAll}
                    sx={{ color: "#71717a" }}
                  />
                </TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Issue</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Repository</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Difficulty</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Flags</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} sx={{ color: "#fb923c" }} />
                  </TableCell>
                </TableRow>
              ) : issues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: "#71717a" }}>
                    No issues found
                  </TableCell>
                </TableRow>
              ) : (
                issues.map((issue) => (
                  <TableRow key={issue._id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.has(issue._id)}
                        onChange={() => handleSelectOne(issue._id)}
                        sx={{ color: "#71717a" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Link
                          href={issue.githubUrl}
                          target="_blank"
                          sx={{ color: "#fff", fontWeight: 500, fontSize: 14, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                        >
                          #{issue.githubNumber}: {issue.title.slice(0, 50)}
                          {issue.title.length > 50 && "..."}
                        </Link>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {issue.labels.slice(0, 3).map((label) => (
                            <Chip
                              key={label}
                              label={label}
                              size="small"
                              sx={{ fontSize: 10, height: 18, bgcolor: "rgba(255,255,255,0.1)" }}
                            />
                          ))}
                          {issue.labels.length > 3 && (
                            <Typography sx={{ fontSize: 10, color: "#71717a" }}>
                              +{issue.labels.length - 3}
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, color: "#a1a1aa" }}>
                        {issue.repoOwner}/{issue.repoName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={issue.status}
                        size="small"
                        sx={{
                          fontSize: 11,
                          bgcolor:
                            issue.status === "open"
                              ? "rgba(34,197,94,0.2)"
                              : issue.status === "claimed"
                              ? "rgba(59,130,246,0.2)"
                              : "rgba(107,114,128,0.2)",
                          color:
                            issue.status === "open"
                              ? "#22c55e"
                              : issue.status === "claimed"
                              ? "#3b82f6"
                              : "#6b7280"
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const difficulty = getDifficulty(issue);
                        const colorMap = {
                          beginner: { bg: "rgba(34,197,94,0.2)", color: "#22c55e" },
                          intermediate: { bg: "rgba(251,146,60,0.2)", color: "#fb923c" },
                          advanced: { bg: "rgba(239,68,68,0.2)", color: "#ef4444" }
                        } as const;

                        const style = colorMap[difficulty];

                        return (
                          <FormControl size="small" sx={{ minWidth: 145 }}>
                            <Select
                              value={difficulty}
                              onChange={(e) =>
                                handleDifficultyChange(issue, e.target.value as IssueDifficulty)
                              }
                              disabled={actionLoading === issue._id}
                              sx={{
                                fontSize: 12,
                                height: 30,
                                bgcolor: style.bg,
                                color: style.color,
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "rgba(255,255,255,0.12)"
                                },
                                "& .MuiSelect-icon": { color: style.color }
                              }}
                            >
                              <MenuItem value="beginner">Beginner</MenuItem>
                              <MenuItem value="intermediate">Intermediate</MenuItem>
                              <MenuItem value="advanced">Advanced</MenuItem>
                            </Select>
                          </FormControl>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Chip
                          label={issue.isApproved ? "Approved" : "Pending"}
                          size="small"
                          sx={{
                            fontSize: 10,
                            bgcolor: issue.isApproved ? "rgba(34,197,94,0.2)" : "rgba(251,146,60,0.2)",
                            color: issue.isApproved ? "#22c55e" : "#fb923c"
                          }}
                        />
                        <Chip
                          label={issue.isVisible ? "Visible" : "Hidden"}
                          size="small"
                          sx={{
                            fontSize: 10,
                            bgcolor: issue.isVisible ? "rgba(59,130,246,0.2)" : "rgba(107,114,128,0.2)",
                            color: issue.isVisible ? "#3b82f6" : "#6b7280"
                          }}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {!issue.isApproved ? (
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              onClick={() => handleApprove(issue)}
                              disabled={actionLoading === issue._id}
                              sx={{ color: "#22c55e" }}
                            >
                              <MSym name="check" sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              onClick={() => handleReject(issue)}
                              disabled={actionLoading === issue._id}
                              sx={{ color: "#ef4444" }}
                            >
                              <MSym name="close" sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title={issue.isVisible ? "Hide" : "Show"}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleVisibility(issue)}
                            disabled={actionLoading === issue._id}
                            sx={{ color: "#3b82f6" }}
                          >
                            <MSym name={issue.isVisible ? "visibility_off" : "visibility"} sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
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
            <Pagination
              count={pagination.totalPages}
              page={pagination.page}
              onChange={(_, page) => loadIssues(page)}
              sx={{
                "& .MuiPaginationItem-root": { color: "#a1a1aa" },
                "& .Mui-selected": { bgcolor: "rgba(251,146,60,0.2) !important", color: "#fb923c" }
              }}
            />
          </Stack>
        )}
      </Stack>
    </AdminLayout>
  );
}

export default IssueModerationPage;

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Paper sx={{ bgcolor: "#0b0f17", border: "1px solid #27272a", p: 2, flex: 1 }}>
      <Typography sx={{ color: "#71717a", fontSize: 12, fontWeight: 500 }}>{label}</Typography>
      <Typography sx={{ color, fontSize: 24, fontWeight: 600 }}>{value}</Typography>
    </Paper>
  );
}
