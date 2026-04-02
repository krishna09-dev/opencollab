import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert
} from "@mui/material";
import MSym from "../../resources/components/MSym";
import AdminLayout from "../components/AdminLayout";
import {
  fetchAdminRepos,
  addRepo,
  updateRepo,
  deleteRepo,
  syncRepo,
  type ApprovedRepo
} from "../api/adminApi";

export default function RepoManagementPage() {
  const [repos, setRepos] = useState<ApprovedRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadRepos();
  }, []);

  async function loadRepos() {
    try {
      setLoading(true);
      const data = await fetchAdminRepos();
      setRepos(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load repos");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRepo() {
    if (!newRepoName.trim()) return;

    try {
      setAdding(true);
      setAddError(null);
      const repo = await addRepo(newRepoName.trim());
      setRepos((prev) => [repo, ...prev]);
      setNewRepoName("");
      setAddDialogOpen(false);
    } catch (err: any) {
      setAddError(err.response?.data?.message || "Failed to add repo");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleActive(repo: ApprovedRepo) {
    try {
      const updated = await updateRepo(repo._id, { isActive: !repo.isActive });
      setRepos((prev) => prev.map((r) => (r._id === repo._id ? updated : r)));
    } catch (err) {
      console.error("Failed to toggle repo:", err);
    }
  }

  async function handleSync(repo: ApprovedRepo) {
    try {
      setSyncingId(repo._id);
      await syncRepo(repo._id);
      await loadRepos();
    } catch (err) {
      console.error("Failed to sync repo:", err);
    } finally {
      setSyncingId(null);
    }
  }

  async function handleDelete(repo: ApprovedRepo) {
    if (!confirm(`Delete ${repo.fullName}? This will remove all issues and PR tracking for this repository.`)) return;

    try {
      setDeletingId(repo._id);
      await deleteRepo(repo._id);
      setRepos((prev) => prev.filter((r) => r._id !== repo._id));
    } catch (err) {
      console.error("Failed to delete repo:", err);
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(dateStr?: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString();
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
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Repositories
            </Typography>
            <Typography sx={{ color: "#a1a1aa", fontSize: 14 }}>
              Manage GitHub repositories for issue ingestion
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<MSym name="add" sx={{ fontSize: 18 }} />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              bgcolor: "#fb923c",
              "&:hover": { bgcolor: "#f97316" },
              textTransform: "none",
              fontWeight: 600
            }}
          >
            Add Repository
          </Button>
        </Stack>

        {/* Error */}
        {error && <Alert severity="error">{error}</Alert>}

        {/* Table */}
        <TableContainer component={Paper} sx={{ bgcolor: "#0b0f17", border: "1px solid #27272a" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Repository</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Last Synced</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }}>Last Error</TableCell>
                <TableCell sx={{ color: "#a1a1aa", fontWeight: 600 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} sx={{ color: "#fb923c" }} />
                  </TableCell>
                </TableRow>
              ) : repos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: "#71717a" }}>
                    No repositories added yet
                  </TableCell>
                </TableRow>
              ) : (
                repos.map((repo) => (
                  <TableRow key={repo._id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography sx={{ fontWeight: 500, color: "#fff" }}>
                          {repo.fullName}
                        </Typography>
                        {repo.description && (
                          <Typography sx={{ fontSize: 12, color: "#71717a" }}>
                            {repo.description.slice(0, 60)}
                            {repo.description.length > 60 && "..."}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={repo.isActive ? "Active" : "Inactive"}
                        size="small"
                        sx={{
                          bgcolor: repo.isActive ? "rgba(34,197,94,0.2)" : "rgba(107,114,128,0.2)",
                          color: repo.isActive ? "#22c55e" : "#6b7280",
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: "#a1a1aa", fontSize: 13 }}>
                      {formatDate(repo.lastSyncedAt)}
                    </TableCell>
                    <TableCell>
                      {repo.lastError ? (
                        <Tooltip title={repo.lastError}>
                          <Chip
                            label="Error"
                            size="small"
                            sx={{ bgcolor: "rgba(239,68,68,0.2)", color: "#ef4444" }}
                          />
                        </Tooltip>
                      ) : (
                        <Typography sx={{ color: "#71717a", fontSize: 13 }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title={repo.isActive ? "Deactivate" : "Activate"}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleActive(repo)}
                            sx={{ color: "#a1a1aa" }}
                          >
                            <MSym name={repo.isActive ? "pause" : "play_arrow"} sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sync Now">
                          <IconButton
                            size="small"
                            onClick={() => handleSync(repo)}
                            disabled={syncingId === repo._id}
                            sx={{ color: "#a1a1aa" }}
                          >
                            {syncingId === repo._id ? (
                              <CircularProgress size={16} sx={{ color: "#fb923c" }} />
                            ) : (
                              <MSym name="sync" sx={{ fontSize: 18 }} />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(repo)}
                            disabled={deletingId === repo._id}
                            sx={{ color: "#ef4444" }}
                          >
                            <MSym name="delete" sx={{ fontSize: 18 }} />
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
      </Stack>

      {/* Add Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        PaperProps={{
          sx: { bgcolor: "#0b0f17", border: "1px solid #27272a", minWidth: 400 }
        }}
      >
        <DialogTitle sx={{ color: "#fff" }}>Add Repository</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#a1a1aa", fontSize: 14, mb: 2 }}>
            Enter the GitHub repository in the format: owner/repo
          </Typography>
          {addError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {addError}
            </Alert>
          )}
          <TextField
            fullWidth
            placeholder="e.g., facebook/react"
            value={newRepoName}
            onChange={(e) => setNewRepoName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddRepo()}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#050509",
                color: "#fff",
                "& fieldset": { borderColor: "#27272a" },
                "&:hover fieldset": { borderColor: "#3f3f46" }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)} sx={{ color: "#a1a1aa" }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddRepo}
            disabled={adding || !newRepoName.trim()}
            variant="contained"
            sx={{ bgcolor: "#fb923c", "&:hover": { bgcolor: "#f97316" } }}
          >
            {adding ? <CircularProgress size={20} /> : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
