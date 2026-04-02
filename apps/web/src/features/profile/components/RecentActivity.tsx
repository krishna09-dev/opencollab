import { Box, Link, Skeleton, Stack, Typography } from "@mui/material";
import type { ProfileActivityItem, ProfileActivityType } from "../types";
import MSym from "../../resources/components/MSym";

interface RecentActivityProps {
  activities: ProfileActivityItem[];
  loading: boolean;
  error: string | null;
}

function getActivityMeta(type: ProfileActivityType): { icon: string; color: string; label: string } {
  switch (type) {
    case "issue_claimed":
      return { icon: "assignment_ind", color: "#22c55e", label: "Claimed Issue" };
    case "pr_opened":
      return { icon: "fork_right", color: "#60a5fa", label: "Opened PR" };
    case "pr_merged":
      return { icon: "done_all", color: "#22c55e", label: "Merged PR" };
    case "pr_closed":
      return { icon: "cancel", color: "#f97316", label: "Closed PR" };
    default:
      return { icon: "history", color: "#a1a1aa", label: "Activity" };
  }
}

function formatRelativeTime(at: string): string {
  const now = Date.now();
  const time = new Date(at).getTime();
  const diffMs = Math.max(0, now - time);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  return `${Math.floor(diffMs / day)}d ago`;
}

export default function RecentActivity({ activities, loading, error }: RecentActivityProps) {
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
        Recent Activity
      </Typography>

      {loading ? (
        <Stack spacing={1.5}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={54} sx={{ bgcolor: "#27272a" }} />
          ))}
        </Stack>
      ) : error ? (
        <Typography sx={{ color: "#a1a1aa", fontSize: 14 }}>{error}</Typography>
      ) : activities.length === 0 ? (
        <Typography sx={{ color: "#a1a1aa", fontSize: 14 }}>
          No activity yet. Claim an issue or submit a PR to see updates here.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {activities.slice(0, 5).map((activity) => {
            const meta = getActivityMeta(activity.type);
            return (
              <Stack key={activity.id} direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "999px",
                    border: `1px solid ${meta.color}55`,
                    bgcolor: `${meta.color}18`,
                    display: "grid",
                    placeItems: "center",
                    mt: 0.1
                  }}
                >
                  <MSym name={meta.icon} sx={{ fontSize: 16, color: meta.color }} />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
                    <Typography sx={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
                      {activity.title}
                    </Typography>
                    <Typography sx={{ color: "#71717a", fontSize: 11, fontWeight: 700 }}>
                      {meta.label}
                    </Typography>
                  </Stack>

                  <Typography sx={{ color: "#a1a1aa", fontSize: 13, mt: 0.35 }}>
                    {activity.description}
                  </Typography>

                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                    <Typography sx={{ color: "#71717a", fontSize: 12 }}>
                      {formatRelativeTime(activity.at)}
                    </Typography>
                    <Typography sx={{ color: "#52525b", fontSize: 12 }}>•</Typography>
                    <Typography sx={{ color: "#71717a", fontSize: 12 }}>
                      {new Date(activity.at).toLocaleString()}
                    </Typography>
                    {activity.url && (
                      <>
                        <Typography sx={{ color: "#52525b", fontSize: 12 }}>•</Typography>
                        <Link
                          href={activity.url}
                          target="_blank"
                          rel="noreferrer"
                          underline="hover"
                          sx={{ color: "#19e66b", fontSize: 12, fontWeight: 600 }}
                        >
                          Open
                        </Link>
                      </>
                    )}
                  </Stack>
                </Box>
              </Stack>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
