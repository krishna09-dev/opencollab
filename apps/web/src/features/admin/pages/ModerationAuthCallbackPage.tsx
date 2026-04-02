import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, CircularProgress, Container, Paper, Typography } from "@mui/material";
import { api } from "../../../lib/api";

type UserSession = {
  id?: string;
  login?: string;
  role?: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: "GitHub sign in failed. Please try again.",
  github_profile_invalid: "GitHub did not return a valid profile for sign in."
};

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ModerationAuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const query = useQuery();

  useEffect(() => {
    const run = async () => {
      const callbackError = query.get("error") || "";
      if (callbackError) {
        setError(ERROR_MESSAGES[callbackError] || "Unable to complete moderation login.");
        return;
      }

      const tokenFromUrl = query.get("token");
      if (!tokenFromUrl) {
        setError("Missing token from GitHub callback.");
        return;
      }

      localStorage.setItem("oc_token", tokenFromUrl);
      localStorage.removeItem("oc_admin_token");
      localStorage.removeItem("oc_admin_user");

      try {
        const res = await api.get<UserSession>("/api/me", {
          headers: { Authorization: `Bearer ${tokenFromUrl}` }
        });

        const user = res.data;
        if (!user?.login || !user?.role) {
          throw new Error("Invalid moderation profile");
        }

        if (user.role !== "moderator" && user.role !== "admin") {
          setError("Your account does not have moderation access.");
          localStorage.removeItem("oc_token");
          return;
        }

        navigate(user.role === "moderator" ? "/moderator/analytics" : "/admin/analytics", {
          replace: true
        });
      } catch {
        localStorage.removeItem("oc_token");
        setError("Failed to verify moderation access after login.");
      }
    };

    run();
  }, [navigate, query]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#050509",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#f5f5f5"
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            bgcolor: "#0b0b12",
            borderRadius: 3,
            border: "1px solid #262636",
            textAlign: "center"
          }}
        >
          {error ? (
            <Alert
              severity="error"
              sx={{
                textAlign: "left",
                bgcolor: "rgba(239,68,68,0.12)",
                color: "#fca5a5",
                border: "1px solid rgba(239,68,68,0.3)",
                "& .MuiAlert-icon": { color: "#fca5a5" }
              }}
            >
              {error}
            </Alert>
          ) : (
            <>
              <CircularProgress sx={{ mb: 3 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Connecting to GitHub
              </Typography>
              <Typography variant="body2" sx={{ color: "#a0a0b5" }}>
                Verifying your moderation access and preparing the dashboard.
              </Typography>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
