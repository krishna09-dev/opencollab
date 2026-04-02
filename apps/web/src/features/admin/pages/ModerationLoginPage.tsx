import { Alert, Box, Button, GlobalStyles, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";
import GitHubMark from "../../auth/components/GitHubMark";
import LoginBrand from "../../auth/components/LoginBrand";
import { API_BASE_URL } from "../../../lib/api";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: "GitHub sign in failed. Please try again.",
  github_profile_invalid: "GitHub did not return a valid profile for sign in."
};

export default function ModerationLoginPage() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const errorCode = query.get("error") || "";
  const errorMessage = errorCode
    ? ERROR_MESSAGES[errorCode] || "Unable to sign in for moderation."
    : null;

  const handleGitHubLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/admin/github`;
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        bgcolor: "#07070c",
        color: "#e5e7eb",
        fontFamily:
          '"Spline Sans", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
        position: "relative",
        overflow: "hidden"
      }}
    >
      <GlobalStyles styles={{ body: { backgroundColor: "#07070c" } }} />

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          "&:before": {
            content: '""',
            position: "absolute",
            inset: "-20%",
            background: `
              radial-gradient(900px 900px at 70% 75%, rgba(56, 189, 248, 0.20), rgba(56, 189, 248, 0) 60%),
              radial-gradient(700px 500px at 15% 35%, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0) 60%)
            `,
            filter: "blur(20px)",
            opacity: 1
          }
        }}
      />

      <LoginBrand />

      <Box
        component="main"
        sx={{
          position: "relative",
          zIndex: 2,
          minHeight: "calc(100vh - 90px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 3
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 640,
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.10)",
            bgcolor: "rgba(10, 20, 26, 0.45)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 35px 90px rgba(0,0,0,0.55)",
            px: { xs: 3, md: 5 },
            py: { xs: 4, md: 5 },
            textAlign: "center"
          }}
        >
          <Typography
            sx={{
              color: "#fff",
              fontWeight: 800,
              letterSpacing: -0.8,
              fontSize: { xs: 30, md: 44 },
              lineHeight: 1.1,
              mb: 1.5
            }}
          >
            OpenCollab Moderation
          </Typography>

          <Typography sx={{ color: "rgba(229,231,235,0.72)", fontSize: 15, mb: 3 }}>
            Sign in with GitHub to access moderation tools and review community activity.
          </Typography>

          {errorMessage && (
            <Alert
              severity="error"
              sx={{
                mb: 2.5,
                textAlign: "left",
                bgcolor: "rgba(239,68,68,0.12)",
                color: "#fca5a5",
                border: "1px solid rgba(239,68,68,0.3)",
                "& .MuiAlert-icon": { color: "#fca5a5" }
              }}
            >
              {errorMessage}
            </Alert>
          )}

          <Button
            onClick={handleGitHubLogin}
            variant="contained"
            disableElevation
            sx={{
              bgcolor: "#f5f5f7",
              color: "#0b0b10",
              borderRadius: 999,
              px: 3.2,
              py: 1.15,
              fontWeight: 700,
              textTransform: "none",
              boxShadow: "0 14px 35px rgba(0,0,0,0.35)",
              "&:hover": { bgcolor: "#ffffff" }
            }}
            startIcon={
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  bgcolor: "rgba(0,0,0,0.06)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: 0.25,
                  color: "#0b0b10"
                }}
              >
                <GitHubMark size={16} />
              </Box>
            }
          >
            Continue with GitHub
          </Button>

          <Typography sx={{ mt: 2.5, color: "rgba(229,231,235,0.50)", fontSize: 12 }}>
            Use any GitHub account to continue to moderation.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
