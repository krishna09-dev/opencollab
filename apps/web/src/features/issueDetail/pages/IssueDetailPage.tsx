import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  GlobalStyles,
  Snackbar,
  Stack,
  Typography
} from "@mui/material";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useIssueDetail } from "../hooks/useIssueDetail";
import IssueDetailHeader from "../components/IssueDetailHeader";
import IssueTitleSection from "../components/IssueTitleSection";
import IssueBodyCard from "../components/IssueBodyCard";
import SetupInstructions from "../components/SetupInstructions";
import UpdatesSection from "../components/UpdatesSection";
import ContributionTimeline from "../components/ContributionTimeline";
import IssueStatusCard from "../components/IssueStatusCard";
import SuggestedResourcesCard from "../components/SuggestedResourcesCard";
import IssueActions from "../components/IssueActions";
import PrTrackingCard from "../components/PrTrackingCard";

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
    open: false,
    message: "",
    severity: "success"
  });

  const showToast = (message: string, severity: "success" | "error" | "info" = "success") =>
    setToast({ open: true, message, severity });

  const closeToast = () => setToast((p) => ({ ...p, open: false }));

  const { currentUser, loadingUser, unreadCount, loadNotifications } = useCurrentUser();

  const {
    issue,
    loadingIssue,
    error,
    claiming,
    aborting,
    refreshingStatus,
    isClaimedByMe,
    isClaimedByOther,
    isWatching,
    statusP,
    diffP,
    skills,
    outcomes,
    projectSetup,
    loadIssue,
    handleClaim,
    handleAbort,
    handleNotify,
    refreshStatusOnly
  } = useIssueDetail(id, currentUser, showToast, loadNotifications);

  const copyToClipboard = (value: string) => navigator.clipboard?.writeText(value).catch(console.error);

  const pageLoading = loadingIssue || loadingUser;

  return (
    <Box sx={{ minHeight: "100vh", width: "100%", bgcolor: "#0a080c", position: "relative", color: "#e5e7eb", fontFamily: '"poppins", sans-serif' }}>
      <GlobalStyles styles={{ body: { backgroundColor: "#0a080c" } }} />

      {/* Background blobs */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(900px 700px at 95% 2%, rgba(34,197,94,0.26), rgba(34,197,94,0) 60%),
            radial-gradient(900px 700px at 15% 10%, rgba(255,255,255,0.06), rgba(255,255,255,0) 60%)
          `
        }}
      />

      <IssueDetailHeader currentUser={currentUser} unreadCount={unreadCount} />

      <Container maxWidth={false} sx={{ maxWidth: 1440, py: 4, px: { xs: 2, md: 5, lg: 10 } }}>
        {pageLoading ? (
          <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Stack spacing={2} sx={{ minHeight: "50vh" }} alignItems="center" justifyContent="center">
            <Typography sx={{ color: "#fca5a5", fontWeight: 600 }}>{error}</Typography>
            <Button
              onClick={loadIssue}
              variant="outlined"
              sx={{ borderColor: "rgba(255,255,255,0.20)", color: "#fff", borderRadius: 999, textTransform: "none" }}
            >
              Retry
            </Button>
          </Stack>
        ) : !issue ? (
          <Typography>Issue not found.</Typography>
        ) : (
          <Stack direction={{ xs: "column", lg: "row" }} spacing={4} sx={{ alignItems: "flex-start" }}>
            {/* LEFT */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <IssueTitleSection
                issue={issue}
                statusP={statusP!}
                diffP={diffP}
                copyToClipboard={copyToClipboard}
              />

              <IssueBodyCard issue={issue} outcomes={outcomes} skills={skills} />

              <SetupInstructions
                issue={issue}
                projectSetup={projectSetup}
                copyToClipboard={copyToClipboard}
              />

              <UpdatesSection issue={issue} />

              <ContributionTimeline
                issue={issue}
                refreshingStatus={refreshingStatus}
                refreshStatusOnly={refreshStatusOnly}
              />
            </Box>

            {/* RIGHT */}
            <Box sx={{ width: { xs: "100%", lg: 276 }, flexShrink: 0, position: { xs: "static", lg: "sticky" }, top: 88 }}>
              <IssueStatusCard
                issue={issue}
                isClaimedByMe={isClaimedByMe}
                isClaimedByOther={isClaimedByOther}
                isWatching={isWatching}
                claiming={claiming}
                aborting={aborting}
                handleClaim={handleClaim}
                handleAbort={handleAbort}
                handleNotify={handleNotify}
              />

              <PrTrackingCard issueId={issue._id} showToast={showToast} />

              <SuggestedResourcesCard issue={issue} />

              <IssueActions issue={issue} copyToClipboard={copyToClipboard} />
            </Box>
          </Stack>
        )}
      </Container>

      <Snackbar open={toast.open} autoHideDuration={3500} onClose={closeToast} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={closeToast} severity={toast.severity} sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
