import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import MSym from "../../resources/components/MSym";
import type { CurrentUser } from "../types";

type Props = {
  currentUser: CurrentUser | null;
  unreadCount: number;
};

export default function IssueDetailHeader({ currentUser, unreadCount }: Props) {
  const navigate = useNavigate();

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
          <IconButton sx={{ color: "#a1a1aa" }}>
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
          <IconButton sx={{ color: "#a1a1aa" }}>
            <MSym name="add_circle" sx={{ fontSize: 19 }} />
          </IconButton>
          <Divider orientation="vertical" flexItem sx={{ borderColor: "#27272a", mx: 0.5 }} />
          <Button
            sx={{ textTransform: "none", color: "#fff", borderRadius: "14px", px: 1, minWidth: 0, gap: 1, "&:hover": { bgcolor: "rgba(255,255,255,0.06)" } }}
            startIcon={<Avatar src={currentUser?.avatarUrl} sx={{ width: 32, height: 32 }} />}
            endIcon={<MSym name="keyboard_arrow_down" sx={{ color: "#a1a1aa", fontSize: 18 }} />}
          >
            <Typography sx={{ fontWeight: 500, fontSize: 14 }}>
              {currentUser?.login || "user"}
            </Typography>
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
