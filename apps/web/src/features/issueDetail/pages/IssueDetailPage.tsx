import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowBack } from "@mui/icons-material";
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
import AppLayout from "../../../components/layout/AppLayout";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useIssueDetail } from "../hooks/useIssueDetail";
import IssueTitleSection from "../components/IssueTitleSection";
import IssueBodyCard from "../components/IssueBodyCard";
import SetupInstructions from "../components/SetupInstructions";
import UpdatesSection from "../components/UpdatesSection";
import ContributionTimeline from "../components/ContributionTimeline";
import IssueStatusCard from "../components/IssueStatusCard";
import SuggestedResourcesCard from "../components/SuggestedResourcesCard";
import IssueActions from "../components/IssueActions";
import PrTrackingCard from "../components/PrTrackingCard";

type IssueDetailNavState = {
  fromPath?: string;
  fromPage?: "feed" | "resources" | "pr-tracking" | "good-first-issues" | "claimed-issues" | "saved" | "profile";
  fromLabel?: string;
};

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state ?? null) as IssueDetailNavState | null;
  const activePage = navState?.fromPage ?? "feed";

  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
    open: false,
    message: "",
    severity: "success"
  });

  const showToast = (message: string, severity: "success" | "error" | "info" = "success") =>
    setToast({ open: true, message, severity });

  const closeToast = () => setToast((p) => ({ ...p, open: false }));

  const {
    currentUser,
    loadingUser
  } = useCurrentUser();

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
    outcomes,
    projectSetup,
    loadIssue,
    handleClaim,
    handleAbort,
    handleNotify,
    refreshStatusOnly
  } = useIssueDetail(id, currentUser, showToast, async () => {});

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast("Copied to clipboard.", "success");
    } catch {
      showToast("Failed to copy to clipboard.", "error");
    }
  };

  const buildIssueShareUrl = (issueId: string) => {
    const configuredBaseUrl = String(import.meta.env.VITE_PUBLIC_APP_URL || "").trim();
    const baseUrl = (configuredBaseUrl || window.location.origin).replace(/\/+$/, "");
    return `${baseUrl}/issues/${issueId}`;
  };

  const pageLoading = loadingIssue || loadingUser;

  const fallbackPathByPage: Record<NonNullable<IssueDetailNavState["fromPage"]>, string> = {
    feed: "/feed",
    resources: "/resources",
    "pr-tracking": "/pr-tracking",
    "good-first-issues": "/good-first-issues",
    "claimed-issues": "/profile/claimed-issues",
    saved: "/saved",
    profile: "/profile"
  };

  const fallbackPath = navState?.fromPath || (navState?.fromPage ? fallbackPathByPage[navState.fromPage] : "/feed");
  const backLabel = navState?.fromLabel || (navState?.fromPage === "saved" ? "saved issues" : navState?.fromPage === "claimed-issues" ? "claimed issues" : "feed");

  const handleBack = () => {
    const historyState = window.history.state as { idx?: number } | null;
    if (typeof historyState?.idx === "number" && historyState.idx > 0) {
      navigate(-1);
      return;
    }
    navigate(fallbackPath, { replace: true });
  };

  return (
    <AppLayout activePage={activePage}>
      <Box sx={{ minHeight: "100%", width: "100%", bgcolor: "#0a080c", position: "relative", color: "#e5e7eb", fontFamily: '"poppins", sans-serif' }}>
        <GlobalStyles styles={{ body: { backgroundColor: "#050509" } }} />

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

        <Container maxWidth={false} sx={{ maxWidth: 1440, py: 4, px: { xs: 2, md: 5, lg: 10 } }}>
          <Button
            onClick={handleBack}
            startIcon={<ArrowBack sx={{ fontSize: 18 }} />}
            variant="outlined"
            sx={{
              mb: 2,
              borderColor: "rgba(255,255,255,0.20)",
              color: "#fff",
              borderRadius: 999,
              textTransform: "none",
              position: "relative",
              zIndex: 1
            }}
          >
            Back to {backLabel}
          </Button>

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
                  shareUrl={buildIssueShareUrl(issue._id)}
                />

                <IssueBodyCard issue={issue} outcomes={outcomes} />

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

                <PrTrackingCard issueId={issue._id} canSubmit={isClaimedByMe} showToast={showToast} onIssueUpdated={loadIssue} />

                <SuggestedResourcesCard />

                <IssueActions
                  issue={issue}
                  copyToClipboard={copyToClipboard}
                  shareUrl={buildIssueShareUrl(issue._id)}
                />
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
    </AppLayout>
  );
}
