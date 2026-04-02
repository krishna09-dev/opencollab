import { Box, Grid, Stack, Typography, Skeleton } from "@mui/material";
import {
  CommitRounded,
  MergeRounded,
  BugReportRounded,
  RateReviewRounded,
  FolderRounded,
  PeopleRounded
} from "@mui/icons-material";
import type { GitHubStats as GitHubStatsType } from "../types";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <Box
      sx={{
        borderRadius: 2,
        border: "1px solid #27272a",
        bgcolor: "rgba(10,10,14,0.62)",
        p: 2.5,
        display: "flex",
        alignItems: "center",
        gap: 2
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 1.5,
          bgcolor: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color
        }}
      >
        {icon}
      </Box>
      <Stack spacing={0.25}>
        <Typography
          sx={{
            fontSize: 24,
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1
          }}
        >
          {value.toLocaleString()}
        </Typography>
        <Typography
          sx={{
            fontSize: 13,
            color: "#a1a1aa"
          }}
        >
          {label}
        </Typography>
      </Stack>
    </Box>
  );
}

function StatCardSkeleton() {
  return (
    <Box
      sx={{
        borderRadius: 2,
        border: "1px solid #27272a",
        bgcolor: "rgba(10,10,14,0.62)",
        p: 2.5,
        display: "flex",
        alignItems: "center",
        gap: 2
      }}
    >
      <Skeleton variant="rounded" width={44} height={44} sx={{ bgcolor: "#27272a" }} />
      <Stack spacing={0.5}>
        <Skeleton variant="text" width={60} height={28} sx={{ bgcolor: "#27272a" }} />
        <Skeleton variant="text" width={80} height={16} sx={{ bgcolor: "#27272a" }} />
      </Stack>
    </Box>
  );
}

interface GitHubStatsProps {
  stats: GitHubStatsType | null;
  loading: boolean;
  error: string | null;
}

export default function GitHubStats({ stats, loading, error }: GitHubStatsProps) {
  if (error) {
    return (
      <Box
        sx={{
          borderRadius: 3,
          border: "1px solid #27272a",
          bgcolor: "rgba(10,10,14,0.62)",
          p: { xs: 3, md: 4 },
          mb: 3,
          textAlign: "center"
        }}
      >
        <Typography sx={{ color: "#a1a1aa", fontSize: 14 }}>
          Unable to load GitHub stats
        </Typography>
      </Box>
    );
  }

  const statItems = stats
    ? [
        { icon: <CommitRounded />, label: "Commits (90d)", value: stats.commits, color: "#19e66b" },
        { icon: <MergeRounded />, label: "Pull Requests", value: stats.pullRequests, color: "#a78bfa" },
        { icon: <BugReportRounded />, label: "Issues Opened", value: stats.issues, color: "#f59e0b" },
        { icon: <RateReviewRounded />, label: "Code Reviews", value: stats.codeReviews, color: "#38bdf8" },
        { icon: <FolderRounded />, label: "Public Repos", value: stats.publicRepos, color: "#fb7185" },
        { icon: <PeopleRounded />, label: "Followers", value: stats.followers, color: "#818cf8" }
      ]
    : [];

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: "1px solid #27272a",
        bgcolor: "rgba(10,10,14,0.62)",
        p: { xs: 3, md: 4 },
        mb: 3
      }}
    >
      <Typography
        sx={{
          fontSize: 18,
          fontWeight: 700,
          color: "#fff",
          mb: 2.5
        }}
      >
        GitHub Activity
      </Typography>

      <Grid container spacing={2}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Grid size={{ xs: 6, md: 4 }} key={i}>
                <StatCardSkeleton />
              </Grid>
            ))
          : statItems.map((item) => (
              <Grid size={{ xs: 6, md: 4 }} key={item.label}>
                <StatCard {...item} />
              </Grid>
            ))}
      </Grid>
    </Box>
  );
}
