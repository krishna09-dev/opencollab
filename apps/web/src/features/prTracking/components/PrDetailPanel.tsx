// apps/web/src/features/prTracking/components/PrDetailPanel.tsx
import { Box, Button, Stack, Typography } from "@mui/material";
import type { PrTrackingItem } from "../types";
import MSym from "../../resources/components/MSym";

export default function PrDetailPanel({
  item,
  onRefresh,
  onSync
}: {
  item: PrTrackingItem;
  onRefresh: () => void;
  onSync: () => void;
}) {
  return (
    <Box>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 950, color: "#fff", letterSpacing: -0.3 }}>
            {item.title}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
            <Box sx={{ px: 1.2, height: 24, borderRadius: 999, border: "1px solid rgba(255,255,255,0.10)", bgcolor: "rgba(255,255,255,0.06)", fontSize: 11, fontWeight: 900 }}>
              {item.status}
            </Box>

            <Box sx={{ px: 1.2, height: 24, borderRadius: 999, border: "1px solid rgba(255,255,255,0.10)", bgcolor: "rgba(255,255,255,0.06)", fontSize: 11, fontWeight: 900 }}>
              Issue #{item.issueNumber}
            </Box>

            <Box sx={{ px: 1.2, height: 24, borderRadius: 999, border: "1px solid rgba(255,255,255,0.10)", bgcolor: "rgba(255,255,255,0.06)", fontSize: 11, fontWeight: 900 }}>
              {item.repoFullName}
            </Box>

            <Box
              component="a"
              href={item.prNumber ? `https://github.com/${item.repoFullName}/pull/${item.prNumber}` : `https://github.com/${item.repoFullName}`}
              target="_blank"
              rel="noreferrer"
              sx={{
                px: 1.2,
                height: 24,
                borderRadius: 999,
                border: "1px solid rgba(96,165,250,0.25)",
                bgcolor: "rgba(96,165,250,0.10)",
                color: "#bfdbfe",
                fontSize: 11,
                fontWeight: 950,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center"
              }}
            >
              Open on GitHub
            </Box>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Button
            onClick={onRefresh}
            startIcon={<MSym name="refresh" sx={{ fontSize: 18 }} />}
            sx={{
              height: 40,
              borderRadius: 999,
              px: 2.25,
              textTransform: "none",
              fontWeight: 900,
              bgcolor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#e5e7eb",
              "&:hover": { bgcolor: "rgba(255,255,255,0.10)" }
            }}
          >
            Refresh
          </Button>

          <Button
            onClick={onSync}
            startIcon={<MSym name="cached" sx={{ fontSize: 18 }} />}
            sx={{
              height: 40,
              borderRadius: 999,
              px: 2.5,
              textTransform: "none",
              fontWeight: 950,
              bgcolor: "#19e66b",
              color: "#001b0a",
              "&:hover": { bgcolor: "#22c55e" }
            }}
          >
            Sync Now
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}