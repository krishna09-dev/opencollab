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
      <Accordion disableGutters elevation={0} defaultExpanded sx={{ bgcolor: "transparent", borderTop: "1px solid rgba(255,255,255,0.08)", "&:before": { display: "none" } }}>
        <AccordionSummary expandIcon={<MSym name="expand_more" sx={{ color: "#9ca3af" }} />} sx={{ px: 0, minHeight: 56 }}>
          <Typography sx={{ color: "#fff", fontWeight: 900 }}>CONTRIBUTION TIMELINE</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pb: 3 }}>
          <Stack spacing={2}>
            {(issue.contributionTimeline || []).length === 0 ? (
              <Typography sx={{ color: "#9ca3af", fontSize: 13 }}>No timeline yet.</Typography>
            ) : (
              (issue.contributionTimeline || []).map((t) => (
                <Stack key={t.id} direction="row" spacing={2} alignItems="center">
                  <Box sx={{ width: 18, height: 18, borderRadius: 999, bgcolor: "rgba(25,230,107,0.10)", border: "1px solid rgba(25,230,107,0.25)" }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: "#e5e7eb", fontWeight: 700, fontSize: 13 }}>{t.title}</Typography>
                    <Typography sx={{ color: "#6b7280", fontSize: 12 }}>{timeAgo(t.at)}</Typography>
                  </Box>
                  <Chip label={t.status} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 800, borderRadius: 999, bgcolor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#d1d5db" }} />
                </Stack>
              ))
            )}

            <Button
              variant="contained"
              disabled={refreshingStatus}
              sx={{ mt: 2, alignSelf: "flex-end", bgcolor: "#19e66b", color: "#000", borderRadius: "12px", px: 2.5, textTransform: "none", fontWeight: 900, "&:hover": { bgcolor: "#22c55e" } }}
              onClick={refreshStatusOnly}
              startIcon={refreshingStatus ? <CircularProgress size={14} /> : undefined}
            >
              Refresh Status
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
