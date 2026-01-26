import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Chip,
  Stack,
  Typography
} from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MSym from "../../resources/components/MSym";
import { timeAgo } from "../utils";
import type { IssueDto } from "../types";

type Props = {
  issue: IssueDto;
};

export default function UpdatesSection({ issue }: Props) {
  return (
    <Box sx={{ mt: 5 }}>
      <Accordion
        disableGutters
        elevation={0}
        defaultExpanded
        sx={{
          bgcolor: "transparent",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          "&:before": { display: "none" }
        }}
      >
        <AccordionSummary
          expandIcon={<MSym name="expand_more" sx={{ color: "#9ca3af" }} />}
          sx={{ px: 0, minHeight: 56 }}
        >
          <Typography sx={{ color: "#fff", fontWeight: 900 }}>UPDATES</Typography>
        </AccordionSummary>

        <AccordionDetails sx={{ px: 0, pb: 2 }}>
          {(issue.updates || []).length === 0 ? (
            <Typography sx={{ color: "#9ca3af", fontSize: 13 }}>No updates yet.</Typography>
          ) : (
            <Stack spacing={3}>
              {(issue.updates || [])
                .slice()
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((u, idx, arr) => {
                  const isOpened = u.id.startsWith("gh_opened");
                  const isOpenCollab = u.actorRole === "OPENCOLLAB";
                  const body = (u.body || "").toLowerCase();

                  const isClaimed = isOpenCollab && (u.id.startsWith("claim") || body.includes("claimed this issue"));
                  const isAborted = isOpenCollab && (u.id.startsWith("abort") || body.includes("aborted this issue"));

                  const isSystemEvent = isOpened || isClaimed || isAborted;
                  const isGithubComment = u.id.startsWith("gh_") && !isOpened;
                  const isMaintainer = u.actorRole === "OWNER" || u.actorRole === "MEMBER";

                  const ring = (color: string) => ({
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: `2px solid ${color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxSizing: "border-box"
                  });

                  const dot = (color: string) => ({
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: color,
                    boxShadow: `0 0 0 8px ${color}22`
                  });

                  const iconNode = isOpened ? (
                    <Box sx={ring("#22c55e")}>
                      <Box sx={dot("#22c55e")} />
                    </Box>
                  ) : isClaimed ? (
                    <Box sx={ring("#22c55e")}>
                      <MSym name="back_hand" sx={{ fontSize: 12, color: "#22c55e" }} />
                    </Box>
                  ) : isAborted ? (
                    <Box sx={ring("#ef4444")}>
                      <Box sx={dot("#ef4444")} />
                    </Box>
                  ) : (
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: "rgba(255,255,255,0.08)",
                        fontWeight: 900,
                        color: "#e5e7eb"
                      }}
                    >
                      {u.actorLogin?.[0]?.toUpperCase() || "?"}
                    </Avatar>
                  );

                  const actionText = isOpened
                    ? "opened this issue"
                    : isClaimed
                    ? "claimed this issue"
                    : isAborted
                    ? "aborted this issue"
                    : "";

                  return (
                    <Stack key={u.id} direction="row" spacing={2} alignItems="center">
                      {/* Timeline column */}
                      <Box
                        sx={{
                          position: "relative",
                          width: 64,
                          minWidth: 64,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "flex-start"
                        }}
                      >
                        {iconNode}

                        {idx < arr.length - 1 && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: 46,
                              left: "50%",
                              transform: "translateX(-50%)",
                              width: 2,
                              height: 44,
                              bgcolor: "rgba(255,255,255,0.14)"
                            }}
                          />
                        )}
                      </Box>

                      {/* Content */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        {isSystemEvent ? (
                          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                            <Typography sx={{ fontSize: 16, fontWeight: 500, color: "#fff", lineHeight: 1 }}>
                              {u.actorLogin}
                            </Typography>
                            <Typography sx={{ fontSize: 16, fontWeight: 500, color: "#9ca3af", lineHeight: 1 }}>
                              {actionText}
                            </Typography>
                            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6b7280", lineHeight: 1 }}>
                              • {timeAgo(u.createdAt)}
                            </Typography>
                          </Stack>
                        ) : (
                          <>
                            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                              <Typography sx={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                                {u.actorLogin}
                              </Typography>
                              {isMaintainer && (
                                <Chip
                                  label="MAINTAINER"
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: 10,
                                    fontWeight: 900,
                                    borderRadius: 999,
                                    bgcolor: "rgba(59,130,246,0.16)",
                                    color: "#60a5fa"
                                  }}
                                />
                              )}
                              <Typography sx={{ fontSize: 18, fontWeight: 500, color: "#6b7280", lineHeight: 1 }}>
                                {timeAgo(u.createdAt)}
                              </Typography>
                            </Stack>

                            <Box
                              sx={{
                                mt: 1.25,
                                px: 2.5,
                                py: 1.75,
                                borderRadius: "18px",
                                bgcolor: isGithubComment ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.04)",
                                border: isGithubComment
                                  ? "1px solid rgba(59,130,246,0.22)"
                                  : "1px solid rgba(255,255,255,0.10)"
                              }}
                            >
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {u.body}
                              </ReactMarkdown>
                            </Box>
                          </>
                        )}
                      </Box>
                    </Stack>
                  );
                })}
            </Stack>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
