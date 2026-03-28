import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import MSym from "../../resources/components/MSym";
import { languageOptions, experienceOptions, interestOptions } from "../types";

function Dot({ color }: { color: string }) {
  return (
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: 999,
        bgcolor: color,
        flexShrink: 0
      }}
    />
  );
}

const pillBtnSx = (active: boolean) => ({
  height: 38,
  minHeight: 38,
  borderRadius: 8,
  px: 1.75,
  textTransform: "none" as const,
  fontSize: 14,
  fontWeight: 600,
  border: "1px solid",
  borderColor: active ? "rgba(34,197,94,0.55)" : "rgba(255,255,255,0.12)",
  bgcolor: active ? "rgba(34,197,94,0.16)" : "rgba(255,255,255,0.02)",
  color: active ? "#eafff1" : "#cbd5e1",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 1,
  lineHeight: 1,
  "& .MuiButton-startIcon, & .MuiButton-endIcon": { m: 0 },
  "&:hover": {
    bgcolor: active ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.05)",
    borderColor: active ? "rgba(34,197,94,0.75)" : "rgba(255,255,255,0.20)"
  }
});

const previewChipSx = {
  height: 36,
  minHeight: 36,
  px: 1.6,
  borderRadius: 8,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  whiteSpace: "nowrap",
  bgcolor: "rgba(34,197,94,0.18)",
  border: "1px solid rgba(34,197,94,0.40)",
  color: "#eafff1",
  fontWeight: 700
} as const;

type Props = {
  selectedLanguages: string[];
  selectedAreas: string[];
  experienceLevel: string;
  saving: boolean;
  setExperienceLevel: (value: string) => void;
  toggleLanguage: (label: string) => void;
  toggleArea: (label: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
};

export default function PreferencesForm({
  selectedLanguages,
  selectedAreas,
  experienceLevel,
  saving,
  setExperienceLevel,
  toggleLanguage,
  toggleArea,
  handleSubmit
}: Props) {
  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "none",
          bgcolor: "rgba(10,10,14,0.62)",
          p: { xs: 3, md: 3.75 },
          boxShadow: "0 35px 90px rgba(0,0,0,0.60)",
          outline: "none"
        }}
      >
        <Box component="form" onSubmit={handleSubmit}>
          <Typography sx={{ fontSize: 26, fontWeight: 900, color: "#fff", mb: 3 }}>
            Your coding preferences
          </Typography>

          <Stack spacing={5.5}>
            {/* Languages */}
            <Stack spacing={1.75}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontWeight: 800, color: "rgba(229,231,235,0.70)", fontSize: 14 }}>
                  Preferred languages / frameworks
                </Typography>
                <Typography sx={{ color: "rgba(229,231,235,0.40)", fontSize: 12 }}>
                  Pick one or more
                </Typography>
              </Stack>

              <Stack direction="row" flexWrap="wrap" gap={1.25}>
                {languageOptions.map((opt) => {
                  const active = selectedLanguages.includes(opt.label);
                  return (
                    <Button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleLanguage(opt.label)}
                      sx={pillBtnSx(active)}
                    >
                      <Dot color={opt.dot} />
                      {opt.label}
                    </Button>
                  );
                })}
              </Stack>
            </Stack>

            {/* Experience */}
            <Stack spacing={1.75}>
              <Typography sx={{ fontWeight: 800, color: "rgba(229,231,235,0.70)", fontSize: 14 }}>
                Experience level
              </Typography>

              <Stack direction="row" flexWrap="wrap" gap={1.25}>
                {experienceOptions.map((opt) => {
                  const active = experienceLevel === opt.value;
                  return (
                    <Button
                      key={opt.value}
                      type="button"
                      onClick={() => setExperienceLevel(opt.value)}
                      sx={pillBtnSx(active)}
                    >
                      {opt.label}
                    </Button>
                  );
                })}
              </Stack>
            </Stack>

            {/* Areas */}
            <Stack spacing={1.75}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontWeight: 800, color: "rgba(229,231,235,0.70)", fontSize: 14 }}>
                  Areas of interest
                </Typography>
                <Typography sx={{ color: "rgba(229,231,235,0.40)", fontSize: 12 }}>
                  Choose as many as you like
                </Typography>
              </Stack>

              <Stack direction="row" flexWrap="wrap" gap={1.25}>
                {interestOptions.map((opt) => {
                  const active = selectedAreas.includes(opt.label);
                  return (
                    <Button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleArea(opt.label)}
                      sx={pillBtnSx(active)}
                    >
                      {opt.label}
                    </Button>
                  );
                })}
              </Stack>
            </Stack>

            {/* Preview */}
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              <Typography
                sx={{
                  fontSize: 11,
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  color: "rgba(229,231,235,0.45)",
                  fontWeight: 800,
                }}
              >
                Live preview of your tags
              </Typography>

              <Stack direction="row" flexWrap="wrap" gap={1.1}>
                {selectedLanguages.map((x) => (
                  <Box key={x} sx={previewChipSx}>
                    {x}
                  </Box>
                ))}
                <Box sx={previewChipSx}>
                  {experienceOptions.find((e) => e.value === experienceLevel)?.label || "Beginner"}
                </Box>
                {selectedAreas.map((x) => (
                  <Box key={x} sx={previewChipSx}>
                    {x}
                  </Box>
                ))}
              </Stack>
            </Stack>

            {/* Save */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1.5 }}>
              <Button
                type="submit"
                disabled={saving}
                endIcon={<MSym name="arrow_forward" sx={{ fontSize: 20 }} />}
                sx={{
                  height: 54,
                  px: 3.75,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 900,
                  fontSize: 16,
                  bgcolor: "#31f26a",
                  color: "#06120a",
                  boxShadow: "0 20px 55px rgba(49,242,106,0.22)",
                  "&:hover": { bgcolor: "#22c55e" },
                  "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.10)", color: "rgba(229,231,235,0.45)" }
                }}
              >
                {saving ? "Saving..." : "Save & Continue"}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
