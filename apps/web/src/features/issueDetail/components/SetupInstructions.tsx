import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import MSym from "../../resources/components/MSym";
import type { IssueDto, SetupInstruction } from "../types";

type Props = {
  issue: IssueDto;
  projectSetup: SetupInstruction[];
  copyToClipboard: (value: string) => void;
};

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

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

function resolveReadmeImageUrl(src: string | undefined, issue: IssueDto) {
  if (!src) return "";

  const withRawBlob = githubBlobToRawUrl(src);
  if (isAbsoluteOrFragmentUrl(withRawBlob)) return withRawBlob;

  const normalized = normalizeRepoPath(withRawBlob);
  return `https://raw.githubusercontent.com/${issue.repoOwner}/${issue.repoName}/HEAD/${encodeURI(normalized)}`;
}

function resolveReadmeLinkUrl(href: string | undefined, issue: IssueDto) {
  if (!href) return undefined;
  if (isAbsoluteOrFragmentUrl(href)) return href;

  const normalized = normalizeRepoPath(href);
  return `https://github.com/${issue.repoOwner}/${issue.repoName}/blob/HEAD/${encodeURI(normalized)}`;
}

function isLikelyBadgeImage(src: string, alt?: string) {
  const hay = `${src} ${alt || ""}`.toLowerCase();
  return (
    hay.includes("badge") ||
    hay.includes("shields.io") ||
    hay.includes("img.shields.io") ||
    hay.includes("actions/workflows") ||
    hay.includes("github/workflows") ||
    hay.includes("travis") ||
    hay.includes("circleci") ||
    hay.includes("codecov") ||
    hay.includes("coveralls") ||
    hay.includes("sonarcloud")
  );
}

function CommandCard({
  item,
  copyToClipboard
}: {
  item: SetupInstruction;
  copyToClipboard: (value: string) => void;
}) {
  const link = isHttpUrl(item.command);

  return (
    <Box>
      <Typography sx={{ color: "#d1d5db", fontSize: 10, mb: 0.75, fontWeight: 600 }}>{item.label}</Typography>

      <Paper
        elevation={0}
        sx={{
          bgcolor: "#11111a",
          border: "1px solid #2c312a",
          borderRadius: "12px",
          px: 2,
          py: 1.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5
        }}
      >
        {link ? (
          <Box
            component="a"
            href={item.command}
            target="_blank"
            rel="noreferrer"
            sx={{
              color: "#60a5fa",
              textDecoration: "none",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 11,
              overflowWrap: "anywhere"
            }}
          >
            {item.command}
          </Box>
        ) : (
          <Typography
            sx={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 11,
              color: "#adadad",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere"
            }}
          >
            {item.command}
          </Typography>
        )}

        <Stack direction="row" spacing={0.75}>
          {link ? (
            <IconButton
              component="a"
              href={item.command}
              target="_blank"
              rel="noreferrer"
              sx={{
                width: 24,
                height: 24,
                borderRadius: "8px",
                border: "1px solid #2c312a",
                bgcolor: "#11111a",
                color: "#9ca3af",
                "&:hover": { bgcolor: "#1a1a24", color: "#fff" }
              }}
            >
              <MSym name="open_in_new" sx={{ fontSize: 18 }} />
            </IconButton>
          ) : null}

          <IconButton
            onClick={() => copyToClipboard(item.command)}
            sx={{
              width: 24,
              height: 24,
              borderRadius: "8px",
              border: "1px solid #2c312a",
              bgcolor: "#11111a",
              color: "#9ca3af",
              "&:hover": { bgcolor: "#1a1a24", color: "#fff" }
            }}
          >
            <MSym name="content_copy" sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Paper>
    </Box>
  );
}

