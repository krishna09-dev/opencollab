// apps/web/src/features/resources/pages/ResourcesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress, Container, GlobalStyles, Snackbar, Stack, Typography } from "@mui/material";

import { api, authHeaders } from "../../../lib/api";
import type { ResourceFilterState } from "../types";
import { useResources } from "../hooks/useResources";
import { seedResources } from "../api/resourcesApi";
import { ResourceGrid } from "../components/ResourceGrid";
import { ResourceFilters } from "../components/ResourceFilters";
import ResourcesHeader from "../components/ResourcesHeader";
import SuggestResourceDialog, { type SuggestResourcePayload } from "../components/SuggestResourceDialog";

type CurrentUser = {
  id: string;
  login: string;
  email?: string;
  avatarUrl?: string;
};

type NotificationDto = {
  id: string;
  type: "ISSUE_AVAILABLE";
  issueId: string;
  issueTitle: string;
  createdAt: string;
  read: boolean;
};

const DEFAULT_FILTERS: ResourceFilterState = {
  q: "",
  category: "All",
  difficulty: "All",
  language: "All",
  type: "All"
};

export default function ResourcesPage() {
  // ✅ dialog state
  const [openSuggest, setOpenSuggest] = useState(false);

  // filters + resources
  const [filters, setFilters] = useState<ResourceFilterState>(DEFAULT_FILTERS);
  const { loading, error, featured, items, total } = useResources(filters);

  // header data
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  // toast
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
    open: false,
    message: "",
    severity: "success"
  });

  const showToast = (message: string, severity: "success" | "error" | "info" = "success") =>
    setToast({ open: true, message, severity });

  const closeToast = () => setToast((p) => ({ ...p, open: false }));

  // fetch current user + notifications
  useEffect(() => {
    (async () => {
      try {
        const me = await api.get<CurrentUser>("/api/me", { headers: authHeaders() });
        setCurrentUser(me.data);
      } catch {
        // ignore
      }

      try {
        const res = await api.get<NotificationDto[]>("/api/notifications", { headers: authHeaders() });
        setNotifications(res.data);
      } catch {
        // ignore
      }
    })();
  }, []);

  // seed resources
  const handleSeed = async () => {
    try {
        const data = await seedResources();
        showToast(`${data.message} • inserted ${data.inserted}`, "success");
        setFilters((p) => ({ ...p }));
    } catch (e: any) {
        const msg =
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        e?.message ||
        "Failed to seed.";
        showToast(msg, "error");
        }
    };

  // ✅ handle suggestion submit (frontend only for now)
  const handleSuggestSubmit = (payload: SuggestResourcePayload) => {
    console.log("Suggest resource payload:", payload);

    showToast("Suggestion submitted (frontend only).", "success");
    setOpenSuggest(false);
  };

  return (
    <Box sx={{ minHeight: "100vh", width: "100%", bgcolor: "#0b0b10", color: "#e5e7eb" }}>
      <GlobalStyles styles={{ body: { backgroundColor: "#0b0b10" } }} />

      {/* Background blobs */}
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

      {/* ✅ Reused header with callback */}
      <ResourcesHeader
        currentUser={currentUser}
        unreadCount={unreadCount}
        onSuggestClick={() => setOpenSuggest(true)} // ✅ IMPORTANT
      />

      <Container maxWidth={false} sx={{ maxWidth: 1440, py: 4, px: { xs: 2, md: 3, lg: 5 } }}>
        <Typography
          sx={{
            color: "#fff",
            fontSize: { xs: 34, md: 44 },
            fontWeight: 900,
            letterSpacing: -0.8,
            lineHeight: 1.05
          }}
        >
          Resources Library
        </Typography>
        <Typography sx={{ mt: 1, color: "#9ca3af", fontSize: 14 }}>
          Search guides, docs, videos and cheat-sheets to help you contribute faster.
        </Typography>

        <ResourceFilters
          value={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          onSeed={handleSeed}
        />

        <Box sx={{ mt: 3 }}>
          {loading ? (
            <Box sx={{ minHeight: "45vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert
              severity="error"
              sx={{
                bgcolor: "rgba(239,68,68,0.10)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#fecaca"
              }}
            >
              {error}
            </Alert>
          ) : (
            <>
              {/* FEATURED */}
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 3, mb: 1.5 }}>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: 1.6,
                    textTransform: "uppercase",
                    color: "#9ca3af"
                  }}
                >
                  Featured
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "#9ca3af", fontSize: 12 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: 999, bgcolor: "#19e66b" }} />
                  <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>High-quality picks for beginners</Typography>
                </Stack>
              </Stack>

              <ResourceGrid items={featured} emptyText="No featured resources match your filters." columns={{ xs: 1, md: 3 }} />

              {/* ALL */}
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 4, mb: 1.5 }}>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: 1.6,
                    textTransform: "uppercase",
                    color: "#9ca3af"
                  }}
                >
                  All resources
                </Typography>

                <Typography sx={{ color: "#6b7280", fontSize: 12 }}>
                  Showing {items.length} of {total}
                </Typography>
              </Stack>

              <ResourceGrid items={items} emptyText="No resources match your filters." columns={{ xs: 1, md: 3 }} />
            </>
          )}
        </Box>
      </Container>

      {/* ✅ Suggest Resource dialog mounted here */}
      <SuggestResourceDialog
        open={openSuggest}
        onClose={() => setOpenSuggest(false)}
        onSubmit={handleSuggestSubmit}
      />

      <Snackbar open={toast.open} autoHideDuration={3500} onClose={closeToast} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={closeToast} severity={toast.severity} sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}