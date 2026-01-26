import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import MSym from "../../resources/components/MSym";
import type { IssueDto } from "../types";

type Props = {
  issue: IssueDto;
};

export default function SuggestedResourcesCard({ issue }: Props) {
  const navigate = useNavigate();

  return (
    <Paper elevation={0} sx={{ borderRadius: "24px", bgcolor: "#101110", border: "1px solid rgba(255,255,255,0.08)", p: 2.5, mb: 2.5 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <MSym name="library_books" sx={{ fontSize: 18, color: "#9ca3af" }} />
        <Typography sx={{ fontSize: 12, fontWeight: 900, color: "#9ca3af", letterSpacing: 1.2, textTransform: "uppercase" }}>
          Suggested Resources
        </Typography>
      </Stack>

      <Stack spacing={1.25}>
        {(issue.suggestedResources || []).slice(0, 3).map((r) => (
          <Box
            key={r.url}
            component="a"
            href={r.url}
            target="_blank"
            rel="noreferrer"
            sx={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1.25,
              borderRadius: "16px",
              color: "#d1d5db",
              "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }
            }}
          >
            <Box sx={{ width: 32, height: 32, borderRadius: "10px", bgcolor: "#0b0b10", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa" }}>
              <MSym name="article" sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#d1d5db", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {r.title}
              </Typography>
              <Typography sx={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {r.url.replace("https://", "").replace("http://", "")}
              </Typography>
            </Box>
            <MSym name="arrow_outward" sx={{ fontSize: 16, color: "#4b5563" }} />
          </Box>
        ))}
        {/* Find more */}
        <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
          <Button
            onClick={() => navigate("/resources")}
            endIcon={<MSym name="arrow_outward" sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: "none",
              fontSize: 13,
              fontWeight: 700,
              color: "#9ca3af",
              px: 0,
              paddingRight: 2,
              minWidth: "auto",
              "& .MuiButton-endIcon": {
                ml: 0.5
              },
              "&:hover": {
                bgcolor: "transparent",
                color: "#e5e7eb",
              }
            }}
          >
            Find more
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
