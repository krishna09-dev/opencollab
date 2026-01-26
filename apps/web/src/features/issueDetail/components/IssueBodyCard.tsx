import { Box, Divider, Paper, Stack, Typography } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MSym from "../../resources/components/MSym";
import type { IssueDto } from "../types";

type Props = {
  issue: IssueDto;
  outcomes: string[];
  skills: string[];
};

export default function IssueBodyCard({ issue, outcomes, skills }: Props) {
  return (
    <Paper elevation={0} sx={{ borderRadius: "24px", bgcolor: "#101110", border: "1px solid rgba(255,255,255,0.08)", p: { xs: 2.5, md: 3.5 } }}>
      {/* Markdown body */}
      <Box sx={{ color: "#d1d5db", fontSize: 16, lineHeight: 1.75 }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <Typography sx={{ fontSize: 22, fontWeight: 900, color: "#fff", mt: 1.5, mb: 1 }}>{children}</Typography>,
            h2: ({ children }) => <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#fff", mt: 1.5, mb: 1 }}>{children}</Typography>,
            p: ({ children }) => <Typography sx={{ mb: 1.25, color: "#d1d5db" }}>{children}</Typography>,
            li: ({ children }) => <Box component="li" sx={{ mb: 0.75 }}>{children}</Box>,
            ul: ({ children }) => <Box component="ul" sx={{ pl: 2.5, mb: 1.25 }}>{children}</Box>,
            code: ({ children }) => (
              <Box component="code" sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", bgcolor: "rgba(255,255,255,0.06)", px: 0.75, py: 0.25, borderRadius: 1, color: "#e5e7eb" }}>
                {children}
              </Box>
            ),
            pre: ({ children }) => (
              <Box sx={{ my: 2, p: 2, borderRadius: 2, bgcolor: "#0d0d12", border: "1px solid rgba(255,255,255,0.08)", overflowX: "auto" }}>
                <Box sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 13, color: "#9ca3af", whiteSpace: "pre" }}>
                  {children}
                </Box>
              </Box>
            ),
            a: ({ href, children }) => (
              <Box component="a" href={href} target="_blank" rel="noreferrer" style={{ color: "#60a5fa", textDecoration: "none" }}>
                {children}
              </Box>
            )
          }}
        >
          {issue.body?.trim() ? issue.body : issue.summary}
        </ReactMarkdown>
      </Box>

      {/* Expected Outcome */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2, mb: 1 }}>
        <MSym name="check_circle" sx={{ fontSize: 22, color: "#19e66b" }} />
        <Typography sx={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>Expected Outcome</Typography>
      </Stack>

      <Box component="ul" sx={{ pl: 2.5, mt: 1, mb: 3, color: "#d1d5db" }}>
        {outcomes.map((x, idx) => (
          <Box component="li" key={idx} sx={{ mb: 1, lineHeight: 1.7 }}>{x}</Box>
        ))}
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 2.5 }} />

      {/* Required Skills */}
      <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#6b7280", letterSpacing: 1.6, textTransform: "uppercase", mb: 1 }}>
        Required Skills
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {skills.map((s) => (
          <Box key={s} sx={{ px: 1.25, py: 0.6, borderRadius: 1.5, bgcolor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)", color: "#d1d5db", fontSize: 11 }}>
            {s}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
