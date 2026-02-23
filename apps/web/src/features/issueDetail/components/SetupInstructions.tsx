import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  IconButton,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import MSym from "../../resources/components/MSym";
import type { IssueDto, SetupInstruction } from "../types";

type Props = {
  issue: IssueDto;
  projectSetup: SetupInstruction[];
  copyToClipboard: (value: string) => void;
};

export default function SetupInstructions({ issue, projectSetup, copyToClipboard }: Props) {
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
            {(issue.autoSetupCommands || []).map((c) => (
              <Box key={c.label + c.command}>
                <Typography sx={{ color: "#d1d5db", fontSize: 10, mb: 0.75, fontWeight: 600 }}>{c.label}</Typography>
                <Paper elevation={0} sx={{ bgcolor: "#11111a", border: "1px solid #2c312a", borderRadius: "12px", px: 2, py: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                  <Typography sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 10, color: "#adadad", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.command}
                  </Typography>
                  <IconButton onClick={() => copyToClipboard(c.command)} sx={{ width: 24, height: 24, borderRadius: "8px", border: "1px solid #2c312a", bgcolor: "#11111a", color: "#9ca3af", "&:hover": { bgcolor: "#1a1a24", color: "#fff" } }}>
                    <MSym name="content_copy" sx={{ fontSize: 18 }} />
                  </IconButton>
                </Paper>
              </Box>
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
          {projectSetup.length === 0 ? (
            <Typography sx={{ color: "#9ca3af", fontSize: 13 }}>No project-specific setup provided.</Typography>
          ) : (
            <Stack spacing={2}>
              {projectSetup.map((c) => (
                <Box key={c.label + c.command}>
                  <Typography sx={{ color: "#d1d5db", fontSize: 10, mb: 0.75, fontWeight: 600 }}>{c.label}</Typography>
                  <Paper elevation={0} sx={{ bgcolor: "#11111a", border: "1px solid #2c312a", borderRadius: "12px", px: 2, py: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                    <Typography sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 10, color: "#adadad", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.command}
                    </Typography>
                    <IconButton onClick={() => copyToClipboard(c.command)} sx={{ width: 24, height: 24, borderRadius: "8px", border: "1px solid #2c312a", bgcolor: "#11111a", color: "#9ca3af", "&:hover": { bgcolor: "#1a1a24", color: "#fff" } }}>
                      <MSym name="content_copy" sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Paper>
                </Box>
              ))}
            </Stack>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
