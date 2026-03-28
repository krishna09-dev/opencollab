import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Adjust,
  Bookmark,
  BookmarkAdd,
  ChatBubbleOutline,
  Search
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputBase,
  Stack,
  Typography
} from "@mui/material";

import AppLayout from "../../../components/layout/AppLayout";
import { useSavedIssues } from "../../../hooks/useSavedIssues";

const TAG_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  bug: { color: "#f87171", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" },
  feature: { color: "#818cf8", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)" },
  enhancement: { color: "#818cf8", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)" },
  documentation: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.2)" },
  "good first issue": { color: "#f472b6", bg: "rgba(244,114,182,0.1)", border: "rgba(244,114,182,0.2)" },
  "help wanted": { color: "#2dd4bf", bg: "rgba(45,212,191,0.1)", border: "rgba(45,212,191,0.2)" },
  javascript: { color: "#facc15", bg: "rgba(250,204,21,0.1)", border: "rgba(250,204,21,0.2)" },
  typescript: { color: "#3178c6", bg: "rgba(49,120,198,0.1)", border: "rgba(49,120,198,0.2)" },
  python: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)" },
  rust: { color: "#fb923c", bg: "rgba(194,65,12,0.1)", border: "rgba(249,115,22,0.2)" },
  react: { color: "#22d3ee", bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.2)" }
};
const DEFAULT_TAG_COLOR = { color: "#a1a1aa", bg: "rgba(161,161,170,0.1)", border: "rgba(161,161,170,0.2)" };

function getTagColor(label: string) {
  return TAG_COLORS[label.toLowerCase()] || DEFAULT_TAG_COLOR;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SavedIssueCard({
  entry,
  onUnsave
}: {
  entry: ReturnType<typeof useSavedIssues>["saved"][number];
  onUnsave: (id: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        p: 2.6,
        borderRadius: "20px",
        border: "1px solid #27272a",
        bgcolor: "#0b0f17",
        position: "relative",
        cursor: "pointer",
        transition: "border-color 0.2s",
        "&:hover": { borderColor: "#3f3f46" }
      }}
      onClick={() => navigate(`/issues/${entry.id}`)}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Adjust sx={{ fontSize: 22, mt: 0.5, color: "#0df259" }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 12,
              color: "#a1a1aa",
              mb: 0.7,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
            }}
          >
            {entry.repoOwner}/{entry.repoName} • saved {timeAgo(entry.savedAt)}
          </Typography>
          <Typography
            sx={{ fontSize: 30 / 1.6, fontWeight: 600, lineHeight: "28px", mb: 0.8, color: "#fff" }}
          >
            {entry.title}
          </Typography>

          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {/* Repo chip as label */}
              <Chip
                label={`${entry.repoOwner}/${entry.repoName}`}
                sx={{
                  height: 26,
                  borderRadius: "8px",
                  fontWeight: 500,
                  color: "#60a5fa",
                  bgcolor: "rgba(96,165,250,0.1)",
                  border: "1px solid rgba(96,165,250,0.2)",
                  ".MuiChip-label": { px: 1.1, fontSize: 12 }
                }}
              />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Stack direction="row" spacing={0.7} alignItems="center">
                <ChatBubbleOutline sx={{ fontSize: 16, color: "#a1a1aa" }} />
                <Typography sx={{ fontSize: 12, color: "#a1a1aa", fontWeight: 500 }}>0</Typography>
              </Stack>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onUnsave(entry.id);
                }}
                sx={{
                  color: "#19e66b",
                  p: 0.5,
                  "&:hover": { bgcolor: "rgba(25,230,107,0.1)" }
                }}
              >
                <Bookmark sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        <Stack spacing={1} alignItems="center">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/issues/${entry.id}`);
            }}
            sx={{
              minHeight: 36,
              textTransform: "none",
              borderRadius: "14px",
              px: 2,
              fontSize: 14,
              fontWeight: 600,
              bgcolor: "#19e66b",
              color: "#000",
              boxShadow: "0 0 10px rgba(25,230,107,0.2)",
              whiteSpace: "nowrap"
            }}
          >
            View
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

export default function SavedIssuesPage() {
  const { saved, toggleSave } = useSavedIssues();
  const [search, setSearch] = useState("");

  const filtered = saved.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.repoOwner.toLowerCase().includes(q) ||
      e.repoName.toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout activePage="saved">
      <Box sx={{ maxWidth: 1152, mx: "auto", px: 3, py: 5 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "16px",
              bgcolor: "rgba(25,230,107,0.1)",
              border: "1px solid rgba(25,230,107,0.25)",
              display: "grid",
              placeItems: "center"
            }}
          >
            <Bookmark sx={{ color: "#19e66b", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 42, lineHeight: "48px", fontWeight: 700, letterSpacing: -0.8 }}>
              Saved Issues
            </Typography>
            <Typography sx={{ color: "#a1a1aa", mt: 0.5, fontSize: 16 }}>
              Issues you've bookmarked for later
            </Typography>
          </Box>
        </Stack>

        {/* Search */}
        <Box
          sx={{
            mt: 3,
            mb: 2.5,
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved issues..."
            sx={{ color: "#fff", fontSize: 14, "& input::placeholder": { color: "#a1a1aa" } }}
          />
          {search && (
            <IconButton size="small" onClick={() => setSearch("")} sx={{ color: "#a1a1aa", p: 0.5 }}>
              <Search sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>

        {/* Stats bar */}
        <Stack direction="row" alignItems="center" sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: 13, color: "#a1a1aa" }}>
            {filtered.length} saved issue{filtered.length !== 1 ? "s" : ""}
            {search ? ` matching "${search}"` : ""}
          </Typography>
        </Stack>

        {/* Content */}
        {filtered.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "20px",
                bgcolor: "rgba(25,230,107,0.08)",
                border: "1px solid rgba(25,230,107,0.15)",
                display: "grid",
                placeItems: "center",
                mx: "auto",
                mb: 2
              }}
            >
              <BookmarkAdd sx={{ fontSize: 32, color: "#19e66b" }} />
            </Box>
            <Typography sx={{ color: "#a1a1aa", fontSize: 16, mb: 0.5 }}>
              {search ? "No saved issues match your search." : "No saved issues yet."}
            </Typography>
            <Typography sx={{ color: "#52525b", fontSize: 14 }}>
              {search
                ? "Try a different search term."
                : "Click the bookmark icon on any issue to save it here."}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {filtered.map((entry) => (
              <SavedIssueCard key={entry.id} entry={entry} onUnsave={toggleSave} />
            ))}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
}
