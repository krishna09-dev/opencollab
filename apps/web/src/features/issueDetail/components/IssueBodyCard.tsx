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
    <Paper elevation={0} sx={{ borderRadius: "12px", bgcolor: "#11111a", border: "1px solid #2c312a", p: { xs: 2.5, md: 3 } }}>
      {/* Markdown body */}
      <Box sx={{ color: "#adadad", fontSize: 16, lineHeight: 1.75 }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#fff", mt: 1.5, mb: 1 }}>{children}</Typography>,
            h2: ({ children }) => <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#fff", mt: 1.5, mb: 1 }}>{children}</Typography>,
            p: ({ children }) => <Typography sx={{ mb: 1.25, color: "#adadad" }}>{children}</Typography>,
            li: ({ children }) => <Box component="li" sx={{ mb: 0.75 }}>{children}</Box>,
            ul: ({ children }) => <Box component="ul" sx={{ pl: 2.5, mb: 1.25 }}>{children}</Box>,
            code: ({ children }) => (
              <Box component="code" sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", bgcolor: "rgba(255,255,255,0.06)", px: 0.75, py: 0.25, borderRadius: 1, color: "#d1d5db" }}>
                {children}
              </Box>
            ),
            pre: ({ children }) => (
              <Box sx={{ my: 2, p: 2, borderRadius: "12px", bgcolor: "#11111a", border: "1px solid #2c312a", overflowX: "auto" }}>
                <Box sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12, color: "#d1d5db", whiteSpace: "pre" }}>
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
        <Typography sx={{ color: "#adadad", fontSize: 16, fontWeight: 700 }}>Expected Outcome</Typography>
      </Stack>

      <Box component="ul" sx={{ pl: 2.5, mt: 1, mb: 3, color: "#adadad" }}>
        {outcomes.map((x, idx) => (
          <Box component="li" key={idx} sx={{ mb: 1, lineHeight: 1.7 }}>{x}</Box>
        ))}
      </Box>

      <Divider sx={{ borderColor: "#2c312a", my: 2.5 }} />

      {/* Required Skills */}
      <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#adadad", textTransform: "uppercase", mb: 1.5 }}>
        Required Skills
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {skills.map((s) => (
          <Box key={s} sx={{ px: 0.75, py: 0.5, borderRadius: "6px", bgcolor: "#11111a", border: "1px solid #2c312a", color: "#d1d5db", fontSize: 8, fontWeight: 600 }}>
            {s}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
