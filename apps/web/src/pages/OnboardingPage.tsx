import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, authHeaders } from "../lib/api";
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Typography
} from "@mui/material";

const languageOptions = [
  { value: "javascript", label: "JavaScript" },
  { value: "react", label: "React" },
  { value: "nextjs", label: "Next.js" },
  { value: "python", label: "Python" }
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
  { value: "infra", label: "Infra / DevOps" },
  { value: "community", label: "Community / DX" }
];

function OnboardingPage() {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
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

    const preferredLanguages = selectedLanguages;
    const areasOfInterest = selectedAreas;

    try {
      await api.put(
        "/api/me/preferences",
        {
          preferredLanguages,
          experienceLevel,
          areasOfInterest
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

  const pillSx = (active: boolean) => ({
    borderRadius: 999,
    px: 2.5,
    py: 0.5,
    textTransform: "none" as const,
    fontSize: 14,
    fontWeight: 500,
    border: "1px solid",
    borderColor: active ? "rgba(148,163,253,0.9)" : "#3a3a4a",
    background: active
      ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
      : "transparent",
    color: active ? "#f9fafb" : "#f5f5f5",
    boxShadow: active
      ? "0 0 0 1px rgba(15,23,42,0.6), 0 10px 25px rgba(15,23,42,0.7)"
      : "none",
    "&:hover": {
      bgcolor: active ? "transparent" : "rgba(245,245,245,0.06)",
      borderColor: active ? "#6366f1" : "#505067"
    }
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#050509",
        color: "#f5f5f5",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Top bar – same as login */}
      <Box
        sx={{
          px: 4,
          py: 2,
          borderBottom: "1px solid #171720",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.5,
              bgcolor: "#ff6b3d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 800
            }}
          >
            OC
          </Box>
          <Typography variant="subtitle2" sx={{ letterSpacing: 1 }}>
            OPENCOLLAB
          </Typography>
        </Stack>
        <Typography variant="caption" sx={{ color: "#8d8da0" }}>
          Step 1 of 2 · Personalise your feed
        </Typography>
      </Box>

      <Container
        maxWidth="lg"
        sx={{
          flex: 1,
          py: { xs: 6, md: 10 },
          display: "flex",
          alignItems: "stretch"
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={6}
          sx={{
            width: "100%",
            alignItems: { md: "center" },
            justifyContent: { md: "space-between" }
          }}
        >
          {/* LEFT – text block */}
          <Box
            sx={{
              flex: 1,
              pr: { md: 4 },
              display: "flex",
              alignItems: "center"
            }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{
                  color: "#ff6b3d",
                  letterSpacing: 2,
                  mb: 2,
                  display: "block"
                }}
              >
                ONBOARDING
              </Typography>

              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  maxWidth: 520,
                  lineHeight: 1.1
                }}
              >
                Tell us how you code so we can{" "}
                <Box component="span" sx={{ color: "#ff6b3d" }}>
                  match the right issues.
                </Box>
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: "#a0a0b5",
                  maxWidth: 520,
                  mb: 3
                }}
              >
                Choose your main languages, experience level and areas of
                interest. We’ll use this to recommend GitHub issues that feel
                like a good fit for you.
              </Typography>

              <Stack spacing={1.1} sx={{ color: "#c0c0d0", fontSize: 14 }}>
                <Typography component="div">
                  • No public profile changes — this only lives inside
                  OpenCollab.
                </Typography>
                <Typography component="div">
                  • You can update these preferences anytime later.
                </Typography>
                <Typography component="div">
                  • Skipping this step may reduce the quality of suggestions.
                </Typography>
              </Stack>
            </Box>
          </Box>

          {/* RIGHT – card */}
          <Box
            sx={{
              flex: 1,
              pl: { md: 4 },
              display: "flex",
              alignItems: "center",
              justifyContent: { xs: "flex-start", md: "center" }
            }}
          >
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                maxWidth: 520,
                p: 4,
                bgcolor: "#0b0b12",
                borderRadius: 3,
                border: "1px solid #262636",
                color: "#f5f5f5" // default text inside card = white
              }}
            >
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  {/* Card heading */}
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ mb: 0.5, color: "#f5f5f5", fontWeight: 600 }}
                    >
                      Your coding preferences
                    </Typography>
                  </Box>

                  {/* Languages */}
                  <Stack spacing={1}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontSize: 13, color: "#f5f5f5", fontWeight: 500 }}
                    >
                      Preferred languages / frameworks
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        columnGap: 1.5,
                        rowGap: 1.5
                      }}
                    >
                      {languageOptions.map((opt) => {
                        const active = selectedLanguages.includes(opt.label);
                        return (
                          <Button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleLanguage(opt.label)}
                            sx={pillSx(active)}
                          >
                            {opt.label}
                          </Button>
                        );
                      })}
                    </Box>

                    <Typography
                      variant="caption"
                      sx={{ color: "#a0a0b5", mt: 0.5 }}
                    >
                      Pick one or more · tap again to unselect
                    </Typography>
                  </Stack>

                  {/* Experience */}
                  <Stack spacing={1}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontSize: 13, color: "#f5f5f5", fontWeight: 500 }}
                    >
                      Experience level
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        columnGap: 1.5,
                        rowGap: 1.5
                      }}
                    >
                      {experienceOptions.map((opt) => {
                        const active = experienceLevel === opt.value;
                        return (
                          <Button
                            key={opt.value}
                            type="button"
                            onClick={() => setExperienceLevel(opt.value)}
                            sx={pillSx(active)}
                          >
                            {opt.label}
                          </Button>
                        );
                      })}
                    </Box>
                  </Stack>

                  {/* Areas of interest */}
                  <Stack spacing={1}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontSize: 13, color: "#f5f5f5", fontWeight: 500 }}
                    >
                      Areas of interest
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        columnGap: 1.5,
                        rowGap: 1.5
                      }}
                    >
                      {interestOptions.map((opt) => {
                        const active = selectedAreas.includes(opt.label);
                        return (
                          <Button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleArea(opt.label)}
                            sx={pillSx(active)}
                          >
                            {opt.label}
                          </Button>
                        );
                      })}
                    </Box>

                    <Typography
                      variant="caption"
                      sx={{ color: "#a0a0b5", mt: 0.5 }}
                    >
                      Choose as many as you like
                    </Typography>
                  </Stack>

                  {/* Live preview */}
                  <Stack spacing={1}>
                    <Typography
                      variant="caption"
                      sx={{ color: "#f5f5f5", fontWeight: 500 }}
                    >
                      Live preview of your tags
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        columnGap: 1,
                        rowGap: 1
                      }}
                    >
                      {selectedLanguages.map((lang) => (
                        <Chip
                          key={lang}
                          size="small"
                          label={lang}
                          sx={{
                            bgcolor: "#1f1f2a",
                            color: "#f5f5f5"
                          }}
                        />
                      ))}
                      {selectedAreas.map((area) => (
                        <Chip
                          key={area}
                          size="small"
                          label={area}
                          sx={{
                            bgcolor: "#21141e",
                            color: "#f5f5f5"
                          }}
                        />
                      ))}
                    </Box>
                  </Stack>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      mt: 1
                    }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={saving}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: 999,
                        px: 3,
                        py: 1,
                        bgcolor: "#1f6feb",
                        "&:hover": { bgcolor: "#1158c7" }
                      }}
                    >
                      {saving ? "Saving…" : "Save & continue"}
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </Paper>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

export default OnboardingPage;