import { Box, Paper, Stack, Typography } from "@mui/material";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import MSym from "../../resources/components/MSym";
import type { IssueDto } from "../types";

type Props = {
  issue: IssueDto;
  outcomes: string[];
};

function isAbsoluteOrFragmentUrl(value: string) {
  return /^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith("//") || value.startsWith("#");
}

function normalizeRepoPath(value: string) {
  return value.replace(/^\.\/?/, "").replace(/^\//, "");
}

function githubBlobToRawUrl(value: string) {
  const match = value.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i);
  if (!match) return value;
  const [, owner, repo, branch, path] = match;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

function resolveImageUrl(src: string | undefined, issue: IssueDto) {
  if (!src) return "";

  const withRawBlob = githubBlobToRawUrl(src);
  if (isAbsoluteOrFragmentUrl(withRawBlob)) return withRawBlob;

  const normalized = normalizeRepoPath(withRawBlob);
  return `https://raw.githubusercontent.com/${issue.repoOwner}/${issue.repoName}/HEAD/${encodeURI(normalized)}`;
}

function resolveLinkUrl(href: string | undefined, issue: IssueDto) {
  if (!href) return undefined;
  if (isAbsoluteOrFragmentUrl(href)) return href;

  const normalized = normalizeRepoPath(href);
  return `https://github.com/${issue.repoOwner}/${issue.repoName}/blob/HEAD/${encodeURI(normalized)}`;
}

export default function IssueBodyCard({ issue, outcomes }: Props) {
  return (
    <Paper elevation={0} sx={{ borderRadius: "12px", bgcolor: "#11111a", border: "1px solid #2c312a", p: { xs: 2.5, md: 3 } }}>
      {/* Markdown body */}
      <Box sx={{ color: "#adadad", fontSize: 16, lineHeight: 1.75 }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          components={{
            h1: ({ children }) => <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#fff", mt: 1.5, mb: 1 }}>{children}</Typography>,
            h2: ({ children }) => <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#fff", mt: 1.5, mb: 1 }}>{children}</Typography>,
            p: ({ children }) => <Typography sx={{ mb: 1.25, color: "#adadad" }}>{children}</Typography>,
            li: ({ children }) => <Box component="li" sx={{ mb: 0.75 }}>{children}</Box>,
            ul: ({ children }) => <Box component="ul" sx={{ pl: 2.5, mb: 1.25 }}>{children}</Box>,
            img: ({ src, alt }) => {
              const resolvedSrc = resolveImageUrl(src, issue);
              if (!resolvedSrc) return null;

              return (
                <Box
                  component="img"
                  src={resolvedSrc}
                  alt={alt || "Issue screenshot"}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  sx={{
                    display: "block",
                    width: "100%",
                    maxWidth: "100%",
                    height: "auto",
                    my: 1.5,
                    borderRadius: "10px",
                    border: "1px solid #2c312a",
                    bgcolor: "#0a0a12"
                  }}
                />
              );
            },
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
              <Box component="a" href={resolveLinkUrl(href, issue)} target="_blank" rel="noreferrer" style={{ color: "#60a5fa", textDecoration: "none" }}>
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
    </Paper>
  );
}
