import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api, authHeaders } from "../../../lib/api";
import { Box, CircularProgress, Typography, Paper, Container } from "@mui/material";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const query = useQuery();

  useEffect(() => {
    const run = async () => {
      const tokenFromUrl = query.get("token");

      if (!tokenFromUrl) {
        setError("Missing token from GitHub callback.");
        return;
      }

      localStorage.setItem("oc_token", tokenFromUrl);

      try {
        const res = await api.get("/api/me", { headers: authHeaders() });
        const user = res.data;

        const needsOnboarding =
          !user.preferredLanguages?.length &&
          !user.areasOfInterest?.length &&
          user.experienceLevel === "beginner";

        if (needsOnboarding) {
          localStorage.setItem("oc_first_time", "true");
          navigate("/onboarding", { replace: true });
        } else {
          navigate("/feed", { replace: true });
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch your profile after login.");
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
            <>
              <Typography variant="h6" sx={{ mb: 1, color: "#ff6b3d" }}>
                Something went wrong
              </Typography>
              <Typography variant="body2" sx={{ color: "#d0d0e0" }}>
                {error}
              </Typography>
            </>
          ) : (
            <>
              <CircularProgress sx={{ mb: 3 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Connecting to GitHub…
              </Typography>
              <Typography variant="body2" sx={{ color: "#a0a0b5" }}>
                We're verifying your GitHub account and loading your OpenCollab
                profile. This usually takes just a moment.
              </Typography>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default AuthCallbackPage;
