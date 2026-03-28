import { Box, Typography } from "@mui/material";
import MSym from "../../resources/components/MSym";

export default function LoginBrand() {
  return (
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
  );
}
