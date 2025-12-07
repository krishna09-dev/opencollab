import { Box, Button, Stack, Typography, Chip } from "@mui/material";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

function LoginPage() {
  const handleGitHubLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/github`;
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        bgcolor: "#050509",
        color: "#f5f5f5",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Top bar */}
      <Box
        component="header"
        sx={{
          px: { xs: 2, md: 4 },
          py: 2,
          borderBottom: "1px solid #171720",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: "#ff6b3d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 800
            }}
          >
            OC
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 600, letterSpacing: 1 }} variant="subtitle1">
              OPENCOLLAB
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#8c8ca0", textTransform: "none" }}
            >
              Beginner-friendly GitHub issues
            </Typography>
          </Box>
        </Stack>

        <Chip
          label="No password — GitHub only"
          sx={{
            borderRadius: 999,
            borderColor: "#262636",
            bgcolor: "transparent",
            color: "#c0c0d0",
            fontSize: 12,
            px: 1.5,
            py: 0.25
          }}
          variant="outlined"
        />
      </Box>

      {/* Hero */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          px: { xs: 2, md: 6 },
          py: { xs: 6, md: 10 }
        }}
      >
        {/* Max width wrapper to center content */}
        <Box sx={{ width: "100%", maxWidth: 1200 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 6, md: 10 }}
            sx={{ width: "100%" }}
          >
            {/* Left copy */}
            <Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
              <Box>
                <Typography
                  variant="overline"
                  sx={{ color: "#ff6b3d", letterSpacing: 2, mb: 2, display: "block" }}
                >
                  WELCOME
                </Typography>

                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    lineHeight: 1.1,
                    mb: 2,
                    maxWidth: 520
                  }}
                >
                  Log in or create an account{" "}
                  <Box component="span" sx={{ color: "#ff6b3d" }}>
                    with GitHub in one click.
                  </Box>
                </Typography>

                <Typography
                  variant="body1"
                  sx={{ color: "#a0a0b5", maxWidth: 540, mb: 4 }}
                >
                  OpenCollab uses your GitHub profile to personalise issue
                  recommendations, track your pull requests, and show your
                  contribution history in one simple dashboard.
                </Typography>

                <Stack spacing={1} sx={{ color: "#c0c0d0", fontSize: 14 }}>
                  <Typography component="div">
                    • Read-only access to your public profile and repos.
                  </Typography>
                  <Typography component="div">
                    • No passwords stored, no email spam, no extra accounts.
                  </Typography>
                  <Typography component="div">
                    • Same familiar GitHub login flow you already use.
                  </Typography>
                </Stack>
              </Box>
            </Box>

            {/* Right card */}
            <Box
              sx={{
                flex: 0.9,
                display: "flex",
                alignItems: "center",
                justifyContent: { xs: "flex-start", md: "center" }
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 420,
                  bgcolor: "#0b0b12",
                  borderRadius: 3,
                  border: "1px solid #262636",
                  p: 3.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 3
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label="Log in"
                      sx={{
                        borderRadius: 999,
                        bgcolor: "#f5f5f5",
                        color: "#050509",
                        fontWeight: 600,
                        fontSize: 13
                      }}
                    />
                    <Chip
                      label="Create account"
                      sx={{
                        borderRadius: 999,
                        bgcolor: "transparent",
                        borderColor: "#303042",
                        color: "#c0c0d0",
                        fontSize: 13
                      }}
                      variant="outlined"
                    />
                  </Stack>
                </Stack>

                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Log in with GitHub
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#a0a0b5" }}>
                    Already contributed before? Connect the same GitHub and we’ll
                    restore your previous progress.
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleGitHubLogin}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 999,
                    py: 1.2,
                    fontSize: 15,
                    bgcolor: "#f5f5f5",
                    color: "#050509",
                    "&:hover": { bgcolor: "#e5e5e5" }
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 1
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        bgcolor: "#050509",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 800
                      }}
                    >
                      GH
                    </Box>
                    Continue with GitHub
                  </Box>
                </Button>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  sx={{ fontSize: 12, color: "#8d8da0" }}
                >
                  <Chip
                    label="Read-only permissions"
                    size="small"
                    sx={{
                      bgcolor: "transparent",
                      borderColor: "#2f2f3f",
                      color: "#b0b0c0",
                      borderRadius: 999,
                      fontSize: 11
                    }}
                    variant="outlined"
                  />
                  <Chip
                    label="No repo changes without your PR"
                    size="small"
                    sx={{
                      bgcolor: "transparent",
                      borderColor: "#2f2f3f",
                      color: "#b0b0c0",
                      borderRadius: 999,
                      fontSize: 11
                    }}
                    variant="outlined"
                  />
                </Stack>

                <Typography
                  variant="caption"
                  sx={{ color: "#717188", lineHeight: 1.6 }}
                >
                  You can revoke access anytime from your GitHub account settings.
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

export default LoginPage;