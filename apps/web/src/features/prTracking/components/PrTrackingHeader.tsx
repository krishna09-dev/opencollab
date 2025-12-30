// apps/web/src/features/prTracking/components/PrTrackingHeader.tsx
import { Avatar, Badge, Box, Button, IconButton, InputBase, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import MSym from "../../resources/components/MSym"; // ✅ reuse your existing MSym

type Props = {
  currentUser?: { login?: string; avatarUrl?: string } | null;
  unreadCount?: number;
  q: string;
  onChangeQ: (q: string) => void;
};

export default function PrTrackingHeader({ currentUser, unreadCount = 0, q, onChangeQ }: Props) {
  const navigate = useNavigate();

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        px: 3,
        py: 1.5,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        background: "rgba(11,11,16,0.55)"
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        {/* LEFT */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 260 }}>
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ cursor: "pointer" }} onClick={() => navigate("/feed")}>
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

            <Box>
              <Typography sx={{ color: "#fff", fontSize: 16, fontWeight: 800, letterSpacing: -0.2, lineHeight: 1.1 }}>
                OpenCollab
              </Typography>
              <Typography sx={{ color: "#9ca3af", fontSize: 12, fontWeight: 700 }}>
                PR Tracking
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Paper
              elevation={0}
              sx={{
                width: 420,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.08)",
                bgcolor: "#11111a",
                px: 1.5,
                py: 0.7,
                display: "flex",
                alignItems: "center",
                gap: 1,
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2)"
              }}
            >
              <MSym name="search" sx={{ fontSize: 20, color: "#6b7280" }} />
              <InputBase
                value={q}
                onChange={(e) => onChangeQ(e.target.value)}
                placeholder="Search PRs, repos, issues..."
                sx={{ color: "#cbd5e1", flex: 1, fontSize: 13, fontWeight: 650 }}
              />
              <Box
                component="kbd"
                sx={{
                  border: "1px solid #374151",
                  borderRadius: 1,
                  px: 1,
                  fontSize: 12,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  color: "#6b7280",
                  fontWeight: 900
                }}
              >
                ⌘K
              </Box>
            </Paper>
          </Box>
        </Stack>

        {/* RIGHT */}
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Button
            onClick={() => navigate("/pr-tracking")}
            startIcon={<MSym name="hub" sx={{ fontSize: 18 }} />}
            sx={{
              height: 40,
              px: 2.75,
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 900,
              bgcolor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#e5e7eb",
              "&:hover": { bgcolor: "rgba(255,255,255,0.10)" }
            }}
          >
            PRs
          </Button>

          {/* keep your resources button if you want */}
          <Button
            onClick={() => navigate("/resources")}
            startIcon={<MSym name="library_books" sx={{ fontSize: 18 }} />}
            sx={{
              height: 40,
              px: 2.75,
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 900,
              bgcolor: "rgba(25,230,107,0.12)",
              border: "1px solid rgba(25,230,107,0.25)",
              color: "#19e66b",
              "&:hover": { bgcolor: "rgba(25,230,107,0.16)" }
            }}
          >
            Resources
          </Button>

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
            <Typography sx={{ fontSize: 13, fontWeight: 800, display: { xs: "none", sm: "block" } }}>
              {currentUser?.login || "user"}
            </Typography>
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}