import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  GlobalStyles,
  IconButton,
  Stack,
  Typography
} from "@mui/material";

import MSym from "../../features/resources/components/MSym";
import { fetchCurrentUser } from "../../features/issueDetail/api/issueDetailApi";

type CurrentUser = { login?: string; avatarUrl?: string } | null;

const NAV_ITEMS = [
  { label: "Trending Issues", icon: "explore", path: "/feed" },
  { label: "Good First Issues", icon: "partner_exchange", path: "/good-first-issues" },
  { label: "Learning Resources", icon: "school", path: "/resources" },
  { label: "Community Picks", icon: "local_fire_department", path: "/feed" },
  { label: "Pull Requests", icon: "fork_right", path: "/pr-tracking" }
];

export default function AppLayout({
  activePage,
  sidebarExtra,
  children
}: {
  activePage: "feed" | "resources" | "pr-tracking" | "pr-detail" | "good-first-issues";
  sidebarExtra?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  useEffect(() => {
    fetchCurrentUser()
      .then((u) => setCurrentUser({ login: u.login, avatarUrl: u.avatarUrl }))
      .catch(() => setCurrentUser(null));
  }, []);

  function isActive(item: typeof NAV_ITEMS[number]) {
    if (item.label === "Trending Issues" && activePage === "feed") return true;
    if (item.label === "Good First Issues" && activePage === "good-first-issues") return true;
    if (item.label === "Learning Resources" && activePage === "resources") return true;
    if (item.label === "Pull Requests" && (activePage === "pr-tracking" || activePage === "pr-detail")) return true;
    return false;
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#050509", color: "#fff" }}>
      <GlobalStyles styles={{ body: { backgroundColor: "#050509" } }} />

      {/* ─── TOP BAR ─── */}
      <Box
        sx={{
          height: 64,
          borderBottom: "1px solid #27272a",
          bgcolor: "rgba(5,5,9,0.8)",
          backdropFilter: "blur(6px)",
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10
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

      {/* ─── BODY ─── */}
      <Box sx={{ pt: "64px" }}>
        {/* ─── SIDEBAR ─── */}
        <Box
          sx={{
            width: "280px",
            boxSizing: "border-box",
            borderRight: "1px solid #27272a",
            px: 3,
            py: 3,
            display: { xs: "none", md: "block" },
            position: "fixed",
            top: 64,
            left: 0,
            bottom: 0,
            overflowY: "auto",
            bgcolor: "#050509",
            zIndex: 9,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: "#27272a", borderRadius: 2 }
          }}
        >
          <Typography sx={{ color: "#a1a1aa", fontWeight: 600, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", px: 1 }}>
            Explore
          </Typography>

          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              return (
                <Button
                  key={item.label}
                  fullWidth
                  onClick={() => navigate(item.path)}
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    borderRadius: "14px",
                    px: 1.5,
                    py: 1,
                    color: active ? "#fff" : "#a1a1aa",
                    bgcolor: active ? "#0b0f17" : "transparent",
                    border: active ? "1px solid rgba(39,39,42,0.5)" : "1px solid transparent",
                    fontWeight: 500,
                    gap: 1,
                    "&:hover": active ? { bgcolor: "#0f1420" } : undefined
                  }}
                >
                  <MSym name={item.icon} sx={{ fontSize: 17, color: active ? "#19e66b" : undefined }} />
                  {item.label}
                </Button>
              );
            })}
          </Stack>

          {/* Page-specific sidebar content */}
          {sidebarExtra && (
            <>
              <Divider sx={{ borderColor: "#27272a", my: 2.5 }} />
              {sidebarExtra}
            </>
          )}
        </Box>

        {/* ─── MAIN CONTENT ─── */}
        <Box
          sx={{
            minHeight: "calc(100vh - 64px)",
            ml: { xs: 0, md: "280px" },
            position: "relative",
            zIndex: 1
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
