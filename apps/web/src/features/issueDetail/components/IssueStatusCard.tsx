import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import MSym from "../../resources/components/MSym";
import { timeAgo } from "../utils";
import type { IssueDto } from "../types";

type Props = {
  issue: IssueDto;
  isClaimedByMe: boolean;
  isClaimedByOther: boolean;
  isWatching: boolean;
  claiming: boolean;
  aborting: boolean;
  handleClaim: () => void;
  handleAbort: () => void;
  handleNotify: () => void;
};

export default function IssueStatusCard({
  issue,
  isClaimedByMe,
  isClaimedByOther,
  isWatching,
  claiming,
  aborting,
  handleClaim,
  handleAbort,
  handleNotify
}: Props) {
  const hasClosedUpdate = (issue.updates || []).some((u) => {
    const id = String(u?.id || "");
    const body = String(u?.body || "").toLowerCase();
    const isGithubCloseMessage =
      u?.actorRole === "GITHUB" && (body.includes("closed this issue") || body.includes("issue has been closed"));
    return id.startsWith("gh_closed") || isGithubCloseMessage;
  });

  const isClosed = issue.status === "closed" || hasClosedUpdate;
  const canAbort = isClaimedByMe && !isClosed;

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "transparent",
        paddingTop: 1,
        position: "relative",
        overflow: "hidden",
        mb: 2.5
      }}
    >
      <Box sx={{ position: "absolute", inset: 0, opacity: 0.5 }} />
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Button
          fullWidth
          onClick={canAbort ? handleAbort : handleClaim}
          disabled={
            claiming ||
            aborting ||
            (isClaimedByOther && !canAbort) ||
            isClosed
          }
          sx={{
            mb: 2,
            height: 48,
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 700,
            fontSize: 16,
            bgcolor: canAbort ? "#fc5555" : "#55fc7b",
            color: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            "&:hover": {
              bgcolor: canAbort ? "#f43f5e" : "#22c55e"
            },
            "&.Mui-disabled": {
              bgcolor: "rgba(255,255,255,0.08)",
              color: "#6b7280"
            }
          }}
          endIcon={!isClosed ? <MSym name={canAbort ? "close" : "attribution"} sx={{ fontSize: 22 }} /> : undefined}
        >
          {isClosed
            ? "Issue Closed"
            : canAbort
            ? aborting
              ? "Aborting..."
              : "Abort Issue"
            : isClaimedByOther
            ? "Already Claimed"
            : claiming
            ? "Claiming..."
            : "Claim Issue"}
        </Button>

        <Stack spacing={1} sx={{ color: "#cbd5e1", fontSize: 13 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>
              Issue Opened on :
            </Typography>
            <Typography sx={{ color: "#adadad", fontWeight: 300, fontSize: 16 }}>
              {timeAgo(issue.openedAt)}
            </Typography>
          </Stack>

          {(issue.status === "claimed" || !!issue.claimedAt || !!issue.claimedByLogin) && (
            <>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>
                  Issue Claimed on :
                </Typography>
                <Typography sx={{ color: "#adadad", fontWeight: 300, fontSize: 16 }}>
                  {issue.claimedAt ? timeAgo(issue.claimedAt) : "-"}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>
                  Issue Claimed By :
                </Typography>
                <Typography sx={{ color: "#adadad", fontWeight: 300, fontSize: 16 }}>
                  {issue.claimedByLogin || "-"}
                </Typography>
              </Stack>
            </>
          )}
        </Stack>

        {isClaimedByOther && !isClosed && (
          <Button
            fullWidth
            onClick={handleNotify}
            disabled={isWatching}
            sx={{
              mt: 2,
              height: 44,
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "rgba(25,230,107,0.10)",
              border: "1px solid rgba(25,230,107,0.20)",
              color: "#19e66b",
              "&:hover": { bgcolor: "rgba(25,230,107,0.14)" },
              "&.Mui-disabled": {
                color: "#6b7280",
                borderColor: "rgba(255,255,255,0.08)"
              }
            }}
          >
            {isWatching ? "You will be notified" : "Notify when available"}
          </Button>
        )}
      </Box>
    </Paper>
  );
}
