import { Button, Stack } from "@mui/material";
import MSym from "../../resources/components/MSym";
import GitHubMark from "../../auth/components/GitHubMark";
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
        startIcon={<GitHubMark />}
        sx={{
          height: 50,
          borderRadius: "14px",
          justifyContent: "flex-start",
          px: 2,
          gap: 1.25,
          bgcolor: "#101110",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#d1d5db",
          fontWeight: 900,
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
        startIcon={<MSym name="share" sx={{ fontSize: 18 }} />}
        sx={{
          height: 50,
          borderRadius: "14px",
          justifyContent: "flex-start",
          px: 2,
          gap: 1.25,
          bgcolor: "#101110",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#d1d5db",
          fontWeight: 900,
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
        startIcon={<MSym name="report_problem" sx={{ fontSize: 18 }} />}
        sx={{
          height: 50,
          borderRadius: "14px",
          justifyContent: "flex-start",
          px: 2,
          gap: 1.25,
          bgcolor: "rgba(239,68,68,0.10)",
          border: "1px solid rgba(239,68,68,0.35)",
          color: "#f87171",
          fontWeight: 900,
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
