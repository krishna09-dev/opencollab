import React from "react";
import { Box, Button, Chip, GlobalStyles, Stack, Typography } from "@mui/material";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

function GitHubMark({ size = 18 }: { size?: number }) {
  // GitHub icon (SVG) because Material Symbols does not include GitHub mark
  return (
    <Box
      component="span"
      sx={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
        <path
          fill="currentColor"
          d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
          0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52
          -.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2
          -3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82
          .64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08
          2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07
          -.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
        />
      </svg>
    </Box>
  );
}

function MSym({ name, sx }: { name: string; sx?: any }) {
  return (
    <Box
      component="span"
      className="material-symbols-outlined"
      sx={{
        fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24',
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...sx
      }}
    >
      {name}
    </Box>
  );
}

export default function LoginPage() {
  const handleGitHubLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/github`;
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        bgcolor: "#07070c",
        color: "#e5e7eb",
        fontFamily: '"Spline Sans", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Global page look */}
      <GlobalStyles
        styles={{
          body: { backgroundColor: "#07070c" }
        }}
      />

      {/* Background blobs (matches reference) */}
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
              radial-gradient(900px 900px at 70% 75%, rgba(25, 230, 107, 0.22), rgba(25, 230, 107, 0) 60%),
              radial-gradient(700px 500px at 15% 35%, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0) 60%)
            `,
            filter: "blur(20px)",
            opacity: 1
          }
        }}
      />

      {/* Top-left brand */}
      <Box
        component="header"
        sx={{
          position: "relative",
          zIndex: 2,
          px: { xs: 3, md: "120px" },
          pt: 4,
          display: "flex",
          alignItems: "center",
          gap: 1.5
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "10px",
            border: "1px solid rgba(25,230,107,0.35)",
            bgcolor: "rgba(17,17,26,0.35)",
            backdropFilter: "blur(14px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 25px rgba(0,0,0,0.35)"
          }}
        >
          <MSym name="terminal" sx={{ fontSize: 18, color: "#19e66b" }} />
        </Box>
        <Typography sx={{ fontWeight: 700, color: "#fff", letterSpacing: -0.2 }}>
          OpenCollab
        </Typography>
      </Box>

      {/* Center content */}
      <Box
        component="main"
        sx={{
          position: "relative",
          zIndex: 2,
          minHeight: "calc(100vh - 90px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 3, md: "120px" }
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "760px 440px" },
            justifyContent: "center",
            alignItems: "flex-start",
            gap: { xs: 3, md: 6 }
          }}
        >
          {/* Left glass card */}
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
              <Box component="span" sx={{ textDecoration: "underline", cursor: "pointer" }}>
                Terms
              </Box>{" "}
              •{" "}
              <Box component="span" sx={{ textDecoration: "underline", cursor: "pointer" }}>
                Privacy
              </Box>
            </Typography>
          </Box>

          {/* Right feed card */}
          <Box
            sx={{
              height: { xs: "auto", md: 230 },
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.10)",
              bgcolor: "rgba(17,17,26,0.28)",
              backdropFilter: "blur(18px)",
              boxShadow: "0 35px 90px rgba(0,0,0,0.45)",
              px: 3,
              py: 3,
              position: "relative",
              overflow: "hidden"
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(600px 300px at 30% 20%, rgba(25,230,107,0.08), rgba(25,230,107,0) 60%)",
                opacity: 0.9,
                pointerEvents: "none"
              }}
            />

            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ position: "relative", mb: 2 }}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box sx={{ width: 7, height: 7, borderRadius: 999, bgcolor: "#19e66b" }} />
                <Typography sx={{ color: "rgba(229,231,235,0.75)", fontSize: 14 }}>
                  Issues Feed
                </Typography>
              </Stack>
              <Typography sx={{ color: "rgba(229,231,235,0.40)", fontSize: 12 }}>
                Live
              </Typography>
            </Stack>

            {/* Highlight item */}
            <Box
              sx={{
                position: "relative",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.10)",
                bgcolor: "rgba(12,12,18,0.55)",
                px: 2,
                py: 1.5,
                mb: 2
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: 999, bgcolor: "#19e66b" }} />
                <Typography sx={{ color: "rgba(229,231,235,0.80)", fontSize: 13 }}>
                  Refactor API Rate Limiter
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label="Good first issue"
                  size="small"
                  sx={{
                    height: 18,
                    borderRadius: 999,
                    bgcolor: "rgba(25,230,107,0.15)",
                    color: "#19e66b",
                    fontSize: 11
                  }}
                />
                <Typography sx={{ color: "rgba(229,231,235,0.40)", fontSize: 11 }}>
                  #402 opened by @dev_alex
                </Typography>
              </Stack>
            </Box>

            {/* muted items */}
            <Stack spacing={1.4} sx={{ position: "relative" }}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MSym name="hotel_class" sx={{ fontSize: 14, color: "rgba(240,171,252,0.75)" }} />
                  <Typography sx={{ color: "rgba(229,231,235,0.45)", fontSize: 13 }}>
                    Update Tailwind Config
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, pl: 2.2 }}>
                  <Chip
                    label="Merged"
                    size="small"
                    sx={{
                      height: 18,
                      borderRadius: 999,
                      bgcolor: "rgba(216,180,254,0.10)",
                      color: "rgba(216,180,254,0.85)",
                      fontSize: 11
                    }}
                  />
                  <Typography sx={{ color: "rgba(229,231,235,0.28)", fontSize: 11 }}>
                    #399 by @sarah_codes
                  </Typography>
                </Stack>
              </Box>

              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: 999, border: "1px solid rgba(255,255,255,0.15)" }} />
                  <Typography sx={{ color: "rgba(229,231,235,0.22)", fontSize: 13 }}>
                    Fix dark mode flicker
                  </Typography>
                </Stack>
                <Typography sx={{ color: "rgba(229,231,235,0.18)", fontSize: 11, mt: 0.5, pl: 2.2 }}>
                  #387 opened 2d ago
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}