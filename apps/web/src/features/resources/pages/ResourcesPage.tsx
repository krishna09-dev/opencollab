import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  InputBase,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import type { ResourceCategory, ResourceDifficulty, ResourceFilterState } from "../types";
import MSym from "../components/MSym";
import { useResources } from "../hooks/useResources";
import AppLayout from "../../../components/layout/AppLayout";

const DEFAULT_FILTERS: ResourceFilterState = {
  q: "",
  category: "All",
  difficulty: "All",
  language: "All",
  type: "All"
};

function ResourcesSidebarExtra({
  filters,
  setFilters
}: {
  filters: ResourceFilterState;
  setFilters: React.Dispatch<React.SetStateAction<ResourceFilterState>>;
}) {
  const categoryLinks: Array<{ label: string; value: ResourceCategory | "All" }> = [
    { label: "All Categories", value: "All" },
    { label: "Git Basics", value: "Git Basics" },
    { label: "Pull Requests", value: "Pull Requests" },
    { label: "Programming Docs", value: "Programming Docs" },
    { label: "CLI Mastery", value: "CLI Mastery" },
    { label: "Bug Fixing", value: "Bug Fixing" }
  ];

  return (
    <>
      <Typography sx={{ color: "#a1a1aa", fontWeight: 600, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", px: 1, mb: 1 }}>
        Categories
      </Typography>
      <Stack spacing={0.5}>
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

    </>
  );
}

export default function ResourcesPage() {
  const navigate = useNavigate();
  const PAGE_SIZE = 5;

  const [filters, setFilters] = useState<ResourceFilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const { loading, error, items, total, totalPages } = useResources(filters, { page, limit: PAGE_SIZE });

  const updateFilters: React.Dispatch<React.SetStateAction<ResourceFilterState>> = (next) => {
    setFilters(next);
    setPage(1);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName ?? "";
      const isEditable =
        !!target?.isContentEditable || tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";

      if (isEditable) return;

      if (event.key === "ArrowRight") {
        setPage((current) => Math.min(totalPages, current + 1));
      }

      if (event.key === "ArrowLeft") {
        setPage((current) => Math.max(1, current - 1));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [totalPages]);

  const topics: Array<{ icon: string; title: string; category: ResourceCategory | "All" }> = [
    { icon: "apps", title: "All Topics", category: "All" },
    { icon: "account_tree", title: "Git Basics", category: "Git Basics" },
    { icon: "fork_right", title: "Pull Requests", category: "Pull Requests" },
    { icon: "web", title: "Programming Docs", category: "Programming Docs" },
    { icon: "terminal", title: "CLI Mastery", category: "CLI Mastery" },
    { icon: "bug_report", title: "Bug Fixing", category: "Bug Fixing" }
  ];

  const workflowSteps = ["Issue", "Fork", "Branch", "Code", "Commit", "PR", "Review", "Merge"];

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
    <AppLayout activePage="resources" sidebarExtra={<ResourcesSidebarExtra filters={filters} setFilters={updateFilters} />}>
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
              onChange={(e) => updateFilters((prev) => ({ ...prev, q: e.target.value }))}
              placeholder="Search guides, tutorials, or topics..."
              sx={{ color: "#fff", fontSize: 14, width: "100%" }}
            />
          </Paper>
        </Stack>

        <Typography sx={{ color: "#a1a1aa", fontWeight: 600, fontSize: 12, letterSpacing: 2.4, textTransform: "uppercase", mt: 4, mb: 2 }}>
          Popular Topics
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0,1fr))", md: "repeat(6, minmax(0,1fr))" }, gap: 2 }}>
          {topics.map((topic) => {
            const active = filters.category === topic.category;

            return (
              <Paper
                key={topic.title}
                elevation={0}
                onClick={() => updateFilters((prev) => ({ ...prev, category: topic.category }))}
                sx={{
                  bgcolor: active ? "rgba(25,230,107,0.08)" : "#0b0f17",
                  border: active ? "1px solid rgba(25,230,107,0.30)" : "1px solid #27272a",
                  borderRadius: "20px",
                  py: 2.5,
                  px: 1.5,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "transform 0.2s, border-color 0.2s",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    borderColor: "rgba(25,230,107,0.25)"
                  }
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 999,
                    bgcolor: active ? "rgba(25,230,107,0.16)" : "rgba(25,230,107,0.10)",
                    display: "grid",
                    placeItems: "center",
                    mx: "auto"
                  }}
                >
                  <MSym name={topic.icon} sx={{ color: "#19e66b", fontSize: 20 }} />
                </Box>
                <Typography sx={{ mt: 1.5, color: "#fff", fontSize: 14, fontWeight: 600 }}>{topic.title}</Typography>
              </Paper>
            );
          })}
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

        {!loading && !error && items.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              bgcolor: "#0b0f17",
              border: "1px solid #27272a",
              borderRadius: "20px",
              px: { xs: 2, md: 8 },
              py: 5,
              textAlign: "center",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                opacity: 0.5,
                background: "linear-gradient(164deg, rgba(96,165,250,0.08) 0%, rgba(96,165,250,0) 100%)"
              }}
            />
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Typography sx={{ fontSize: 24, fontWeight: 700, lineHeight: "32px", color: "#fff" }}>
                No Learning Resources Found
              </Typography>
              <Typography sx={{ mt: 1.25, color: "#a1a1aa", fontSize: 14, lineHeight: "20px" }}>
                {filters.category === "All"
                  ? "There are no learning resources available right now."
                  : `No resources are available in ${filters.category} right now.`}
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                <Button
                  onClick={() => navigate("/good-first-issues")}
                  endIcon={<MSym name="arrow_forward" sx={{ fontSize: 12 }} />}
                  sx={{
                    height: 48,
                    borderRadius: "14px",
                    px: 3,
                    textTransform: "none",
                    fontWeight: 700,
                    bgcolor: "#19e66b",
                    color: "#000",
                    "&:hover": { bgcolor: "#22c55e" }
                  }}
                >
                  Explore Good First Issues
                </Button>
                <Button
                  onClick={() => navigate("/feed")}
                  sx={{
                    height: 48,
                    borderRadius: "14px",
                    px: 3,
                    textTransform: "none",
                    fontWeight: 700,
                    color: "#fff",
                    border: "1px solid #27272a",
                    bgcolor: "transparent"
                  }}
                >
                  Go To Issue Feed
                </Button>
                <Button
                  onClick={() => {
                    setFilters(DEFAULT_FILTERS);
                    setPage(1);
                  }}
                  sx={{
                    height: 48,
                    borderRadius: "14px",
                    px: 3,
                    textTransform: "none",
                    fontWeight: 700,
                    color: "#a1a1aa",
                    border: "1px solid #27272a",
                    bgcolor: "transparent"
                  }}
                >
                  Show All Categories
                </Button>
              </Stack>
            </Box>
          </Paper>
        )}

        {!loading && !error && items.length > 0 && (
          <Stack spacing={2}>
            {items.map((guide) => {
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

        {!loading && !error && total > 0 && (
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            sx={{ mt: 3 }}
          >
            <Typography sx={{ color: "#a1a1aa", fontSize: 13 }}>
              Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total} resources
            </Typography>

            {totalPages > 1 && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  startIcon={<MSym name="chevron_left" sx={{ fontSize: 18 }} />}
                  sx={{
                    borderRadius: "12px",
                    textTransform: "none",
                    color: "#e4e4e7",
                    border: "1px solid #27272a",
                    px: 1.5,
                    minWidth: 0
                  }}
                >
                  Prev
                </Button>

                <Typography sx={{ color: "#a1a1aa", fontSize: 13, minWidth: 90, textAlign: "center" }}>
                  Page {page}/{totalPages}
                </Typography>

                <Button
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  endIcon={<MSym name="chevron_right" sx={{ fontSize: 18 }} />}
                  sx={{
                    borderRadius: "12px",
                    textTransform: "none",
                    color: "#e4e4e7",
                    border: "1px solid #27272a",
                    px: 1.5,
                    minWidth: 0
                  }}
                >
                  Next
                </Button>
              </Stack>
            )}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
}
