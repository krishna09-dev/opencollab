// apps/web/src/features/prTracking/pages/PrTrackingPage.tsx
import { useMemo, useState } from "react";
import { Alert, Box, Button, Container, GlobalStyles, Paper, Stack, Typography } from "@mui/material";
import ResourcesHeader from "../../resources/components/ResourcesHeader";
import PrCard from "../components/PrCard";
import PrTrackingFilters from "../components/PrFilters";
import type { PrStatusFilter, PrTrackingItem } from "../types";
import { useNavigate } from "react-router-dom";
import MSym from "../../resources/components/MSym";

// TEMP: dummy items (until backend ready)
const DUMMY: PrTrackingItem[] = [
  {
    id: "1",
    title: "Add PR tracking status chips to UI",
    repoFullName: "opencollab/web",
    issueNumber: 142,
    shortSummary: "Adds PR list + detail tracking view.",
    status: "PR_OPEN",
    prNumber: 57,
    messagesCount: 2,
    lastMessagePreview: "Please add pagination…",
    updatedAtLabel: "Updated 2m ago"
  },
  {
    id: "2",
    title: "Fix resources seed + add status/source fields",
    repoFullName: "opencollab/api",
    issueNumber: 133,
    shortSummary: "Schema defaults + route updates.",
    status: "MERGED",
    prNumber: 41,
    messagesCount: 5,
    lastMessagePreview: "Merged ✅",
    updatedAtLabel: "Updated 1d ago"
  },
  {
    id: "3",
    title: "Refactor auth middleware typings",
    repoFullName: "opencollab/api",
    issueNumber: 128,
    shortSummary: "Fixes AuthRequest userId patterns.",
    status: "CLOSED",
    prNumber: 38,
    messagesCount: 1,
    lastMessagePreview: "Closing due to conflict",
    updatedAtLabel: "Updated 4d ago"
  }
];

