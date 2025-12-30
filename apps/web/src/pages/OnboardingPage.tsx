import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, authHeaders } from "../lib/api";
import {
  Box,
  Button,
  Container,
  GlobalStyles,
  Paper,
  Stack,
  Typography
} from "@mui/material";

const languageOptions = [
  { value: "javascript", label: "JavaScript", dot: "#facc15" },
  { value: "react", label: "React", dot: "#38bdf8" },
  { value: "nextjs", label: "Next Js", dot: "#9ca3af" },
  { value: "python", label: "Python", dot: "#9ca3af" }
];

const experienceOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" }
];

const interestOptions = [
  { value: "frontend", label: "Frontend / UI" },
  { value: "backend", label: "Backend / APIs" },
  { value: "devtools", label: "Dev tools" },
  { value: "docs", label: "Documentation" },
  { value: "testing", label: "Testing / QA" },
  { value: "data", label: "Data / ML" },
  { value: "infra", label: "Infra / DevOps" }
];

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

function MSym({ name, sx }: { name: string; sx?: any }) {
  return (
    <Box
      component="span"
      className="material-symbols-outlined"
      sx={{
        fontVariationSettings: '"FILL" 0, "wght" 500, "GRAD" 0, "opsz" 24',
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...sx
      }}
    >
      {name}
    </Box>
  );
}

export default function OnboardingPage() {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["JavaScript", "React"]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(["Frontend / UI", "Backend / APIs"]);
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const toggleLanguage = (label: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const toggleArea = (label: string) => {
    setSelectedAreas((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(
        "/api/me/preferences",
        {
          preferredLanguages: selectedLanguages,
          experienceLevel,
          areasOfInterest: selectedAreas
        },
        { headers: authHeaders() }
      );
      navigate("/feed", { replace: true });
    } catch (err) {
      console.error(err);
      alert("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ✅ FIX: pill alignment + consistent height/padding
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

  // ✅ FIX: preview chips no clipping / centered
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#07070b",
        color: "#e5e7eb",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <GlobalStyles styles={{ body: { backgroundColor: "#07070b" } }} />

      {/* Background blobs */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(900px 700px at 85% 20%, rgba(34,197,94,0.26), rgba(34,197,94,0) 60%),
            radial-gradient(900px 700px at 15% 20%, rgba(255,255,255,0.06), rgba(255,255,255,0) 60%)
          `
        }}
      />

      {/* Brand */}
      <Box sx={{ position: "relative", zIndex: 1, pt: 4, px: { xs: 3, md: "120px" } }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 1.5,
              border: "1px solid rgba(34,197,94,0.35)",
              bgcolor: "rgba(11, 20, 15, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
            }}
          >
            <MSym name="terminal" sx={{ color: "#22c55e", fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>OpenCollab</Typography>
        </Stack>
      </Box>

      <Container
        maxWidth={false}
        sx={{
          position: "relative",
          zIndex: 1,
          px: { xs: 3, md: "120px" },
          pt: { xs: 6, md: 8 },
          pb: { xs: 8, md: 10 }
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1.1fr" },
            gap: { xs: 5, md: 8 },
            alignItems: "center"
          }}
        >
          {/* LEFT */}
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
              {[
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
              ].map((x) => (
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

          {/* RIGHT */}
          <Box>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                // ✅ remove “border container” look
                border: "none",
                bgcolor: "rgba(10,10,14,0.62)",
                // backdropFilter: "blur(16px)",
                p: { xs: 3, md: 3.75 },
                boxShadow: "0 35px 90px rgba(0,0,0,0.60)",
                outline: "none" // subtle glass edge (not boxy)
              }}
            >
              <Box component="form" onSubmit={handleSubmit}>
                <Typography sx={{ fontSize: 26, fontWeight: 900, color: "#fff", mb: 3 }}>
                  Your coding preferences
                </Typography>

                {/* ✅ more gaps between sections */}
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
        </Box>
      </Container>
    </Box>
  );
}