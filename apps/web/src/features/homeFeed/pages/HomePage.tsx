import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useHomeFeed } from "../hooks/useHomeFeed";
import HomeActions from "../components/HomeActions";
import IssuesTable from "../components/IssuesTable";

const FEATURED_ISSUE_ID = "69627dbcb167839c878730af";

export default function HomePage() {
  const {
    loading,
    headline,
    stats,
    issuesLoading,
    issuesError,
    tableRows,
    loadIssues
  } = useHomeFeed();

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#050509",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#f5f5f5"
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#050509",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#f5f5f5",
        px: 2
      }}
    >
      <Stack spacing={3} alignItems="center" sx={{ width: "100%", maxWidth: 1100 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, textAlign: "center" }}>
          {headline}
        </Typography>

        {stats && (
          <Typography sx={{ color: "#9ca3af", fontSize: 13, textAlign: "center", maxWidth: 520 }}>
            In DB: {stats.total} issues • Open: {stats.open} • Beginner-friendly: {stats.beginner}
          </Typography>
        )}

        <HomeActions
          featuredIssueId={FEATURED_ISSUE_ID}
          issuesLoading={issuesLoading}
          loadIssues={loadIssues}
        />

        <Typography sx={{ color: "#9ca3af", fontSize: 13, textAlign: "center", maxWidth: 520 }}>
          Browse all issues available in the database, claim one, and track your PR progress.
        </Typography>

        <IssuesTable
          tableRows={tableRows}
          issuesLoading={issuesLoading}
          issuesError={issuesError}
        />
      </Stack>
    </Box>
  );
}
