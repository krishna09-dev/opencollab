import { Box, IconButton, Stack, Typography } from "@mui/material";
import MSym from "../../resources/components/MSym";
import { labelColorDot } from "../utils";
import type { IssueDto } from "../types";

type PillStyle = { text: string; icon: string; fg: string; bg: string; bd: string };

type Props = {
  issue: IssueDto;
  statusP: PillStyle;
  diffP: PillStyle;
  copyToClipboard: (value: string) => void;
  shareUrl: string;
};

export default function IssueTitleSection({ issue, statusP, diffP, copyToClipboard, shareUrl }: Props) {
  return (
    <>
      {/* Breadcrumb */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "#9aa1ac", opacity: 0.4, fontSize: 16, fontWeight: 300, mb: 1 }}>
          <Box component="span">{issue.repoName}</Box>
          <Box sx={{ color: "#374151" }}>/</Box>
          <Box sx={{ color: "#9ca3af" }}>#{issue.githubNumber}</Box>
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Typography sx={{ color: "#fff", fontSize: { xs: 22, md: 32 }, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.2 }}>
            {issue.title}
          </Typography>

          <IconButton
            onClick={() => copyToClipboard(shareUrl)}
            sx={{
              width: 48,
              height: 48,
              borderRadius: 999,
              border: "1px solid #2c312a",
              bgcolor: "#11111a",
              color: "#9ca3af",
              "&:hover": { bgcolor: "#1a1a24", color: "#fff" }
            }}
          >
            <MSym name="ios_share" sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Pills row */}
      <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 0.75, py: 0.5, borderRadius: "6px", bgcolor: statusP.bg, border: `1px solid ${statusP.bd}`, color: statusP.fg, fontSize: 8, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>
          <MSym name={statusP.icon} sx={{ fontSize: 10, color: statusP.fg }} />
          {statusP.text}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 0.75, py: 0.5, borderRadius: "6px", bgcolor: diffP.bg, border: `1px solid ${diffP.bd}`, color: diffP.fg, fontSize: 8, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>
          <MSym name={diffP.icon} sx={{ fontSize: 10, color: diffP.fg }} />
          {diffP.text}
        </Box>

        {issue.repoLanguage && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 0.75, py: 0.5, borderRadius: "6px", bgcolor: "#11111a", border: "1px solid #2c312a", color: "#d1d5db", fontSize: 8, fontWeight: 600 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: 999, bgcolor: labelColorDot(issue.repoLanguage) }} />
            {issue.repoLanguage}
          </Box>
        )}

        {(issue.labels || []).slice(0, 3).map((l) => (
          <Box key={l} sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 0.75, py: 0.5, borderRadius: "6px", bgcolor: "#11111a", border: "1px solid #2c312a", color: "#d1d5db", fontSize: 8, fontWeight: 600 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: 999, bgcolor: labelColorDot(l) }} />
            {l}
          </Box>
        ))}
      </Stack>
    </>
  );
}
