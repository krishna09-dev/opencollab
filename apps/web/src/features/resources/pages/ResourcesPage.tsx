import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, GlobalStyles, Stack, Typography } from "@mui/material";

import type { ResourceFilterState } from "../types";
import type { SuggestResourcePayload } from "../components/SuggestResourceDialog";

import ResourcesHeader from "../components/ResourcesHeader";
import { ResourceFilters } from "../components/ResourceFilters";
import { ResourceGrid } from "../components/ResourceGrid";
import SuggestResourceDialog from "../components/SuggestResourceDialog";

import { useResources } from "../hooks/useResources";
import { useSeedResources } from "../hooks/useSeedResources";
import { useDebounce } from "../hooks/useDebounce";

import { suggestResource } from "../api/resourcesApi";
import { fetchCurrentUser } from "../../issueDetail/api/issueDetailApi";

const DEFAULT_FILTERS: ResourceFilterState = {
  q: "",
  category: "All",
  difficulty: "All",
  language: "All",
  type: "All"
};

export default function ResourcesPage() {
  // ── user ──
  const [currentUser, setCurrentUser] = useState<{ login?: string; avatarUrl?: string } | null>(null);

  useEffect(() => {
    fetchCurrentUser()
      .then((u) => setCurrentUser({ login: u.login, avatarUrl: u.avatarUrl }))
      .catch(() => setCurrentUser(null));
  }, []);

  // ── filters ──
  const [filters, setFilters] = useState<ResourceFilterState>(DEFAULT_FILTERS);
  const debouncedFilters = useDebounce(filters, 300);

  // ── data ──
  const { loading, error, featured, items, total } = useResources(debouncedFilters);

  // ── seed ──
  const { seeding, seed } = useSeedResources();
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  const handleSeed = useCallback(async () => {
    setSeedMsg(null);
    const result = await seed();
    if (result.ok) {
      setSeedMsg(`Seeded ${result.inserted ?? 0} resources.`);
      // refresh by toggling filters
      setFilters((f) => ({ ...f }));
    } else {
      setSeedMsg(result.message ?? "Seed failed.");
    }
  }, [seed]);

  // ── suggest dialog ──
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestMsg, setSuggestMsg] = useState<string | null>(null);

  const handleSuggest = useCallback(async (payload: SuggestResourcePayload) => {
    setSuggestMsg(null);
    try {
      const res = await suggestResource(payload);
      setSuggestMsg(res.message);
      setSuggestOpen(false);
      // refresh
      setFilters((f) => ({ ...f }));
    } catch (e: any) {
      setSuggestMsg(e?.response?.data?.message || e?.message || "Failed to submit suggestion.");
    }
  }, []);

  // ── reset ──
  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSeedMsg(null);
    setSuggestMsg(null);
  }, []);

  // ── separate featured from regular ──
  const regularItems = useMemo(() => {
    const featuredIds = new Set(featured.map((f) => f.id));
    return items.filter((i) => !featuredIds.has(i.id));
  }, [items, featured]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#050509", color: "#fff" }}>
      <GlobalStyles styles={{ body: { backgroundColor: "#050509" } }} />

      {/* ── Header ── */}
      <ResourcesHeader
        currentUser={currentUser}
        onSuggestClick={() => setSuggestOpen(true)}
      />

      {/* ── Main content ── */}
      <Box sx={{ maxWidth: 1280, mx: "auto", px: 3, py: 4 }}>
        {/* ── Title ── */}
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.5 }}>
            Learning Resources
          </Typography>
          <Typography sx={{ fontSize: 15, color: "#9ca3af" }}>
            Master the skills needed to contribute to world-class open source projects.
          </Typography>
        </Stack>

        {/* ── Filters ── */}
        <ResourceFilters
          value={filters}
          onChange={setFilters}
          onReset={handleReset}
          onSeed={handleSeed}
        />

        {/* ── Status messages ── */}
        {(seedMsg || suggestMsg) && (
          <Typography sx={{ mt: 2, fontSize: 14, color: "#19e66b", fontWeight: 600 }}>
            {seedMsg || suggestMsg}
          </Typography>
        )}

        {seeding && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
            <CircularProgress size={16} sx={{ color: "#19e66b" }} />
            <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>Seeding resources...</Typography>
          </Stack>
        )}

        {/* ── Loading ── */}
        {loading && !seeding && (
          <Stack alignItems="center" sx={{ py: 8 }}>
            <CircularProgress size={32} sx={{ color: "#19e66b" }} />
            <Typography sx={{ mt: 2, fontSize: 14, color: "#9ca3af" }}>Loading resources...</Typography>
          </Stack>
        )}

        {/* ── Error ── */}
        {error && (
          <Typography sx={{ mt: 3, color: "#fca5a5", fontSize: 14, fontWeight: 600 }}>
            {error}
          </Typography>
        )}

        {/* ── Results ── */}
        {!loading && !error && (
          <Stack spacing={5} sx={{ mt: 4 }}>
            {/* count */}
            <Typography sx={{ fontSize: 13, color: "#6b7280" }}>
              {total} resource{total !== 1 ? "s" : ""} found
            </Typography>

            {/* Featured */}
            {featured.length > 0 && (
              <Stack spacing={2}>
                <Typography sx={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#a1a1aa", fontWeight: 700 }}>
                  Featured
                </Typography>
                <ResourceGrid items={featured} emptyText="" columns={{ xs: 1, md: 3 }} />
              </Stack>
            )}

            {/* All resources */}
            <Stack spacing={2}>
              <Typography sx={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#a1a1aa", fontWeight: 700 }}>
                {featured.length > 0 ? "All Resources" : "Resources"}
              </Typography>
              <ResourceGrid
                items={regularItems}
                emptyText="No resources match your filters. Try adjusting or seed some samples."
                columns={{ xs: 1, md: 3 }}
              />
            </Stack>
          </Stack>
        )}
      </Box>

      {/* ── Suggest dialog ── */}
      <SuggestResourceDialog
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        onSubmit={handleSuggest}
      />
    </Box>
  );
}
