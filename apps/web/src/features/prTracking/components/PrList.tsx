// apps/web/src/features/prTracking/components/PrList.tsx
import { Box, Typography } from "@mui/material";
import type { PrTrackingItem } from "../types";
import PrCard from "./PrCard";

export default function PrList({
  items,
  onOpen
}: {
  items: PrTrackingItem[];
  onOpen: (id: string) => void;
}) {
  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {items.map((it) => (
        <PrCard key={it.id} item={it} onOpen={() => onOpen(it.id)} />
      ))}

      {items.length === 0 && (
        <Box sx={{ p: 3, borderRadius: 3, border: "1px solid rgba(255,255,255,0.10)", bgcolor: "rgba(255,255,255,0.04)" }}>
          <Typography sx={{ fontWeight: 900, color: "#fff" }}>No PRs match your filters.</Typography>
          <Typography sx={{ mt: 0.5, color: "#9ca3af", fontWeight: 650, fontSize: 13 }}>
            Try resetting filters or search by repo name.
          </Typography>
        </Box>
      )}
    </Box>
  );
}