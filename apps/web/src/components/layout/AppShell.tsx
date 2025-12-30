import { Box, Container, GlobalStyles, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

function MSym({ name, sx }: { name: string; sx?: any }) {
  return (
    <Box
      component="span"
      className="material-symbols-outlined"
      sx={{
        fontVariationSettings: '"FILL" 0, "wght" 500, "GRAD" 0, "opsz" 24',
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

export default function AppShell({
  subtitle,
  rightSlot,
  children
}: {
  subtitle?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", width: "100%", bgcolor: "#0b0b10", position: "relative", color: "#e5e7eb" }}>
      <GlobalStyles styles={{ body: { backgroundColor: "#0b0b10" } }} />

      {/* blob bg */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(900px 700px at 95% 2%, rgba(25,230,107,0.24), rgba(25,230,107,0) 60%),
            radial-gradient(900px 700px at 15% 10%, rgba(255,255,255,0.06), rgba(255,255,255,0) 60%)
          `
        }}
      />

      {/* header */}
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(14px)",
          bgcolor: "rgba(11,11,16,0.65)"
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: 1180, px: { xs: 2, md: 3 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 1.5 }}>
            {/* brand */}
            <Stack direction="row" alignItems="center" spacing={1.4} sx={{ cursor: "pointer" }} onClick={() => navigate("/feed")}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "16px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "rgba(25,230,107,0.10)",
                  border: "1px solid rgba(25,230,107,0.25)",
                  boxShadow: "0 0 0 6px rgba(25,230,107,0.06)"
                }}
              >
                <MSym name="terminal" sx={{ fontSize: 24, color: "#19e66b" }} />
              </Box>

              <Stack spacing={0} sx={{ lineHeight: 1 }}>
                <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 18, letterSpacing: -0.2 }}>
                  OpenCollab
                </Typography>
                <Typography sx={{ color: "#9ca3af", fontWeight: 700, fontSize: 12 }}>
                  {subtitle || "Curated Resources"}
                </Typography>
              </Stack>
            </Stack>

            {/* right */}
            <Stack direction="row" alignItems="center" spacing={1.2}>
              {rightSlot}
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* content */}
      <Container maxWidth={false} sx={{ maxWidth: 1180, py: 3, px: { xs: 2, md: 3 }, position: "relative", zIndex: 1 }}>
        {children}
      </Container>
    </Box>
  );
}