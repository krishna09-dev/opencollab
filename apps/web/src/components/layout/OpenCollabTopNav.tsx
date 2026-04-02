import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Badge,
  Box,
  Button,
  IconButton,
  InputBase,
  Paper,
  Stack,
  Typography
} from "@mui/material";

type CurrentUser = {
  id: string;
  login: string;
  email?: string;
  avatarUrl?: string;
};

function MSym({ name, sx }: { name: string; sx?: any }) {
  return (
    <Box
      component="span"
      className="material-symbols-outlined"
      sx={{
        fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24',
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...sx
      }}
    >
      {name}
    </Box>
  );
}

export default function OpenCollabTopNav({
  currentUser,
  unreadCount,
  onSearchClick,
  rightPrimary
}: {
  currentUser: CurrentUser | null;
  unreadCount: number;
  onSearchClick?: () => void;
  rightPrimary?: React.ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <Box
      component="header"
      sx={{
        position: "relative",
        top: 0,
        zIndex: 50,
        px: 3,
        py: 1.5,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)"
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={3}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ cursor: "pointer" }}
            onClick={() => navigate("/feed")}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                border: "1px solid rgba(25,230,107,0.35)",
                bgcolor: "rgba(17,17,26,0.35)",
                backdropFilter: "blur(14px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 25px rgba(0,0,0,0.35)"
              }}
            >
              <MSym name="terminal" sx={{ fontSize: 20, color: "#19e66b" }} />
            </Box>
            <Typography sx={{ color: "#fff", fontSize: 18, fontWeight: 700, letterSpacing: -0.2 }}>
              OpenCollab
            </Typography>
          </Stack>

          {/* Search */}
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Paper
              elevation={0}
              onClick={onSearchClick}
              sx={{
                width: 420,
                cursor: onSearchClick ? "pointer" : "default",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.08)",
                bgcolor: "#11111a",
                px: 1.5,
                py: 0.75,
                display: "flex",
                alignItems: "center",
                gap: 1,
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2)"
              }}
            >
              <MSym name="search" sx={{ fontSize: 20, color: "#6b7280" }} />
              <InputBase
                placeholder="Search issues, repos, users..."
                sx={{ color: "#cbd5e1", flex: 1, fontSize: 14 }}
                readOnly={!!onSearchClick}
              />
              <Box
                component="kbd"
                sx={{
                  border: "1px solid #374151",
                  borderRadius: 1,
                  px: 1,
                  fontSize: 12,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  color: "#6b7280"
                }}
              >
                ⌘K
              </Box>
            </Paper>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1.5}>
          {rightPrimary}

          <IconButton
            sx={{
              width: 36,
              height: 36,
              borderRadius: 999,
              color: "#9ca3af",
              "&:hover": { bgcolor: "rgba(255,255,255,0.10)", color: "#fff" }
            }}
          >
            <Badge
              variant={unreadCount > 0 ? "dot" : "standard"}
              color="success"
              overlap="circular"
              sx={{
                "& .MuiBadge-badge": {
                  bgcolor: "#19e66b",
                  border: "2px solid #0b0b10",
                  right: 10,
                  top: 10
                }
              }}
            >
              <MSym name="notifications" sx={{ fontSize: 22 }} />
            </Badge>
          </IconButton>

          <Button
            variant="text"
            sx={{
              borderRadius: 999,
              textTransform: "none",
              px: 1,
              py: 0.5,
              color: "#e5e7eb",
              "&:hover": { bgcolor: "rgba(255,255,255,0.10)" }
            }}
            startIcon={
              <Avatar
                src={currentUser?.avatarUrl}
                sx={{
                  width: 28,
                  height: 28,
                  background: "linear-gradient(135deg, #a855f7, #3b82f6)"
                }}
              />
            }
          >
            <Typography sx={{ fontSize: 14, fontWeight: 600, display: { xs: "none", sm: "block" } }}>
              {currentUser?.login || "user"}
            </Typography>
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}