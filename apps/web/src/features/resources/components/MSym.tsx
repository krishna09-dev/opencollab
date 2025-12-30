import { Box } from "@mui/material";

export default function MSym({ name, sx }: { name: string; sx?: any }) {
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