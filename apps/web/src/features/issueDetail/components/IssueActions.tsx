import { Button, Stack } from "@mui/material";
import MSym from "../../resources/components/MSym";
import type { IssueDto } from "../types";

type Props = {
  issue: IssueDto;
  copyToClipboard: (value: string) => void;
};

export default function IssueActions({ issue, copyToClipboard }: Props) {
  return (
    <Stack spacing={1.25} sx={{ mb: 2.5 }}>
      {/* Open in GitHub */}
      <Button
        fullWidth
        component="a"
        href={issue.githubUrl}
        target="_blank"
        rel="noreferrer"
        startIcon={<MSym name="north_east" sx={{ fontSize: 20 }} />}
        sx={{
          height: 48,
          borderRadius: "12px",
          justifyContent: "flex-start",
          px: 3,
          gap: 1,
          bgcolor: "#11111a",
          border: "1px solid #2c312a",
          color: "#fff",
          fontWeight: 700,
          fontSize: 16,
          textTransform: "none",
          "& .MuiButton-startIcon": { ml: 0 },
          "&:hover": {
            bgcolor: "rgba(255,255,255,0.08)",
            color: "#fff"
          }
        }}
      >
        Open in GitHub
      </Button>

      {/* Share link */}
      <Button
        fullWidth
        onClick={() => copyToClipboard(window.location.href)}
        startIcon={<MSym name="share" sx={{ fontSize: 20 }} />}
        sx={{
          height: 48,
          borderRadius: "12px",
          justifyContent: "flex-start",
          px: 3,
          gap: 1,
          bgcolor: "#11111a",
          border: "1px solid #2c312a",
          color: "#fff",
          fontWeight: 700,
          fontSize: 16,
          textTransform: "none",
          "& .MuiButton-startIcon": { ml: 0 },
          "&:hover": {
            bgcolor: "rgba(255,255,255,0.08)",
            color: "#fff"
          }
        }}
      >
        Share link
      </Button>

      {/* Report */}
      <Button
        fullWidth
        startIcon={<MSym name="error" sx={{ fontSize: 20 }} />}
        sx={{
          height: 48,
          borderRadius: "12px",
          justifyContent: "flex-start",
          px: 3,
          gap: 1,
          bgcolor: "#310505",
          border: "1px solid #ff0000",
          color: "#ff0000",
          fontWeight: 700,
          fontSize: 16,
          textTransform: "none",
          "& .MuiButton-startIcon": { ml: 0 },
          "&:hover": {
            bgcolor: "rgba(239,68,68,0.14)"
          }
        }}
      >
        Report
      </Button>
    </Stack>
  );
}
