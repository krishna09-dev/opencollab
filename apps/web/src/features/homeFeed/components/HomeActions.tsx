import { Button, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

type Props = {
  featuredIssueId: string;
  issuesLoading: boolean;
  loadIssues: () => void;
};

export default function HomeActions({ featuredIssueId, issuesLoading, loadIssues }: Props) {
  const navigate = useNavigate();

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
      <Button
        variant="contained"
        onClick={() => navigate(`/issues/${featuredIssueId}`)}
        sx={{
          height: 44,
          px: 3,
          borderRadius: 999,
          textTransform: "none",
          fontWeight: 900,
          bgcolor: "#19e66b",
          color: "#000",
          "&:hover": { bgcolor: "#22c55e" }
        }}
      >
        Browse Issues
      </Button>

      <Button
        variant="outlined"
        onClick={() => navigate("/resources")}
        sx={{
          height: 44,
          px: 3,
          borderRadius: 999,
          textTransform: "none",
          fontWeight: 900,
          borderColor: "rgba(25,230,107,0.35)",
          color: "#19e66b",
          bgcolor: "rgba(25,230,107,0.08)",
          "&:hover": { bgcolor: "rgba(25,230,107,0.12)", borderColor: "rgba(25,230,107,0.55)" }
        }}
      >
        Resources
      </Button>

      <Button
        variant="outlined"
        onClick={() => navigate("/pr-tracking")}
        sx={{
          height: 44,
          px: 3,
          borderRadius: 999,
          textTransform: "none",
          fontWeight: 900,
          borderColor: "rgba(59,130,246,0.35)",
          color: "#93c5fd",
          bgcolor: "rgba(59,130,246,0.08)",
          "&:hover": { bgcolor: "rgba(59,130,246,0.12)", borderColor: "rgba(59,130,246,0.55)" }
        }}
      >
        PR Tracking
      </Button>

      <Button
        variant="outlined"
        onClick={loadIssues}
        disabled={issuesLoading}
        sx={{
          height: 44,
          px: 3,
          borderRadius: 999,
          textTransform: "none",
          fontWeight: 900,
          borderColor: "rgba(255,255,255,0.25)",
          color: "#fff",
          "&:hover": { borderColor: "rgba(255,255,255,0.40)", bgcolor: "rgba(255,255,255,0.06)" }
        }}
      >
        {issuesLoading ? "Refreshing..." : "Refresh"}
      </Button>
    </Stack>
  );
}
