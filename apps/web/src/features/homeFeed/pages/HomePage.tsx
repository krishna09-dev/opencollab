import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Adjust,
  ArrowBack,
  ArrowForward,
  Bookmark,
  BookmarkAdd,
  ChatBubbleOutline,
  Close,
  Code,
  ExpandMore,
  Search,
  Sort,
  Tune,
  AutoAwesome
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Stack,
  Typography
} from "@mui/material";

import AppLayout from "../../../components/layout/AppLayout";
import MSym from "../../resources/components/MSym";
import { useHomeFeed } from "../hooks/useHomeFeed";
import { useSavedIssues } from "../../../hooks/useSavedIssues";
import type { IssueRow } from "../types";
import type { RecommendationItem } from "../api/homeApi";

const filterChipSx = {
  borderRadius: "14px",
  height: 30,
  bgcolor: "#0b0f17",
  border: "1px solid #27272a",
  color: "#a1a1aa",
  fontSize: 12,
  fontWeight: 500,
  ".MuiChip-label": { px: 1.5 }
};

// ─── Tag color helpers ───
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

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

const DIFFICULTY_STYLES: Record<DifficultyLevel, { label: string; color: string; bg: string; border: string }> = {
  beginner: {
    label: "Beginner",
    color: "#2dd4bf",
    bg: "rgba(45,212,191,0.1)",
    border: "rgba(45,212,191,0.2)"
  },
  intermediate: {
    label: "Intermediate",
    color: "#facc15",
    bg: "rgba(250,204,21,0.1)",
    border: "rgba(250,204,21,0.2)"
  },
  advanced: {
    label: "Advanced",
    color: "#f87171",
    bg: "rgba(248,113,113,0.1)",
    border: "rgba(248,113,113,0.2)"
  }
};

function normalizeDifficulty(value?: string | null): DifficultyLevel | null {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "beginner" || normalized === "intermediate" || normalized === "advanced") {
    return normalized;
  }
  return null;
}

function inferDifficultyFromIssue(issue: IssueRow): DifficultyLevel {
  const explicit = normalizeDifficulty(issue.difficulty);
  if (explicit) return explicit;

  const labels = (issue.labels || []).map((l) => l.toLowerCase());
  const hasBeginnerSignals = issue.beginnerFriendly || labels.some((l) =>
    l.includes("good first issue") || l.includes("beginner") || l.includes("easy")
  );
  const hasAdvancedSignals =
    labels.some((l) => l.includes("advanced") || l.includes("hard") || l.includes("complex")) ||
    (issue.requiredSkills || []).length > 5 ||
    String(issue.body || "").length > 2000;

  if (hasBeginnerSignals && !hasAdvancedSignals) return "beginner";
  if (hasAdvancedSignals && !hasBeginnerSignals) return "advanced";
  return "intermediate";
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

const RECENT_SEARCHES_KEY = "oc_recent_searches";

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const searches = loadRecentSearches().filter((s) => s !== query);
  searches.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, 3)));
}

function HomeSidebarExtra({ onSearch, onFilterLanguage, onFilterDifficulty, activeLanguage, activeDifficulty, onClearFilters, languageOptions }: {
  onSearch: (query: string) => void;
  onFilterLanguage: (lang: string | undefined) => void;
  onFilterDifficulty: (diff: string | undefined) => void;
  activeLanguage?: string;
  activeDifficulty?: string;
  onClearFilters: () => void;
  languageOptions: string[];
}) {
  const [recentSearches] = useState<string[]>(loadRecentSearches);

  const DIFFICULTY_MAP: Record<string, string> = { "Beginner": "beginner", "Intermediate": "intermediate", "Advanced": "advanced" };

  return (
    <>
      <Typography sx={{ color: "#a1a1aa", fontWeight: 600, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", px: 1, mb: 1.5 }}>
        Recent Searches
      </Typography>
      <Stack spacing={0.5}>
        {recentSearches.length === 0 ? (
          <Typography sx={{ fontSize: 12, color: "#52525b", px: 1.5, py: 1 }}>No recent searches.</Typography>
        ) : (
          recentSearches.map((item) => (
            <Button
              key={item}
              fullWidth
              onClick={() => onSearch(item)}
              sx={{ textTransform: "none", borderRadius: "14px", justifyContent: "flex-start", px: 1.5, py: 1, gap: 1, color: "#a1a1aa", fontWeight: 500 }}
            >
              <MSym name="history" sx={{ fontSize: 17 }} />
              {item}
            </Button>
          ))
        )}
      </Stack>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 3, mb: 1.5 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#a1a1aa", letterSpacing: 0.6, textTransform: "uppercase" }}>
          Filters
        </Typography>
        <Typography sx={{ fontSize: 10, color: "#19e66b", cursor: "pointer" }} onClick={onClearFilters}>Clear all</Typography>
      </Stack>

      <Typography sx={{ fontSize: 12, color: "#fff", mb: 1 }}>Languages</Typography>
      <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mb: 2.5 }}>
        {languageOptions.map((language) => {
          const isActive = activeLanguage === language;
          const showCodeIcon = language.toLowerCase() === "javascript";
          return (
            <Chip
              key={language}
              icon={showCodeIcon ? <Code sx={{ fontSize: "14px !important", color: isActive ? "#19e66b !important" : undefined }} /> : undefined}
              label={language}
              onClick={() => onFilterLanguage(isActive ? undefined : language)}
              sx={isActive
                ? { ...filterChipSx, bgcolor: "rgba(25,230,107,0.1)", borderColor: "rgba(25,230,107,0.2)", color: "#19e66b", cursor: "pointer" }
                : { ...filterChipSx, cursor: "pointer" }}
            />
          );
        })}
        {languageOptions.length === 0 && (
          <Typography sx={{ fontSize: 12, color: "#52525b", px: 0.5 }}>
            No languages found.
          </Typography>
        )}
      </Stack>

      <Typography sx={{ fontSize: 12, color: "#fff", mb: 1 }}>Difficulty</Typography>
      <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mb: 2.5 }}>
        {Object.entries(DIFFICULTY_MAP).map(([label, value]) => {
          const isActive = activeDifficulty === value;
          return (
            <Chip
              key={label}
              label={label}
              onClick={() => onFilterDifficulty(isActive ? undefined : value)}
              sx={isActive
                ? { ...filterChipSx, bgcolor: "rgba(25,230,107,0.1)", borderColor: "rgba(25,230,107,0.2)", color: "#19e66b", cursor: "pointer" }
                : { ...filterChipSx, cursor: "pointer" }}
            />
          );
        })}
      </Stack>

    </>
  );
}

