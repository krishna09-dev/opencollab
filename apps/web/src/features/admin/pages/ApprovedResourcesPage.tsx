import { useCallback, useEffect, useState } from "react";
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
  deleteApprovedResource,
  fetchApprovedResources,
  type ResourceCategory,
  updateApprovedResource,
  type Pagination as PaginationType,
  type ResourceRequestItem
} from "../api/adminApi";

const RESOURCE_TYPES: ResourceRequestItem["type"][] = ["docs", "article", "video", "tool", "repo"];
const RESOURCE_DIFFICULTIES: ResourceRequestItem["difficulty"][] = [
  "beginner",
  "intermediate",
  "advanced"
];
const RESOURCE_CATEGORIES: ResourceCategory[] = [
  "Git Basics",
  "Pull Requests",
  "Programming Docs",
  "CLI Mastery",
  "Bug Fixing"
];

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
  width: 320,
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

export default function ApprovedResourcesPage() {
  const [items, setItems] = useState<ResourceRequestItem[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"" | "official" | "community">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    item: ResourceRequestItem | null;
    title: string;
    url: string;
    description: string;
    category: ResourceCategory | "";
    type: ResourceRequestItem["type"];
    difficulty: ResourceRequestItem["difficulty"];
    tagsText: string;
    topicsText: string;
    language: string;
    isFeatured: boolean;
    qualityScore: string;
    loading: boolean;
  }>({
    open: false,
    item: null,
    title: "",
    url: "",
    description: "",
    category: "",
    type: "article",
    difficulty: "beginner",
    tagsText: "",
    topicsText: "",
    language: "",
    isFeatured: false,
    qualityScore: "70",
    loading: false
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    item: ResourceRequestItem | null;
    loading: boolean;
  }>({
    open: false,
    item: null,
    loading: false
  });

  const loadResources = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchApprovedResources({
          page,
          limit: 20,
          search: search.trim() || undefined,
          source: sourceFilter || undefined
        });

        setItems(data.items);
        setPagination(data.pagination);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load approved resources");
      } finally {
        setLoading(false);
      }
    },
    [search, sourceFilter]
  );

  useEffect(() => {
    loadResources(1);
  }, [sourceFilter, loadResources]);

  useEffect(() => {
    const timer = setTimeout(() => loadResources(1), 300);
    return () => clearTimeout(timer);
  }, [search, loadResources]);

  function formatDate(date?: string | null) {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  }

  function sourceChip(source: string) {
    if (source === "official") {
      return { label: "Official", color: "#22c55e", bg: "rgba(34,197,94,0.2)" };
    }
    return { label: "Community", color: "#38bdf8", bg: "rgba(56,189,248,0.2)" };
  }

  function difficultyChip(difficulty: string) {
    if (difficulty === "beginner") {
      return { color: "#22c55e", bg: "rgba(34,197,94,0.2)" };
    }
    if (difficulty === "advanced") {
      return { color: "#ef4444", bg: "rgba(239,68,68,0.2)" };
    }
    return { color: "#fb923c", bg: "rgba(251,146,60,0.2)" };
  }

  function openEditDialog(item: ResourceRequestItem) {
    setEditDialog({
      open: true,
      item,
      title: item.title || "",
      url: item.url || "",
      description: item.description || "",
      category: item.category || "Programming Docs",
      type: item.type || "article",
      difficulty: item.difficulty || "beginner",
      tagsText: (item.tags || []).join(", "),
      topicsText: (item.topics || []).join(", "),
      language: item.language || "",
      isFeatured: Boolean(item.isFeatured),
      qualityScore: String(item.qualityScore ?? 70),
      loading: false
    });
  }

  async function handleUpdateResource() {
    if (!editDialog.item) return;
    if (!editDialog.title.trim() || !editDialog.url.trim() || !editDialog.description.trim() || !editDialog.category) {
      setError("Title, URL, description, and category are required.");
      return;
    }

    const parsedQualityScore = Number(editDialog.qualityScore);
    if (!Number.isFinite(parsedQualityScore) || parsedQualityScore < 0 || parsedQualityScore > 100) {
      setError("Quality score must be a number between 0 and 100.");
      return;
    }

    try {
      setEditDialog((prev) => ({ ...prev, loading: true }));
      setError(null);
      setSuccess(null);

      const tags = editDialog.tagsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const topics = editDialog.topicsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const res = await updateApprovedResource(editDialog.item._id, {
        title: editDialog.title.trim(),
        url: editDialog.url.trim(),
        description: editDialog.description.trim(),
        category: editDialog.category,
        type: editDialog.type,
        difficulty: editDialog.difficulty,
        tags,
        topics,
        language: editDialog.language.trim() || null,
        isFeatured: editDialog.isFeatured,
        qualityScore: parsedQualityScore
      });

      setSuccess(res.message || "Approved resource updated");
      setEditDialog((prev) => ({ ...prev, open: false, item: null, loading: false }));
      await loadResources(pagination.page);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update approved resource");
      setEditDialog((prev) => ({ ...prev, loading: false }));
    }
  }

  async function handleDeleteResource() {
    if (!deleteDialog.item) return;

    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      setActionLoadingId(deleteDialog.item._id);
      setError(null);
      setSuccess(null);

      const res = await deleteApprovedResource(deleteDialog.item._id);
      setSuccess(res.message || "Approved resource deleted");
      setDeleteDialog({ open: false, item: null, loading: false });
      await loadResources(pagination.page);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete approved resource");
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <AdminLayout>
      <Stack spacing={3}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 600 }}>Approved Resources</Typography>
          <Typography sx={{ color: "#a1a1aa", fontSize: 14 }}>
            View all resources currently approved and visible to users.
          </Typography>
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
          <TextField
            placeholder="Search title, url, or description"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={darkFilterTextFieldSx}
          />

          <FormControl size="small" sx={{ minWidth: 180, ...darkFormControlSx }}>
            <InputLabel>Source</InputLabel>
            <Select
              value={sourceFilter}
              label="Source"
              onChange={(e) => setSourceFilter(e.target.value as "" | "official" | "community")}
              MenuProps={darkSelectMenuProps}
              sx={darkFilterSelectSx}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="official">Official</MenuItem>
              <MenuItem value="community">Community</MenuItem>
            </Select>
          </FormControl>

          <Button
            onClick={() => loadResources(1)}
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
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Source</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Approved Review</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} sx={{ color: "#0ea5e9" }} />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: "#71717a" }}>
                    No approved resources found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const sourceMeta = sourceChip(item.source);
                  const diffMeta = difficultyChip(item.difficulty);

                  return (
                    <TableRow key={item._id} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Link href={item.url} target="_blank" rel="noopener" sx={{ color: "#fff", fontWeight: 500, fontSize: 13 }}>
                            {item.title}
                          </Link>
                          <Typography sx={{ color: "#71717a", fontSize: 12, maxWidth: 340 }}>
                            {item.description}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={item.type}
                          size="small"
                          sx={{ fontSize: 11, bgcolor: "rgba(148,163,184,0.2)", color: "#cbd5e1" }}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={item.category || "Programming Docs"}
                          size="small"
                          sx={{ fontSize: 11, bgcolor: "rgba(96,165,250,0.15)", color: "#bfdbfe" }}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={item.difficulty}
                          size="small"
                          sx={{
                            fontSize: 11,
                            bgcolor: diffMeta.bg,
                            color: diffMeta.color
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={sourceMeta.label}
                          size="small"
                          sx={{ fontSize: 11, bgcolor: sourceMeta.bg, color: sourceMeta.color }}
                        />
                      </TableCell>

                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography sx={{ color: "#a1a1aa", fontSize: 12 }}>
                            {item.reviewedByLogin || "Admin"} • {formatDate(item.reviewedAt)}
                          </Typography>
                          <Typography sx={{ color: "#71717a", fontSize: 12 }}>
                            Published: {formatDate(item.createdAt)}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Edit approved resource">
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(item)}
                              sx={{ color: "#38bdf8" }}
                            >
                              <MSym name="edit" sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete approved resource">
                            <IconButton
                              size="small"
                              onClick={() => setDeleteDialog({ open: true, item, loading: false })}
                              disabled={actionLoadingId === item._id}
                              sx={{ color: "#ef4444" }}
                            >
                              {actionLoadingId === item._id ? (
                                <CircularProgress size={16} sx={{ color: "#ef4444" }} />
                              ) : (
                                <MSym name="delete" sx={{ fontSize: 18 }} />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Stack>
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
              onChange={(_, page) => loadResources(page)}
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
        open={editDialog.open}
        onClose={() =>
          !editDialog.loading &&
          setEditDialog((prev) => ({ ...prev, open: false, item: null }))
        }
        PaperProps={{
          sx: {
            bgcolor: "#0b0f17",
            border: "1px solid #27272a",
            minWidth: { xs: "92vw", md: 720 }
          }
        }}
      >
        <DialogTitle sx={{ color: "#fff" }}>Edit Approved Resource</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              label="Title"
              value={editDialog.title}
              onChange={(e) => setEditDialog((prev) => ({ ...prev, title: e.target.value }))}
              fullWidth
              sx={darkTextFieldSx}
            />

            <TextField
              label="URL"
              value={editDialog.url}
              onChange={(e) => setEditDialog((prev) => ({ ...prev, url: e.target.value }))}
              fullWidth
              sx={darkTextFieldSx}
            />

            <TextField
              label="Description"
              value={editDialog.description}
              onChange={(e) =>
                setEditDialog((prev) => ({ ...prev, description: e.target.value }))
              }
              fullWidth
              multiline
              minRows={2}
              sx={darkTextFieldSx}
            />

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <FormControl fullWidth size="small" sx={darkFormControlSx}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={editDialog.category}
                  label="Category"
                  onChange={(e) =>
                    setEditDialog((prev) => ({
                      ...prev,
                      category: e.target.value as ResourceCategory | ""
                    }))
                  }
                  MenuProps={darkSelectMenuProps}
                  sx={darkFilterSelectSx}
                >
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
                  value={editDialog.type}
                  label="Type"
                  onChange={(e) =>
                    setEditDialog((prev) => ({
                      ...prev,
                      type: e.target.value as ResourceRequestItem["type"]
                    }))
                  }
                  MenuProps={darkSelectMenuProps}
                  sx={darkFilterSelectSx}
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
                  value={editDialog.difficulty}
                  label="Difficulty"
                  onChange={(e) =>
                    setEditDialog((prev) => ({
                      ...prev,
                      difficulty: e.target.value as ResourceRequestItem["difficulty"]
                    }))
                  }
                  MenuProps={darkSelectMenuProps}
                  sx={darkFilterSelectSx}
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
                value={editDialog.tagsText}
                onChange={(e) =>
                  setEditDialog((prev) => ({ ...prev, tagsText: e.target.value }))
                }
                fullWidth
                sx={darkTextFieldSx}
              />
              <TextField
                label="Topics (comma separated)"
                value={editDialog.topicsText}
                onChange={(e) =>
                  setEditDialog((prev) => ({ ...prev, topicsText: e.target.value }))
                }
                fullWidth
                sx={darkTextFieldSx}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Language (optional)"
                value={editDialog.language}
                onChange={(e) =>
                  setEditDialog((prev) => ({ ...prev, language: e.target.value }))
                }
                fullWidth
                sx={darkTextFieldSx}
              />

              <TextField
                label="Quality Score (0-100)"
                value={editDialog.qualityScore}
                onChange={(e) =>
                  setEditDialog((prev) => ({ ...prev, qualityScore: e.target.value }))
                }
                fullWidth
                sx={darkTextFieldSx}
              />

              <FormControl fullWidth size="small" sx={darkFormControlSx}>
                <InputLabel>Featured</InputLabel>
                <Select
                  value={editDialog.isFeatured ? "true" : "false"}
                  label="Featured"
                  onChange={(e) =>
                    setEditDialog((prev) => ({
                      ...prev,
                      isFeatured: e.target.value === "true"
                    }))
                  }
                  MenuProps={darkSelectMenuProps}
                  sx={darkFilterSelectSx}
                >
                  <MenuItem value="false">No</MenuItem>
                  <MenuItem value="true">Yes</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setEditDialog((prev) => ({ ...prev, open: false, item: null }))}
            disabled={editDialog.loading}
            sx={{ color: "#a1a1aa" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateResource}
            disabled={editDialog.loading}
            sx={{ bgcolor: "#0ea5e9", "&:hover": { bgcolor: "#0284c7" } }}
          >
            {editDialog.loading ? (
              <CircularProgress size={18} sx={{ color: "#fff" }} />
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onClose={() =>
          !deleteDialog.loading &&
          setDeleteDialog({ open: false, item: null, loading: false })
        }
        PaperProps={{ sx: { bgcolor: "#0b0f17", border: "1px solid #27272a", minWidth: 420 } }}
      >
        <DialogTitle sx={{ color: "#fff" }}>Delete Approved Resource</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#a1a1aa", fontSize: 14 }}>
            This will permanently remove{" "}
            <Box component="span" sx={{ color: "#fff", fontWeight: 600 }}>
              {deleteDialog.item?.title || "this resource"}
            </Box>
            {" "}from approved resources.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, item: null, loading: false })}
            disabled={deleteDialog.loading}
            sx={{ color: "#a1a1aa" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteResource}
            disabled={deleteDialog.loading}
            sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}
          >
            {deleteDialog.loading ? (
              <CircularProgress size={18} sx={{ color: "#fff" }} />
            ) : (
              "Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
