import { useState } from "react";
import {
  Adjust,
  ArrowBack,
  ArrowForward,
  Bookmark,
  BookmarkAdd,
  ChatBubbleOutline,
  Code,
  ExpandMore,
  GridView,
  Search,
  Sort,
  ThumbUpOffAlt,
  Tune,
  ViewList
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputBase,
  Stack,
  Typography
} from "@mui/material";

import AppLayout from "../../../components/layout/AppLayout";
import MSym from "../../resources/components/MSym";
import { api, authHeaders } from "../../../lib/api";

type FeedIssue = {
  id: string;
  repo: string;
  number: string;
  openedText: string;
  title: string;
  body: string;
  tags: Array<{ label: string; color: string; bg: string; border: string }>;
  comments: number;
  likes: number;
  cta: "View Details" | "Claim" | "View";
  ctaPrimary?: boolean;
  iconColor: string;
  muted?: boolean;
  claimed?: boolean;
};

async function seedAllData(): Promise<{
  message: string;
  resources: { inserted: number };
  prTracking: { inserted: number; ids: string[] };
}> {
  const res = await api.post("/api/seed-all", {}, { headers: authHeaders() });
  return res.data;
}

const issues: FeedIssue[] = [
  {
    id: "1",
    repo: "facebook/react",
    number: "#28491",
    openedText: "opened 2 hours ago by gaearon",
    title: "Fix hydration mismatch error when using Suspense boundaries in SSR",
    body:
      "I've noticed that when using lazy loading components inside a suspense boundary during server-side rendering, the hydration process throws a warning about mismatched HTML content. This seems to happen\u2026",
    tags: [
      { label: "TypeScript", color: "#3178c6", bg: "rgba(49,120,198,0.1)", border: "rgba(49,120,198,0.2)" },
      { label: "Bug", color: "#f87171", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" },
      { label: "High Priority", color: "#fb923c", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.2)" },
      { label: "Intermediate", color: "#c084fc", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.2)" }
    ],
    comments: 12,
    likes: 45,
    cta: "View Details",
    ctaPrimary: true,
    iconColor: "#0df259"
  },
  {
    id: "2",
    repo: "vercel/next.js",
    number: "#54102",
    openedText: "opened 5 hours ago",
    title: "Update documentation for Image component optimization props",
    body:
      "The current docs for next/image are missing examples for the new loaderFile prop introduced in v14. We need to add a section explaining how to use it with custom CDNs.",
    tags: [
      { label: "JavaScript", color: "#facc15", bg: "rgba(250,204,21,0.1)", border: "rgba(250,204,21,0.2)" },
      { label: "Documentation", color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.2)" },
      { label: "Beginner", color: "#2dd4bf", bg: "rgba(45,212,191,0.1)", border: "rgba(45,212,191,0.2)" },
      { label: "Good First Issue", color: "#f472b6", bg: "rgba(244,114,182,0.1)", border: "rgba(244,114,182,0.2)" }
    ],
    comments: 3,
    likes: 8,
    cta: "Claim",
    iconColor: "#4ade80"
  },
  {
    id: "3",
    repo: "tailwindlabs/tailwindcss",
    number: "#1294",
    openedText: "opened 1 day ago",
    title: "Add support for container queries in arbitrary values",
    body:
      "Currently, arbitrary values work great for most utilities, but container queries seem to ignore custom breakpoints defined inline. Would be great to have @container-[500px]:bg-red-500 working out of the box.",
    tags: [
      { label: "CSS", color: "#22d3ee", bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.2)" },
      { label: "Feature Request", color: "#818cf8", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)" },
      { label: "Advanced", color: "#fb7185", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.2)" }
    ],
    comments: 28,
    likes: 102,
    cta: "Claim",
    iconColor: "#0df259"
  },
  {
    id: "4",
    repo: "rust-lang/rust",
    number: "#98321",
    openedText: "opened 2 days ago",
    title: "Optimization pass for borrow checker diagnostics",
    body:
      "Some error messages regarding lifetimes are still a bit cryptic for newcomers. We have a proposal to simplify the output for common distinct lifetime mismatch errors.",
    tags: [
      { label: "Rust", color: "#fb923c", bg: "rgba(194,65,12,0.1)", border: "rgba(249,115,22,0.2)" },
      { label: "Compiler", color: "#60a5fa", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)" },
      { label: "Advanced", color: "#fb7185", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.2)" }
    ],
    comments: 54,
    likes: 210,
    cta: "View",
    iconColor: "#c084fc",
    muted: true,
    claimed: true
  }
];

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

function HomeSidebarExtra() {
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  const handleSeedAll = async () => {
    setSeeding(true);
    setSeedMsg(null);
    try {
      const result = await seedAllData();
      setSeedMsg(
        `${result.message} — Resources: ${result.resources.inserted}, PRs: ${result.prTracking.inserted}`
      );
    } catch (e: any) {
      setSeedMsg(e?.response?.data?.message || "Failed to seed demo data.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <>
      <Typography sx={{ color: "#a1a1aa", fontWeight: 600, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", px: 1, mb: 1.5 }}>
        Saved Searches
      </Typography>
      <Stack spacing={0.5}>
        {["React High Priority", "Assigned to Me", "Rust & Help Wanted"].map((item) => (
          <Button
            key={item}
            fullWidth
            sx={{ textTransform: "none", borderRadius: "14px", justifyContent: "flex-start", px: 1.5, py: 1, gap: 1, color: "#a1a1aa", fontWeight: 500 }}
          >
            <MSym name="search" sx={{ fontSize: 17 }} />
            {item}
          </Button>
        ))}
      </Stack>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 3, mb: 1.5 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#a1a1aa", letterSpacing: 0.6, textTransform: "uppercase" }}>
          Filters
        </Typography>
        <Typography sx={{ fontSize: 10, color: "#19e66b", cursor: "pointer" }}>Clear all</Typography>
      </Stack>

      <Typography sx={{ fontSize: 12, color: "#fff", mb: 1 }}>Languages</Typography>
      <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mb: 2.5 }}>
        <Chip
          icon={<Code sx={{ fontSize: "14px !important", color: "#19e66b !important" }} />}
          label="JS"
          sx={{ ...filterChipSx, bgcolor: "rgba(25,230,107,0.1)", borderColor: "rgba(25,230,107,0.2)", color: "#19e66b" }}
        />
        {["Python", "React", "Rust"].map((item) => (
          <Chip key={item} label={item} sx={filterChipSx} />
        ))}
      </Stack>

      <Typography sx={{ fontSize: 12, color: "#fff", mb: 1 }}>Difficulty</Typography>
      <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mb: 2.5 }}>
        {["Beginner", "Intermediate", "Advanced"].map((item) => (
          <Chip key={item} label={item} sx={filterChipSx} />
        ))}
      </Stack>

      <Divider sx={{ borderColor: "#27272a", my: 2 }} />
      <Button
        fullWidth
        sx={{ textTransform: "none", justifyContent: "space-between", color: "#a1a1aa", borderRadius: "14px", px: 1.5, py: 1 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Bookmark sx={{ fontSize: 20 }} />
          <Typography sx={{ fontSize: 14, fontWeight: 500 }}>Saved Issues</Typography>
        </Stack>
        <Box sx={{ px: 0.8, borderRadius: "8px", bgcolor: "rgba(39,39,42,0.5)", fontFamily: "monospace", fontSize: 12 }}>
          12
        </Box>
      </Button>

      <Divider sx={{ borderColor: "#27272a", my: 2 }} />
      <Button
        fullWidth
        onClick={handleSeedAll}
        disabled={seeding}
        sx={{
          textTransform: "none",
          borderRadius: "14px",
          px: 1.5,
          py: 1.2,
          gap: 1,
          bgcolor: "rgba(25,230,107,0.1)",
          border: "1px solid rgba(25,230,107,0.25)",
          color: "#19e66b",
          fontWeight: 600,
          "&:hover": { bgcolor: "rgba(25,230,107,0.18)" },
          "&.Mui-disabled": { color: "rgba(25,230,107,0.5)", bgcolor: "rgba(25,230,107,0.05)" }
        }}
      >
        {seeding ? (
          <CircularProgress size={16} sx={{ color: "#19e66b" }} />
        ) : (
          <MSym name="auto_awesome" sx={{ fontSize: 18 }} />
        )}
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
          {seeding ? "Seeding..." : "Seed All Demo Data"}
        </Typography>
      </Button>
      {seedMsg && (
        <Typography sx={{ mt: 1, color: "#19e66b", fontSize: 11, px: 0.5 }}>
          {seedMsg}
        </Typography>
      )}
    </>
  );
}

export default function HomePage() {
  return (
    <AppLayout activePage="feed" sidebarExtra={<HomeSidebarExtra />}>
      <Box sx={{ maxWidth: 1152, mx: "auto", px: 3, py: 5 }}>
        <Typography sx={{ fontSize: 42, lineHeight: "48px", fontWeight: 700, letterSpacing: -0.8 }}>
          Your Issue Feed
        </Typography>
        <Typography sx={{ color: "#a1a1aa", mt: 1, fontSize: 16 }}>
          Discover issues relevant to your skills and interests.
        </Typography>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mt: 3, mb: 2.2 }}>
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
              value=""
              placeholder="Search issues, repos, or authors (e.g. is:open label:bug)"
              sx={{ color: "#a1a1aa", fontSize: 14 }}
              readOnly
            />
            <Box sx={{ px: 0.8, py: 0.3, borderRadius: "8px", border: "1px solid #27272a", bgcolor: "rgba(11,15,23,0.5)", color: "#a1a1aa", fontSize: 12 }}>
              /
            </Box>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              sx={toolbarButtonSx}
              startIcon={<Tune sx={{ fontSize: 18 }} />}
              endIcon={<ExpandMore sx={{ fontSize: 18, color: "#a1a1aa" }} />}
            >
              Filters
            </Button>
            <Button sx={toolbarButtonSx} startIcon={<BookmarkAdd sx={{ fontSize: 18 }} />}>Save</Button>
            <Button
              sx={toolbarButtonSx}
              startIcon={<Sort sx={{ fontSize: 18 }} />}
              endIcon={<ExpandMore sx={{ fontSize: 18, color: "#a1a1aa" }} />}
            >
              Sort
            </Button>
            <Stack direction="row" spacing={0.5} sx={{ bgcolor: "#0b0f17", border: "1px solid #27272a", borderRadius: "14px", p: 0.7 }}>
              <IconButton sx={{ width: 30, height: 30, borderRadius: "6px", bgcolor: "rgba(11,15,23,0.8)", color: "#fff" }}>
                <ViewList sx={{ fontSize: 20 }} />
              </IconButton>
              <IconButton sx={{ width: 30, height: 30, borderRadius: "6px", color: "#a1a1aa" }}>
                <GridView sx={{ fontSize: 20 }} />
              </IconButton>
            </Stack>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: 12, color: "#a1a1aa", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Active:</Typography>
          <Chip label="repo:facebook/react" onDelete={() => undefined} sx={{ height: 26, borderRadius: "6px", bgcolor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa", ".MuiChip-deleteIcon": { color: "rgba(96,165,250,0.7)", fontSize: 16 } }} />
          <Chip label="is:open" onDelete={() => undefined} sx={{ height: 26, borderRadius: "6px", bgcolor: "rgba(25,230,107,0.1)", border: "1px solid rgba(25,230,107,0.2)", color: "#19e66b", ".MuiChip-deleteIcon": { color: "rgba(25,230,107,0.7)", fontSize: 16 } }} />
          <Typography sx={{ fontSize: 12, color: "#a1a1aa" }}>Clear all</Typography>
        </Stack>

        <Stack spacing={2}>
          {issues.map((issue) => (
            <Box
              key={issue.id}
              sx={{
                p: 2.6,
                borderRadius: "20px",
                border: "1px solid #27272a",
                bgcolor: issue.muted ? "rgba(11,15,23,0.5)" : "#0b0f17",
                opacity: issue.muted ? 0.8 : 1,
                position: "relative"
              }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Adjust sx={{ fontSize: 22, mt: 0.5, color: issue.iconColor }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 12, color: "#a1a1aa", mb: 0.7, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                    {issue.repo} • {issue.number} • {issue.openedText}
                  </Typography>
                  <Typography sx={{ fontSize: 30/1.6, fontWeight: 600, lineHeight: "28px", mb: 0.8, color: issue.muted ? "rgba(255,255,255,0.8)" : "#fff" }}>
                    {issue.title}
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: "#a1a1aa", lineHeight: "22px", mb: 1.5 }}>{issue.body}</Typography>

                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {issue.tags.map((tag) => (
                        <Chip
                          key={tag.label}
                          label={tag.label}
                          sx={{
                            height: 26,
                            borderRadius: "8px",
                            fontWeight: 500,
                            color: tag.color,
                            bgcolor: tag.bg,
                            border: `1px solid ${tag.border}`,
                            ".MuiChip-label": { px: 1.1, fontSize: 12 }
                          }}
                        />
                      ))}
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <Stack direction="row" spacing={0.7} alignItems="center">
                        <ChatBubbleOutline sx={{ fontSize: 16, color: "#a1a1aa" }} />
                        <Typography sx={{ fontSize: 12, color: "#a1a1aa", fontWeight: 500 }}>{issue.comments}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.7} alignItems="center">
                        <ThumbUpOffAlt sx={{ fontSize: 16, color: "#a1a1aa" }} />
                        <Typography sx={{ fontSize: 12, color: "#a1a1aa", fontWeight: 500 }}>{issue.likes}</Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </Box>
                <Button
                  sx={
                    issue.ctaPrimary
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
                          color: issue.cta === "View" ? "#a1a1aa" : "#fff",
                          bgcolor: "#0b0f17",
                          whiteSpace: "nowrap"
                        }
                  }
                >
                  {issue.cta}
                </Button>
              </Stack>
              {issue.claimed && (
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
          ))}
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3.2, pt: 3, borderTop: "1px solid #27272a" }}>
          <Button sx={pageButtonSx} startIcon={<ArrowBack sx={{ fontSize: 18 }} />}>Previous</Button>
          <Stack direction="row" spacing={0.5} alignItems="center">
            {["1", "2", "3"].map((pg, index) => (
              <Box
                key={pg}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "6px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: index === 0 ? "rgba(25,230,107,0.2)" : "transparent",
                  color: index === 0 ? "#19e66b" : "#a1a1aa",
                  fontWeight: index === 0 ? 700 : 400,
                  fontSize: 14
                }}
              >
                {pg}
              </Box>
            ))}
            <Typography sx={{ color: "#a1a1aa", px: 0.5, fontSize: 14 }}>...</Typography>
            <Box sx={{ width: 32, height: 32, borderRadius: "6px", display: "grid", placeItems: "center", color: "#a1a1aa", fontSize: 14 }}>
              12
            </Box>
          </Stack>
          <Button sx={pageButtonSx} endIcon={<ArrowForward sx={{ fontSize: 18 }} />}>Next</Button>
        </Stack>

        <Typography sx={{ mt: 4, color: "#a1a1aa", fontSize: 12, textAlign: "center" }}>
          © 2023 OpenCollab Inc. · Terms · Privacy
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
