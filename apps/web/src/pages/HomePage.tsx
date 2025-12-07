// apps/web/src/pages/HomePage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, authHeaders } from "../lib/api";
import { Box, CircularProgress, Typography } from "@mui/material";

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

    // Check if this is first-time user (flag set in AuthCallback / Onboarding)
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

  // Clear the first–time flag after the first render
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
      <Typography variant="h4" sx={{ fontWeight: 600 }}>
        {headline}
      </Typography>
    </Box>
  );
}

export default HomePage;