import { Box, Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";

type UserLegalFooterProps = {
  sx?: SxProps<Theme>;
  textColor?: string;
  linkColor?: string;
  borderColor?: string;
};

export default function UserLegalFooter({
  sx,
  textColor = "#71717a",
  linkColor = "#a1a1aa",
  borderColor = "rgba(63,63,70,0.6)"
}: UserLegalFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        borderTop: `1px solid ${borderColor}`,
        px: { xs: 2.5, md: 4 },
        py: 2.5,
        ...sx
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Typography sx={{ color: textColor, fontSize: 12 }}>
          Copyright {currentYear} OpenCollab. All rights reserved.
        </Typography>

        <Stack direction="row" spacing={2}>
          <Typography
            component={RouterLink}
            to="/privacy"
            sx={{
              color: linkColor,
              fontSize: 12,
              textDecoration: "none",
              "&:hover": { color: "#e5e7eb" }
            }}
          >
            Privacy Policy
          </Typography>
          <Typography
            component={RouterLink}
            to="/terms"
            sx={{
              color: linkColor,
              fontSize: 12,
              textDecoration: "none",
              "&:hover": { color: "#e5e7eb" }
            }}
          >
            Terms and Conditions
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
