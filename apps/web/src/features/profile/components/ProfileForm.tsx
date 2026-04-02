import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import MSym from "../../resources/components/MSym";
import { languageOptions, experienceOptions, interestOptions } from "../../onboarding/types";

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

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "rgba(255,255,255,0.02)",
    borderRadius: 2,
    color: "#fff",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.12)"
    },
    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.20)"
    },
    "&.Mui-focused fieldset": {
      borderColor: "rgba(34,197,94,0.55)"
    }
  },
  "& .MuiInputLabel-root": {
    color: "#a1a1aa",
    "&.Mui-focused": {
      color: "#19e66b"
    }
  }
};

type Props = {
  email: string;
  setEmail: (value: string) => void;
  selectedLanguages: string[];
  selectedAreas: string[];
  experienceLevel: string;
  saving: boolean;
  error: string | null;
  success: boolean;
  embedded?: boolean;
  hideTitle?: boolean;
  setExperienceLevel: (value: "beginner" | "intermediate" | "advanced") => void;
  toggleLanguage: (label: string) => void;
  toggleArea: (label: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
};

export default function ProfileForm({
  email,
  setEmail,
  selectedLanguages,
  selectedAreas,
  experienceLevel,
  saving,
  error,
  success,
  embedded = false,
  hideTitle = false,
  setExperienceLevel,
  toggleLanguage,
  toggleArea,
  handleSubmit
}: Props) {
  const content = (
    <Box component="form" onSubmit={handleSubmit}>
      {!hideTitle && (
        <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#fff", mb: 3 }}>
          Edit Profile
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, bgcolor: "rgba(248,113,113,0.1)", color: "#f87171" }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3, bgcolor: "rgba(34,197,94,0.1)", color: "#19e66b" }}>
          Profile saved successfully!
        </Alert>
      )}

      <Stack spacing={4}>
        {/* Email */}
        <Stack spacing={1.5}>
          <Typography sx={{ fontWeight: 700, color: "rgba(229,231,235,0.70)", fontSize: 14 }}>
            Email
          </Typography>
          <TextField
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            fullWidth
            size="small"
            sx={textFieldSx}
          />
        </Stack>

        {/* Languages */}
        <Stack spacing={1.75}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ fontWeight: 700, color: "rgba(229,231,235,0.70)", fontSize: 14 }}>
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
          <Typography sx={{ fontWeight: 700, color: "rgba(229,231,235,0.70)", fontSize: 14 }}>
            Experience level
          </Typography>

          <Stack direction="row" flexWrap="wrap" gap={1.25}>
            {experienceOptions.map((opt) => {
              const active = experienceLevel === opt.value;
              return (
                <Button
                  key={opt.value}
                  type="button"
                  onClick={() => setExperienceLevel(opt.value as "beginner" | "intermediate" | "advanced")}
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
            <Typography sx={{ fontWeight: 700, color: "rgba(229,231,235,0.70)", fontSize: 14 }}>
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

        {/* Save Button */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 2 }}>
          <Button
            type="submit"
            disabled={saving}
            endIcon={<MSym name="check" sx={{ fontSize: 20 }} />}
            sx={{
              height: 48,
              px: 3.5,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
              fontSize: 15,
              bgcolor: "#31f26a",
              color: "#06120a",
              boxShadow: "0 15px 40px rgba(49,242,106,0.20)",
              "&:hover": { bgcolor: "#22c55e" },
              "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.10)", color: "rgba(229,231,235,0.45)" }
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );

  if (embedded) {
    return content;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid #27272a",
        bgcolor: "rgba(10,10,14,0.62)",
        p: { xs: 3, md: 4 }
      }}
    >
      {content}
    </Paper>
  );
}
