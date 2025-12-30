import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import type { ResourceItem } from "../types";
import MSym from "./MSym";

function SourceChip({ item }: { item: ResourceItem }) {
  const source = item.source ?? (item.isOfficial ? "official" : "community");
  const status = item.status ?? "approved";

  // status chip only if not approved (future admin pages)
  const statusChip =
    status !== "approved" ? (
      <Chip
        size="small"
        label={status.toUpperCase()}
        sx={{
          height: 22,
          fontSize: 11,
          fontWeight: 900,
          borderRadius: 999,
          bgcolor:
            status === "pending"
              ? "rgba(245,158,11,0.14)"
              : "rgba(239,68,68,0.14)",
          color: status === "pending" ? "#fbbf24" : "#fca5a5",
          border:
            status === "pending"
              ? "1px solid rgba(245,158,11,0.25)"
              : "1px solid rgba(239,68,68,0.25)"
        }}
      />
    ) : null;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Chip
        size="small"
        label={source === "official" ? "OFFICIAL" : "COMMUNITY"}
        sx={{
          height: 22,
          fontSize: 11,
          fontWeight: 900,
          borderRadius: 999,
          bgcolor: source === "official" ? "rgba(25,230,107,0.12)" : "rgba(59,130,246,0.12)",
          color: source === "official" ? "#19e66b" : "#93c5fd",
          border:
            source === "official"
              ? "1px solid rgba(25,230,107,0.25)"
              : "1px solid rgba(59,130,246,0.25)"
        }}
      />
      {statusChip}
    </Stack>
  );
}

export default function ResourceCard({ item }: { item: ResourceItem }) {
  return (
    <Box
      sx={{
        borderRadius: 4,
        p: 2,
        bgcolor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
        display: "flex",
        flexDirection: "column",
        gap: 1.25
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <SourceChip item={item} />
        {item.isFeatured ? (
          <Chip
            size="small"
            label="FEATURED"
            sx={{
              height: 22,
              fontSize: 11,
              fontWeight: 900,
              borderRadius: 999,
              bgcolor: "rgba(255,255,255,0.06)",
              color: "#e5e7eb",
              border: "1px solid rgba(255,255,255,0.10)"
            }}
          />
        ) : null}
      </Stack>

      <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 15, lineHeight: 1.2 }}>
        {item.title}
      </Typography>

      <Typography sx={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.35 }}>
        {item.description}
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
        <Chip
          size="small"
          label={item.category}
          sx={{
            height: 22,
            fontSize: 11,
            fontWeight: 800,
            borderRadius: 999,
            bgcolor: "rgba(255,255,255,0.06)",
            color: "#e5e7eb",
            border: "1px solid rgba(255,255,255,0.10)"
          }}
        />
        <Chip
          size="small"
          label={item.difficulty.toUpperCase()}
          sx={{
            height: 22,
            fontSize: 11,
            fontWeight: 900,
            borderRadius: 999,
            bgcolor: "rgba(255,255,255,0.06)",
            color: "#e5e7eb",
            border: "1px solid rgba(255,255,255,0.10)"
          }}
        />
        {item.language ? (
          <Chip
            size="small"
            label={String(item.language)}
            sx={{
              height: 22,
              fontSize: 11,
              fontWeight: 900,
              borderRadius: 999,
              bgcolor: "rgba(255,255,255,0.06)",
              color: "#e5e7eb",
              border: "1px solid rgba(255,255,255,0.10)"
            }}
          />
        ) : null}
      </Stack>

      {!!item.tags?.length && (
        <Stack direction="row" spacing={0.75} flexWrap="wrap">
          {item.tags.slice(0, 4).map((t) => (
            <Chip
              key={t}
              size="small"
              label={t}
              sx={{
                height: 22,
                fontSize: 11,
                fontWeight: 800,
                borderRadius: 999,
                bgcolor: "rgba(255,255,255,0.04)",
                color: "#9ca3af",
                border: "1px solid rgba(255,255,255,0.08)"
              }}
            />
          ))}
        </Stack>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
        <Typography sx={{ fontSize: 12, color: "#6b7280" }}>{item.type.toUpperCase()}</Typography>

        <Button
          component="a"
          href={item.url}
          target="_blank"
          rel="noreferrer"
          endIcon={<MSym name="open_in_new" sx={{ fontSize: 18 }} />}
          sx={{
            height: 34,
            borderRadius: 999,
            px: 2,
            textTransform: "none",
            fontWeight: 900,
            bgcolor: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "#e5e7eb",
            "&:hover": { bgcolor: "rgba(255,255,255,0.10)" }
          }}
        >
          Open
        </Button>
      </Stack>
    </Box>
  );
}