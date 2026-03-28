import { useNavigate } from "react-router-dom";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import MSym from "../../resources/components/MSym";
import type { PrTrackingItem, PrDisplayStatus } from "../../prTracking/types";

function getStatusColor(status: PrDisplayStatus | undefined) {
  switch (status) {
    case "MERGED":
      return { color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)" };
    case "IN_REVIEW":
      return { color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.2)" };
    case "CHANGES_REQUESTED":
      return { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)" };
    default:
      return { color: "#a1a1aa", bg: "rgba(161,161,170,0.1)", border: "rgba(161,161,170,0.2)" };
  }
}

function getStatusLabel(status: PrDisplayStatus | undefined) {
  switch (status) {
    case "MERGED":
      return "Merged";
    case "IN_REVIEW":
      return "In Review";
    case "CHANGES_REQUESTED":
      return "Changes Requested";
    default:
      return "Open";
  }
}

export default function HomePrCard({ item }: { item: PrTrackingItem }) {
  const navigate = useNavigate();
  const statusColor = getStatusColor(item.displayStatus);
  const isMerged = item.displayStatus === "MERGED";

  return (
    <Box
      sx={{
        p: 2.6,
        borderRadius: "20px",
        border: "1px solid #27272a",
        bgcolor: isMerged ? "rgba(11,15,23,0.6)" : "#0b0f17",
        opacity: isMerged ? 0.85 : 1,
        cursor: "pointer",
        transition: "border-color 0.2s",
        "&:hover": { borderColor: "#3f3f46" }
      }}
      onClick={() => navigate(`/pr-tracking/${item.id}`)}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: statusColor.bg,
            border: `1px solid ${statusColor.border}`,
            mt: 0.3
          }}
        >
          <MSym name="fork_right" sx={{ color: statusColor.color, fontSize: 20 }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 12,
              color: "#a1a1aa",
              mb: 0.7,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
            }}
          >
            {item.repoFullName} • PR #{item.prNumber || "—"} • {item.updatedAtLabel || ""}
          </Typography>
          <Typography
            sx={{
              fontSize: 30 / 1.6,
              fontWeight: 600,
              lineHeight: "28px",
              mb: 0.8,
              color: isMerged ? "rgba(255,255,255,0.8)" : "#fff"
            }}
          >
            {item.title}
          </Typography>
          {item.shortSummary && (
            <Typography
              sx={{
                fontSize: 14,
                color: "#a1a1aa",
                lineHeight: "22px",
                mb: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              }}
            >
              {item.shortSummary}
            </Typography>
          )}

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip
              label={getStatusLabel(item.displayStatus)}
              sx={{
                height: 26,
                borderRadius: "8px",
                fontWeight: 600,
                color: statusColor.color,
                bgcolor: statusColor.bg,
                border: `1px solid ${statusColor.border}`,
                ".MuiChip-label": { px: 1.1, fontSize: 12 }
              }}
            />
            {item.primaryLanguage && (
              <Chip
                label={item.primaryLanguage}
                sx={{
                  height: 26,
                  borderRadius: "8px",
                  fontWeight: 500,
                  color: "#a1a1aa",
                  bgcolor: "rgba(161,161,170,0.1)",
                  border: "1px solid rgba(161,161,170,0.2)",
                  ".MuiChip-label": { px: 1.1, fontSize: 12 }
                }}
              />
            )}
          </Stack>
        </Box>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/pr-tracking/${item.id}`);
          }}
          sx={{
            minHeight: 36,
            textTransform: "none",
            borderRadius: "14px",
            px: 2,
            fontSize: 14,
            fontWeight: 600,
            bgcolor: "#60a5fa",
            color: "#000",
            boxShadow: "0 0 10px rgba(96,165,250,0.2)",
            whiteSpace: "nowrap",
            "&:hover": { bgcolor: "#3b82f6" }
          }}
        >
          View PR
        </Button>
      </Stack>
    </Box>
  );
}
