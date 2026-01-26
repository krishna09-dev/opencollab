import { Box, GlobalStyles } from "@mui/material";
import LoginBrand from "../components/LoginBrand";
import LoginHero from "../components/LoginHero";
import IssueFeedPreview from "../components/IssueFeedPreview";

export default function LoginPage() {
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
      <GlobalStyles styles={{ body: { backgroundColor: "#07070c" } }} />

      {/* Background blobs */}
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

      <LoginBrand />

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
          <LoginHero />
          <IssueFeedPreview />
        </Box>
      </Box>
    </Box>
  );
}
