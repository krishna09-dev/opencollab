import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  GlobalStyles,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import type { ResourceCategory, ResourceDifficulty, ResourceFilterState, ResourceItem } from "../types";
import MSym from "../components/MSym";

import { useResources } from "../hooks/useResources";
import { fetchCurrentUser } from "../../issueDetail/api/issueDetailApi";

const DEFAULT_FILTERS: ResourceFilterState = {
  q: "",
  category: "All",
  difficulty: "All",
  language: "All",
  type: "All"
};

export default function ResourcesPage() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<{ login?: string; avatarUrl?: string } | null>(null);

  useEffect(() => {
    fetchCurrentUser()
      .then((u) => setCurrentUser({ login: u.login, avatarUrl: u.avatarUrl }))
      .catch(() => setCurrentUser(null));
  }, []);

  const [filters, setFilters] = useState<ResourceFilterState>(DEFAULT_FILTERS);
  const { loading, error, featured, items } = useResources(filters);

  const [categoryAnchor, setCategoryAnchor] = useState<null | HTMLElement>(null);
  const [difficultyAnchor, setDifficultyAnchor] = useState<null | HTMLElement>(null);

  const topics = [
    { icon: "account_tree", title: "Git Basics" },
    { icon: "fork_right", title: "Pull Requests" },
    { icon: "web", title: "React Guide" },
    { icon: "terminal", title: "CLI Mastery" },
    { icon: "bug_report", title: "Bug Fixing" },
    { icon: "edit_document", title: "Write Docs" }
  ];

  const workflowSteps = ["Issue", "Fork", "Branch", "Code", "Commit", "PR", "Review", "Merge"];

  const categoryLinks: Array<{ label: string; value: ResourceCategory | "All" }> = [
    { label: "Git & Workflow", value: "Git" },
    { label: "Tech Stacks", value: "General" },
    { label: "Documentation", value: "Docs" }
  ];

  const categoryOptions: Array<ResourceCategory | "All"> = [
    "All",
    "Git",
    "GitHub",
    "Project Setup",
    "Debugging",
    "Testing",
    "CI/CD",
    "Docs",
    "General"
  ];

  const difficultyOptions: Array<ResourceDifficulty | "All"> = ["All", "beginner", "intermediate", "advanced"];

  const curatedGuides = useMemo(() => {
    const merged: ResourceItem[] = [];
    const seen = new Set<string>();

    for (const item of [...featured, ...items]) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
      if (merged.length >= 3) break;
    }

    return merged;
  }, [featured, items]);

  const categoryLabel = filters.category === "All" ? "Category" : filters.category;
  const difficultyLabel =
    filters.difficulty === "All"
      ? "Difficulty"
      : `${filters.difficulty.charAt(0).toUpperCase()}${filters.difficulty.slice(1)}`;

  const difficultyMeta = (difficulty: ResourceDifficulty) => {
    if (difficulty === "beginner") {
      return { color: "#2dd4bf", bg: "rgba(45,212,191,0.10)", border: "rgba(45,212,191,0.20)", iconBg: "rgba(25,230,107,0.10)" };
    }
    if (difficulty === "intermediate") {
      return { color: "#fb923c", bg: "rgba(251,146,60,0.10)", border: "rgba(251,146,60,0.20)", iconBg: "rgba(96,165,250,0.10)" };
    }
    return { color: "#c084fc", bg: "rgba(192,132,252,0.10)", border: "rgba(192,132,252,0.20)", iconBg: "rgba(192,132,252,0.10)" };
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#050509", color: "#fff" }}>
      <GlobalStyles styles={{ body: { backgroundColor: "#050509" } }} />
      <Box
        sx={{
          height: 64,
          borderBottom: "1px solid #27272a",
          bgcolor: "rgba(5,5,9,0.8)",
          backdropFilter: "blur(6px)",
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ cursor: "pointer" }} onClick={() => navigate("/feed")}>
          <Box sx={{ width: 32, height: 32, borderRadius: "14px", bgcolor: "rgba(25,230,107,0.2)", display: "grid", placeItems: "center" }}>
            <MSym name="terminal" sx={{ color: "#19e66b", fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.4 }}>OpenCollab</Typography>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton sx={{ color: "#a1a1aa" }}>
            <Badge
              variant="dot"
              color="success"
              sx={{
                "& .MuiBadge-badge": {
                  bgcolor: "#19e66b",
                  border: "2px solid #050509",
                  right: 6,
                  top: 8
                }
              }}
            >
              <MSym name="notifications" sx={{ fontSize: 19 }} />
            </Badge>
          </IconButton>
          <IconButton sx={{ color: "#a1a1aa" }}>
            <MSym name="add_circle" sx={{ fontSize: 19 }} />
          </IconButton>
          <Divider orientation="vertical" flexItem sx={{ borderColor: "#27272a", mx: 0.5 }} />
          <Button
            sx={{ textTransform: "none", color: "#fff", borderRadius: "14px", px: 1, minWidth: 0, gap: 1, "&:hover": { bgcolor: "rgba(255,255,255,0.06)" } }}
            startIcon={<Avatar src={currentUser?.avatarUrl} sx={{ width: 32, height: 32 }} />}
            endIcon={<MSym name="keyboard_arrow_down" sx={{ color: "#a1a1aa", fontSize: 18 }} />}
          >
            <Typography sx={{ fontWeight: 500, fontSize: 14 }}>{currentUser?.login || "Alex Dev"}</Typography>
          </Button>
        </Stack>
      </Box>

      <Box sx={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>
        <Box sx={{ width: 288, borderRight: "1px solid #27272a", px: 3, py: 3, display: { xs: "none", md: "block" } }}>
          <Typography sx={{ color: "#a1a1aa", fontWeight: 600, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", px: 1 }}>
            Explore
          </Typography>

          <Stack spacing={0.5} sx={{ mt: 1 }}>
            <Button fullWidth onClick={() => navigate("/feed")} sx={{ justifyContent: "flex-start", textTransform: "none", borderRadius: "14px", px: 1.5, py: 1, color: "#a1a1aa", fontWeight: 500, gap: 1 }}>
              <MSym name="explore" sx={{ fontSize: 17 }} />
              Trending Issues
            </Button>
            <Button fullWidth onClick={() => navigate("/feed")} sx={{ justifyContent: "flex-start", textTransform: "none", borderRadius: "14px", px: 1.5, py: 1, color: "#a1a1aa", fontWeight: 500, gap: 1 }}>
              <MSym name="partner_exchange" sx={{ fontSize: 17 }} />
              Good First Issues
            </Button>
            <Button
              fullWidth
              sx={{
                justifyContent: "flex-start",
                textTransform: "none",
                borderRadius: "14px",
                px: 1.5,
                py: 1,
                color: "#fff",
                bgcolor: "#0b0f17",
                border: "1px solid rgba(39,39,42,0.5)",
                fontWeight: 500,
                gap: 1,
                "&:hover": { bgcolor: "#0f1420" }
              }}
            >
              <MSym name="school" sx={{ fontSize: 17, color: "#19e66b" }} />
              Learning Resources
            </Button>
            <Button fullWidth onClick={() => navigate("/resources")} sx={{ justifyContent: "flex-start", textTransform: "none", borderRadius: "14px", px: 1.5, py: 1, color: "#a1a1aa", fontWeight: 500, gap: 1 }}>
              <MSym name="local_fire_department" sx={{ fontSize: 17 }} />
              Community Picks
            </Button>
          </Stack>

          <Typography sx={{ color: "#a1a1aa", fontWeight: 600, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", px: 1, mt: 3 }}>
            Categories
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {categoryLinks.map((category) => {
              const active = filters.category === category.value;
              return (
                <Button
                  key={category.label}
                  fullWidth
                  onClick={() => setFilters((f) => ({ ...f, category: category.value }))}
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    borderRadius: "14px",
                    px: 1.5,
                    py: 1,
                    color: active ? "#fff" : "#a1a1aa",
                    bgcolor: active ? "rgba(255,255,255,0.04)" : "transparent",
                    fontWeight: 500,
                    gap: 1
                  }}
                >
                  <MSym name="category" sx={{ fontSize: 16 }} />
                  {category.label}
                </Button>
              );
            })}
          </Stack>

          <Divider sx={{ borderColor: "#27272a", my: 2.5 }} />
          <Button fullWidth sx={{ justifyContent: "flex-start", textTransform: "none", borderRadius: "14px", px: 1.5, py: 1, color: "#a1a1aa", fontWeight: 500, gap: 1 }}>
            <MSym name="bookmark" sx={{ fontSize: 16 }} />
            Saved Guides
            <Box sx={{ ml: "auto", borderRadius: "8px", px: 0.8, bgcolor: "rgba(39,39,42,0.5)", color: "#a1a1aa", fontSize: 12 }}>8</Box>
          </Button>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ maxWidth: 1152, mx: "auto", px: 3, py: 5 }}>
            <Typography sx={{ fontSize: 42, lineHeight: "48px", fontWeight: 700, letterSpacing: -0.8 }}>
              Learning Resources
            </Typography>
            <Typography sx={{ color: "#a1a1aa", mt: 1, fontSize: 16 }}>
              Master the skills needed to contribute to world-class open source projects.
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mt: 3, alignItems: "center" }}>
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  width: "100%",
                  borderRadius: "16px",
                  border: "1px solid #27272a",
                  bgcolor: "#0b0f17",
                  px: 1.5,
                  py: 1.1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}
              >
                <MSym name="search" sx={{ color: "#a1a1aa", fontSize: 18 }} />
                <InputBase
                  value={filters.q}
                  onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
                  placeholder="Search guides, tutorials, or topics..."
                  sx={{ color: "#fff", fontSize: 14, width: "100%" }}
                />
              </Paper>

              <Stack direction="row" spacing={1}>
                <Button
                  onClick={(e) => setCategoryAnchor(e.currentTarget)}
                  sx={{ height: 46, borderRadius: "16px", textTransform: "none", px: 2, color: "#fff", border: "1px solid #27272a", bgcolor: "#0b0f17", gap: 0.75 }}
                  startIcon={<MSym name="category" sx={{ fontSize: 18 }} />}
                  endIcon={<MSym name="keyboard_arrow_down" sx={{ fontSize: 16 }} />}
                >
                  {categoryLabel}
                </Button>
                <Button
                  onClick={(e) => setDifficultyAnchor(e.currentTarget)}
                  sx={{ height: 46, borderRadius: "16px", textTransform: "none", px: 2, color: "#fff", border: "1px solid #27272a", bgcolor: "#0b0f17", gap: 0.75 }}
                  startIcon={<MSym name="bolt" sx={{ fontSize: 18 }} />}
                  endIcon={<MSym name="keyboard_arrow_down" sx={{ fontSize: 16 }} />}
                >
                  {difficultyLabel}
                </Button>
              </Stack>
            </Stack>

            <Typography sx={{ color: "#a1a1aa", fontWeight: 600, fontSize: 12, letterSpacing: 2.4, textTransform: "uppercase", mt: 4, mb: 2 }}>
              Popular Topics
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0,1fr))", md: "repeat(6, minmax(0,1fr))" }, gap: 2 }}>
              {topics.map((topic) => (
                <Paper key={topic.title} elevation={0} sx={{ bgcolor: "#0b0f17", border: "1px solid #27272a", borderRadius: "20px", py: 2.5, px: 1.5, textAlign: "center" }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 999, bgcolor: "rgba(25,230,107,0.10)", display: "grid", placeItems: "center", mx: "auto" }}>
                    <MSym name={topic.icon} sx={{ color: "#19e66b", fontSize: 20 }} />
                  </Box>
                  <Typography sx={{ mt: 1.5, color: "#fff", fontSize: 14, fontWeight: 600 }}>{topic.title}</Typography>
                </Paper>
              ))}
            </Box>

            <Typography sx={{ color: "#a1a1aa", fontWeight: 600, fontSize: 12, letterSpacing: 2.4, textTransform: "uppercase", mt: 4, mb: 2 }}>
              Contribution Workflow
            </Typography>
            <Paper elevation={0} sx={{ bgcolor: "rgba(11,15,23,0.5)", border: "1px solid #27272a", borderRadius: "20px", px: { xs: 2, md: 4 }, py: 3, overflowX: "auto" }}>
              <Stack direction="row" alignItems="center" sx={{ minWidth: 860 }}>
                {workflowSteps.map((step, index) => {
                  const active = step === "Issue" || step === "Merge";
                  return (
                    <Stack key={step} direction="row" alignItems="center" sx={{ flex: 1 }}>
                      <Stack alignItems="center" spacing={1.2} sx={{ minWidth: 40 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 999,
                            border: active ? "2px solid #19e66b" : "1px solid #27272a",
                            bgcolor: "#0b0f17",
                            color: active ? "#19e66b" : "#a1a1aa",
                            boxShadow: active ? "0 0 15px rgba(25,230,107,0.2)" : "none",
                            display: "grid",
                            placeItems: "center"
                          }}
                        >
                          <MSym name="adjust" sx={{ fontSize: 16 }} />
                        </Box>
                        <Typography sx={{ color: active ? "#fff" : "#a1a1aa", fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                          {step}
                        </Typography>
                      </Stack>
                      {index < workflowSteps.length - 1 && <Box sx={{ height: 2, bgcolor: "#27272a", flex: 1, mx: 1 }} />}
                    </Stack>
                  );
                })}
              </Stack>
            </Paper>

            <Typography sx={{ color: "#a1a1aa", fontWeight: 600, fontSize: 12, letterSpacing: 2.4, textTransform: "uppercase", mt: 4, mb: 2 }}>
              Curated Guides
            </Typography>

            {loading && (
              <Stack alignItems="center" sx={{ py: 6 }}>
                <CircularProgress size={28} sx={{ color: "#19e66b" }} />
                <Typography sx={{ color: "#a1a1aa", mt: 1.5, fontSize: 14 }}>Loading guides...</Typography>
              </Stack>
            )}

            {!loading && error && (
              <Paper elevation={0} sx={{ bgcolor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "14px", px: 2, py: 1.5 }}>
                <Typography sx={{ color: "#fecaca", fontSize: 14, fontWeight: 500 }}>{error}</Typography>
              </Paper>
            )}

            {!loading && !error && (
              <Stack spacing={2}>
                {curatedGuides.map((guide) => {
                  const meta = difficultyMeta(guide.difficulty);
                  return (
                    <Paper key={guide.id} elevation={0} sx={{ bgcolor: "#0b0f17", border: "1px solid #27272a", borderRadius: "20px", px: 3, py: 2.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{ width: 40, height: 40, borderRadius: "16px", bgcolor: meta.iconBg, display: "grid", placeItems: "center" }}>
                            <MSym name="menu_book" sx={{ fontSize: 18, color: meta.color }} />
                          </Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{ borderRadius: "8px", px: 1.1, py: 0.35, bgcolor: meta.bg, border: `1px solid ${meta.border}` }}>
                              <Typography sx={{ color: meta.color, fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>
                                {guide.difficulty}
                              </Typography>
                            </Box>
                            <Typography sx={{ color: "#a1a1aa", fontSize: 12 }}>
                              • {guide.minutes ?? 15} min read
                            </Typography>
                          </Stack>
                        </Stack>

                        <Button
                          component="a"
                          href={guide.url}
                          target="_blank"
                          rel="noreferrer"
                          sx={{
                            height: 36,
                            borderRadius: "14px",
                            px: 2,
                            textTransform: "none",
                            fontWeight: 700,
                            bgcolor: "#19e66b",
                            color: "#000",
                            boxShadow: "0 0 10px rgba(25,230,107,0.20)",
                            "&:hover": { bgcolor: "#22c55e" }
                          }}
                        >
                          View Guide
                        </Button>
                      </Stack>

                      <Typography sx={{ mt: 2, fontSize: 30 / 1.5, fontWeight: 700, color: "#fff", lineHeight: "28px" }}>
                        {guide.title}
                      </Typography>
                      <Typography sx={{ mt: 1, color: "#a1a1aa", fontSize: 14, lineHeight: "22px" }}>
                        {guide.description}
                      </Typography>

                      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", rowGap: 1 }}>
                        {(guide.tags ?? []).slice(0, 3).map((tag) => (
                          <Box key={tag} sx={{ borderRadius: "6px", px: 1.3, py: 0.55, border: "1px solid #27272a", color: "#a1a1aa", fontSize: 11, fontWeight: 500 }}>
                            {tag}
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}

            <Paper elevation={0} sx={{ mt: 5, bgcolor: "#0b0f17", border: "1px solid #27272a", borderRadius: "20px", px: { xs: 2, md: 12 }, py: 5, position: "relative", overflow: "hidden" }}>
              <Box sx={{ position: "absolute", inset: 0, opacity: 0.5, background: "linear-gradient(164deg, rgba(25,230,107,0.05) 0%, rgba(25,230,107,0) 100%)" }} />
              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Typography sx={{ textAlign: "center", fontSize: 24, fontWeight: 700, lineHeight: "32px" }}>
                  Ready to Start Contributing?
                </Typography>
                <Typography sx={{ mt: 1.25, textAlign: "center", color: "#a1a1aa", fontSize: 14, lineHeight: "20px" }}>
                  Put your skills to the test with real-world issues curated for beginners and first-time contributors.
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                  <Button
                    onClick={() => navigate("/feed")}
                    endIcon={<MSym name="arrow_forward" sx={{ fontSize: 12 }} />}
                    sx={{
                      height: 52,
                      borderRadius: "16px",
                      px: 4,
                      textTransform: "none",
                      fontWeight: 700,
                      bgcolor: "#19e66b",
                      color: "#000",
                      boxShadow: "0 0 20px rgba(25,230,107,0.15)",
                      "&:hover": { bgcolor: "#22c55e" }
                    }}
                  >
                    Browse Beginner Issues
                  </Button>
                  <Button
                    onClick={() => navigate("/pr-tracking")}
                    sx={{
                      height: 52,
                      borderRadius: "16px",
                      px: 4,
                      textTransform: "none",
                      fontWeight: 700,
                      color: "#fff",
                      border: "1px solid #27272a",
                      bgcolor: "transparent"
                    }}
                  >
                    Track My PRs
                  </Button>
                </Stack>
              </Box>
            </Paper>

            <Typography sx={{ mt: 4, color: "#a1a1aa", fontSize: 12, textAlign: "center" }}>
              © 2023 OpenCollab Inc. · Terms · Privacy
            </Typography>
          </Box>
        </Box>
      </Box>

      <Menu
        anchorEl={categoryAnchor}
        open={Boolean(categoryAnchor)}
        onClose={() => setCategoryAnchor(null)}
        PaperProps={{ sx: { mt: 1, bgcolor: "#0b0f17", border: "1px solid #27272a", color: "#fff", minWidth: 220 } }}
      >
        {categoryOptions.map((option) => (
          <MenuItem
            key={option}
            onClick={() => {
              setFilters((prev) => ({ ...prev, category: option }));
              setCategoryAnchor(null);
            }}
            selected={filters.category === option}
          >
            {option}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={difficultyAnchor}
        open={Boolean(difficultyAnchor)}
        onClose={() => setDifficultyAnchor(null)}
        PaperProps={{ sx: { mt: 1, bgcolor: "#0b0f17", border: "1px solid #27272a", color: "#fff", minWidth: 220 } }}
      >
        {difficultyOptions.map((option) => (
          <MenuItem
            key={option}
            onClick={() => {
              setFilters((prev) => ({ ...prev, difficulty: option }));
              setDifficultyAnchor(null);
            }}
            selected={filters.difficulty === option}
          >
            {option === "All" ? "All" : `${option.charAt(0).toUpperCase()}${option.slice(1)}`}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
