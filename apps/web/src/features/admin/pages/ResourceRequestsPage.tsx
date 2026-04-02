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
  approveResourceRequest,
  createAdminResource,
  fetchAdminResourceRequests,
  fetchMyResourceRequests,
  rejectResourceRequest,
  submitResourceRequest,
  type Pagination as PaginationType,
  type RequestStatus,
  type ResourceRequestItem
} from "../api/adminApi";

const RESOURCE_TYPES = ["docs", "article", "video", "tool", "repo"] as const;
const RESOURCE_DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
const RESOURCE_CATEGORIES = [
  "Git Basics",
  "Pull Requests",
  "Programming Docs",
  "CLI Mastery",
  "Bug Fixing"
] as const;

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
  "& .MuiInputBase-input::placeholder": {
    color: "#a1a1aa",
    opacity: 1
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

const darkSelectSx = {
  bgcolor: "#050509",
  color: "#fff",
  "& fieldset": { borderColor: "#27272a" },
  "&:hover fieldset": { borderColor: "#3f3f46" },
  "&.Mui-focused fieldset": { borderColor: "#38bdf8" }
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
      "& .MuiMenuItem-root.Mui-disabled": { color: "#71717a" },
      "& .MuiMenuItem-root.Mui-selected": {
        bgcolor: "rgba(56,189,248,0.18)"
      },
      "& .MuiMenuItem-root.Mui-selected:hover": {
        bgcolor: "rgba(56,189,248,0.26)"
      }
    }
  }
};

