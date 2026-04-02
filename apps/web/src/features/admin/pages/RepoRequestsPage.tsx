import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  approveRepoRequest,
  fetchAdminRepoRequests,
  fetchMyRepoRequests,
  rejectRepoRequest,
  syncRepo,
  submitRepoRequest,
  type Pagination as PaginationType,
  type RepoRequestItem,
  type RequestStatus
} from "../api/adminApi";

const darkTextFieldSx = {
  "& .MuiInputLabel-root": { color: "#a1a1aa" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#e4e4e7" },
  "& .MuiOutlinedInput-root": {
    bgcolor: "#050509",
    color: "#fff",
    "& fieldset": { borderColor: "#27272a" },
    "&:hover fieldset": { borderColor: "#3f3f46" },
    "&.Mui-focused fieldset": { borderColor: "#38bdf8" }
  },
  "& .MuiInputBase-input": {
    color: "#fff",
    WebkitTextFillColor: "#fff",
    caretColor: "#fff"
  },
  "& .MuiInputBase-inputMultiline": {
    color: "#fff",
    WebkitTextFillColor: "#fff",
    caretColor: "#fff"
  },
  "& .MuiInputBase-input::placeholder": {
    color: "#a1a1aa",
    opacity: 1
  },
  "& .MuiInputBase-inputMultiline::placeholder": {
    color: "#a1a1aa",
    opacity: 1
  },
  "& input:-webkit-autofill": {
    WebkitTextFillColor: "#fff",
    WebkitBoxShadow: "0 0 0 100px #050509 inset",
    caretColor: "#fff"
  }
};

const darkFilterTextFieldSx = {
  width: 280,
  "& .MuiOutlinedInput-root": {
    bgcolor: "#0b0f17",
    color: "#fff",
    "& fieldset": { borderColor: "#27272a" },
    "&:hover fieldset": { borderColor: "#3f3f46" },
    "&.Mui-focused fieldset": { borderColor: "#38bdf8" }
  },
  "& .MuiInputBase-input::placeholder": {
    color: "#a1a1aa",
    opacity: 1
  }
};

const darkFormControlSx = {
  "& .MuiInputLabel-root": { color: "#a1a1aa" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#e4e4e7" },
  "& .MuiSvgIcon-root": { color: "#a1a1aa" }
};

const darkFilterSelectSx = {
  bgcolor: "#0b0f17",
  color: "#fff",
  "& fieldset": { borderColor: "#27272a" },
  "&:hover fieldset": { borderColor: "#3f3f46" },
  "&.Mui-focused fieldset": { borderColor: "#38bdf8" }
};

const darkSelectMenuProps = {
  PaperProps: {
    sx: {
      bgcolor: "#0b0f17",
      color: "#fff",
      border: "1px solid #27272a",
      "& .MuiMenuItem-root": { color: "#fff" },
      "& .MuiMenuItem-root.Mui-selected": {
        bgcolor: "rgba(56,189,248,0.18)"
      },
      "& .MuiMenuItem-root.Mui-selected:hover": {
        bgcolor: "rgba(56,189,248,0.26)"
      }
    }
  }
};

export default function RepoRequestsPage() {
  const location = useLocation();
  const isModeratorView = location.pathname.startsWith("/moderator");

  const [requests, setRequests] = useState<RepoRequestItem[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>(
    isModeratorView ? "" : "pending"
  );
  const [search, setSearch] = useState("");

  const [fullName, setFullName] = useState("");
  const [requestNotes, setRequestNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [syncingRequestId, setSyncingRequestId] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    request: RepoRequestItem | null;
    reason: string;
    loading: boolean;
  }>({
    open: false,
    request: null,
    reason: "",
    loading: false
  });

  const loadRequests = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const params: {
          page: number;
          limit: number;
          status?: RequestStatus;
          search?: string;
        } = {
          page,
          limit: 20
        };

        if (statusFilter) {
          params.status = statusFilter as RequestStatus;
        }
        if (!isModeratorView && search.trim()) {
          params.search = search.trim();
        }

        const data = isModeratorView
          ? await fetchMyRepoRequests(params)
          : await fetchAdminRepoRequests(params);

        setRequests(data.requests);
        setPagination(data.pagination);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load repository requests");
      } finally {
        setLoading(false);
      }
    },
    [isModeratorView, search, statusFilter]
  );

  useEffect(() => {
    loadRequests(1);
  }, [statusFilter, loadRequests]);

  useEffect(() => {
    if (isModeratorView) return;
    const timer = setTimeout(() => loadRequests(1), 300);
    return () => clearTimeout(timer);
  }, [search, isModeratorView, loadRequests]);

  async function handleSubmitRequest() {
    if (!fullName.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      const res = await submitRepoRequest(fullName.trim(), requestNotes.trim() || undefined);
      setSuccess(res.message || "Repository request submitted");
      setFullName("");
      setRequestNotes("");
      await loadRequests(1);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit repository request");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(request: RepoRequestItem) {
    try {
      setActionLoadingId(request._id);
      setError(null);
      setSuccess(null);
      const res = await approveRepoRequest(request._id, { syncNow: true });
      if (res.sync?.success === false) {
        setSuccess("Request approved. Initial sync failed, but the repository was added.");
      } else {
        setSuccess(res.message || "Request approved successfully");
      }
      await loadRequests(pagination.page);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to approve request");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReject() {
    if (!rejectDialog.request) return;

    try {
      setRejectDialog((prev) => ({ ...prev, loading: true }));
      setError(null);
      setSuccess(null);
      const res = await rejectRepoRequest(
        rejectDialog.request._id,
        rejectDialog.reason.trim() || undefined
      );
      setSuccess(res.message || "Request rejected");
      setRejectDialog({ open: false, request: null, reason: "", loading: false });
      await loadRequests(pagination.page);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject request");
      setRejectDialog((prev) => ({ ...prev, loading: false }));
    }
  }

  async function handleSyncRequest(request: RepoRequestItem) {
    if (!request.approvedRepoId) {
      setError("This approved request is missing a repository link, so sync cannot run.");
      return;
    }

    try {
      setSyncingRequestId(request._id);
      setError(null);
      setSuccess(null);
      const res = await syncRepo(request.approvedRepoId);
      setSuccess(res.message || `Sync completed for ${request.fullName}`);
      await loadRequests(pagination.page);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to sync repository issues");
    } finally {
      setSyncingRequestId(null);
    }
  }

  function statusChip(status: RequestStatus) {
    if (status === "approved") {
      return {
        label: "Approved",
        sx: { bgcolor: "rgba(34,197,94,0.2)", color: "#22c55e" }
      };
    }
    if (status === "rejected") {
      return {
        label: "Rejected",
        sx: { bgcolor: "rgba(239,68,68,0.2)", color: "#ef4444" }
      };
    }
    return {
      label: "Pending",
      sx: { bgcolor: "rgba(251,146,60,0.2)", color: "#fb923c" }
    };
  }

  function formatDate(date?: string | null) {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  }

  return (
    <AdminLayout>
      <Stack spacing={3}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 600 }}>
            Repository Requests
          </Typography>
          <Typography sx={{ color: "#a1a1aa", fontSize: 14 }}>
            {isModeratorView
              ? "Request repositories for admin approval and track their status"
              : "Review and approve moderator-submitted repository requests"}
          </Typography>
        </Box>

        {isModeratorView && (
          <Paper
            sx={{
              bgcolor: "#0b0f17",
              border: "1px solid #27272a",
              borderRadius: "12px",
              p: 2.5
            }}
          >
            <Stack spacing={2}>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>
                Request a Repository
              </Typography>
              <TextField
                label="GitHub Repository"
                placeholder="owner/repo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                fullWidth
                sx={darkTextFieldSx}
              />
              <TextField
                label="Notes for Admin (optional)"
                placeholder="Why should this repository be added?"
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                sx={darkTextFieldSx}
              />
              <Stack direction="row" justifyContent="flex-end">
                <Button
                  variant="contained"
                  onClick={handleSubmitRequest}
                  disabled={submitting || !fullName.trim()}
                  startIcon={<MSym name="send" sx={{ fontSize: 16 }} />}
                  sx={{
                    textTransform: "none",
                    bgcolor: "#0ea5e9",
                    "&:hover": { bgcolor: "#0284c7" }
                  }}
                >
                  {submitting ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Submit Request"}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{
              bgcolor: "rgba(239,68,68,0.1)",
              color: "#f87171",
              border: "1px solid rgba(239,68,68,0.2)",
              "& .MuiAlert-icon": { color: "#f87171" }
            }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            onClose={() => setSuccess(null)}
            sx={{
              bgcolor: "rgba(34,197,94,0.1)",
              color: "#86efac",
              border: "1px solid rgba(34,197,94,0.2)",
              "& .MuiAlert-icon": { color: "#86efac" }
            }}
          >
            {success}
          </Alert>
        )}

        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          {!isModeratorView && (
            <TextField
              placeholder="Search by repository or requester"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={darkFilterTextFieldSx}
            />
          )}

          <FormControl size="small" sx={{ minWidth: 160, ...darkFormControlSx }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              MenuProps={darkSelectMenuProps}
              sx={darkFilterSelectSx}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>

          <Button
            onClick={() => loadRequests(1)}
            disabled={loading}
            startIcon={<MSym name="refresh" sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: "none",
              color: "#a1a1aa",
              "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.05)" }
            }}
          >
            Refresh
          </Button>
        </Stack>

        <TableContainer sx={{ bgcolor: "#0b0f17", border: "1px solid #27272a", borderRadius: "12px" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Repository</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>
                  {isModeratorView ? "Submitted At" : "Requested By"}
                </TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Review</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} sx={{ color: "#0ea5e9" }} />
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: "#71717a" }}>
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => {
                  const chip = statusChip(request.status);
                  return (
                    <TableRow key={request._id} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography sx={{ fontWeight: 500, color: "#fff", fontSize: 14 }}>
                            {request.fullName}
                          </Typography>
                          {request.htmlUrl ? (
                            <Link
                              href={request.htmlUrl}
                              target="_blank"
                              rel="noopener"
                              sx={{ color: "#60a5fa", fontSize: 12 }}
                            >
                              Open on GitHub
                            </Link>
                          ) : null}
                          {request.requestNotes ? (
                            <Typography sx={{ color: "#71717a", fontSize: 12 }}>
                              Note: {request.requestNotes}
                            </Typography>
                          ) : null}
                        </Stack>
                      </TableCell>

                      <TableCell>
                        {isModeratorView ? (
                          <Typography sx={{ color: "#a1a1aa", fontSize: 13 }}>
                            {formatDate(request.createdAt)}
                          </Typography>
                        ) : (
                          <Stack spacing={0.5}>
                            <Typography sx={{ color: "#fff", fontSize: 13 }}>
                              {request.requestedByLogin}
                            </Typography>
                            <Typography sx={{ color: "#71717a", fontSize: 12 }}>
                              {request.requestedByRole} • {formatDate(request.createdAt)}
                            </Typography>
                          </Stack>
                        )}
                      </TableCell>

                      <TableCell>
                        <Chip label={chip.label} size="small" sx={{ fontSize: 11, ...chip.sx }} />
                      </TableCell>

                      <TableCell>
                        {request.status === "pending" ? (
                          <Typography sx={{ color: "#71717a", fontSize: 12 }}>Awaiting admin review</Typography>
                        ) : (
                          <Stack spacing={0.5}>
                            <Typography sx={{ color: "#a1a1aa", fontSize: 12 }}>
                              {request.reviewedByLogin || "Admin"} • {formatDate(request.reviewedAt)}
                            </Typography>
                            {request.reviewNotes ? (
                              <Typography sx={{ color: "#71717a", fontSize: 12 }}>
                                {request.reviewNotes}
                              </Typography>
                            ) : null}
                          </Stack>
                        )}
                      </TableCell>

                      <TableCell align="right">
                        {request.status === "pending" && !isModeratorView ? (
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Approve and sync">
                              <IconButton
                                size="small"
                                onClick={() => handleApprove(request)}
                                disabled={actionLoadingId === request._id}
                                sx={{ color: "#22c55e" }}
                              >
                                {actionLoadingId === request._id ? (
                                  <CircularProgress size={16} sx={{ color: "#22c55e" }} />
                                ) : (
                                  <MSym name="check_circle" sx={{ fontSize: 18 }} />
                                )}
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Reject request">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  setRejectDialog({
                                    open: true,
                                    request,
                                    reason: "",
                                    loading: false
                                  })
                                }
                                sx={{ color: "#ef4444" }}
                              >
                                <MSym name="cancel" sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : request.status === "approved" ? (
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip
                              title={
                                request.approvedRepoId
                                  ? "Sync issues from GitHub"
                                  : "Approved repository link is missing"
                              }
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleSyncRequest(request)}
                                  disabled={!request.approvedRepoId || syncingRequestId === request._id}
                                  sx={{ color: "#38bdf8" }}
                                >
                                  {syncingRequestId === request._id ? (
                                    <CircularProgress size={16} sx={{ color: "#38bdf8" }} />
                                  ) : (
                                    <MSym name="sync" sx={{ fontSize: 18 }} />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        ) : (
                          <Typography sx={{ color: "#71717a", fontSize: 12 }}>
                            {isModeratorView ? "-" : "Reviewed"}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {pagination.totalPages > 1 && (
          <Stack direction="row" justifyContent="center">
            <Pagination
              count={pagination.totalPages}
              page={pagination.page}
              onChange={(_, value) => loadRequests(value)}
              sx={{
                "& .MuiPaginationItem-root": { color: "#a1a1aa" },
                "& .Mui-selected": {
                  bgcolor: "rgba(14,165,233,0.2) !important",
                  color: "#38bdf8"
                }
              }}
            />
          </Stack>
        )}
      </Stack>

      <Dialog
        open={rejectDialog.open}
        onClose={() => !rejectDialog.loading && setRejectDialog({ open: false, request: null, reason: "", loading: false })}
        PaperProps={{ sx: { bgcolor: "#0b0f17", border: "1px solid #27272a", minWidth: 420 } }}
      >
        <DialogTitle sx={{ color: "#fff" }}>Reject Repository Request</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#a1a1aa", fontSize: 14, mb: 2 }}>
            Provide an optional reason for rejecting {rejectDialog.request?.fullName}.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            value={rejectDialog.reason}
            onChange={(e) => setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Reason (optional)"
            sx={darkTextFieldSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setRejectDialog({ open: false, request: null, reason: "", loading: false })}
            disabled={rejectDialog.loading}
            sx={{ color: "#a1a1aa" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            variant="contained"
            disabled={rejectDialog.loading}
            sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}
          >
            {rejectDialog.loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
