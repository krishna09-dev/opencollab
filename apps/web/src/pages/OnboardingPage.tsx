import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, authHeaders } from "../lib/api";
import {
  Box,
  Button,
  Chip,
  Container,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";

const experienceOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" }
];

function OnboardingPage() {
  const [languagesText, setLanguagesText] = useState("");
  const [areasText, setAreasText] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const preferredLanguages = languagesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const areasOfInterest = areasText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

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

  const previewTags = (text: string) =>
    text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);

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
      {/* Simple bar reusing OC brand */}
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
          sx={{ width: "100%" }}
        >
          {/* Left explainer */}
          <Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
            <Box>
              <Typography
                variant="overline"
                sx={{ color: "#ff6b3d", letterSpacing: 2, mb: 2, display: "block" }}
              >
                ONBOARDING
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, mb: 2, maxWidth: 440 }}
              >
                Tell us how you code so we can match the right issues.
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "#a0a0b5", maxWidth: 460, mb: 3 }}
              >
                We’ll use this to recommend tasks that fit your language
                preferences, experience level, and the areas of open source you
                actually care about.
              </Typography>

              <Stack spacing={1.2} sx={{ color: "#c0c0d0", fontSize: 14 }}>
                <Typography component="div">
                  • No public profile changes — this only lives inside OpenCollab.
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

          {/* Right form */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
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
                border: "1px solid #262636"
              }}
            >
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  <TextField
                    label="Preferred languages / frameworks"
                    variant="outlined"
                    fullWidth
                    value={languagesText}
                    onChange={(e) => setLanguagesText(e.target.value)}
                    helperText="Comma-separated · e.g. JavaScript, React, Python"
                    InputLabelProps={{ style: { color: "#c0c0d0" } }}
                    sx={{
                      "& .MuiInputBase-root": {
                        bgcolor: "#15151f",
                        color: "#f5f5f5"
                      }
                    }}
                  />

                  <TextField
                    select
                    label="Experience level"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    fullWidth
                    InputLabelProps={{ style: { color: "#c0c0d0" } }}
                    sx={{
                      "& .MuiInputBase-root": {
                        bgcolor: "#15151f",
                        color: "#f5f5f5"
                      }
                    }}
                  >
                    {experienceOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Areas of interest"
                    variant="outlined"
                    fullWidth
                    value={areasText}
                    onChange={(e) => setAreasText(e.target.value)}
                    helperText="Comma-separated · e.g. dev tools, docs, UI, testing"
                    InputLabelProps={{ style: { color: "#c0c0d0" } }}
                    sx={{
                      "& .MuiInputBase-root": {
                        bgcolor: "#15151f",
                        color: "#f5f5f5"
                      }
                    }}
                  />

                  {/* Live preview chips */}
                  <Stack spacing={1}>
                    <Typography variant="caption" sx={{ color: "#8d8da0" }}>
                      Live preview of your tags
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {previewTags(languagesText).map((lang) => (
                        <Chip
                          key={lang}
                          size="small"
                          label={lang}
                          sx={{
                            bgcolor: "#1f1f2a",
                            color: "#f5f5f5",
                            mr: 0.5,
                            mb: 0.5
                          }}
                        />
                      ))}
                      {previewTags(areasText).map((area) => (
                        <Chip
                          key={area}
                          size="small"
                          label={area}
                          sx={{
                            bgcolor: "#21141e",
                            color: "#f5f5f5",
                            mr: 0.5,
                            mb: 0.5
                          }}
                        />
                      ))}
                    </Stack>
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