function IssueCard({ issue, isSaved, onToggleSave }: { issue: IssueRow; isSaved?: boolean; onToggleSave?: (id: string, meta?: { title: string; repoOwner: string; repoName: string; repoLanguage?: string | null; labels?: string[]; beginnerFriendly?: boolean }) => void }) {
  const navigate = useNavigate();
  const isClaimed = issue.status === "claimed";
  const isClosed = issue.status === "closed";
  const muted = isClaimed || isClosed;
  const issueDifficulty = inferDifficultyFromIssue(issue);
  const difficultyStyle = DIFFICULTY_STYLES[issueDifficulty];

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
              {issue.repoLanguage && (() => {
                const tc = getTagColor(issue.repoLanguage);
                return (
                  <Chip
                    key={`lang-${issue.repoLanguage}`}
                    label={issue.repoLanguage}
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
              })()}

              <Chip
                label={difficultyStyle.label}
                sx={{
                  height: 26,
                  borderRadius: "8px",
                  fontWeight: 500,
                  color: difficultyStyle.color,
                  bgcolor: difficultyStyle.bg,
                  border: `1px solid ${difficultyStyle.border}`,
                  ".MuiChip-label": { px: 1.1, fontSize: 12 }
                }}
              />

              {(issue.labels || []).slice(0, 3).map((label) => {
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
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Stack direction="row" spacing={0.7} alignItems="center">
                <ChatBubbleOutline sx={{ fontSize: 16, color: "#a1a1aa" }} />
                <Typography sx={{ fontSize: 12, color: "#a1a1aa", fontWeight: 500 }}>
                  {issue.commentsCount ?? 0}
                </Typography>
              </Stack>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave?.(issue._id, { 
                    title: issue.title, 
                    repoOwner: issue.repoOwner, 
                    repoName: issue.repoName,
                    repoLanguage: issue.repoLanguage,
                    labels: issue.labels,
                    beginnerFriendly: issue.beginnerFriendly
                  });
                }}
                sx={{
                  color: isSaved ? "#19e66b" : "#a1a1aa",
                  p: 0.5,
                  "&:hover": { bgcolor: "rgba(25,230,107,0.1)" }
                }}
              >
                {isSaved ? <Bookmark sx={{ fontSize: 18 }} /> : <BookmarkAdd sx={{ fontSize: 18 }} />}
              </IconButton>
            </Stack>
          </Stack>
        </Box>
        <Stack spacing={1} alignItems="center">
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
            Claimed{issue.claimedByLogin ? ` by ${issue.claimedByLogin}` : ""}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function RecommendationCard({ recommendation, isSaved, onToggleSave }: { recommendation: RecommendationItem; isSaved?: boolean; onToggleSave?: (id: string, meta?: { title: string; repoOwner: string; repoName: string; repoLanguage?: string | null; labels?: string[]; beginnerFriendly?: boolean }) => void }) {
  const navigate = useNavigate();

  // Parse labels string to array
  const labelsArray = recommendation.labels
    ? recommendation.labels.replace(/[\[\]']/g, "").split(",").map((l) => l.trim()).filter(Boolean)
    : [];

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
      onClick={() => {
        navigate(`/issues/${recommendation.issue_id}`);
      }}
    >
      {/* AI Match Score Badge */}
      <Box
        sx={{
          position: "absolute",
          top: -10,
          right: recommendation.claimed_by ? 140 : -8,
          px: 1.4,
          py: 0.3,
          borderRadius: "999px",
          border: "1px solid rgba(168,85,247,0.3)",
          bgcolor: "rgba(168,85,247,0.2)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          gap: 0.5
        }}
      >
        <Typography sx={{ fontSize: 10, color: "#d8b4fe", fontWeight: 700, letterSpacing: "0.025em", textTransform: "uppercase" }}>
          {Math.round(recommendation.similarity_score * 100)}% AI Match
        </Typography>
      </Box>
      {/* Claimed By Badge */}
      {recommendation.claimed_by && (
        <Box
          sx={{
            position: "absolute",
            top: -10,
            right: -8,
            px: 1.2,
            py: 0.3,
            borderRadius: "999px",
            border: "1px solid rgba(168,85,247,0.3)",
            bgcolor: "rgba(168,85,247,0.2)",
            backdropFilter: "blur(6px)"
          }}
        >
          <Typography sx={{ fontSize: 10, color: "#d8b4fe", fontWeight: 700, letterSpacing: "0.025em", textTransform: "uppercase" }}>
            Claimed by {recommendation.claimed_by}
          </Typography>
        </Box>
      )}
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Adjust sx={{ fontSize: 22, mt: 0.5, color: "#0df259" }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 12, color: "#a1a1aa", mb: 0.7, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
            {recommendation.repo_name} • {recommendation.language}
          </Typography>
          <Typography sx={{ fontSize: 30 / 1.6, fontWeight: 600, lineHeight: "28px", mb: 0.8, color: "#fff" }}>
            {recommendation.issue_title}
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#a1a1aa", lineHeight: "22px", mb: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {recommendation.summary || recommendation.body?.slice(0, 200) || `A ${recommendation.difficulty} level ${recommendation.language} issue with topics: ${recommendation.topics || "general"}`}
          </Typography>

          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {/* Labels */}
              {labelsArray.slice(0, 4).map((label) => {
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
                label={recommendation.difficulty}
                sx={{
                  height: 26,
                  borderRadius: "8px",
                  fontWeight: 500,
                  color: recommendation.difficulty === "beginner" ? "#2dd4bf" : "#facc15",
                  bgcolor: recommendation.difficulty === "beginner" ? "rgba(45,212,191,0.1)" : "rgba(250,204,21,0.1)",
                  border: recommendation.difficulty === "beginner" ? "1px solid rgba(45,212,191,0.2)" : "1px solid rgba(250,204,21,0.2)",
                  ".MuiChip-label": { px: 1.1, fontSize: 12 }
                }}
              />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Stack direction="row" spacing={0.7} alignItems="center">
                <ChatBubbleOutline sx={{ fontSize: 16, color: "#a1a1aa" }} />
                <Typography sx={{ fontSize: 12, color: "#a1a1aa", fontWeight: 500 }}>
                  {labelsArray.length}
                </Typography>
              </Stack>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  const parts = recommendation.repo_name.split("/");
                  const labelsArr = recommendation.labels
                    ? recommendation.labels.replace(/[\[\]']/g, "").split(",").map((l) => l.trim()).filter(Boolean)
                    : [];
                  onToggleSave?.(recommendation.issue_id, {
                    title: recommendation.issue_title,
                    repoOwner: parts[0] || "",
                    repoName: parts[1] || recommendation.repo_name,
                    repoLanguage: recommendation.language || null,
                    labels: labelsArr,
                    beginnerFriendly: recommendation.difficulty === "beginner"
                  });
                }}
                sx={{
                  color: isSaved ? "#19e66b" : "#a1a1aa",
                  p: 0.5,
                  "&:hover": { bgcolor: "rgba(25,230,107,0.1)" }
                }}
              >
                {isSaved ? <Bookmark sx={{ fontSize: 18 }} /> : <BookmarkAdd sx={{ fontSize: 18 }} />}
              </IconButton>
            </Stack>
          </Stack>
        </Box>
        <Stack spacing={1} alignItems="center">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/issues/${recommendation.issue_id}`);
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

export default function HomePage() {
  const navigate = useNavigate();
  const { isSaved, toggleSave, savedCount } = useSavedIssues();
  const {
    issues,
    pagination,
    issuesLoading,
    issuesError,
    filters,
    languageOptions,
    updateFilters,
    goToPage,
    loadIssues,
    recommendations,
    recommendationsLoading,
    recommendationError,
    useRecommendations,
    toggleRecommendations,
    loadRecommendations,
    showAllIssues
  } = useHomeFeed();

  const [searchInput, setSearchInput] = useState("");
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // For You filtering state
  const [recSearch, setRecSearch] = useState("");
  const [recSort, setRecSort] = useState<"newest" | "score">("score");
  const [recDifficultyFilter, setRecDifficultyFilter] = useState<string | undefined>(undefined);
  const [recFilterAnchor, setRecFilterAnchor] = useState<null | HTMLElement>(null);
  const [recSortAnchor, setRecSortAnchor] = useState<null | HTMLElement>(null);

  // Debounced search - triggers search as user types
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      if (searchInput !== (filters.search || "")) {
        updateFilters({ search: searchInput || undefined, page: 1 });
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const handleSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchInput.trim()) {
      saveRecentSearch(searchInput.trim());
    }
    updateFilters({ search: searchInput || undefined, page: 1 });
  };

  const handleSidebarSearch = (query: string) => {
    setSearchInput(query);
    updateFilters({ search: query, page: 1 });
  };

  const handleSidebarLanguage = (lang: string | undefined) => {
    updateFilters({ language: lang, page: 1 });
  };

  const handleSidebarDifficulty = (diff: string | undefined) => {
    updateFilters({ difficulty: diff, page: 1 });
  };

  const handleClearSidebarFilters = () => {
    updateFilters({ language: undefined, difficulty: undefined, page: 1 });
  };

  // Filter options
  const STATUS_OPTIONS = [
    { value: undefined, label: "All Statuses" },
    { value: "open", label: "Open" },
    { value: "claimed", label: "Claimed" },
    { value: "closed", label: "Closed" }
  ];

  const LANGUAGE_OPTIONS = [
    { value: undefined, label: "All Languages" },
    ...languageOptions.map((lang) => ({ value: lang, label: lang }))
  ];

  const DIFFICULTY_OPTIONS = [
    { value: undefined, label: "All Difficulties" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" }
  ];

  const SORT_OPTIONS = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" }
  ];

  const hasActiveFilters = filters.search || filters.status || filters.language || filters.difficulty;

  // Show ML recommendations or regular issues
  const showingRecommendations = useRecommendations;
  const isLoading = showingRecommendations ? recommendationsLoading : issuesLoading;

  // Filter recommendations client-side
  const filteredRecommendations = recommendations.filter((rec) => {
    if (recSearch) {
      const q = recSearch.toLowerCase();
      const matchesTitle = rec.issue_title.toLowerCase().includes(q);
      const matchesRepo = rec.repo_name.toLowerCase().includes(q);
      const matchesLabels = rec.labels?.toLowerCase().includes(q);
      const matchesTopics = rec.topics?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesRepo && !matchesLabels && !matchesTopics) return false;
    }
    if (recDifficultyFilter && rec.difficulty !== recDifficultyFilter) return false;
    return true;
  }).sort((a, b) => {
    const aClaimedRank = a.issue_status === "claimed" || !!a.claimed_by ? 1 : 0;
    const bClaimedRank = b.issue_status === "claimed" || !!b.claimed_by ? 1 : 0;
    if (aClaimedRank !== bClaimedRank) return aClaimedRank - bClaimedRank;
    if (recSort === "score") return b.similarity_score - a.similarity_score;
    return 0; // "newest" keeps original order
  });

  return (
    <AppLayout activePage="feed" sidebarExtra={<HomeSidebarExtra onSearch={handleSidebarSearch} onFilterLanguage={handleSidebarLanguage} onFilterDifficulty={handleSidebarDifficulty} activeLanguage={filters.language} activeDifficulty={filters.difficulty} onClearFilters={handleClearSidebarFilters} languageOptions={languageOptions} />}>
      <Box sx={{ maxWidth: 1152, mx: "auto", px: 3, py: 5 }}>
        <Typography sx={{ fontSize: 42, lineHeight: "48px", fontWeight: 700, letterSpacing: -0.8 }}>
          Your Issue Feed
        </Typography>
        <Typography sx={{ color: "#a1a1aa", mt: 1, fontSize: 16 }}>
          Discover issues relevant to your skills and interests.
        </Typography>

        {/* Feed Mode Toggle */}
        <Stack direction="row" spacing={1} sx={{ mt: 3, mb: 2 }}>
          <Button
            onClick={showAllIssues}
            sx={{
              textTransform: "none",
              borderRadius: "14px",
              px: 2,
              py: 1,
              fontSize: 14,
              fontWeight: 600,
              bgcolor: !useRecommendations ? "rgba(255,255,255,0.06)" : "transparent",
              border: "1px solid #27272a",
              color: !useRecommendations ? "#fff" : "#a1a1aa",
              "&:hover": { bgcolor: !useRecommendations ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)" }
            }}
          >
            All Issues
          </Button>
          <Button
            onClick={() => { if (!useRecommendations) toggleRecommendations(); }}
            startIcon={<AutoAwesome sx={{ fontSize: 18 }} />}
            sx={{
              textTransform: "none",
              borderRadius: "14px",
              px: 2,
              py: 1,
              fontSize: 14,
              fontWeight: 600,
              bgcolor: useRecommendations ? "rgba(168,85,247,0.15)" : "transparent",
              border: useRecommendations ? "1px solid rgba(168,85,247,0.3)" : "1px solid #27272a",
              color: useRecommendations ? "#c084fc" : "#a1a1aa",
              "&:hover": { bgcolor: useRecommendations ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.05)" }
            }}
          >
            For You
            {recommendations.length > 0 && (
              <Box
                component="span"
                sx={{
                  ml: 1,
                  px: 0.8,
                  py: 0.1,
                  borderRadius: "6px",
                  bgcolor: useRecommendations ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.1)",
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                {recommendations.length}
              </Box>
            )}
          </Button>
        </Stack>

        {!showingRecommendations && (
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
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                placeholder="Search issues, repos, or authors..."
                sx={{ color: "#fff", fontSize: 14, "& input::placeholder": { color: "#a1a1aa" } }}
              />
              {searchInput && (
                <IconButton
                  size="small"
                  onClick={() => { setSearchInput(""); updateFilters({ search: undefined, page: 1 }); }}
                  sx={{ color: "#a1a1aa", p: 0.5 }}
                >
                  <Close sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                sx={{
                  ...toolbarButtonSx,
                  ...(hasActiveFilters && !filters.search ? {
                    bgcolor: "rgba(25,230,107,0.1)",
                    borderColor: "rgba(25,230,107,0.3)",
                    color: "#19e66b"
                  } : {})
                }}
                startIcon={<Tune sx={{ fontSize: 18 }} />}
                endIcon={<ExpandMore sx={{ fontSize: 18, color: "#a1a1aa" }} />}
                onClick={(e) => setFilterAnchor(e.currentTarget)}
              >
                Filters
                {(filters.status || filters.language || filters.difficulty) && (
                  <Box
                    component="span"
                    sx={{
                      ml: 0.5,
                      px: 0.6,
                      py: 0.1,
                      borderRadius: "4px",
                      bgcolor: "rgba(25,230,107,0.2)",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#19e66b"
                    }}
                  >
                    {[filters.status, filters.language, filters.difficulty].filter(Boolean).length}
                  </Box>
                )}
              </Button>
              <Menu
                anchorEl={filterAnchor}
                open={Boolean(filterAnchor)}
                onClose={() => setFilterAnchor(null)}
                PaperProps={{
                  sx: {
                    bgcolor: "#0b0f17",
                    border: "1px solid #27272a",
                    borderRadius: "12px",
                    minWidth: 220,
                    mt: 1
                  }
                }}
              >
                <Typography sx={{ px: 2, py: 1, fontSize: 11, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Status
                </Typography>
                {STATUS_OPTIONS.map((opt) => (
                  <MenuItem
                    key={opt.label}
                    onClick={() => { updateFilters({ status: opt.value, page: 1 }); setFilterAnchor(null); }}
                    sx={{
                      fontSize: 14,
                      color: filters.status === opt.value ? "#19e66b" : "#fff",
                      bgcolor: filters.status === opt.value ? "rgba(25,230,107,0.1)" : "transparent",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }
                    }}
                  >
                    {opt.label}
                  </MenuItem>
                ))}
                <Divider sx={{ borderColor: "#27272a", my: 1 }} />
                <Typography sx={{ px: 2, py: 1, fontSize: 11, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Language
                </Typography>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <MenuItem
                    key={opt.label}
                    onClick={() => { updateFilters({ language: opt.value, page: 1 }); setFilterAnchor(null); }}
                    sx={{
                      fontSize: 14,
                      color: filters.language === opt.value ? "#19e66b" : "#fff",
                      bgcolor: filters.language === opt.value ? "rgba(25,230,107,0.1)" : "transparent",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }
                    }}
                  >
                    {opt.label}
                  </MenuItem>
                ))}
                <Divider sx={{ borderColor: "#27272a", my: 1 }} />
                <Typography sx={{ px: 2, py: 1, fontSize: 11, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Difficulty
                </Typography>
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <MenuItem
                    key={opt.label}
                    onClick={() => { updateFilters({ difficulty: opt.value, page: 1 }); setFilterAnchor(null); }}
                    sx={{
                      fontSize: 14,
                      color: filters.difficulty === opt.value ? "#19e66b" : "#fff",
                      bgcolor: filters.difficulty === opt.value ? "rgba(25,230,107,0.1)" : "transparent",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }
                    }}
                  >
                    {opt.label}
                  </MenuItem>
                ))}
                {(filters.status || filters.language || filters.difficulty) && (
                  <>
                    <Divider sx={{ borderColor: "#27272a", my: 1 }} />
                    <MenuItem
                      onClick={() => {
                        updateFilters({ status: undefined, language: undefined, difficulty: undefined, page: 1 });
                        setFilterAnchor(null);
                      }}
                      sx={{ fontSize: 14, color: "#f87171", "&:hover": { bgcolor: "rgba(248,113,113,0.1)" } }}
                    >
                      Clear All Filters
                    </MenuItem>
                  </>
                )}
              </Menu>

              <Button
                sx={toolbarButtonSx}
                startIcon={savedCount > 0 ? <Bookmark sx={{ fontSize: 18 }} /> : <BookmarkAdd sx={{ fontSize: 18 }} />}
                onClick={() => navigate("/saved")}
              >
                Saved
                {savedCount > 0 && (
                  <Box
                    component="span"
                    sx={{
                      ml: 0.5,
                      px: 0.6,
                      py: 0.1,
                      borderRadius: "4px",
                      bgcolor: "rgba(255,255,255,0.12)",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#e4e4e7"
                    }}
                  >
                    {savedCount}
                  </Box>
                )}
              </Button>

              <Button
                sx={toolbarButtonSx}
                startIcon={<Sort sx={{ fontSize: 18 }} />}
                endIcon={<ExpandMore sx={{ fontSize: 18, color: "#a1a1aa" }} />}
                onClick={(e) => setSortAnchor(e.currentTarget)}
              >
                {filters.sort === "oldest" ? "Oldest" : "Newest"}
              </Button>
              <Menu
                anchorEl={sortAnchor}
                open={Boolean(sortAnchor)}
                onClose={() => setSortAnchor(null)}
                PaperProps={{
                  sx: {
                    bgcolor: "#0b0f17",
                    border: "1px solid #27272a",
                    borderRadius: "12px",
                    minWidth: 160,
                    mt: 1
                  }
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <MenuItem
                    key={opt.value}
                    onClick={() => { updateFilters({ sort: opt.value }); setSortAnchor(null); }}
                    sx={{
                      fontSize: 14,
                      color: (filters.sort || "newest") === opt.value ? "#19e66b" : "#fff",
                      bgcolor: (filters.sort || "newest") === opt.value ? "rgba(25,230,107,0.1)" : "transparent",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }
                    }}
                  >
                    {opt.label}
                  </MenuItem>
                ))}
              </Menu>

            </Stack>
          </Stack>
        )}

        {/* Active filter chips */}
        {!showingRecommendations && hasActiveFilters && (
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: 12, color: "#a1a1aa", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Active:</Typography>
            {filters.search && (
              <Chip
                label={`search: ${filters.search}`}
                onDelete={() => { setSearchInput(""); updateFilters({ search: undefined, page: 1 }); }}
                sx={{ height: 26, borderRadius: "6px", bgcolor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa", ".MuiChip-deleteIcon": { color: "rgba(96,165,250,0.7)", fontSize: 16 } }}
              />
            )}
            {filters.status && (
              <Chip
                label={`status: ${filters.status}`}
                onDelete={() => updateFilters({ status: undefined, page: 1 })}
                sx={{ height: 26, borderRadius: "6px", bgcolor: "rgba(25,230,107,0.1)", border: "1px solid rgba(25,230,107,0.2)", color: "#19e66b", ".MuiChip-deleteIcon": { color: "rgba(25,230,107,0.7)", fontSize: 16 } }}
              />
            )}
            {filters.language && (
              <Chip
                label={`language: ${filters.language}`}
                onDelete={() => updateFilters({ language: undefined, page: 1 })}
                sx={{ height: 26, borderRadius: "6px", bgcolor: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.2)", color: "#facc15", ".MuiChip-deleteIcon": { color: "rgba(250,204,21,0.7)", fontSize: 16 } }}
              />
            )}
            {filters.difficulty && (
              <Chip
                label={`difficulty: ${filters.difficulty}`}
                onDelete={() => updateFilters({ difficulty: undefined, page: 1 })}
                sx={{ height: 26, borderRadius: "6px", bgcolor: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)", color: "#2dd4bf", ".MuiChip-deleteIcon": { color: "rgba(45,212,191,0.7)", fontSize: 16 } }}
              />
            )}
            <Typography
              sx={{ fontSize: 12, color: "#a1a1aa", cursor: "pointer", "&:hover": { color: "#fff" } }}
              onClick={() => { setSearchInput(""); updateFilters({ search: undefined, status: undefined, language: undefined, difficulty: undefined, page: 1 }); }}
            >
              Clear all
            </Typography>
          </Stack>
        )}

        {/* For You Search, Filters, Sort */}
        {showingRecommendations && (
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
                  value={recSearch}
                  onChange={(e) => setRecSearch(e.target.value)}
                  placeholder="Search recommendations..."
                  sx={{ color: "#fff", fontSize: 14, "& input::placeholder": { color: "#a1a1aa" } }}
                />
                {recSearch && (
                  <IconButton
                    size="small"
                    onClick={() => setRecSearch("")}
                    sx={{ color: "#a1a1aa", p: 0.5 }}
                  >
                    <Close sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  sx={{
                    ...toolbarButtonSx,
                    ...(recDifficultyFilter ? {
                      bgcolor: "rgba(168,85,247,0.1)",
                      borderColor: "rgba(168,85,247,0.3)",
                      color: "#c084fc"
                    } : {})
                  }}
                  startIcon={<Tune sx={{ fontSize: 18 }} />}
                  endIcon={<ExpandMore sx={{ fontSize: 18, color: "#a1a1aa" }} />}
                  onClick={(e) => setRecFilterAnchor(e.currentTarget)}
                >
                  Filters
                  {recDifficultyFilter && (
                    <Box
                      component="span"
                      sx={{
                        ml: 0.5,
                        px: 0.6,
                        py: 0.1,
                        borderRadius: "4px",
                        bgcolor: "rgba(168,85,247,0.2)",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#c084fc"
                      }}
                    >
                      1
                    </Box>
                  )}
                </Button>
                <Menu
                  anchorEl={recFilterAnchor}
                  open={Boolean(recFilterAnchor)}
                  onClose={() => setRecFilterAnchor(null)}
                  PaperProps={{
                    sx: {
                      bgcolor: "#0b0f17",
                      border: "1px solid #27272a",
                      borderRadius: "12px",
                      minWidth: 180,
                      mt: 1
                    }
                  }}
                >
                  <Typography sx={{ px: 2, py: 1, fontSize: 11, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Difficulty
                  </Typography>
                  {[
                    { value: undefined, label: "All Difficulties" },
                    { value: "beginner", label: "Beginner" },
                    { value: "intermediate", label: "Intermediate" },
                    { value: "advanced", label: "Advanced" }
                  ].map((opt) => (
                    <MenuItem
                      key={opt.label}
                      onClick={() => { setRecDifficultyFilter(opt.value); setRecFilterAnchor(null); }}
                      sx={{
                        fontSize: 14,
                        color: recDifficultyFilter === opt.value ? "#c084fc" : "#fff",
                        bgcolor: recDifficultyFilter === opt.value ? "rgba(168,85,247,0.1)" : "transparent",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }
                      }}
                    >
                      {opt.label}
                    </MenuItem>
                  ))}
                  {recDifficultyFilter && (
                    <>
                      <Divider sx={{ borderColor: "#27272a", my: 1 }} />
                      <MenuItem
                        onClick={() => { setRecDifficultyFilter(undefined); setRecFilterAnchor(null); }}
                        sx={{ fontSize: 14, color: "#f87171", "&:hover": { bgcolor: "rgba(248,113,113,0.1)" } }}
                      >
                        Clear Filter
                      </MenuItem>
                    </>
                  )}
                </Menu>

                <Button
                  sx={toolbarButtonSx}
                  startIcon={savedCount > 0 ? <Bookmark sx={{ fontSize: 18 }} /> : <BookmarkAdd sx={{ fontSize: 18 }} />}
                  onClick={() => navigate("/saved")}
                >
                  Saved
                  {savedCount > 0 && (
                    <Box
                      component="span"
                      sx={{
                        ml: 0.5,
                        px: 0.6,
                        py: 0.1,
                        borderRadius: "4px",
                        bgcolor: "rgba(255,255,255,0.12)",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#e4e4e7"
                      }}
                    >
                      {savedCount}
                    </Box>
                  )}
                </Button>

                <Button
                  sx={toolbarButtonSx}
                  startIcon={<Sort sx={{ fontSize: 18 }} />}
                  endIcon={<ExpandMore sx={{ fontSize: 18, color: "#a1a1aa" }} />}
                  onClick={(e) => setRecSortAnchor(e.currentTarget)}
                >
                  {recSort === "score" ? "Best Match" : "Newest"}
                </Button>
                <Menu
                  anchorEl={recSortAnchor}
                  open={Boolean(recSortAnchor)}
                  onClose={() => setRecSortAnchor(null)}
                  PaperProps={{
                    sx: {
                      bgcolor: "#0b0f17",
                      border: "1px solid #27272a",
                      borderRadius: "12px",
                      minWidth: 160,
                      mt: 1
                    }
                  }}
                >
                  {[
                    { value: "score" as const, label: "Best Match" },
                    { value: "newest" as const, label: "Newest" }
                  ].map((opt) => (
                    <MenuItem
                      key={opt.value}
                      onClick={() => { setRecSort(opt.value); setRecSortAnchor(null); }}
                      sx={{
                        fontSize: 14,
                        color: recSort === opt.value ? "#c084fc" : "#fff",
                        bgcolor: recSort === opt.value ? "rgba(168,85,247,0.1)" : "transparent",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }
                      }}
                    >
                      {opt.label}
                    </MenuItem>
                  ))}
                </Menu>
              </Stack>
            </Stack>

            {/* Active filter chips for For You */}
            {(recSearch || recDifficultyFilter) && (
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2.2 }}>
                <Typography sx={{ fontSize: 12, color: "#a1a1aa", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Active:</Typography>
                {recSearch && (
                  <Chip
                    label={`search: ${recSearch}`}
                    onDelete={() => setRecSearch("")}
                    sx={{ height: 26, borderRadius: "6px", bgcolor: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", color: "#c084fc", ".MuiChip-deleteIcon": { color: "rgba(192,132,252,0.7)", fontSize: 16 } }}
                  />
                )}
                {recDifficultyFilter && (
                  <Chip
                    label={`difficulty: ${recDifficultyFilter}`}
                    onDelete={() => setRecDifficultyFilter(undefined)}
                    sx={{ height: 26, borderRadius: "6px", bgcolor: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)", color: "#2dd4bf", ".MuiChip-deleteIcon": { color: "rgba(45,212,191,0.7)", fontSize: 16 } }}
                  />
                )}
                <Typography
                  sx={{ fontSize: 12, color: "#a1a1aa", cursor: "pointer", "&:hover": { color: "#fff" } }}
                  onClick={() => { setRecSearch(""); setRecDifficultyFilter(undefined); }}
                >
                  Clear all
                </Typography>
              </Stack>
            )}

            <Box sx={{ mb: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AutoAwesome sx={{ color: "#c084fc", fontSize: 20 }} />
                <Typography sx={{ color: "#c084fc", fontSize: 14, fontWeight: 600 }}>
                  Personalized recommendations based on your preferences
                </Typography>
              </Stack>
            </Box>
          </>
        )}

        {/* ─── Feed content ─── */}
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: showingRecommendations ? "#c084fc" : "#19e66b" }} />
          </Box>
        ) : issuesError && !showingRecommendations ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography sx={{ color: "#f87171", mb: 2 }}>{issuesError}</Typography>
            <Button onClick={loadIssues} sx={{ textTransform: "none", color: "#19e66b" }}>Retry</Button>
          </Box>
        ) : showingRecommendations ? (
          recommendationError && filteredRecommendations.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <MSym name="error" sx={{ fontSize: 48, color: "#f87171", mb: 2 }} />
              <Typography sx={{ color: "#f87171", fontSize: 16 }}>
                {recommendationError}
              </Typography>
              <Typography sx={{ color: "#52525b", fontSize: 14, mt: 0.5, mb: 2 }}>
                We could not load personalized recommendations right now.
              </Typography>
              <Button
                onClick={() => { void loadRecommendations(); }}
                sx={{ textTransform: "none", color: "#c084fc" }}
              >
                Retry Recommendations
              </Button>
            </Box>
          ) : filteredRecommendations.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <MSym name="auto_awesome" sx={{ fontSize: 48, color: "#27272a", mb: 2 }} />
              <Typography sx={{ color: "#a1a1aa", fontSize: 16 }}>
                {recSearch || recDifficultyFilter
                  ? "No recommendations match your filters."
                  : "We couldn't find any good matches for your selections."}
              </Typography>
              <Typography sx={{ color: "#52525b", fontSize: 14, mt: 0.5 }}>
                {recSearch || recDifficultyFilter
                  ? "Try adjusting your search or filters."
                  : "Try updating your preferences in settings to broaden your interests."}
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {filteredRecommendations.map((rec, idx) => (
                <RecommendationCard key={rec.issue_id || idx} recommendation={rec} isSaved={isSaved(rec.issue_id)} onToggleSave={toggleSave} />
              ))}
            </Stack>
          )
        ) : issues.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <MSym name="inbox" sx={{ fontSize: 48, color: "#27272a", mb: 2 }} />
            <Typography sx={{ color: "#a1a1aa", fontSize: 16 }}>No issues found.</Typography>
            <Typography sx={{ color: "#52525b", fontSize: 14, mt: 0.5 }}>
              Try adjusting your filters or search terms.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {issues.map((issue) => (
              <IssueCard key={issue._id} issue={issue} isSaved={isSaved(issue._id)} onToggleSave={toggleSave} />
            ))}
          </Stack>
        )}

        {/* ─── Pagination ─── */}
        {pagination && pagination.totalPages > 1 && !showingRecommendations && (
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3.2, pt: 3, borderTop: "1px solid #27272a" }}>
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
                      bgcolor: pg === pagination.page ? "rgba(25,230,107,0.2)" : "transparent",
                      color: pg === pagination.page ? "#19e66b" : "#a1a1aa",
                      fontWeight: pg === pagination.page ? 700 : 400,
                      fontSize: 14,
                      "&:hover": { bgcolor: pg === pagination.page ? "rgba(25,230,107,0.2)" : "rgba(255,255,255,0.05)" }
                    }}
                  >
                    {pg}
                  </Box>
                );
              })}
              {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 2 && (
                <>
                  <Typography sx={{ color: "#a1a1aa", px: 0.5, fontSize: 14 }}>...</Typography>
                  <Box
                    onClick={() => goToPage(pagination.totalPages)}
                    sx={{ width: 32, height: 32, borderRadius: "6px", display: "grid", placeItems: "center", color: "#a1a1aa", fontSize: 14, cursor: "pointer" }}
                  >
                    {pagination.totalPages}
                  </Box>
                </>
              )}
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
          {showingRecommendations
            ? `Showing ${filteredRecommendations.length} of ${recommendations.length} recommendations`
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
