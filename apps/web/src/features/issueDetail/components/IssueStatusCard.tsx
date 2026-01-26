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
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "transparent",
        paddingTop: 2.5,
        position: "relative",
        overflow: "hidden",
        mb: 2.5
      }}
    >
      <Box sx={{ position: "absolute", inset: 0, opacity: 0.5 }} />
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Button
          fullWidth
          onClick={isClaimedByMe ? handleAbort : handleClaim}
          disabled={
            claiming ||
            aborting ||
            (isClaimedByOther && !isClaimedByMe) ||
            issue.status === "closed"
          }
          sx={{
            mb: 2,
            height: 40,
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 900,
            bgcolor: isClaimedByMe ? "#fb7185" : "#19e66b",
            color: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            "&:hover": {
              bgcolor: isClaimedByMe ? "#f43f5e" : "#22c55e"
            },
            "&.Mui-disabled": {
              bgcolor: "rgba(255,255,255,0.08)",
              color: "#6b7280"
            }
          }}
        >
          {issue.status !== "closed" && (
            <MSym
              name={isClaimedByMe ? "close" : "attribution"}
              sx={{ fontSize: 24, lineHeight: 1 }}
            />
          )}

          {issue.status === "closed"
            ? "Issue Closed"
            : isClaimedByMe
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
            <Typography sx={{ color: "#9ca3af", fontWeight: 300, fontSize: 14 }}>
              Issue Opened on :
            </Typography>
            <Typography sx={{ color: "#e5e7eb", fontWeight: 500, fontSize: 14 }}>
              {timeAgo(issue.openedAt)}
            </Typography>
          </Stack>

          {(issue.status === "claimed" || !!issue.claimedAt || !!issue.claimedByLogin) && (
            <>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ color: "#9ca3af", fontWeight: 300, fontSize: 14 }}>
                  Issue Claimed on :
                </Typography>
                <Typography sx={{ color: "#e5e7eb", fontWeight: 500, fontSize: 14 }}>
                  {issue.claimedAt ? timeAgo(issue.claimedAt) : "-"}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ color: "#9ca3af", fontWeight: 300, fontSize: 14 }}>
                  Issue Claimed By :
                </Typography>
                <Typography sx={{ color: "#e5e7eb", fontWeight: 500, fontSize: 14 }}>
                  {issue.claimedByLogin || "-"}
                </Typography>
              </Stack>
            </>
          )}
        </Stack>

        {isClaimedByOther && (
          <Button
            fullWidth
            onClick={handleNotify}
            disabled={isWatching}
            sx={{
              mt: 2,
              height: 40,
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 900,
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