export default function PrTrackingPage() {
  const navigate = useNavigate();

  // later: pass real currentUser/unreadCount from API like ResourcesPage
  const currentUser = { login: "krishna09-dev", avatarUrl: "" };
  const unreadCount = 1;

  const [tab, setTab] = useState<"list" | "detail">("list");

  const [filters, setFilters] = useState<{ q: string; status: PrStatusFilter; repo: string }>({
    q: "",
    status: "All",
    repo: "All"
  });

  const repoOptions = useMemo(() => {
    const s = new Set(DUMMY.map((x) => x.repoFullName));
    return Array.from(s);
  }, []);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return DUMMY.filter((x) => {
      const hitQ =
        !q ||
        x.title.toLowerCase().includes(q) ||
        x.repoFullName.toLowerCase().includes(q) ||
        String(x.issueNumber).includes(q);

      const hitStatus = filters.status === "All" ? true : x.status === filters.status;
      const hitRepo = filters.repo === "All" ? true : x.repoFullName === filters.repo;

      return hitQ && hitStatus && hitRepo;
    });
  }, [filters]);

  const summary = useMemo(() => {
    const total = DUMMY.length;
    const open = DUMMY.filter((x) => x.status === "PR_OPEN").length;
    const merged = DUMMY.filter((x) => x.status === "MERGED").length;
    const closed = DUMMY.filter((x) => x.status === "CLOSED").length;
    return { total, open, merged, closed };
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", width: "100%", bgcolor: "#0b0b10", color: "#e5e7eb" }}>
      <GlobalStyles styles={{ body: { backgroundColor: "#0b0b10" } }} />

      {/* background blobs */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(900px 700px at 95% 2%, rgba(34,197,94,0.26), rgba(34,197,94,0) 60%),
            radial-gradient(900px 700px at 15% 10%, rgba(255,255,255,0.06), rgba(255,255,255,0) 60%)
          `
        }}
      />

      {/* header */}
      <ResourcesHeader currentUser={currentUser} unreadCount={unreadCount} />

      <Container maxWidth={false} sx={{ maxWidth: 1440, py: 4, px: { xs: 2, md: 3, lg: 5 } }}>
        <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "flex-end" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography sx={{ color: "#fff", fontSize: { xs: 34, md: 44 }, fontWeight: 950, letterSpacing: -0.9, lineHeight: 1.05 }}>
              PR Tracking
            </Typography>
            <Typography sx={{ mt: 1, color: "#9ca3af", fontSize: 14, fontWeight: 650 }}>
              List of PRs you created, their status chips, and messages (comments + system events).
            </Typography>

            {/* tabs */}
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                onClick={() => setTab("list")}
                sx={{
                  height: 34,
                  borderRadius: 999,
                  px: 2,
                  textTransform: "none",
                  fontWeight: 900,
                  bgcolor: tab === "list" ? "rgba(25,230,107,0.12)" : "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: tab === "list" ? "#19e66b" : "#9ca3af",
                  "&:hover": { bgcolor: tab === "list" ? "rgba(25,230,107,0.16)" : "rgba(255,255,255,0.06)" }
                }}
              >
                PR List
              </Button>
              <Button
                onClick={() => setTab("detail")}
                sx={{
                  height: 34,
                  borderRadius: 999,
                  px: 2,
                  textTransform: "none",
                  fontWeight: 900,
                  bgcolor: tab === "detail" ? "rgba(25,230,107,0.12)" : "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: tab === "detail" ? "#19e66b" : "#9ca3af",
                  "&:hover": { bgcolor: tab === "detail" ? "rgba(25,230,107,0.16)" : "rgba(255,255,255,0.06)" }
                }}
              >
                PR Detail
              </Button>
            </Stack>
          </Box>

          {/* actions */}
          <Stack direction="row" spacing={1.25} sx={{ justifyContent: "flex-end" }}>
            <Button
              startIcon={<MSym name="sync" sx={{ fontSize: 18 }} />}
              sx={{
                height: 40,
                borderRadius: 999,
                px: 2.5,
                textTransform: "none",
                fontWeight: 900,
                bgcolor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#e5e7eb",
                "&:hover": { bgcolor: "rgba(255,255,255,0.10)" }
              }}
            >
              Manual Refresh
            </Button>

            <Button
              startIcon={<MSym name="bolt" sx={{ fontSize: 18 }} />}
              sx={{
                height: 40,
                borderRadius: 999,
                px: 2.5,
                textTransform: "none",
                fontWeight: 950,
                bgcolor: "#19e66b",
                color: "#001b0a",
                "&:hover": { bgcolor: "#22c55e" }
              }}
            >
              Run Dummy Worker
            </Button>
          </Stack>
        </Stack>

        {/* main grid */}
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5} sx={{ mt: 3 }}>
          {/* LEFT: list card */}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.10)",
              bgcolor: "rgba(255,255,255,0.04)",
              overflow: "hidden",
              boxShadow: "0 25px 70px rgba(0,0,0,0.35)"
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                bgcolor: "rgba(17,17,26,0.25)"
              }}
            >
              <Typography sx={{ fontWeight: 950, color: "#fff" }}>All PRs</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#9ca3af" }}>Click an item to open detail</Typography>
            </Stack>

            <Box sx={{ p: 2 }}>
              {/* ✅ Proper rounded filter bar (like reference) */}
              <PrTrackingFilters
                value={filters}
                repoOptions={repoOptions}
                onChange={setFilters}
                onReset={() => setFilters({ q: "", status: "All", repo: "All" })}
              />

              <Typography sx={{ mt: 2, color: "#6b7280", fontSize: 12, fontWeight: 800 }}>
                Showing {filtered.length} of {DUMMY.length}
              </Typography>

              <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                {filtered.length === 0 ? (
                  <Alert
                    severity="info"
                    sx={{
                      bgcolor: "rgba(59,130,246,0.10)",
                      border: "1px solid rgba(59,130,246,0.25)",
                      color: "#bfdbfe"
                    }}
                  >
                    No PRs match your filters.
                  </Alert>
                ) : (
                  filtered.map((item) => (
                    <PrCard key={item.id} item={item} onOpen={() => setTab("detail")} />
                  ))
                )}
              </Stack>
            </Box>
          </Paper>

          {/* RIGHT: summary */}
          <Paper
            elevation={0}
            sx={{
              width: { xs: "100%", lg: 460 },
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.10)",
              bgcolor: "rgba(255,255,255,0.04)",
              overflow: "hidden",
              boxShadow: "0 25px 70px rgba(0,0,0,0.35)"
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                bgcolor: "rgba(17,17,26,0.25)"
              }}
            >
              <Typography sx={{ fontWeight: 950, color: "#fff" }}>Summary</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#9ca3af" }}>Dummy stats</Typography>
            </Stack>

            <Box sx={{ p: 2 }}>
              <Stack direction="row" spacing={1.25} sx={{ flexWrap: "wrap" }}>
                {[
                  { n: summary.total, l: "Total PRs" },
                  { n: summary.open, l: "PR_OPEN" },
                  { n: summary.merged, l: "MERGED" },
                  { n: summary.closed, l: "CLOSED" }
                ].map((x) => (
                  <Box
                    key={x.l}
                    sx={{
                      flex: "1 1 200px",
                      p: 2,
                      borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.10)",
                      bgcolor: "rgba(255,255,255,0.04)"
                    }}
                  >
                    <Typography sx={{ fontSize: 22, fontWeight: 950, color: "#fff", letterSpacing: -0.6 }}>
                      {x.n}
                    </Typography>
                    <Typography sx={{ mt: 0.5, fontSize: 12, fontWeight: 800, color: "#9ca3af" }}>
                      {x.l}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.10)",
                  bgcolor: "rgba(255,255,255,0.04)"
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 950, color: "#fff" }}>Status rules</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#9ca3af" }}>Sprint 4</Typography>
                </Stack>

                <Stack spacing={1} sx={{ mt: 1.5, color: "#cbd5e1", fontWeight: 750, fontSize: 13 }}>
                  <Box>• PR_OPEN → PR detected</Box>
                  <Box>• MERGED → PR merged</Box>
                  <Box>• CLOSED → PR closed</Box>
                  <Box>• ACCEPTED → No PR yet</Box>
                </Stack>

                <Typography sx={{ mt: 1.5, fontSize: 12, color: "#6b7280", fontWeight: 800 }}>
                  Worker sync (dummy): every 10–15 minutes. Manual refresh uses user token.
                </Typography>
              </Box>

              <Button
                onClick={() => navigate("/resources")}
                sx={{
                  mt: 2,
                  height: 40,
                  borderRadius: 999,
                  px: 2.5,
                  textTransform: "none",
                  fontWeight: 950,
                  bgcolor: "rgba(25,230,107,0.12)",
                  border: "1px solid rgba(25,230,107,0.25)",
                  color: "#19e66b",
                  "&:hover": { bgcolor: "rgba(25,230,107,0.16)" }
                }}
              >
                Go to Resources
              </Button>
            </Box>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}