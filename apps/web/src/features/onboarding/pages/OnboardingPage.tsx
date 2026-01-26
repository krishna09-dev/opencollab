import { Box, Container, GlobalStyles } from "@mui/material";
import { useOnboarding } from "../hooks/useOnboarding";
import OnboardingBrand from "../components/OnboardingBrand";
import OnboardingHero from "../components/OnboardingHero";
import PreferencesForm from "../components/PreferencesForm";

export default function OnboardingPage() {
  const {
    selectedLanguages,
    selectedAreas,
    experienceLevel,
    saving,
    setExperienceLevel,
    toggleLanguage,
    toggleArea,
    handleSubmit
  } = useOnboarding();

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

      <OnboardingBrand />

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
          <OnboardingHero />

          <PreferencesForm
            selectedLanguages={selectedLanguages}
            selectedAreas={selectedAreas}
            experienceLevel={experienceLevel}
            saving={saving}
            setExperienceLevel={setExperienceLevel}
            toggleLanguage={toggleLanguage}
            toggleArea={toggleArea}
            handleSubmit={handleSubmit}
          />
        </Box>
      </Container>
    </Box>
  );
}
