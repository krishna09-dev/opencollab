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
};

export default function IssueTitleSection({ issue, statusP, diffP, copyToClipboard }: Props) {
  return (
    <>
      {/* Breadcrumb */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "#6b7280", fontSize: 13, fontFamily: "monospace", mb: 1.5 }}>
          <Box component="span">{issue.repoOwner}</Box>
          <Box sx={{ color: "#374151" }}>/</Box>
          <Box component="span">{issue.repoName}</Box>
          <Box sx={{ color: "#374151" }}>/</Box>
          <Box sx={{ color: "#9ca3af" }}>#{issue.githubNumber}</Box>
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Typography sx={{ color: "#fff", fontSize: { xs: 26, md: 34 }, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.15 }}>
            {issue.title}
          </Typography>

          <IconButton
            onClick={() => copyToClipboard(window.location.href)}
            sx={{
              width: 40,
              height: 40,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.08)",
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, borderRadius: 999, bgcolor: statusP.bg, border: `1px solid ${statusP.bd}`, color: statusP.fg, fontSize: 11, fontWeight: 800, letterSpacing: 0.9, textTransform: "uppercase" }}>
          <MSym name={statusP.icon} sx={{ fontSize: 16, color: statusP.fg }} />
          {statusP.text}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, borderRadius: 999, bgcolor: diffP.bg, border: `1px solid ${diffP.bd}`, color: diffP.fg, fontSize: 11, fontWeight: 800, letterSpacing: 0.9, textTransform: "uppercase" }}>
          <MSym name={diffP.icon} sx={{ fontSize: 16, color: diffP.fg }} />
          {diffP.text}
        </Box>

        {(issue.labels || []).slice(0, 3).map((l) => (
          <Box key={l} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, borderRadius: 999, bgcolor: "#11111a", border: "1px solid rgba(255,255,255,0.05)", color: "#d1d5db", fontSize: 13 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: 999, bgcolor: labelColorDot(l) }} />
            {l}
          </Box>
        ))}
      </Stack>
    </>
  );
}
