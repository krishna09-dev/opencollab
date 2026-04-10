import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography
} from "@mui/material";
import MSym from "../../resources/components/MSym";
import { timeAgo } from "../utils";
import type { IssueDto } from "../types";

type Props = {
  issue: IssueDto;
  refreshingStatus: boolean;
  refreshStatusOnly: () => void;
};

export default function ContributionTimeline({ issue, refreshingStatus, refreshStatusOnly }: Props) {
  return (
    <Box sx={{ mt: 4 }}>
      <Accordion disableGutters elevation={0} defaultExpanded sx={{ bgcolor: "transparent", borderTop: "1px solid #2c312a", "&:before": { display: "none" } }}>
        <AccordionSummary expandIcon={<MSym name="expand_more" sx={{ color: "#9ca3af" }} />} sx={{ px: 0, minHeight: 56 }}>
          <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 32 }}>CONTRIBUTION TIMELINE</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pb: 3 }}>
          <Stack spacing={2}>
            {(issue.contributionTimeline || []).length === 0 ? (
              <Typography sx={{ color: "#9ca3af", fontSize: 13 }}>No timeline yet.</Typography>
            ) : (
              (issue.contributionTimeline || []).map((t) => (
                <Stack key={t.id} direction="row" spacing={2} alignItems="center">
                  <Box sx={{ width: 22, height: 22, borderRadius: 999, bgcolor: "rgba(25,230,107,0.10)", border: "1px solid rgba(25,230,107,0.25)" }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: "#adadad", fontWeight: 400, fontSize: 16 }}>{t.title}</Typography>
                    <Typography sx={{ color: "#adadad", fontSize: 14 }}>{timeAgo(t.at)}</Typography>
                  </Box>
                  <Chip label={t.status} size="small" sx={{ height: 20, fontSize: 8, fontWeight: 700, borderRadius: "6px", bgcolor: "#11111a", border: "1px solid #2c312a", color: "#d1d5db" }} />
                </Stack>
              ))
            )}

            <Button
              variant="contained"
              disabled={refreshingStatus}
              sx={{ mt: 2, alignSelf: "flex-end", bgcolor: "#55fc7b", color: "#000", borderRadius: "12px", px: 3, textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#22c55e" } }}
              onClick={refreshStatusOnly}
              startIcon={refreshingStatus ? <CircularProgress size={14} color="inherit" /> : <MSym name="refresh" sx={{ fontSize: 16 }} />}
            >
              Refresh from GitHub
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
