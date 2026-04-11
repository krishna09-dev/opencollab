import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  GlobalStyles,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography
} from "@mui/material";

import MSym from "../../features/resources/components/MSym";
import {
  fetchCurrentUser,
  fetchNotifications,
  markAllNotificationsRead
} from "../../features/issueDetail/api/issueDetailApi";
import type { NotificationDto } from "../../features/issueDetail/types";
import UserLegalFooter from "./UserLegalFooter";

type CurrentUser = { login?: string; avatarUrl?: string; role?: string } | null;

const NAV_ITEMS = [
  { label: "Trending Issues", icon: "explore", path: "/feed" },
  { label: "Good First Issues", icon: "partner_exchange", path: "/good-first-issues" },
  { label: "Claimed Issues", icon: "assignment_ind", path: "/profile/claimed-issues" },
  { label: "Learning Resources", icon: "school", path: "/resources" },
  { label: "Pull Requests", icon: "fork_right", path: "/pr-tracking" },
  { label: "Saved Issues", icon: "bookmark", path: "/saved" }
];

export default function AppLayout({
  activePage,
  sidebarExtra,
  children
}: {
  activePage: "feed" | "resources" | "pr-tracking" | "pr-detail" | "good-first-issues" | "claimed-issues" | "saved" | "profile";
  sidebarExtra?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch {
      setNotifications([]);
    }
  };

  const markNotificationsReadAll = async () => {
    try {
      const data = await markAllNotificationsRead();
      setNotifications(data.notifications || []);
      return true;
    } catch {
      return false;
    }
  };

  const openNotifications = async (event: MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
    await loadNotifications();
  };

  const closeNotifications = () => setNotificationsAnchor(null);

  const handleMarkAllRead = async (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    await markNotificationsReadAll();
  };

  const formatNotificationDate = (createdAt: string) => {
    const value = new Date(createdAt);
    if (Number.isNaN(value.getTime())) return "Just now";
    return value.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  useEffect(() => {
    fetchCurrentUser()
      .then((u) => setCurrentUser({ login: u.login, avatarUrl: u.avatarUrl, role: u.role }))
      .catch(() => setCurrentUser(null));
    loadNotifications();
  }, []);

  function isActive(item: typeof NAV_ITEMS[number]) {
    if (item.label === "Trending Issues" && activePage === "feed") return true;
    if (item.label === "Good First Issues" && activePage === "good-first-issues") return true;
    if (item.label === "Claimed Issues" && activePage === "claimed-issues") return true;
    if (item.label === "Learning Resources" && activePage === "resources") return true;
    if (item.label === "Pull Requests" && (activePage === "pr-tracking" || activePage === "pr-detail")) return true;
    if (item.label === "Saved Issues" && activePage === "saved") return true;
    return false;
  }

  return (
    <Box sx={{ minHeight: "100vh", width: "100%", maxWidth: "100vw", overflowX: "hidden", bgcolor: "#050509", color: "#fff" }}>
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
          <IconButton sx={{ color: "#a1a1aa" }} onClick={openNotifications}>
            <Badge
              variant={unreadCount > 0 ? "dot" : "standard"}
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
          <Menu
            anchorEl={notificationsAnchor}
            open={Boolean(notificationsAnchor)}
            onClose={closeNotifications}
            PaperProps={{
              sx: {
                mt: 1,
                width: 360,
                maxWidth: "92vw",
                maxHeight: 420,
                bgcolor: "#0b0f17",
                border: "1px solid #27272a",
                borderRadius: "12px",
                color: "#fff"
              }
            }}
          >
            <Box
              sx={{
                px: 1.5,
                pt: 1.25,
                pb: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1
              }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Notifications</Typography>
              <Button
                size="small"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                sx={{
                  textTransform: "none",
                  minWidth: 0,
                  px: 1,
                  fontSize: 12,
                  color: "#19e66b",
                  "&.Mui-disabled": { color: "#6b7280" }
                }}
              >
                Mark all read
              </Button>
            </Box>
            <Divider sx={{ borderColor: "#27272a" }} />

            {notifications.length === 0 ? (
              <Box sx={{ px: 2, py: 2.5 }}>
                <Typography sx={{ fontSize: 13, color: "#a1a1aa" }}>No notifications yet.</Typography>
              </Box>
            ) : (
              notifications.map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={async () => {
                    if (!notification.read) {
                      await markNotificationsReadAll();
                    }
                    closeNotifications();
                    navigate(`/issues/${notification.issueId}`);
                  }}
                  sx={{
                    alignItems: "flex-start",
                    py: 1.25,
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    "&:last-of-type": { borderBottom: "none" },
                    "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }
                  }}
                >
                  <Stack spacing={0.5} sx={{ width: "100%", minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#fff" }} noWrap>
                        {notification.issueTitle}
                      </Typography>
                      {!notification.read && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            flexShrink: 0,
                            bgcolor: "#19e66b"
                          }}
                        />
                      )}
                    </Stack>

                    <Typography sx={{ fontSize: 12, color: "#cbd5e1" }}>
                      Issue is available to claim again.
                    </Typography>

                    <Typography sx={{ fontSize: 11, color: "#6b7280" }}>
                      {formatNotificationDate(notification.createdAt)}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))
            )}
          </Menu>
          <Divider orientation="vertical" flexItem sx={{ borderColor: "#27272a", mx: 0.5 }} />
          <Button
            onClick={(e) => setProfileAnchor(e.currentTarget)}
            sx={{ textTransform: "none", color: "#fff", borderRadius: "14px", px: 1, minWidth: 0, gap: 1, "&:hover": { bgcolor: "rgba(255,255,255,0.06)" } }}
            startIcon={<Avatar src={currentUser?.avatarUrl} sx={{ width: 32, height: 32 }} />}
            endIcon={<MSym name="keyboard_arrow_down" sx={{ color: "#a1a1aa", fontSize: 18 }} />}
          >
            <Typography sx={{ fontWeight: 500, fontSize: 14 }}>{currentUser?.login || "Alex Dev"}</Typography>
          </Button>
          <Menu
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={() => setProfileAnchor(null)}
            PaperProps={{
              sx: {
                mt: 1,
                bgcolor: "#0b0f17",
                border: "1px solid #27272a",
                borderRadius: "12px",
                minWidth: 180,
                color: "#fff"
              }
            }}
          >
            <MenuItem
              onClick={() => { setProfileAnchor(null); navigate("/profile"); }}
              sx={{ fontSize: 14, gap: 1.5, "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}
            >
              <MSym name="person" sx={{ fontSize: 18, color: "#a1a1aa" }} />
              Your Profile
            </MenuItem>
            {currentUser?.role === "admin" && (
              <MenuItem
                onClick={() => {
                  setProfileAnchor(null);
                  navigate("/admin");
                }}
                sx={{
                  fontSize: 14,
                  gap: 1.5,
                  "&:hover": {
                    bgcolor: "rgba(251,146,60,0.1)"
                  }
                }}
              >
                <MSym
                  name="admin_panel_settings"
                  sx={{
                    fontSize: 18,
                    color: "#fb923c"
                  }}
                />
                Admin Panel
              </MenuItem>
            )}
            <Divider sx={{ borderColor: "#27272a" }} />
            <MenuItem
              onClick={() => {
                setProfileAnchor(null);
                localStorage.clear();
                window.location.href = "/login";
              }}
              sx={{ fontSize: 14, gap: 1.5, color: "#f87171", "&:hover": { bgcolor: "rgba(248,113,113,0.1)" } }}
            >
              <MSym name="logout" sx={{ fontSize: 18 }} />
              Logout
            </MenuItem>
          </Menu>
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
            maxWidth: "100%",
            overflowX: "clip",
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column"
          }}
        >
          <Box sx={{ flex: 1 }}>
            {children}
          </Box>
          <UserLegalFooter
            sx={{ bgcolor: "#050509" }}
            textColor="#71717a"
            linkColor="#a1a1aa"
            borderColor="rgba(39,39,42,0.85)"
          />
        </Box>
      </Box>
    </Box>
  );
}
