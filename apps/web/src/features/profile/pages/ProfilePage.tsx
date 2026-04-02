import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography
} from "@mui/material";
import { Close } from "@mui/icons-material";
import AppLayout from "../../../components/layout/AppLayout";
import ProfileHeader from "../components/ProfileHeader";
import ProfileForm from "../components/ProfileForm";
import GitHubStats from "../components/GitHubStats";
import ContributionGraph from "../components/ContributionGraph";
import RecentActivity from "../components/RecentActivity";
import { useProfile } from "../hooks/useProfile";

export default function ProfilePage() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const {
    profile,
    loading,
    saving,
    error,
    success,
    email,
    setEmail,
    selectedLanguages,
    selectedAreas,
    experienceLevel,
    setExperienceLevel,
    toggleLanguage,
    toggleArea,
    handleSubmit,
    githubStats,
    githubStatsLoading,
    githubStatsError,
    contributionSource,
    setContributionSource,
    contributions,
    contributionsLoading,
    contributionsError,
    activities,
    activitiesLoading,
    activitiesError
  } = useProfile();

  return (
    <AppLayout activePage="profile">
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#050509",
          px: { xs: 2, md: 4 },
          py: 4
        }}
      >
        <Box sx={{ maxWidth: 800, mx: "auto" }}>
          {/* Page Title */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
            sx={{ mb: 4 }}
          >
            <Stack spacing={1}>
              <Typography
                sx={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#fff"
                }}
              >
                Your Profile
              </Typography>
              <Typography
                sx={{
                  fontSize: 15,
                  color: "#a1a1aa"
                }}
              >
                Manage your account settings and preferences
              </Typography>
            </Stack>

            <Button
              onClick={() => setEditDialogOpen(true)}
              sx={{
                textTransform: "none",
                borderRadius: "12px",
                border: "1px solid #27272a",
                color: "#fff",
                px: 2,
                minHeight: 40
              }}
            >
              Edit Profile
            </Button>
          </Stack>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress sx={{ color: "#19e66b" }} />
            </Box>
          ) : profile ? (
            <>
              <ProfileHeader profile={profile} />
              
              {/* GitHub Activity Stats */}
              <GitHubStats
                stats={githubStats}
                loading={githubStatsLoading}
                error={githubStatsError}
              />

              {/* Contribution Graph */}
              <ContributionGraph
                data={contributions}
                loading={contributionsLoading}
                error={contributionsError}
                source={contributionSource}
                onSourceChange={setContributionSource}
              />

              {/* Recent Activity */}
              <RecentActivity
                activities={activities}
                loading={activitiesLoading}
                error={activitiesError}
              />
            </>
          ) : (
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                color: "#a1a1aa"
              }}
            >
              <Typography>Unable to load profile. Please try again.</Typography>
            </Box>
          )}

          <Dialog
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                bgcolor: "#050509",
                border: "1px solid #27272a",
                borderRadius: "14px"
              }
            }}
          >
            <DialogTitle sx={{ color: "#fff", pr: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Edit Profile</Typography>
                <IconButton onClick={() => setEditDialogOpen(false)} sx={{ color: "#a1a1aa" }}>
                  <Close sx={{ fontSize: 20 }} />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent sx={{ pt: 0, pb: 2.5 }}>
              <ProfileForm
                email={email}
                setEmail={setEmail}
                selectedLanguages={selectedLanguages}
                selectedAreas={selectedAreas}
                experienceLevel={experienceLevel}
                saving={saving}
                error={error}
                success={success}
                embedded
                hideTitle
                setExperienceLevel={setExperienceLevel}
                toggleLanguage={toggleLanguage}
                toggleArea={toggleArea}
                handleSubmit={handleSubmit}
              />
            </DialogContent>
          </Dialog>
        </Box>
      </Box>
    </AppLayout>
  );
}
