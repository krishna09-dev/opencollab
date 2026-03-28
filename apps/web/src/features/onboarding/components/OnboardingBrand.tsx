import { Box, Stack, Typography } from "@mui/material";
import MSym from "../../resources/components/MSym";

export default function OnboardingBrand() {
  return (
    <Box sx={{ position: "relative", zIndex: 1, pt: 4, px: { xs: 3, md: "120px" } }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.5,
            border: "1px solid rgba(34,197,94,0.35)",
            bgcolor: "rgba(11, 20, 15, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
          }}
        >
          <MSym name="terminal" sx={{ color: "#22c55e", fontSize: 20 }} />
        </Box>
        <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>OpenCollab</Typography>
      </Stack>
    </Box>
  );
}
