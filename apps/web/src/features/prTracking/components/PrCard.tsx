// apps/web/src/features/prTracking/components/PrCard.tsx
import { Box, Button, Stack, Typography } from "@mui/material";
import type { PrTrackingItem, PrStatus } from "../types";
import MSym from "../../resources/components/MSym";

function statusChipSx(status: PrStatus) {
  if (status === "PR_OPEN")
    return { bgcolor: "rgba(96,165,250,0.10)", borderColor: "rgba(96,165,250,0.25)", color: "#bfdbfe" };
  if (status === "MERGED")
    return { bgcolor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.25)", color: "#bbf7d0" };
  if (status === "CLOSED")
    return { bgcolor: "rgba(239,68,68,0.10)", borderColor: "rgba(239,68,68,0.25)", color: "#fecaca" };
  return { bgcolor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.10)", color: "#e5e7eb" };
}

const chipBase = {
  height: 26,
  px: 1.2,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.10)",
  fontSize: 12,
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  gap: 0.75
} as const;

export default function PrCard({ item, onOpen }: { item: PrTrackingItem; onOpen: () => void }) {
  const isMerged = item.status === "MERGED";
  const isClosed = item.status === "CLOSED";

  const iconSx = isMerged
    ? { borderColor: "rgba(34,197,94,0.25)", bgcolor: "rgba(34,197,94,0.12)", color: "#bbf7d0" }
    : isClosed
    ? { borderColor: "rgba(239,68,68,0.25)", bgcolor: "rgba(239,68,68,0.10)", color: "#fecaca" }
    : { borderColor: "rgba(96,165,250,0.25)", bgcolor: "rgba(96,165,250,0.10)", color: "#bfdbfe" };

  return (
    <Box
      onClick={onOpen}
      sx={{
        cursor: "pointer",
        p: 2,
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.10)",
        bgcolor: "rgba(255,255,255,0.04)",
        transition: "0.15s ease",
        "&:hover": {
          bgcolor: "rgba(255,255,255,0.06)",
          borderColor: "rgba(255,255,255,0.14)",
          transform: "translateY(-1px)"
        }
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid",
            ...iconSx
          }}
        >
          <MSym name={isMerged ? "done_all" : isClosed ? "block" : "fork_right"} sx={{ fontSize: 20 }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 950,
              color: "#fff",
              letterSpacing: -0.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {item.title}
          </Typography>

          <Typography sx={{ mt: 0.5, fontSize: 13, fontWeight: 650, color: "#cbd5e1" }}>
            Repo: {item.repoFullName} • Issue #{item.issueNumber}
            {item.shortSummary ? ` • ${item.shortSummary}` : ""}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
            <Box sx={{ ...chipBase, border: "1px solid", ...statusChipSx(item.status) }}>{item.status}</Box>
            <Box sx={{ ...chipBase, bgcolor: "rgba(255,255,255,0.06)" }}>ACCEPTED</Box>

            {typeof item.messagesCount === "number" && (
              <Box sx={{ ...chipBase, height: 24, fontSize: 11, bgcolor: "rgba(255,255,255,0.06)" }}>
                💬 {item.messagesCount} messages
              </Box>
            )}

            {item.lastMessagePreview && (
              <Box
                sx={{
                  ...chipBase,
                  height: 24,
                  fontSize: 11,
                  bgcolor: "rgba(255,255,255,0.06)",
                  maxWidth: 260,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                Last: “{item.lastMessagePreview}”
              </Box>
            )}
          </Stack>
        </Box>

        <Stack spacing={1} alignItems="flex-end">
          <Box sx={{ ...chipBase, border: "1px solid", ...statusChipSx(item.status) }}>
            #{item.prNumber ?? "—"}
          </Box>
          <Typography sx={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>
            {item.updatedAtLabel || "Updated recently"}
          </Typography>

          <Button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            sx={{
              mt: 0.5,
              height: 34,
              borderRadius: 999,
              px: 2,
              textTransform: "none",
              fontWeight: 900,
              bgcolor: "rgba(25,230,107,0.12)",
              border: "1px solid rgba(25,230,107,0.25)",
              color: "#19e66b",
              "&:hover": { bgcolor: "rgba(25,230,107,0.16)" }
            }}
          >
            Track
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}