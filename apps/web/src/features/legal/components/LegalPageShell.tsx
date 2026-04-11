import { Box, Button, Container, GlobalStyles, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type LegalPageShellProps = {
  currentPath: "privacy" | "terms";
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export default function LegalPageShell({
  currentPath,
  title,
  subtitle,
  lastUpdated,
  sections
}: LegalPageShellProps) {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#0b0f17",
        color: "#e2e8f0",
        fontFamily: '"Inter", sans-serif',
        position: "relative",
        overflowX: "clip"
      }}
    >
      <GlobalStyles styles={{ body: { margin: 0, backgroundColor: "#0b0f17", color: "#e2e8f0" } }} />

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(700px 520px at 16% 8%, rgba(25,230,107,0.12), transparent 70%), radial-gradient(900px 580px at 84% 78%, rgba(59,130,246,0.12), transparent 72%)"
        }}
      />

      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(11,15,23,0.78)",
          borderBottom: "1px solid rgba(148,163,184,0.18)"
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            maxWidth: "1220px !important",
            py: 2,
            px: { xs: 2.5, md: 4 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2
          }}
        >
          <Typography
            component={RouterLink}
            to="/"
            sx={{
              textDecoration: "none",
              color: "#f8fafc",
              fontWeight: 700,
              letterSpacing: -0.3,
              fontSize: 20
            }}
          >
            OpenCollab
          </Typography>

          <Stack direction="row" spacing={1.25}>
            <Button
              component={RouterLink}
              to="/terms"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 999,
                px: 2,
                color: currentPath === "terms" ? "#062312" : "#cbd5e1",
                bgcolor: currentPath === "terms" ? "#19e66b" : "rgba(30,41,59,0.7)",
                border: "1px solid rgba(71,85,105,0.35)",
                "&:hover": {
                  bgcolor: currentPath === "terms" ? "#4ff49a" : "rgba(51,65,85,0.9)"
                }
              }}
            >
              Terms
            </Button>

            <Button
              component={RouterLink}
              to="/privacy"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 999,
                px: 2,
                color: currentPath === "privacy" ? "#062312" : "#cbd5e1",
                bgcolor: currentPath === "privacy" ? "#19e66b" : "rgba(30,41,59,0.7)",
                border: "1px solid rgba(71,85,105,0.35)",
                "&:hover": {
                  bgcolor: currentPath === "privacy" ? "#4ff49a" : "rgba(51,65,85,0.9)"
                }
              }}
            >
              Privacy
            </Button>

            <Button
              component={RouterLink}
              to="/login"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 999,
                px: 2,
                color: "#cbd5e1",
                border: "1px solid rgba(71,85,105,0.35)",
                "&:hover": {
                  bgcolor: "rgba(51,65,85,0.35)"
                }
              }}
            >
              Login
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container
        maxWidth="xl"
        sx={{
          position: "relative",
          zIndex: 2,
          maxWidth: "1220px !important",
          px: { xs: 2.5, md: 4 },
          py: { xs: 5, md: 8 }
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: "28px",
            border: "1px solid rgba(71,85,105,0.35)",
            bgcolor: "rgba(10,14,22,0.78)",
            backdropFilter: "blur(10px)",
            p: { xs: 3, md: 4 }
          }}
        >
          <Typography
            sx={{
              color: "#19e66b",
              fontWeight: 700,
              letterSpacing: 0.9,
              textTransform: "uppercase",
              fontSize: 12
            }}
          >
            Legal
          </Typography>
          <Typography
            sx={{
              mt: 1,
              fontFamily: '"Manrope", sans-serif',
              fontWeight: 800,
              color: "#f8fafc",
              letterSpacing: -0.7,
              fontSize: { xs: "clamp(2rem, 8vw, 2.7rem)", md: "clamp(2.7rem, 4vw, 3.3rem)" }
            }}
          >
            {title}
          </Typography>
          <Typography sx={{ mt: 1.2, color: "#94a3b8", maxWidth: 860, fontSize: { xs: 15, md: 17 }, lineHeight: 1.7 }}>
            {subtitle}
          </Typography>
          <Typography sx={{ mt: 2.3, color: "#64748b", fontSize: 13 }}>
            Last updated: {lastUpdated}
          </Typography>
        </Paper>

        <Stack spacing={2.2} sx={{ mt: 3.2 }}>
          {sections.map((section, index) => (
            <Paper
              key={section.title}
              elevation={0}
              sx={{
                borderRadius: "22px",
                border: "1px solid rgba(71,85,105,0.28)",
                bgcolor: "rgba(8,12,20,0.84)",
                p: { xs: 2.5, md: 3.2 }
              }}
            >
              <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.25 }}>
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    border: "1px solid rgba(25,230,107,0.32)",
                    color: "#19e66b",
                    fontWeight: 700,
                    fontSize: 12,
                    display: "grid",
                    placeItems: "center"
                  }}
                >
                  {index + 1}
                </Box>
                <Typography sx={{ fontWeight: 700, color: "#f8fafc", fontSize: 18 }}>{section.title}</Typography>
              </Stack>

              {section.paragraphs.map((paragraph) => (
                <Typography key={paragraph} sx={{ mt: 1, color: "#cbd5e1", fontSize: 15, lineHeight: 1.8 }}>
                  {paragraph}
                </Typography>
              ))}

              {section.bullets && section.bullets.length > 0 ? (
                <Box
                  component="ul"
                  sx={{
                    mb: 0,
                    mt: 1.2,
                    pl: 2.3,
                    color: "#cbd5e1",
                    "& li": {
                      mt: 0.9,
                      fontSize: 14,
                      lineHeight: 1.7
                    }
                  }}
                >
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </Box>
              ) : null}
            </Paper>
          ))}
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1.2}
          sx={{ mt: 4.2, pt: 2.7, borderTop: "1px solid rgba(71,85,105,0.28)" }}
        >
          <Typography sx={{ color: "#64748b", fontSize: 13 }}>
            Copyright {currentYear} OpenCollab. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Typography component={RouterLink} to="/privacy" sx={{ color: "#94a3b8", fontSize: 13, textDecoration: "none", "&:hover": { color: "#e2e8f0" } }}>
              Privacy Policy
            </Typography>
            <Typography component={RouterLink} to="/terms" sx={{ color: "#94a3b8", fontSize: 13, textDecoration: "none", "&:hover": { color: "#e2e8f0" } }}>
              Terms and Conditions
            </Typography>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}