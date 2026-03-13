import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Adjust,
  ArrowBack,
  ArrowForward,
  AutoAwesome,
  ChatBubbleOutline,
  ExpandMore,
  Search,
  Sort,
  ThumbUpOffAlt,
  Tune
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  InputBase,
  Stack,
  Typography
} from "@mui/material";

import AppLayout from "../../../components/layout/AppLayout";
import MSym from "../../resources/components/MSym";
import { useGoodFirstIssues } from "../hooks/useGoodFirstIssues";
import type { GoodFirstIssue, DifficultyLevel } from "../types";
import { DIFFICULTY_CONFIGS } from "../types";

// Tag color helpers (from HomePage)
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

function getStatusColor(status: string) {
  if (status === "open") return "#0df259";
  if (status === "claimed") return "#c084fc";
  return "#a1a1aa";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Sidebar component for skill level selection
function GoodFirstIssuesSidebar({
  userLevel,
  onChangeLevel,
  difficultyCounts
}: {
  userLevel: DifficultyLevel;
  onChangeLevel: (level: DifficultyLevel) => void;
  difficultyCounts: Record<DifficultyLevel, number>;
}) {
  return (
    <>
      <Typography
        sx={{
          color: "#a1a1aa",
          fontWeight: 600,
          fontSize: 12,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          px: 1,
          mb: 1.5
        }}
      >
        Your Skill Level
      </Typography>

      <Stack spacing={1}>
        {(Object.keys(DIFFICULTY_CONFIGS) as DifficultyLevel[]).map((level) => {
          const config = DIFFICULTY_CONFIGS[level];
          const isActive = userLevel === level;

          return (
            <Button
              key={level}
              fullWidth
              onClick={() => onChangeLevel(level)}
              sx={{
                textTransform: "none",
                borderRadius: "14px",
                justifyContent: "flex-start",
                px: 1.5,
                py: 1.2,
                gap: 1.2,
                color: isActive ? config.color : "#a1a1aa",
                bgcolor: isActive ? config.bgColor : "transparent",
                border: isActive ? `1px solid ${config.borderColor}` : "1px solid transparent",
                fontWeight: 500,
                "&:hover": {
                  bgcolor: isActive ? config.bgColor : "rgba(255,255,255,0.03)"
                }
              }}
            >
              <MSym
                name={config.icon}
                sx={{ fontSize: 18, color: isActive ? config.color : undefined }}
              />
              <Box sx={{ flex: 1, textAlign: "left" }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                  {config.label}
                </Typography>
                <Typography sx={{ fontSize: 11, color: "#71717a", lineHeight: 1.3 }}>
                  {config.description.slice(0, 40)}...
                </Typography>
              </Box>
              {isActive && (
                <MSym name="check_circle" sx={{ fontSize: 18, color: config.color }} />
              )}
            </Button>
          );
        })}
      </Stack>

      <Divider sx={{ borderColor: "#27272a", my: 2.5 }} />

      <Typography
        sx={{
          color: "#a1a1aa",
          fontWeight: 600,
          fontSize: 12,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          px: 1,
          mb: 1.5
        }}
      >
        Issue Stats
      </Typography>

      <Stack spacing={0.8}>
        {(Object.keys(DIFFICULTY_CONFIGS) as DifficultyLevel[]).map((level) => {
          const config = DIFFICULTY_CONFIGS[level];
          const count = difficultyCounts[level];

          return (
            <Stack
              key={level}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ px: 1 }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: config.color
                  }}
                />
                <Typography sx={{ fontSize: 13, color: "#a1a1aa" }}>
                  {config.label}
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                {count}
              </Typography>
            </Stack>
          );
        })}
      </Stack>

      <Divider sx={{ borderColor: "#27272a", my: 2.5 }} />

      <Box sx={{ px: 1 }}>
        <Typography sx={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>
          We recommend issues based on your selected skill level. As you grow, update your level to see more challenging issues.
        </Typography>
      </Box>
    </>
  );
}

