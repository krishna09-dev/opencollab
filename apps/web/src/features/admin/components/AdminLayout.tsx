import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  GlobalStyles,
  Stack,
  Typography
} from "@mui/material";
import MSym from "../../resources/components/MSym";
import { api } from "../../../lib/api";

type SessionUser = {
  name: string;
  role: string;
};

const TOP_BAR_HEIGHT = 64;
const SIDEBAR_WIDTH = 240;

export default function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isModeratorRoute = location.pathname.startsWith("/moderator");

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const basePath = isModeratorRoute ? "/moderator" : "/admin";
  const accentColor = isModeratorRoute ? "#38bdf8" : "#fb923c";
  const panelTitle = isModeratorRoute ? "OpenCollab Moderation" : "OpenCollab Admin";

  const navItems = useMemo(() => {
    if (isModeratorRoute) {
      return [
        { label: "Analytics", icon: "analytics", path: `${basePath}/analytics` },
        { label: "Repo Requests", icon: "outbox", path: `${basePath}/repo-requests` },
        { label: "Resource Requests", icon: "library_add", path: `${basePath}/resource-requests` },
        { label: "Issues", icon: "bug_report", path: `${basePath}/issues` },
        { label: "Claims", icon: "assignment_ind", path: `${basePath}/claims` },
        { label: "PR Verification", icon: "verified", path: `${basePath}/prs` }
      ];
    }

    return [
      { label: "Analytics", icon: "analytics", path: `${basePath}/analytics` },
      { label: "Repositories", icon: "folder_code", path: `${basePath}/repos` },
      { label: "Requested Repos", icon: "outbox", path: `${basePath}/repo-requests` },
      { label: "Resource Requests", icon: "library_add", path: `${basePath}/resource-requests` },
      { label: "Approved Resources", icon: "inventory_2", path: `${basePath}/approved-resources` },
      { label: "Issues", icon: "bug_report", path: `${basePath}/issues` },
      { label: "Claims", icon: "assignment_ind", path: `${basePath}/claims` }
    ];
  }, [basePath, isModeratorRoute]);

  useEffect(() => {
    let alive = true;

    const resolveSession = async () => {
      setAuthLoading(true);

      const adminToken = localStorage.getItem("oc_admin_token");
      const userToken = localStorage.getItem("oc_token");

      if (!adminToken && !userToken) {
        navigate(isModeratorRoute ? "/moderation" : "/admin/login", { replace: true });
        return;
      }

      let resolved: SessionUser | null = null;

      const storedAdmin = localStorage.getItem("oc_admin_user");
      if (!resolved && storedAdmin) {
        try {
          const parsed = JSON.parse(storedAdmin) as { username?: string; role?: string };
          if (parsed?.username && parsed?.role) {
            resolved = { name: parsed.username, role: parsed.role };
          }
        } catch {
          // ignore parse errors
        }
      }

      if (!resolved && adminToken) {
        try {
          const res = await api.get("/auth/admin/me", {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          resolved = { name: res.data.username || "Admin", role: res.data.role || "admin" };
        } catch {
          // admin token not valid for admin auth endpoint
        }
      }

      if (!resolved && userToken) {
        try {
          const res = await api.get("/api/me", {
            headers: { Authorization: `Bearer ${userToken}` }
          });
          resolved = { name: res.data.login || "User", role: res.data.role || "user" };
        } catch {
          // user token invalid
        }
      }

      if (!alive) return;

      if (!resolved) {
        navigate(isModeratorRoute ? "/moderation" : "/admin/login", { replace: true });
        return;
      }

      const isModeratorOrAdmin =
        resolved.role === "moderator" || resolved.role === "admin";
      const isAdmin = resolved.role === "admin";

      if (isModeratorRoute && !isModeratorOrAdmin) {
        navigate("/feed", { replace: true });
        return;
      }

      if (!isModeratorRoute && !isAdmin) {
        if (resolved.role === "moderator") {
          navigate("/moderator", { replace: true });
        } else {
          navigate("/feed", { replace: true });
        }
        return;
      }

      setSessionUser(resolved);
      setAuthLoading(false);
    };

    resolveSession();

    return () => {
      alive = false;
    };
  }, [isModeratorRoute, navigate]);

  const isActive = (path: string) => location.pathname.startsWith(path);

  function handleLogout() {
    localStorage.removeItem("oc_admin_token");
    localStorage.removeItem("oc_admin_user");
    localStorage.removeItem("oc_token");
    navigate(isModeratorRoute ? "/moderation" : "/admin/login");
  }

  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#050509",
          display: "grid",
          placeItems: "center"
        }}
      >
        <Stack spacing={1.5} alignItems="center">
          <CircularProgress size={28} sx={{ color: accentColor }} />
          <Typography sx={{ color: "#a1a1aa", fontSize: 13 }}>
            Loading management panel...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", width: "100%", bgcolor: "#050509", color: "#fff" }}>
      <GlobalStyles styles={{ body: { backgroundColor: "#050509" } }} />

      {/* Top Bar */}
      <Box
        sx={{
          height: TOP_BAR_HEIGHT,
          borderBottom: "1px solid #27272a",
          bgcolor: "rgba(5,5,9,0.95)",
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
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "14px",
              bgcolor: isModeratorRoute ? "rgba(56,189,248,0.2)" : "rgba(251,146,60,0.2)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer"
            }}
            onClick={() => navigate(basePath)}
          >
            <MSym name="admin_panel_settings" sx={{ color: accentColor, fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.4 }}>
            {panelTitle}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {sessionUser && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "10px",
                  bgcolor: isModeratorRoute ? "rgba(56,189,248,0.15)" : "rgba(251,146,60,0.15)",
                  display: "grid",
                  placeItems: "center"
                }}
              >
                <MSym name="person" sx={{ color: accentColor, fontSize: 16 }} />
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#a1a1aa" }}>
                {sessionUser.name} ({sessionUser.role})
              </Typography>
            </Stack>
          )}
          <Divider orientation="vertical" flexItem sx={{ borderColor: "#27272a", mx: 0.5 }} />
          <Button
            onClick={handleLogout}
            startIcon={<MSym name="logout" sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: "none",
              color: "#f87171",
              fontSize: 13,
              "&:hover": { bgcolor: "rgba(248,113,113,0.1)" }
            }}
          >
            Logout
          </Button>
        </Stack>
      </Box>

      {/* Sidebar */}
      <Box
        sx={{
          width: SIDEBAR_WIDTH,
          boxSizing: "border-box",
          borderRight: "1px solid #27272a",
          px: 2,
          py: 3,
          position: "fixed",
          top: TOP_BAR_HEIGHT,
          left: 0,
          bottom: 0,
          bgcolor: "#050509",
          zIndex: 5,
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "#27272a", borderRadius: 2 }
        }}
      >
        <Typography
          sx={{
            color: "#a1a1aa",
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            px: 1,
            mb: 1
          }}
        >
          {isModeratorRoute ? "Moderation Panel" : "Admin Panel"}
        </Typography>

        <Stack spacing={0.5}>
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Button
                key={item.path}
                fullWidth
                onClick={() => navigate(item.path)}
                sx={{
                  justifyContent: "flex-start",
                  textTransform: "none",
                  borderRadius: "10px",
                  px: 1.5,
                  py: 1,
                  color: active ? "#fff" : "#a1a1aa",
                  bgcolor: active
                    ? isModeratorRoute
                      ? "rgba(56,189,248,0.15)"
                      : "rgba(251,146,60,0.15)"
                    : "transparent",
                  fontWeight: 500,
                  gap: 1,
                  "&:hover": {
                    bgcolor: active
                      ? isModeratorRoute
                        ? "rgba(56,189,248,0.22)"
                        : "rgba(251,146,60,0.2)"
                      : "rgba(255,255,255,0.05)"
                  }
                }}
              >
                <MSym
                  name={item.icon}
                  sx={{ fontSize: 18, color: active ? accentColor : undefined }}
                />
                {item.label}
              </Button>
            );
          })}
        </Stack>

        <Divider sx={{ borderColor: "#27272a", my: 2 }} />

        <Typography sx={{ color: "#71717a", fontSize: 12, px: 1 }}>
          {isModeratorRoute
            ? "Review community operations and submit requests to admins."
            : "Manage repositories, moderation workflows, and platform quality."}
        </Typography>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          boxSizing: "border-box",
          marginLeft: `${SIDEBAR_WIDTH}px`,
          marginTop: `${TOP_BAR_HEIGHT}px`,
          width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
          maxWidth: `calc(100% - ${SIDEBAR_WIDTH}px)`,
          minHeight: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
          p: { xs: 2, md: 3 }
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
