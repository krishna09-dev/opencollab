import { Box, Button, Chip, Container, GlobalStyles, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import MSym from "../../resources/components/MSym";

const MODERATOR_PREVIEW_IMAGE = "/Container.png";

const PATHWAY_CARDS = [
  {
    icon: "rocket_launch",
    title: "Start Contributing",
    body: "Step into high-impact projects. We filter the noise and find issues that match your skill level and interests.",
    cta: "Get Started",
    to: "/login"
  },
  {
    icon: "admin_panel_settings",
    title: "Moderator Tools",
    body: "Scale your community. Use advanced analytics and automation to manage repository health and contributor growth.",
    cta: "Open Dashboard",
    to: "/moderation"
  }
] as const;

const FEATURE_CARDS = [
  {
    icon: "auto_awesome",
    title: "AI-Powered Recommendations",
    body: "Context-aware issue matching based on your commit history and tech stack."
  },
  {
    icon: "query_stats",
    title: "Contribution Analytics",
    body: "Deep insights into your impact, velocity, and community standing."
  },
  {
    icon: "library_books",
    title: "Resource Library",
    body: "Curated guides and documentation for mastering collaboration workflows."
  },
  {
    icon: "radar",
    title: "PR Tracking System",
    body: "Real-time lifecycle monitoring of your pull requests across multiple repos."
  }
] as const;

const PARTNERS = ["GITHUB", "GITLAB", "VERCEL", "LINEAR", "STRIPE"] as const;

export default function LandingPage() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#131318",
        color: "#e4e1e9",
        position: "relative",
        overflowX: "clip",
        fontFamily: '"Inter", sans-serif',
        "@keyframes rise": {
          "0%": { opacity: 0, transform: "translateY(18px)" },
          "100%": { opacity: 1, transform: "translateY(0px)" }
        }
      }}
    >
      <GlobalStyles styles={{ body: { margin: 0, backgroundColor: "#131318", color: "#e4e1e9" } }} />

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(520px 520px at 50% -120px, rgba(121,255,149,0.15), rgba(121,255,149,0) 60%), radial-gradient(680px 400px at 68% 20%, rgba(25,230,107,0.08), rgba(25,230,107,0) 70%), radial-gradient(780px 520px at 25% 85%, rgba(40,110,180,0.12), rgba(40,110,180,0) 72%)"
        }}
      />

      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(19,19,24,0.8)",
          borderBottom: "1px solid rgba(60,74,60,0.2)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)"
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            maxWidth: "1280px !important",
            px: { xs: 2.5, md: 4 },
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: 20,
              letterSpacing: -0.6,
              color: "#fcfcfd"
            }}
          >
            OpenCollab
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
            <Button
              component={RouterLink}
              to="/login"
              disableRipple
              sx={{
                minWidth: 0,
                p: 0,
                color: "#a1a1aa",
                fontFamily: '"Inter", sans-serif',
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: -0.2,
                textTransform: "uppercase",
                "&:hover": { bgcolor: "transparent", color: "#e4e1e9" }
              }}
            >
              LOGIN
            </Button>

            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              disableElevation
              sx={{
                bgcolor: "#19e66b",
                color: "#003915",
                borderRadius: 999,
                px: { xs: 2, md: 3 },
                py: 1,
                fontFamily: '"Inter", sans-serif',
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: -0.2,
                textTransform: "uppercase",
                boxShadow: "0 0 20px rgba(25,230,107,0.3)",
                "&:hover": { bgcolor: "#51f38e" }
              }}
            >
              GET STARTED
            </Button>
          </Box>
        </Container>
      </Box>

      <Box component="section" id="platform" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 10, md: 20 } }}>
        <Container maxWidth="xl" sx={{ maxWidth: "1280px !important", px: { xs: 2.5, md: 4 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
              gap: { xs: 6, md: 8 },
              alignItems: "center"
            }}
          >
            <Box sx={{ animation: "rise 620ms ease" }}>
              <Chip
                label="V2.0 BETA LIVE"
                sx={{
                  bgcolor: "#2a292f",
                  border: "1px solid rgba(60,74,60,0.2)",
                  color: "#bacbb8",
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 500,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  height: 30
                }}
                icon={<Box sx={{ bgcolor: "#79ff95", width: 8, height: 8, borderRadius: 99 }} />}
              />

              <Typography
                sx={{
                  mt: 3,
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 800,
                  fontSize: { xs: "clamp(2.8rem, 9vw, 4.5rem)", md: "clamp(4rem, 6vw, 4.75rem)" },
                  lineHeight: { xs: 1.02, md: 1 },
                  letterSpacing: { xs: -1.1, md: -1.8 }
                }}
              >
                <Box component="span" sx={{ display: "block" }}>
                  Step into the
                </Box>
                <Box component="span" sx={{ display: "block", fontWeight: 700 }}>
                  Future of Open
                </Box>
                <Box component="span" sx={{ display: "block", fontWeight: 700 }}>
                  Source with
                </Box>
                <Box component="span" sx={{ display: "block" }}>
                  smart issue
                </Box>
                <Box component="span" sx={{ display: "block" }}>
                  discovery.
                </Box>
              </Typography>

              <Typography
                sx={{
                  mt: 2.5,
                  maxWidth: 520,
                  color: "#bacbb8",
                  fontSize: { xs: 16, md: 20 },
                  lineHeight: { xs: 1.6, md: 1.4 }
                }}
              >
                Discover beginner-friendly GitHub issues, track your contributions, and collaborate
                smarter - all in one platform.
              </Typography>

              <Box sx={{ mt: 3.5, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  disableElevation
                  sx={{
                    bgcolor: "#19e66b",
                    color: "#006128",
                    borderRadius: 999,
                    px: 4,
                    py: 1.6,
                    textTransform: "none",
                    fontFamily: '"Manrope", sans-serif',
                    fontWeight: 700,
                    fontSize: 16,
                    "&:hover": { bgcolor: "#51f38e" }
                  }}
                >
                  Explore Issues
                </Button>

                <Button
                  component={RouterLink}
                  to="/moderation"
                  sx={{
                    bgcolor: "rgba(31,31,36,0.6)",
                    border: "1px solid rgba(60,74,60,0.15)",
                    color: "#e4e1e9",
                    borderRadius: 999,
                    px: 4,
                    py: 1.6,
                    textTransform: "none",
                    fontFamily: '"Manrope", sans-serif',
                    fontWeight: 700,
                    fontSize: 16,
                    backdropFilter: "blur(6px)",
                    "&:hover": { bgcolor: "rgba(47,47,54,0.76)" }
                  }}
                >
                  Moderator Access
                </Button>
              </Box>
            </Box>

            <Box sx={{ position: "relative", minHeight: { xs: 380, md: 500 }, animation: "rise 780ms ease" }}>
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center"
                }}
              >
                <Box
                  sx={{
                    width: { xs: 260, md: 400 },
                    height: { xs: 260, md: 400 },
                    borderRadius: 999,
                    bgcolor: "rgba(121,255,149,0.05)",
                    filter: "blur(50px)"
                  }}
                />
              </Box>

              <Box
                sx={{
                  position: "absolute",
                  right: { xs: -8, md: -18 },
                  top: { xs: 4, md: 0 },
                  width: { xs: 250, md: 320 },
                  borderRadius: "32px",
                  p: 3,
                  transform: "rotate(-6deg)",
                  backdropFilter: "blur(6px)",
                  bgcolor: "rgba(31,31,36,0.6)",
                  border: "1px solid rgba(60,74,60,0.15)",
                  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.3, opacity: 0.6 }}>
                  <MSym name="check_box" sx={{ fontSize: 16, color: "#79ff95" }} />
                  <Typography
                    sx={{
                      fontFamily: '"Space Grotesk", sans-serif',
                      textTransform: "uppercase",
                      fontSize: 12,
                      letterSpacing: -0.4
                    }}
                  >
                    ISSUE #1024
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    mt: 1.2,
                    pt: 0.8,
                    fontFamily: '"Manrope", sans-serif',
                    fontWeight: 700,
                    fontSize: 14,
                    lineHeight: "20px"
                  }}
                >
                  Fix: Responsive Sidebar Overflow
                </Typography>

                <Box sx={{ mt: 1.2, mb: 1.5 }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      px: 1,
                      py: 0.5,
                      borderRadius: 999,
                      bgcolor: "#006027"
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#86d891",
                        fontFamily: '"Inter", sans-serif',
                        fontSize: 10,
                        fontWeight: 600,
                        lineHeight: "15px",
                        textTransform: "uppercase"
                      }}
                    >
                      GOOD FIRST ISSUE
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ height: 4, borderRadius: 999, bgcolor: "#1f1f24", overflow: "hidden" }}>
                  <Box sx={{ width: "66.67%", height: "100%", bgcolor: "#79ff95" }} />
                </Box>
              </Box>

              <Box
                sx={{
                  position: "absolute",
                  left: { xs: -16, md: -40 },
                  bottom: { xs: 10, md: 32 },
                  width: { xs: 250, md: 288 },
                  borderRadius: "32px",
                  p: 3,
                  transform: "rotate(3deg)",
                  backdropFilter: "blur(6px)",
                  bgcolor: "rgba(31,31,36,0.6)",
                  border: "1px solid rgba(60,74,60,0.15)",
                  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <MSym name="extension" sx={{ color: "#e4e1e9", fontSize: 18 }} />
                  <Typography sx={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: 12 }}>
                    Active PRs
                  </Typography>
                </Box>

                <Box sx={{ mt: 2, display: "grid", gap: 1.3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: 99, bgcolor: "#35343a" }} />
                    <Box sx={{ width: 96, height: 8, borderRadius: 99, bgcolor: "#1f1f24" }} />
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: 99, bgcolor: "#35343a" }} />
                    <Box sx={{ width: 128, height: 8, borderRadius: 99, bgcolor: "#1f1f24" }} />
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  position: "absolute",
                  left: { xs: "36%", md: "32%" },
                  top: { xs: "31%", md: "30%" },
                  width: { xs: 210, md: 262 },
                  borderRadius: "32px",
                  p: 3,
                  transform: "rotate(-12deg)",
                  backdropFilter: "blur(6px)",
                  bgcolor: "rgba(31,31,36,0.6)",
                  border: "1px solid rgba(60,74,60,0.15)",
                  opacity: 0.84,
                  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Manrope", sans-serif',
                    fontWeight: 800,
                    fontSize: 30,
                    lineHeight: "36px",
                    color: "#79ff95",
                    textAlign: "center"
                  }}
                >
                  128+
                </Typography>
                <Typography
                  sx={{
                    mt: 0.6,
                    textAlign: "center",
                    opacity: 0.5,
                    color: "#e4e1e9",
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontWeight: 500,
                    fontSize: 10,
                    letterSpacing: 1,
                    textTransform: "uppercase"
                  }}
                >
                  GLOBAL CONTRIBUTORS
                </Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="xl" sx={{ maxWidth: "1280px !important", px: { xs: 2.5, md: 4 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 4
            }}
          >
            {PATHWAY_CARDS.map((card) => (
              <Box
                key={card.title}
                sx={{
                  minHeight: { xs: "auto", md: 376 },
                  borderRadius: "32px",
                  p: { xs: 4, md: 6.1 },
                  border: "1px solid rgba(60,74,60,0.15)",
                  backdropFilter: "blur(6px)",
                  bgcolor: "rgba(31,31,36,0.6)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 4
                }}
              >
                <Box>
                  <Box
                    sx={{
                      width: 57,
                      height: 57,
                      borderRadius: 99,
                      bgcolor: "rgba(25,230,107,0.12)",
                      display: "grid",
                      placeItems: "center"
                    }}
                  >
                    <MSym name={card.icon} sx={{ color: "#79ff95", fontSize: 24 }} />
                  </Box>

                  <Typography
                    sx={{
                      mt: 3,
                      pt: 1,
                      fontFamily: '"Manrope", sans-serif',
                      fontWeight: 700,
                      fontSize: { xs: 28, md: 30 },
                      lineHeight: "36px"
                    }}
                  >
                    {card.title}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 2,
                      maxWidth: 420,
                      color: "#bacbb8",
                      fontSize: 16,
                      lineHeight: "26px"
                    }}
                  >
                    {card.body}
                  </Typography>
                </Box>

                <Button
                  component={RouterLink}
                  to={card.to}
                  disableRipple
                  sx={{
                    px: 0,
                    alignSelf: "flex-start",
                    color: "#79ff95",
                    fontFamily: '"Manrope", sans-serif',
                    fontWeight: 700,
                    fontSize: 16,
                    textTransform: "none",
                    "&:hover": { bgcolor: "transparent", color: "#a7ffbb" }
                  }}
                  endIcon={<MSym name="arrow_outward" sx={{ fontSize: 16 }} />}
                >
                  {card.cta}
                </Button>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Box component="section" id="resources" sx={{ bgcolor: "#0e0e13", py: { xs: 8, md: 12 } }}>
        <Container maxWidth="xl" sx={{ maxWidth: "1280px !important", px: { xs: 2.5, md: 4 } }}>
          <Typography
            sx={{
              fontFamily: '"Manrope", sans-serif',
              fontWeight: 800,
              fontSize: { xs: 32, md: 36 },
              letterSpacing: -0.9,
              lineHeight: "40px"
            }}
          >
            The Engine for Modern OS
          </Typography>
          <Typography sx={{ mt: 1.8, color: "#bacbb8", fontSize: 16, lineHeight: "24px", maxWidth: 576 }}>
            Powerful features built for the next generation of digital architects.
          </Typography>

          <Box
            sx={{
              mt: 8,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))"
              },
              gap: 3
            }}
          >
            {FEATURE_CARDS.map((feature) => (
              <Box
                key={feature.title}
                sx={{
                  minHeight: 228,
                  p: 4,
                  backdropFilter: "blur(6px)",
                  bgcolor: "rgba(19,19,24,0.4)"
                }}
              >
                <MSym name={feature.icon} sx={{ color: "#79ff95", fontSize: 20 }} />
                <Typography
                  sx={{
                    mt: 2,
                    pt: 1,
                    fontFamily: '"Manrope", sans-serif',
                    fontWeight: 700,
                    fontSize: 16,
                    lineHeight: "24px"
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography sx={{ mt: 1, color: "#bacbb8", fontSize: 14, lineHeight: "20px" }}>
                  {feature.body}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Box component="section" id="enterprise" sx={{ px: { xs: 2.5, md: 4 }, py: { xs: 8, md: 12 } }}>
        <Container maxWidth="xl" sx={{ maxWidth: "1280px !important", px: 0 }}>
          <Box
            sx={{
              borderRadius: "32px",
              p: { xs: 3.5, md: 10 },
              border: "1px solid rgba(60,74,60,0.15)",
              backdropFilter: "blur(6px)",
              bgcolor: "rgba(31,31,36,0.6)",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
              gap: { xs: 5, md: 6 },
              alignItems: "center"
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  color: "#79ff95",
                  fontWeight: 500,
                  fontSize: 14,
                  textTransform: "uppercase",
                  letterSpacing: 1.4,
                  lineHeight: "20px"
                }}
              >
                MAINTAINER FIRST
              </Typography>

              <Typography
                sx={{
                  mt: 2,
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 800,
                  fontSize: { xs: 40, md: 48 },
                  lineHeight: { xs: "44px", md: "48px" }
                }}
              >
                Built for Moderators
                <Box component="span" sx={{ display: "block" }}>
                  and Maintainers
                </Box>
              </Typography>

              <Typography sx={{ mt: 2.4, color: "#bacbb8", fontSize: 18, lineHeight: "29.25px", maxWidth: 560 }}>
                Focus on the code while we manage the crowd. OpenCollab provides a unified interface
                to monitor contributor health, automate issue labeling, and streamline the review
                process.
              </Typography>

              <Button
                component={RouterLink}
                to="/moderation"
                variant="contained"
                disableElevation
                sx={{
                  mt: 3.5,
                  bgcolor: "#79ff95",
                  color: "#003915",
                  borderRadius: 999,
                  px: 4,
                  py: 1.6,
                  textTransform: "none",
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 700,
                  fontSize: 16,
                  "&:hover": { bgcolor: "#a6ffba" }
                }}
              >
                Go to Moderator Panel
              </Button>
            </Box>

            <Box
              sx={{
                width: "100%",
                maxWidth: 400,
                aspectRatio: "1 / 1",
                mx: "auto",
                position: "relative",
                borderRadius: "32px",
                border: "1px solid rgba(60,74,60,0.3)",
                overflow: "hidden",
                opacity: 0.88
              }}
            >
              <Box
                component="img"
                src={MODERATOR_PREVIEW_IMAGE}
                alt="Moderator console preview"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(19,19,24,0) 35%, rgba(19,19,24,0.96) 100%)"
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      <Box
        component="section"
        id="pricing"
        sx={{
          bgcolor: "#0e0e13",
          borderTop: "1px solid rgba(60,74,60,0.1)",
          borderBottom: "1px solid rgba(60,74,60,0.1)",
          py: { xs: 3.5, md: 6.2 }
        }}
      >
        <Container maxWidth="xl" sx={{ maxWidth: "1280px !important", px: { xs: 2.5, md: 4 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" },
              gap: 2,
              opacity: 0.4
            }}
          >
            {PARTNERS.map((partner) => (
              <Typography
                key={partner}
                sx={{
                  textAlign: "center",
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 800,
                  fontSize: { xs: 16, md: 20 },
                  lineHeight: { xs: "24px", md: "28px" }
                }}
              >
                {partner}
              </Typography>
            ))}
          </Box>
        </Container>
      </Box>

      <Box component="section" sx={{ position: "relative", py: { xs: 10, md: 16 }, px: { xs: 2.5, md: 4 } }}>
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            width: 600,
            height: 300,
            transform: "translateX(-50%)",
            borderRadius: 999,
            bgcolor: "rgba(121,255,149,0.1)",
            filter: "blur(60px)",
            pointerEvents: "none"
          }}
        />
        <Container maxWidth="md" sx={{ position: "relative", px: { xs: 0, sm: 2 } }}>
          <Typography
            sx={{
              textAlign: "center",
              fontFamily: '"Manrope", sans-serif',
              fontWeight: 800,
              fontSize: { xs: "clamp(2.4rem, 8vw, 3rem)", md: "60px" },
              lineHeight: { xs: 1.05, md: "60px" },
              letterSpacing: -1.5
            }}
          >
            <Box component="span" sx={{ display: "block" }}>
              Start your open source
            </Box>
            <Box component="span" sx={{ display: "block" }}>
              journey or lead the
            </Box>
            <Box component="span" sx={{ display: "block" }}>
              community.
            </Box>
          </Typography>

          <Box sx={{ mt: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 3, flexWrap: "wrap" }}>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              disableElevation
              sx={{
                bgcolor: "#19e66b",
                color: "#006128",
                borderRadius: 999,
                px: 5,
                py: 2,
                textTransform: "none",
                fontFamily: '"Manrope", sans-serif',
                fontWeight: 700,
                fontSize: 18,
                lineHeight: "28px",
                boxShadow: "0 0 30px rgba(25,230,107,0.2)",
                "&:hover": { bgcolor: "#51f38e" }
              }}
            >
              Get Started
            </Button>

            <Button
              component={RouterLink}
              to="/moderation"
              sx={{
                bgcolor: "rgba(31,31,36,0.6)",
                border: "1px solid rgba(60,74,60,0.3)",
                color: "#e4e1e9",
                borderRadius: 999,
                px: 5,
                py: 2,
                textTransform: "none",
                fontFamily: '"Manrope", sans-serif',
                fontWeight: 700,
                fontSize: 18,
                lineHeight: "28px",
                backdropFilter: "blur(6px)",
                "&:hover": { bgcolor: "rgba(47,47,54,0.76)" }
              }}
            >
              Moderator Access
            </Button>
          </Box>
        </Container>
      </Box>

      <Box
        component="footer"
        sx={{
          bgcolor: "#0e0e13",
          borderTop: "1px solid rgba(60,74,60,0.15)",
          py: { xs: 2.5, md: 3 }
        }}
      >
        <Container maxWidth="xl" sx={{ maxWidth: "1280px !important", px: { xs: 2.5, md: 4 } }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              gap: { xs: 1.3, sm: 2 }
            }}
          >
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.1 }}>
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: "999px",
                  border: "1px solid rgba(121,255,149,0.45)",
                  bgcolor: "rgba(25,230,107,0.12)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0
                }}
              >
                <MSym name="terminal" sx={{ fontSize: 13, color: "#79ff95" }} />
              </Box>
              <Typography sx={{ color: "#a1a1aa", fontSize: 13, lineHeight: "20px" }}>
                OpenCollab Copyright {currentYear}. All rights reserved.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                flexWrap: "wrap",
                rowGap: 0.75,
                columnGap: 1.6
              }}
            >
              <Typography
                component={RouterLink}
                to="/privacy"
                sx={{
                  color: "#a1a1aa",
                  fontSize: 13,
                  lineHeight: "20px",
                  textDecoration: "none",
                  "&:hover": { color: "#e4e1e9" }
                }}
              >
                Privacy Policy
              </Typography>
              <Typography sx={{ color: "rgba(161,161,170,0.45)", fontSize: 12, display: { xs: "none", sm: "block" } }}>
                |
              </Typography>
              <Typography
                component={RouterLink}
                to="/terms"
                sx={{
                  color: "#a1a1aa",
                  fontSize: 13,
                  lineHeight: "20px",
                  textDecoration: "none",
                  "&:hover": { color: "#e4e1e9" }
                }}
              >
                Terms and Conditions
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}