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
    <Paper elevation={0} sx={{ borderRadius: "12px", bgcolor: "#11111a", border: "1px solid #2c312a", p: 3, mb: 2.5 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <MSym name="library_books" sx={{ fontSize: 22, color: "#fff" }} />
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#fff", textTransform: "uppercase" }}>
          Suggested Resources
        </Typography>
      </Stack>

      <Box sx={{ height: 1, bgcolor: "#2c312a", mb: 1.5 }} />

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
              gap: 1,
              p: 0.5,
              borderRadius: "8px",
              color: "#d1d5db",
              "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }
            }}
          >
            <Box sx={{ width: 24, height: 24, borderRadius: "8px", bgcolor: "#0b0b10", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa" }}>
              <MSym name="article" sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 400, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {r.title}
              </Typography>
              <Typography sx={{ fontSize: 10, color: "#adadad", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {r.type || r.url.replace("https://", "").replace("http://", "")}
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
              fontSize: 16,
              fontWeight: 400,
              color: "#fff",
              px: 0,
              paddingRight: 1,
              minWidth: "auto",
              textDecoration: "underline",
              "& .MuiButton-endIcon": {
                ml: 0.5
              },
              "&:hover": {
                bgcolor: "transparent",
                color: "#e5e7eb"
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
