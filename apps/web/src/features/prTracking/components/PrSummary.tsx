// apps/web/src/features/prTracking/components/PrSummary.tsx
import { Box, Typography } from "@mui/material";
import type { PrStatus, PrTrackingItem } from "../types";

function count(items: PrTrackingItem[], status: PrStatus) {
  return items.filter((x) => x.status === status).length;
}

const statBoxSx = {
  p: 2,
  borderRadius: 3,
  border: "1px solid rgba(255,255,255,0.10)",
  bgcolor: "rgba(255,255,255,0.04)"
} as const;

export default function PrSummary({ items }: { items: PrTrackingItem[] }) {
  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
        <Box sx={statBoxSx}>
          <Typography sx={{ fontSize: 22, fontWeight: 950, color: "#fff", letterSpacing: -0.6 }}>
            {items.length}
          </Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#9ca3af" }}>
            Total PRs
          </Typography>
        </Box>

        <Box sx={statBoxSx}>
          <Typography sx={{ fontSize: 22, fontWeight: 950, color: "#fff", letterSpacing: -0.6 }}>
            {count(items, "PR_OPEN")}
          </Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#9ca3af" }}>
            PR_OPEN
          </Typography>
        </Box>

        <Box sx={statBoxSx}>
          <Typography sx={{ fontSize: 22, fontWeight: 950, color: "#fff", letterSpacing: -0.6 }}>
            {count(items, "MERGED")}
          </Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#9ca3af" }}>
            MERGED
          </Typography>
        </Box>

        <Box sx={statBoxSx}>
          <Typography sx={{ fontSize: 22, fontWeight: 950, color: "#fff", letterSpacing: -0.6 }}>
            {count(items, "CLOSED")}
          </Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#9ca3af" }}>
            CLOSED
          </Typography>
        </Box>
      </Box>

      <Box sx={{ ...statBoxSx, p: 2.25 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 950, color: "#fff" }}>Status rules</Typography>
          <Typography sx={{ fontWeight: 800, color: "#9ca3af", fontSize: 12 }}>Sprint 4</Typography>
        </Box>

        <Box sx={{ mt: 1.25, display: "grid", gap: 0.9, color: "#cbd5e1", fontWeight: 750, fontSize: 13 }}>
          <Box>• <b>PR_OPEN</b> — PR detected</Box>
          <Box>• <b>MERGED</b> — PR merged</Box>
          <Box>• <b>CLOSED</b> — PR closed</Box>
          <Box>• <b>ACCEPTED</b> — No PR yet</Box>
        </Box>

        <Typography sx={{ mt: 1.25, color: "rgba(255,255,255,0.45)", fontWeight: 700, fontSize: 12 }}>
          Worker sync (dummy): every 10–15 minutes. Manual refresh uses user token.
        </Typography>
      </Box>
    </Box>
  );
}