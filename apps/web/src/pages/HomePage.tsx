import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, authHeaders } from "../lib/api";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";

interface MeResponse {
  login: string;
}

function HomePage() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>("");
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("oc_token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const flag = localStorage.getItem("oc_first_time") === "true";
    setIsNewUser(flag);

    const run = async () => {
      try {
        const res = await api.get<MeResponse>("/api/me", {
          headers: authHeaders()
        });
        setUsername(res.data.login);
      } catch (err) {
        console.error(err);
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [navigate]);

  useEffect(() => {
    if (isNewUser) {
      localStorage.removeItem("oc_first_time");
    }
  }, [isNewUser]);

  if (loading) {
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
        <CircularProgress />
      </Box>
    );
  }

  const headline = isNewUser
    ? `This is the homepage — welcome, ${username}!`
    : `This is the homepage — welcome back, ${username}!`;

  const ISSUE_1 = 597;
  const ISSUE_2 = 602;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#050509",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#f5f5f5",
        px: 2
      }}
    >
      <Stack spacing={3} alignItems="center">
        <Typography variant="h4" sx={{ fontWeight: 600, textAlign: "center" }}>
          {headline}
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button
            variant="contained"
            onClick={() => navigate(`/issues/${ISSUE_1}`)}
            sx={{
              height: 44,
              px: 3,
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 900,
              bgcolor: "#19e66b",
              color: "#000",
              "&:hover": { bgcolor: "#22c55e" }
            }}
          >
            Issue 1 (#{ISSUE_1})
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate(`/issues/${ISSUE_2}`)}
            sx={{
              height: 44,
              px: 3,
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 900,
              borderColor: "rgba(255,255,255,0.25)",
              color: "#fff",
              "&:hover": { borderColor: "rgba(255,255,255,0.40)", bgcolor: "rgba(255,255,255,0.06)" }
            }}
          >
            Issue 2 (#{ISSUE_2})
          </Button>

          {/* ✅ NEW: Resources button */}
          <Button
            variant="outlined"
            onClick={() => navigate(`/resources`)}
            sx={{
              height: 44,
              px: 3,
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 900,
              borderColor: "rgba(25,230,107,0.35)",
              color: "#19e66b",
              bgcolor: "rgba(25,230,107,0.08)",
              "&:hover": { bgcolor: "rgba(25,230,107,0.12)", borderColor: "rgba(25,230,107,0.55)" }
            }}
          >
            Resources
          </Button>

          {/* ✅ NEW: PR Tracking button */}
        <Button
          variant="outlined"
          onClick={() => navigate(`/pr-tracking`)}
          sx={{
            height: 44,
            px: 3,
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 900,
            borderColor: "rgba(59,130,246,0.35)",
            color: "#93c5fd",
            bgcolor: "rgba(59,130,246,0.08)",
            "&:hover": { bgcolor: "rgba(59,130,246,0.12)", borderColor: "rgba(59,130,246,0.55)" }
          }}
        >
          PR Tracking
        </Button>
        </Stack>

        <Typography sx={{ color: "#9ca3af", fontSize: 13, textAlign: "center", maxWidth: 520 }}>
          Demo links to real GitHub issues for presentation, plus curated resources for beginners.
        </Typography>
      </Stack>
    </Box>
  );
}

export default HomePage;