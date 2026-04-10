import { useState, type MouseEvent } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import MSym from "../../resources/components/MSym";
import type { CurrentUser, NotificationDto } from "../types";

type Props = {
  currentUser: CurrentUser | null;
  unreadCount: number;
  notifications: NotificationDto[];
  loadNotifications: () => Promise<void>;
  markNotificationsReadAll: () => Promise<boolean>;
};

export default function IssueDetailHeader({
  currentUser,
  unreadCount,
  notifications,
  loadNotifications,
  markNotificationsReadAll
}: Props) {
  const navigate = useNavigate();
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);

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

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        px: 3,
        height: 64,
        borderBottom: "1px solid #27272a",
        bgcolor: "rgba(5,5,9,0.48)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center"
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: "100%" }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            sx={{ cursor: "pointer" }}
            onClick={() => navigate("/feed")}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "14px",
                bgcolor: "rgba(13,242,89,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <MSym name="terminal" sx={{ fontSize: 20, color: "#19e66b" }} />
            </Box>
            <Typography sx={{ color: "#fff", fontSize: 18, fontWeight: 700, letterSpacing: -0.2 }}>
              OpenCollab
            </Typography>
          </Stack>
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
            <Box sx={{ px: 1.5, pt: 1.25, pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
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
            <Typography sx={{ fontWeight: 500, fontSize: 14 }}>
              {currentUser?.login || "user"}
            </Typography>
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
      </Stack>
    </Box>
  );
}
