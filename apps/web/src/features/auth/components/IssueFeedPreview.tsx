import { Box, Chip, Stack, Typography } from "@mui/material";
import MSym from "../../resources/components/MSym";

export default function IssueFeedPreview() {
  return (
    <Box
      sx={{
        height: { xs: "auto", md: 230 },
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.10)",
        bgcolor: "rgba(17,17,26,0.28)",
        backdropFilter: "blur(18px)",
        boxShadow: "0 35px 90px rgba(0,0,0,0.45)",
        px: 3,
        py: 3,
        position: "relative",
        overflow: "hidden"
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(600px 300px at 30% 20%, rgba(25,230,107,0.08), rgba(25,230,107,0) 60%)",
          opacity: 0.9,
          pointerEvents: "none"
        }}
      />

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ position: "relative", mb: 2 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ width: 7, height: 7, borderRadius: 999, bgcolor: "#19e66b" }} />
          <Typography sx={{ color: "rgba(229,231,235,0.75)", fontSize: 14 }}>
            Issues Feed
          </Typography>
        </Stack>
        <Typography sx={{ color: "rgba(229,231,235,0.40)", fontSize: 12 }}>
          Live
        </Typography>
      </Stack>

      {/* Highlight item */}
      <Box
        sx={{
          position: "relative",
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.10)",
          bgcolor: "rgba(12,12,18,0.55)",
          px: 2,
          py: 1.5,
          mb: 2
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: 999, bgcolor: "#19e66b" }} />
          <Typography sx={{ color: "rgba(229,231,235,0.80)", fontSize: 13 }}>
            Refactor API Rate Limiter
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label="Good first issue"
            size="small"
            sx={{
              height: 18,
              borderRadius: 999,
              bgcolor: "rgba(25,230,107,0.15)",
              color: "#19e66b",
              fontSize: 11
            }}
          />
          <Typography sx={{ color: "rgba(229,231,235,0.40)", fontSize: 11 }}>
            #402 opened by @dev_alex
          </Typography>
        </Stack>
      </Box>

      {/* muted items */}
      <Stack spacing={1.4} sx={{ position: "relative" }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <MSym name="hotel_class" sx={{ fontSize: 14, color: "rgba(240,171,252,0.75)" }} />
            <Typography sx={{ color: "rgba(229,231,235,0.45)", fontSize: 13 }}>
              Update Tailwind Config
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, pl: 2.2 }}>
            <Chip
              label="Merged"
              size="small"
              sx={{
                height: 18,
                borderRadius: 999,
                bgcolor: "rgba(216,180,254,0.10)",
                color: "rgba(216,180,254,0.85)",
                fontSize: 11
              }}
            />
            <Typography sx={{ color: "rgba(229,231,235,0.28)", fontSize: 11 }}>
              #399 by @sarah_codes
            </Typography>
          </Stack>
        </Box>

        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 10, height: 10, borderRadius: 999, border: "1px solid rgba(255,255,255,0.15)" }} />
            <Typography sx={{ color: "rgba(229,231,235,0.22)", fontSize: 13 }}>
              Fix dark mode flicker
            </Typography>
          </Stack>
          <Typography sx={{ color: "rgba(229,231,235,0.18)", fontSize: 11, mt: 0.5, pl: 2.2 }}>
            #387 opened 2d ago
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
