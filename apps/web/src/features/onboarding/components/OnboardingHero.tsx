import { Box, Stack, Typography } from "@mui/material";
import MSym from "../../resources/components/MSym";

const features = [
  {
    title: "Private & Secure",
    desc: "No public profile changes — this only lives inside OpenCollab.",
    icon: "lock"
  },
  {
    title: "Flexible Preferences",
    desc: "You can update these preferences anytime later from your settings.",
    icon: "tune"
  },
  {
    title: "Better Matches",
    desc: "Skipping this step may reduce the quality of suggestions.",
    icon: "auto_awesome"
  }
];

export default function OnboardingHero() {
  return (
    <Box sx={{ pt: { xs: 0, md: 3 } }}>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          px: 1.25,
          py: 0.5,
          borderRadius: 999,
          fontSize: 12,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "#f59e0b",
          border: "1px solid rgba(245,158,11,0.35)",
          bgcolor: "rgba(245,158,11,0.10)",
          mb: 2
        }}
      >
        ONBOARDING
      </Box>

      <Typography
        sx={{
          fontSize: { xs: 36, md: 44 },
          fontWeight: 900,
          lineHeight: 1.08,
          color: "#fff",
          maxWidth: 540
        }}
      >
        Tell us how you code so
        <br />
        we can{" "}
        <Box component="span" sx={{ color: "#22c55e" }}>
          match the right
        </Box>
        <br />
        <Box component="span" sx={{ color: "#22c55e" }}>
          issues.
        </Box>
      </Typography>

      <Typography
        sx={{
          mt: 2,
          color: "rgba(229,231,235,0.70)",
          fontSize: 16,
          lineHeight: 1.7,
          maxWidth: 520
        }}
      >
        Choose your main languages, experience level
        <br />
        and areas of interest. We'll use this to recommend
        <br />
        GitHub issues that feel like a good fit for you.
      </Typography>

      <Stack spacing={1.6} sx={{ mt: 4, maxWidth: 460 }}>
        {features.map((x) => (
          <Stack key={x.title} direction="row" spacing={1.6} alignItems="flex-start">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                border: "1px solid rgba(255,255,255,0.10)",
                bgcolor: "rgba(255,255,255,0.03)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(229,231,235,0.70)"
              }}
            >
              <MSym name={x.icon} sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>
                {x.title}
              </Typography>
              <Typography sx={{ color: "rgba(229,231,235,0.55)", fontSize: 12.5, mt: 0.25 }}>
                {x.desc}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