export default function ResourceRequestsPage() {
  const location = useLocation();
  const isModeratorView = location.pathname.startsWith("/moderator");

  const [requests, setRequests] = useState<ResourceRequestItem[]>([]);
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

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof RESOURCE_CATEGORIES)[number] | "">("");
  const [type, setType] = useState<(typeof RESOURCE_TYPES)[number]>("article");
  const [difficulty, setDifficulty] = useState<(typeof RESOURCE_DIFFICULTIES)[number]>(
    "beginner"
  );
  const [tagsText, setTagsText] = useState("");
  const [topicsText, setTopicsText] = useState("");
  const [language, setLanguage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    request: ResourceRequestItem | null;
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

        if (!isModeratorView) {
          params.status = "pending";

          if (search.trim()) {
            params.search = search.trim();
          }
        }

        const data = isModeratorView
          ? await fetchMyResourceRequests(params)
          : await fetchAdminResourceRequests(params);

        setRequests(data.requests);
        setPagination(data.pagination);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load resource requests");
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
  }, [isModeratorView, search, loadRequests]);

  async function handleSubmitRequest() {
    if (!title.trim() || !url.trim() || !description.trim() || !category) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const tags = tagsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const topics = topicsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const res = await submitResourceRequest({
        title: title.trim(),
        url: url.trim(),
        description: description.trim(),
        category,
        type,
        difficulty,
        tags,
        topics,
        language: language.trim() || null
      });

      setSuccess(res.message || "Resource request submitted");
      setTitle("");
      setUrl("");
      setDescription("");
      setCategory("");
      setType("article");
      setDifficulty("beginner");
      setTagsText("");
      setTopicsText("");
      setLanguage("");

      await loadRequests(1);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit resource request");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublishResource() {
    if (!title.trim() || !url.trim() || !description.trim() || !category) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const tags = tagsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const topics = topicsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const res = await createAdminResource({
        title: title.trim(),
        url: url.trim(),
        description: description.trim(),
        category,
        type,
        difficulty,
        tags,
        topics,
        language: language.trim() || null
      });

      setSuccess(res.message || "Resource published and visible to users");
      setTitle("");
      setUrl("");
      setDescription("");
      setCategory("");
      setType("article");
      setDifficulty("beginner");
      setTagsText("");
      setTopicsText("");
      setLanguage("");

      await loadRequests(1);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to publish resource");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(request: ResourceRequestItem) {
    try {
      setActionLoadingId(request._id);
      setError(null);
      setSuccess(null);
      const res = await approveResourceRequest(request._id);
      setSuccess(res.message || "Resource approved");
      await loadRequests(pagination.page);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to approve resource request");
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
      const res = await rejectResourceRequest(
        rejectDialog.request._id,
        rejectDialog.reason.trim() || undefined
      );
      setSuccess(res.message || "Resource request rejected");
      setRejectDialog({ open: false, request: null, reason: "", loading: false });
      await loadRequests(pagination.page);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject resource request");
      setRejectDialog((prev) => ({ ...prev, loading: false }));
    }
  }

  function formatDate(date?: string | null) {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  }

  function statusChip(status: RequestStatus) {
    if (status === "approved") {
      return { label: "Approved", color: "#22c55e", bg: "rgba(34,197,94,0.2)" };
    }
    if (status === "rejected") {
      return { label: "Rejected", color: "#ef4444", bg: "rgba(239,68,68,0.2)" };
    }
    return { label: "Pending", color: "#fb923c", bg: "rgba(251,146,60,0.2)" };
  }

  function difficultyChip(d: ResourceRequestItem["difficulty"]) {
    if (d === "beginner") {
      return { color: "#22c55e", bg: "rgba(34,197,94,0.2)" };
    }
    if (d === "advanced") {
      return { color: "#ef4444", bg: "rgba(239,68,68,0.2)" };
    }
    return { color: "#fb923c", bg: "rgba(251,146,60,0.2)" };
  }

  return (
    <AdminLayout>
      <Stack spacing={3}>
        <Box>
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 600 }}>
              Resource Requests
            </Typography>
            <Typography sx={{ color: "#a1a1aa", fontSize: 14 }}>
              {isModeratorView
                ? "Submit resource suggestions for admin review and track approval status"
                : "Review pending community resource requests and publish official resources directly to users"}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            bgcolor: "#0b0f17",
            border: "1px solid #27272a",
            borderRadius: "12px",
            p: 2.5
          }}
        >
          <Stack spacing={2}>
            <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
              {isModeratorView ? "Request a New Resource" : "Publish Official Resource"}
            </Typography>
            <Typography sx={{ color: "#a1a1aa", fontSize: 13 }}>
              {isModeratorView
                ? "Submissions from moderators require admin approval before users can see them."
                : "Admin published resources are approved immediately and visible to users without moderator review."}
            </Typography>

            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              sx={darkTextFieldSx}
            />

            <TextField
              label="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              fullWidth
              sx={darkTextFieldSx}
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              sx={darkTextFieldSx}
            />

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <FormControl fullWidth size="small" sx={darkFormControlSx}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  label="Category"
                  onChange={(e) =>
                    setCategory(e.target.value as (typeof RESOURCE_CATEGORIES)[number] | "")
                  }
                  MenuProps={darkSelectMenuProps}
                  sx={darkSelectSx}
                >
                  <MenuItem value="" disabled>
                    Select category
                  </MenuItem>
                  {RESOURCE_CATEGORIES.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={darkFormControlSx}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={type}
                  label="Type"
                  onChange={(e) => setType(e.target.value as (typeof RESOURCE_TYPES)[number])}
                  MenuProps={darkSelectMenuProps}
                  sx={darkSelectSx}
                >
                  {RESOURCE_TYPES.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={darkFormControlSx}>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={difficulty}
                  label="Difficulty"
                  onChange={(e) =>
                    setDifficulty(e.target.value as (typeof RESOURCE_DIFFICULTIES)[number])
                  }
                  MenuProps={darkSelectMenuProps}
                  sx={darkSelectSx}
                >
                  {RESOURCE_DIFFICULTIES.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Tags (comma separated)"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                fullWidth
                sx={darkTextFieldSx}
              />
              <TextField
                label="Topics (comma separated)"
                value={topicsText}
                onChange={(e) => setTopicsText(e.target.value)}
                fullWidth
                sx={darkTextFieldSx}
              />
            </Stack>

            <TextField
              label="Language (optional)"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              fullWidth
              sx={darkTextFieldSx}
            />

            <Stack direction="row" justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={isModeratorView ? handleSubmitRequest : handlePublishResource}
                disabled={
                  submitting || !title.trim() || !url.trim() || !description.trim() || !category
                }
                startIcon={<MSym name={isModeratorView ? "send" : "publish"} sx={{ fontSize: 16 }} />}
                sx={{
                  textTransform: "none",
                  bgcolor: isModeratorView ? "#0ea5e9" : "#22c55e",
                  "&:hover": { bgcolor: isModeratorView ? "#0284c7" : "#16a34a" }
                }}
              >
                {submitting ? (
                  <CircularProgress size={18} sx={{ color: "#fff" }} />
                ) : isModeratorView ? (
                  "Submit Request"
                ) : (
                  "Publish Resource"
                )}
              </Button>
            </Stack>
          </Stack>
        </Box>

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
              placeholder="Search title, url, or description"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={darkFilterTextFieldSx}
            />
          )}

          {isModeratorView && (
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
          )}

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
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Resource</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Difficulty</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>
                  {isModeratorView ? "Submitted At" : "Status"}
                </TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Review</TableCell>
                {!isModeratorView && (
                  <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }} align="right">
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isModeratorView ? 6 : 7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} sx={{ color: "#0ea5e9" }} />
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isModeratorView ? 6 : 7} align="center" sx={{ py: 4, color: "#71717a" }}>
                    {isModeratorView ? "No resource requests found" : "No pending resource requests found"}
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => {
                  const statusMeta = statusChip(request.status);
                  const difficultyMeta = difficultyChip(request.difficulty);

                  return (
                    <TableRow key={request._id} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Link
                            href={request.url}
                            target="_blank"
                            rel="noopener"
                            sx={{ color: "#fff", fontWeight: 500, fontSize: 13 }}
                          >
                            {request.title}
                          </Link>
                          <Typography sx={{ color: "#71717a", fontSize: 12, maxWidth: 320 }}>
                            {request.description}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={request.type}
                          size="small"
                          sx={{ fontSize: 11, bgcolor: "rgba(148,163,184,0.2)", color: "#cbd5e1" }}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={request.category || "Programming Docs"}
                          size="small"
                          sx={{ fontSize: 11, bgcolor: "rgba(96,165,250,0.15)", color: "#bfdbfe" }}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={request.difficulty}
                          size="small"
                          sx={{
                            fontSize: 11,
                            bgcolor: difficultyMeta.bg,
                            color: difficultyMeta.color
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        {isModeratorView ? (
                          <Typography sx={{ color: "#a1a1aa", fontSize: 13 }}>
                            {formatDate(request.createdAt)}
                          </Typography>
                        ) : (
                          <Chip
                            label={statusMeta.label}
                            size="small"
                            sx={{ fontSize: 11, bgcolor: statusMeta.bg, color: statusMeta.color }}
                          />
                        )}
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

                      {!isModeratorView && (
                        <TableCell align="right">
                          {request.status === "pending" ? (
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="Approve resource">
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

                              <Tooltip title="Reject resource">
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
                          ) : (
                            <Typography sx={{ color: "#71717a", fontSize: 12 }}>Reviewed</Typography>
                          )}
                        </TableCell>
                      )}
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
              onChange={(_, page) => loadRequests(page)}
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
        <DialogTitle sx={{ color: "#fff" }}>Reject Resource Request</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#a1a1aa", fontSize: 14, mb: 2 }}>
            Provide an optional reason for rejecting this resource request.
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
