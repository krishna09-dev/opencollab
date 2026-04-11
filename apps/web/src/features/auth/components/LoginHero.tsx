import { Box, Button, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import GitHubMark from "./GitHubMark";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export default function LoginHero() {
  const handleGitHubLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/github`;
  };

  return (
    <Box
      sx={{
        height: { xs: "auto", md: 300 },
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.10)",
        bgcolor: "rgba(17, 26, 18, 0.32)",
        backdropFilter: "blur(18px)",
        boxShadow: "0 35px 90px rgba(0,0,0,0.55)",
        position: "relative",
        overflow: "hidden",
        px: { xs: 3, md: 6 },
        py: { xs: 4, md: 5 },
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center"
      }}
    >
      {/* subtle inner highlight */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(600px 250px at 50% 0%, rgba(255,255,255,0.08), rgba(255,255,255,0) 60%)",
          opacity: 0.8,
          pointerEvents: "none"
        }}
      />

      <Typography
        sx={{
          position: "relative",
          color: "#fff",
          fontWeight: 800,
          letterSpacing: -0.8,
          fontSize: { xs: 34, md: 50 },
          lineHeight: 1.08,
          mb: 1.5
        }}
      >
        Welcome to OpenCollab
      </Typography>

      <Typography
        sx={{
          position: "relative",
          color: "rgba(229,231,235,0.70)",
          fontSize: 15,
          mb: 3
        }}
      >
        Sign in to get beginner-friendly issues matched to your skills.
      </Typography>

      <Button
        onClick={handleGitHubLogin}
        variant="contained"
        disableElevation
        sx={{
          position: "relative",
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

      <Typography
        sx={{
          position: "relative",
          mt: 2,
          color: "rgba(229,231,235,0.45)",
          fontSize: 12
        }}
      >
        No password needed. We create your account automatically.
      </Typography>

      {/* Divider line */}
      <Box
        sx={{
          position: "relative",
          width: "78%",
          height: 0.007,
          bgcolor: "rgba(255,255,255,0.08)",
          mt: 3,
          mb: 2.5
        }}
      />

      <Typography
        sx={{
          position: "relative",
          color: "rgba(229,231,235,0.45)",
          fontSize: 11
        }}
      >
        By continuing, you agree to{" "}
        <Box
          component={RouterLink}
          to="/terms"
          sx={{ textDecoration: "underline", color: "inherit", cursor: "pointer" }}
        >
          Terms and Conditions
        </Box>{" "}
        •{" "}
        <Box
          component={RouterLink}
          to="/privacy"
          sx={{ textDecoration: "underline", color: "inherit", cursor: "pointer" }}
        >
          Privacy Policy
        </Box>
      </Typography>
    </Box>
  );
}