// Issue card component
function GoodFirstIssueCard({ issue }: { issue: GoodFirstIssue }) {
  const navigate = useNavigate();
  const config = DIFFICULTY_CONFIGS[issue.difficulty];
  const isClaimed = issue.status === "claimed";
  const isClosed = issue.status === "closed";
  const muted = isClaimed || isClosed;

  const cta = isClaimed ? "View" : isClosed ? "Closed" : issue.status === "open" ? "View Details" : "View";
  const ctaPrimary = issue.status === "open";

  return (
    <Box
      sx={{
        p: 2.6,
        borderRadius: "20px",
        border: "1px solid #27272a",
        bgcolor: muted ? "rgba(11,15,23,0.5)" : "#0b0f17",
        opacity: muted ? 0.8 : 1,
        position: "relative",
        cursor: "pointer",
        transition: "border-color 0.2s",
        "&:hover": { borderColor: "#3f3f46" }
      }}
      onClick={() => navigate(`/issues/${issue._id}`)}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Adjust sx={{ fontSize: 22, mt: 0.5, color: getStatusColor(issue.status) }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 12, color: "#a1a1aa", mb: 0.7, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
            {issue.repoOwner}/{issue.repoName} • #{issue.githubNumber} • {timeAgo(issue.githubCreatedAt)}
          </Typography>
          <Typography sx={{ fontSize: 30 / 1.6, fontWeight: 600, lineHeight: "28px", mb: 0.8, color: muted ? "rgba(255,255,255,0.8)" : "#fff" }}>
            {issue.title}
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#a1a1aa", lineHeight: "22px", mb: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {issue.summary || issue.body?.slice(0, 200)}
          </Typography>

          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {(issue.labels || []).slice(0, 4).map((label) => {
                const tc = getTagColor(label);
                return (
                  <Chip
                    key={label}
                    label={label}
                    sx={{
                      height: 26,
                      borderRadius: "8px",
                      fontWeight: 500,
                      color: tc.color,
                      bgcolor: tc.bg,
                      border: `1px solid ${tc.border}`,
                      ".MuiChip-label": { px: 1.1, fontSize: 12 }
                    }}
                  />
                );
              })}
              {/* Difficulty chip */}
              <Chip
                label={config.label}
                sx={{
                  height: 26,
                  borderRadius: "8px",
                  fontWeight: 500,
                  color: config.color,
                  bgcolor: config.bgColor,
                  border: `1px solid ${config.borderColor}`,
                  ".MuiChip-label": { px: 1.1, fontSize: 12 }
                }}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <Stack direction="row" spacing={0.7} alignItems="center">
                <ChatBubbleOutline sx={{ fontSize: 16, color: "#a1a1aa" }} />
                <Typography sx={{ fontSize: 12, color: "#a1a1aa", fontWeight: 500 }}>
                  {issue.requiredSkills?.length || 0}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.7} alignItems="center">
                <ThumbUpOffAlt sx={{ fontSize: 16, color: "#a1a1aa" }} />
                <Typography sx={{ fontSize: 12, color: "#a1a1aa", fontWeight: 500 }}>
                  {issue.labels?.length || 0}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Box>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/issues/${issue._id}`);
          }}
          sx={
            ctaPrimary
              ? {
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
                }
              : {
                  minHeight: 36,
                  textTransform: "none",
                  borderRadius: "14px",
                  px: 2,
                  fontSize: 14,
                  fontWeight: 500,
                  border: "1px solid #27272a",
                  color: isClosed ? "#a1a1aa" : "#fff",
                  bgcolor: "#0b0f17",
                  whiteSpace: "nowrap"
                }
          }
        >
          {cta}
        </Button>
      </Stack>
      {isClaimed && (
        <Box
          sx={{
            position: "absolute",
            top: -10,
            right: -8,
            px: 1.2,
            py: 0.2,
            borderRadius: "999px",
            border: "1px solid rgba(168,85,247,0.3)",
            bgcolor: "rgba(168,85,247,0.2)",
            backdropFilter: "blur(6px)"
          }}
        >
          <Typography sx={{ fontSize: 10, color: "#d8b4fe", fontWeight: 700, letterSpacing: "0.025em", textTransform: "uppercase" }}>
            Claimed
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// Main page component
export default function GoodFirstIssuesPage() {
  const {
    userLevel,
    changeUserLevel,
    viewMode,
    switchToRecommended,
    switchToBrowse,
    recommended,
    recommendedLoading,
    issues,
    pagination,
    loading,
    error,
    filters,
    updateFilters,
    goToPage,
    loadIssues,
    filterByDifficulty,
    difficultyCounts
  } = useGoodFirstIssues();

  const [searchInput, setSearchInput] = useState("");

  const handleSearch = () => {
    updateFilters({ search: searchInput, page: 1 });
  };

  const isLoading = viewMode === "recommended" ? recommendedLoading : loading;
  const displayIssues = viewMode === "recommended" ? recommended : issues;
  const config = DIFFICULTY_CONFIGS[userLevel];

  return (
    <AppLayout
      activePage="good-first-issues"
      sidebarExtra={
        <GoodFirstIssuesSidebar
          userLevel={userLevel}
          onChangeLevel={changeUserLevel}
          difficultyCounts={difficultyCounts}
        />
      }
    >
      <Box sx={{ maxWidth: 1152, mx: "auto", px: 3, py: 5 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "16px",
              bgcolor: config.bgColor,
              border: `1px solid ${config.borderColor}`,
              display: "grid",
              placeItems: "center"
            }}
          >
            <MSym name="partner_exchange" sx={{ color: config.color, fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 42, lineHeight: "48px", fontWeight: 700, letterSpacing: -0.8 }}>
              Good First Issues
            </Typography>
            <Typography sx={{ color: "#a1a1aa", mt: 0.5, fontSize: 16 }}>
              Find the perfect issue to start your open source journey
            </Typography>
          </Box>
        </Stack>

        {/* Skill Level Indicator */}
        <Box
          sx={{
            mt: 3,
            mb: 2,
            p: 2,
            borderRadius: "16px",
            bgcolor: config.bgColor,
            border: `1px solid ${config.borderColor}`
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <MSym name={config.icon} sx={{ color: config.color, fontSize: 22 }} />
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
                  Showing issues for: <span style={{ color: config.color }}>{config.label}</span>
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#71717a" }}>
                  {config.description}
                </Typography>
              </Box>
            </Stack>
            <Button
              size="small"
              sx={{
                textTransform: "none",
                color: config.color,
                fontSize: 12,
                fontWeight: 500
              }}
              endIcon={<MSym name="tune" sx={{ fontSize: 16 }} />}
            >
              Change Level
            </Button>
          </Stack>
        </Box>

        {/* View Mode Toggle */}
        <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
          <Button
            onClick={switchToRecommended}
            startIcon={<AutoAwesome sx={{ fontSize: 18 }} />}
            sx={{
              textTransform: "none",
              borderRadius: "14px",
              px: 2,
              py: 1,
              fontSize: 14,
              fontWeight: 600,
              bgcolor: viewMode === "recommended" ? config.bgColor : "transparent",
              border: viewMode === "recommended" ? `1px solid ${config.borderColor}` : "1px solid #27272a",
              color: viewMode === "recommended" ? config.color : "#a1a1aa",
              "&:hover": {
                bgcolor: viewMode === "recommended" ? config.bgColor : "rgba(255,255,255,0.05)"
              }
            }}
          >
            Recommended for You
            {recommended.length > 0 && (
              <Box
                component="span"
                sx={{
                  ml: 1,
                  px: 0.8,
                  py: 0.1,
                  borderRadius: "6px",
                  bgcolor: viewMode === "recommended" ? `${config.color}30` : "rgba(255,255,255,0.1)",
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                {recommended.length}
              </Box>
            )}
          </Button>
          <Button
            onClick={switchToBrowse}
            sx={{
              textTransform: "none",
              borderRadius: "14px",
              px: 2,
              py: 1,
              fontSize: 14,
              fontWeight: 600,
              bgcolor: viewMode === "browse" ? "rgba(25,230,107,0.15)" : "transparent",
              border: viewMode === "browse" ? "1px solid rgba(25,230,107,0.3)" : "1px solid #27272a",
              color: viewMode === "browse" ? "#19e66b" : "#a1a1aa",
              "&:hover": {
                bgcolor: viewMode === "browse" ? "rgba(25,230,107,0.2)" : "rgba(255,255,255,0.05)"
              }
            }}
          >
            Browse All
          </Button>
        </Stack>

        {/* Search and Filters (only in browse mode) */}
        {viewMode === "browse" && (
          <>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2.2 }}>
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
                  placeholder="Search good first issues..."
                  sx={{ color: "#a1a1aa", fontSize: 14 }}
                />
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  sx={toolbarButtonSx}
                  startIcon={<Tune sx={{ fontSize: 18 }} />}
                  endIcon={<ExpandMore sx={{ fontSize: 18, color: "#a1a1aa" }} />}
                >
                  Filters
                </Button>
                <Button
                  sx={toolbarButtonSx}
                  startIcon={<Sort sx={{ fontSize: 18 }} />}
                >
                  Newest
                </Button>
              </Stack>
            </Stack>

            {/* Difficulty Filter Chips */}
            <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
              <Chip
                label="All"
                onClick={() => filterByDifficulty(undefined)}
                sx={{
                  height: 30,
                  borderRadius: "14px",
                  bgcolor: !filters.difficulty ? "rgba(25,230,107,0.1)" : "#0b0f17",
                  border: !filters.difficulty ? "1px solid rgba(25,230,107,0.2)" : "1px solid #27272a",
                  color: !filters.difficulty ? "#19e66b" : "#a1a1aa",
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              />
              {(Object.keys(DIFFICULTY_CONFIGS) as DifficultyLevel[]).map((level) => {
                const c = DIFFICULTY_CONFIGS[level];
                const isActive = filters.difficulty === level;
                return (
                  <Chip
                    key={level}
                    label={c.label}
                    onClick={() => filterByDifficulty(level)}
                    sx={{
                      height: 30,
                      borderRadius: "14px",
                      bgcolor: isActive ? c.bgColor : "#0b0f17",
                      border: isActive ? `1px solid ${c.borderColor}` : "1px solid #27272a",
                      color: isActive ? c.color : "#a1a1aa",
                      fontWeight: 500,
                      cursor: "pointer"
                    }}
                  />
                );
              })}
            </Stack>
          </>
        )}

        {/* Content */}
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: config.color }} />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography sx={{ color: "#f87171", mb: 2 }}>{error}</Typography>
            <Button onClick={() => loadIssues()} sx={{ textTransform: "none", color: "#19e66b" }}>
              Retry
            </Button>
          </Box>
        ) : displayIssues.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <MSym name="search_off" sx={{ fontSize: 48, color: "#27272a", mb: 2 }} />
            <Typography sx={{ color: "#a1a1aa", fontSize: 16 }}>
              No issues found for your criteria.
            </Typography>
            <Typography sx={{ color: "#52525b", fontSize: 14, mt: 0.5 }}>
              Try adjusting your filters or skill level.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {displayIssues.map((issue) => (
              <GoodFirstIssueCard key={issue._id} issue={issue} />
            ))}
          </Stack>
        )}

        {/* Pagination (only in browse mode) */}
        {viewMode === "browse" && pagination && pagination.totalPages > 1 && (
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: 3.2, pt: 3, borderTop: "1px solid #27272a" }}
          >
            <Button
              sx={pageButtonSx}
              startIcon={<ArrowBack sx={{ fontSize: 18 }} />}
              disabled={pagination.page <= 1}
              onClick={() => goToPage(pagination.page - 1)}
            >
              Previous
            </Button>
            <Stack direction="row" spacing={0.5} alignItems="center">
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                let pg: number;
                if (pagination.totalPages <= 5) {
                  pg = i + 1;
                } else if (pagination.page <= 3) {
                  pg = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pg = pagination.totalPages - 4 + i;
                } else {
                  pg = pagination.page - 2 + i;
                }
                return (
                  <Box
                    key={pg}
                    onClick={() => goToPage(pg)}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "6px",
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                      bgcolor: pg === pagination.page ? config.bgColor : "transparent",
                      color: pg === pagination.page ? config.color : "#a1a1aa",
                      fontWeight: pg === pagination.page ? 700 : 400,
                      fontSize: 14,
                      "&:hover": {
                        bgcolor: pg === pagination.page ? config.bgColor : "rgba(255,255,255,0.05)"
                      }
                    }}
                  >
                    {pg}
                  </Box>
                );
              })}
            </Stack>
            <Button
              sx={pageButtonSx}
              endIcon={<ArrowForward sx={{ fontSize: 18 }} />}
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => goToPage(pagination.page + 1)}
            >
              Next
            </Button>
          </Stack>
        )}

        <Typography sx={{ mt: 4, color: "#a1a1aa", fontSize: 12, textAlign: "center" }}>
          {viewMode === "recommended"
            ? `Showing ${recommended.length} recommended issues for ${config.label} level`
            : pagination
            ? `Showing ${issues.length} of ${pagination.total} issues`
            : ""}
        </Typography>
      </Box>
    </AppLayout>
  );
}

const toolbarButtonSx = {
  textTransform: "none",
  borderRadius: "14px",
  px: 1.6,
  border: "1px solid #27272a",
  bgcolor: "#0b0f17",
  color: "#fff",
  fontSize: 14,
  fontWeight: 500,
  minHeight: 42,
  whiteSpace: "nowrap"
};

const pageButtonSx = {
  textTransform: "none",
  color: "#a1a1aa",
  borderRadius: "14px",
  fontSize: 14,
  minHeight: 36,
  px: 2,
  fontWeight: 500
};