export default function SetupInstructions({ issue, projectSetup, copyToClipboard }: Props) {
  const branchName = `fix/issue-${issue.githubNumber}`;
  const readmeMarkdown = issue.repositoryReadme?.trim() || "";
  const readmeUrl = issue.repositoryReadmeUrl || `https://github.com/${issue.repoOwner}/${issue.repoName}#readme`;

  const fallbackGitFlow: SetupInstruction[] = [
    { label: "Open issue", command: issue.githubUrl },
    { label: "Fork repository", command: `Open https://github.com/${issue.repoOwner}/${issue.repoName} and click Fork` },
    { label: "Clone your fork", command: `git clone https://github.com/<your-username>/${issue.repoName}.git` },
    { label: "Create branch", command: `git checkout -b ${branchName}` },
    { label: "Commit and push", command: `git add . && git commit -m \"fix: resolve #${issue.githubNumber}\" && git push -u origin ${branchName}` },
    { label: "Open pull request", command: `Open GitHub and create a PR for #${issue.githubNumber}` }
  ];

  const gitFlowItems = (issue.autoSetupCommands || []).length ? issue.autoSetupCommands : fallbackGitFlow;

  const hasReadmeEntry = projectSetup.some((entry) => /readme/i.test(entry.label) || /#readme/i.test(entry.command));
  const projectSetupItems = [
    ...(hasReadmeEntry ? [] : [{ label: "Open repository README", command: readmeUrl }]),
    ...projectSetup
  ];

  const normalizedProjectSetup = projectSetupItems.length
    ? projectSetupItems
    : [{ label: "Open repository README", command: readmeUrl }];

  return (
    <Box sx={{ mt: 5 }}>
      <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 32, letterSpacing: 0.5, mb: 1.5 }}>
        SETUP INSTRUCTIONS
      </Typography>

      {/* Git Flow */}
      <Accordion defaultExpanded disableGutters elevation={0} sx={{ bgcolor: "transparent", borderTop: "1px solid #2c312a", borderBottom: "1px solid #2c312a", "&:before": { display: "none" } }}>
        <AccordionSummary expandIcon={<MSym name="expand_more" sx={{ color: "#9ca3af" }} />} sx={{ px: 0, minHeight: 56 }}>
          <Typography sx={{ color: "#d1d5db", fontWeight: 700, fontSize: 16 }}>GIT FLOW</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pb: 2 }}>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.25 }}>
              <Typography sx={{ color: "#9ca3af", fontSize: 12 }}>
                {"Follow this path: issue -> fork -> clone -> branch -> code -> commit -> PR."}
              </Typography>
              <Chip label={`${gitFlowItems.length} steps`} size="small" sx={{ height: 22, bgcolor: "rgba(34,197,94,0.12)", color: "#86efac", border: "1px solid rgba(134,239,172,0.25)" }} />
            </Box>

            {gitFlowItems.map((item) => (
              <CommandCard key={item.label + item.command} item={item} copyToClipboard={copyToClipboard} />
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Project-specific setup */}
      <Accordion disableGutters elevation={0} sx={{ bgcolor: "transparent", borderBottom: "1px solid #2c312a", "&:before": { display: "none" } }}>
        <AccordionSummary expandIcon={<MSym name="expand_more" sx={{ color: "#9ca3af" }} />} sx={{ px: 0, minHeight: 56 }}>
          <Typography sx={{ color: "#d1d5db", fontWeight: 700, fontSize: 16 }}>PROJECT-SPECIFIC SETUP</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pb: 2 }}>
          <Stack spacing={2}>
            <Typography sx={{ color: "#9ca3af", fontSize: 12 }}>
              Project setup comes from the target repository README so contributors follow the maintainer-defined steps.
            </Typography>

            {normalizedProjectSetup.map((item) => (
              <CommandCard key={item.label + item.command} item={item} copyToClipboard={copyToClipboard} />
            ))}

            <Paper elevation={0} sx={{ mt: 1, borderRadius: "12px", bgcolor: "#11111a", border: "1px solid #2c312a", p: { xs: 2, md: 2.25 } }}>
              <Stack spacing={1.25}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Typography sx={{ color: "#d1d5db", fontWeight: 700, fontSize: 14 }}>Repository README</Typography>
                  <Box component="a" href={readmeUrl} target="_blank" rel="noreferrer" sx={{ color: "#60a5fa", fontSize: 12, textDecoration: "none" }}>
                    Open on GitHub
                  </Box>
                </Stack>

                {!readmeMarkdown ? (
                  <Typography sx={{ color: "#9ca3af", fontSize: 13 }}>
                    README content is not available yet for this issue. Open the README link above or refresh issue sync.
                  </Typography>
                ) : (
                  <Box sx={{ color: "#adadad", fontSize: 14, lineHeight: 1.7 }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeSanitize]}
                      components={{
                        h1: ({ children }) => <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#fff", mt: 1.5, mb: 1 }}>{children}</Typography>,
                        h2: ({ children }) => <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#fff", mt: 1.25, mb: 0.9 }}>{children}</Typography>,
                        h3: ({ children }) => <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#fff", mt: 1.1, mb: 0.7 }}>{children}</Typography>,
                        p: ({ children }) => <Typography sx={{ mb: 1.1, color: "#adadad", fontSize: 14 }}>{children}</Typography>,
                        li: ({ children }) => <Box component="li" sx={{ mb: 0.6 }}>{children}</Box>,
                        ul: ({ children }) => <Box component="ul" sx={{ pl: 2.4, mb: 1.1 }}>{children}</Box>,
                        ol: ({ children }) => <Box component="ol" sx={{ pl: 2.4, mb: 1.1 }}>{children}</Box>,
                        img: ({ src, alt }) => {
                          const resolvedSrc = resolveReadmeImageUrl(src, issue);
                          if (!resolvedSrc) return null;

                          const isBadge = isLikelyBadgeImage(resolvedSrc, alt);

                          return (
                            <Box
                              component="img"
                              src={resolvedSrc}
                              alt={alt || "README image"}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              sx={{
                                display: isBadge ? "inline-block" : "block",
                                width: "auto",
                                maxWidth: "100%",
                                height: "auto",
                                maxHeight: isBadge ? 22 : "none",
                                my: isBadge ? 0.15 : 1.3,
                                mr: isBadge ? 0.75 : 0,
                                verticalAlign: isBadge ? "middle" : "baseline",
                                borderRadius: isBadge ? 0 : "10px",
                                border: isBadge ? "none" : "1px solid #2c312a",
                                bgcolor: isBadge ? "transparent" : "#0a0a12"
                              }}
                            />
                          );
                        },
                        code: ({ children }) => (
                          <Box component="code" sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", bgcolor: "rgba(255,255,255,0.06)", px: 0.65, py: 0.2, borderRadius: 1, color: "#d1d5db" }}>
                            {children}
                          </Box>
                        ),
                        pre: ({ children }) => (
                          <Box sx={{ my: 1.5, p: 1.5, borderRadius: "10px", bgcolor: "#0f1017", border: "1px solid #2c312a", overflowX: "auto" }}>
                            <Box sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12, color: "#d1d5db", whiteSpace: "pre" }}>
                              {children}
                            </Box>
                          </Box>
                        ),
                        a: ({ href, children }) => (
                          <Box component="a" href={resolveReadmeLinkUrl(href, issue)} target="_blank" rel="noreferrer" sx={{ color: "#60a5fa", textDecoration: "none" }}>
                            {children}
                          </Box>
                        )
                      }}
                    >
                      {readmeMarkdown}
                    </ReactMarkdown>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
