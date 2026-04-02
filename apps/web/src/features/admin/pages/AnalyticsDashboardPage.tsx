import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Alert,
  Box,
  CircularProgress,
  Stack,
  Typography
} from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from "recharts";
import MSym from "../../resources/components/MSym";
import AdminLayout from "../components/AdminLayout";
import { fetchAnalytics, type PlatformAnalytics } from "../api/adminApi";

const EMPTY_ANALYTICS: PlatformAnalytics = {
  overview: {
    users: {
      total: 0,
      newLast30Days: 0,
      withActiveClaims: 0,
      withPrs: 0
    },
    issues: {
      total: 0,
      open: 0,
      claimed: 0,
      closed: 0,
      approved: 0,
      visible: 0,
      beginnerFriendly: 0,
      newLast30Days: 0
    },
    prs: {
      total: 0,
      open: 0,
      merged: 0,
      closed: 0,
      newLast30Days: 0,
      newLast7Days: 0
    },
    ml: {
      issuesScored: 0,
      issuesWithOverride: 0,
      averageScore: 0,
      scoringCoverage: 0
    },
    recommendations: {
      totalClicks: 0,
      totalClaims: 0,
      totalCompletions: 0,
      successRate: 0,
      completionRate: 0
    },
    reports: {
      total: 0,
      pending: 0,
      resolved: 0,
      newLast30Days: 0
    },
    repositories: {
      total: 0,
      active: 0
    }
  },
  timeSeries: {
    issues: [],
    claims: [],
    mergedPrs: []
  },
  topContributors: [],
  topRepositories: []
};

function StatCard({
  icon,
  label,
  value,
  subtitle,
  color
}: {
  icon: string;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
}) {
  return (
    <Box
      sx={{
        bgcolor: "#0b0f17",
        border: "1px solid #27272a",
        borderRadius: "12px",
        p: 2.5,
        flex: 1,
        minWidth: 150
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "10px",
            bgcolor: `${color}20`,
            display: "grid",
            placeItems: "center"
          }}
        >
          <MSym name={icon} sx={{ fontSize: 17, color }} />
        </Box>
        <Typography sx={{ color: "#71717a", fontSize: 12, fontWeight: 500 }}>
          {label}
        </Typography>
      </Stack>
      <Typography sx={{ color: "#fff", fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography sx={{ color: "#71717a", fontSize: 12, mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

function ChartCard({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        bgcolor: "#0b0f17",
        border: "1px solid #27272a",
        borderRadius: "12px",
        p: 2.5,
        minHeight: 340
      }}
    >
      <Typography sx={{ color: "#fff", fontSize: 15, fontWeight: 600, mb: 0.5 }}>
        {title}
      </Typography>
      <Typography sx={{ color: "#71717a", fontSize: 12, mb: 2 }}>
        {subtitle}
      </Typography>
      <Box sx={{ width: "100%", height: 260 }}>{children}</Box>
    </Box>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "grid",
        placeItems: "center",
        color: "#71717a",
        border: "1px dashed #27272a",
        borderRadius: "10px"
      }}
    >
      <Typography sx={{ fontSize: 13 }}>{message}</Typography>
    </Box>
  );
}

function buildLastNDaysIso(days: number) {
  const result: string[] = [];
  const now = new Date();
  const todayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(todayUtc);
    d.setUTCDate(todayUtc.getUTCDate() - i);

    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    result.push(`${year}-${month}-${day}`);
  }

  return result;
}

function formatAxisDate(isoDate: string) {
  const [yearStr, monthStr, dayStr] = isoDate.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!year || !month || !day) return isoDate;

  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return utcDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });
}

function shortRepoName(fullName: string, max = 20) {
  if (fullName.length <= max) return fullName;
  return `${fullName.slice(0, max - 1)}...`;
}

export default function AnalyticsDashboardPage() {
  const location = useLocation();
  const isModeratorRoute = location.pathname.startsWith("/moderator");
  const accentColor = isModeratorRoute ? "#38bdf8" : "#fb923c";

  const [analytics, setAnalytics] = useState<PlatformAnalytics>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAnalytics();
        setAnalytics(data);
      } catch (err: any) {
        const status = err?.response?.status;
        setAnalytics(EMPTY_ANALYTICS);
        if (status === 401 || status === 403) {
          setError(err.response?.data?.message || "Access denied");
        } else {
          setError("Failed to load analytics");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { overview, topContributors, topRepositories } = analytics;

  const activitySeries = useMemo(() => {
    const dayKeys = buildLastNDaysIso(30);
    const issueCounts = new Map(analytics.timeSeries.issues.map((row) => [row._id, row.count]));
    const claimCounts = new Map(analytics.timeSeries.claims.map((row) => [row._id, row.count]));
    const mergedPrCounts = new Map(analytics.timeSeries.mergedPrs.map((row) => [row._id, row.count]));

    return dayKeys.map((day) => ({
      day,
      issues: issueCounts.get(day) || 0,
      claims: claimCounts.get(day) || 0,
      mergedPrs: mergedPrCounts.get(day) || 0
    }));
  }, [analytics.timeSeries]);

  const issueDistribution = useMemo(
    () => [
      { name: "Open", value: overview.issues.open, color: "#22c55e" },
      { name: "Claimed", value: overview.issues.claimed, color: "#fb923c" },
      { name: "Closed", value: overview.issues.closed, color: "#ef4444" }
    ],
    [overview.issues]
  );

  const prDistribution = useMemo(
    () => [
      { name: "Open", value: overview.prs.open, color: "#3b82f6" },
      { name: "Merged", value: overview.prs.merged, color: "#22c55e" },
      { name: "Closed", value: overview.prs.closed, color: "#ef4444" }
    ],
    [overview.prs]
  );

  const topRepositoryChartData = useMemo(
    () =>
      topRepositories.slice(0, 8).map((repo) => ({
        name: shortRepoName(repo.repoFullName),
        fullName: repo.repoFullName,
        totalIssues: repo.totalIssues,
        claimedIssues: repo.claimedIssues
      })),
    [topRepositories]
  );

  const topContributorChartData = useMemo(
    () =>
      topContributors.slice(0, 8).map((contributor) => ({
        login: contributor.login,
        mergedPrCount: contributor.mergedPrCount
      })),
    [topContributors]
  );

  const hasActivityData = activitySeries.some(
    (item) => item.issues > 0 || item.claims > 0 || item.mergedPrs > 0
  );
  const hasIssueDistribution = issueDistribution.some((item) => item.value > 0);
  const hasPrDistribution = prDistribution.some((item) => item.value > 0);
  const hasRepoData = topRepositoryChartData.length > 0;
  const hasContributorData = topContributorChartData.length > 0;

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={28} sx={{ color: accentColor }} />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 600 }}>Platform Analytics</Typography>
          <Typography sx={{ color: "#a1a1aa", fontSize: 14 }}>
            Overview of platform activity and performance
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              bgcolor: "rgba(239,68,68,0.1)",
              color: "#f87171",
              border: "1px solid rgba(239,68,68,0.2)",
              "& .MuiAlert-icon": { color: "#f87171" }
            }}
          >
            {error}
          </Alert>
        )}

        {!isModeratorRoute && (
          <Box>
            <Typography sx={{ color: "#a1a1aa", fontWeight: 600, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", mb: 1.5 }}>
              Users
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <StatCard icon="group" label="Total Users" value={overview.users.total} subtitle={`+${overview.users.newLast30Days} last 30d`} color="#3b82f6" />
              <StatCard icon="assignment_ind" label="Active Contributors" value={overview.users.withActiveClaims} color="#22c55e" />
              <StatCard icon="fork_right" label="With PRs" value={overview.users.withPrs} color="#a855f7" />
              <StatCard icon="trending_up" label="Activity Rate" value={`${Math.round((overview.users.withActiveClaims / (overview.users.total || 1)) * 100)}%`} color="#fb923c" />
            </Stack>
          </Box>
        )}

        {/* Issues */}
        <Box>
          <Typography sx={{ color: "#a1a1aa", fontWeight: 600, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", mb: 1.5 }}>
            Issues
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <StatCard icon="bug_report" label="Total Issues" value={overview.issues.total} subtitle={`+${overview.issues.newLast30Days} last 30d`} color="#3b82f6" />
            <StatCard icon="radio_button_checked" label="Open" value={overview.issues.open} color="#22c55e" />
            <StatCard icon="assignment_ind" label="Claimed" value={overview.issues.claimed} color="#fb923c" />
            <StatCard icon="school" label="Beginner Friendly" value={overview.issues.beginnerFriendly} color="#a855f7" />
          </Stack>
        </Box>

        {/* Pull Requests */}
        <Box>
          <Typography sx={{ color: "#a1a1aa", fontWeight: 600, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", mb: 1.5 }}>
            Pull Requests
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <StatCard icon="fork_right" label="Total PRs" value={overview.prs.total} subtitle={`+${overview.prs.newLast7Days} last 7d`} color="#3b82f6" />
            <StatCard icon="check_circle" label="Merged" value={overview.prs.merged} color="#22c55e" />
            <StatCard icon="pending" label="Open" value={overview.prs.open} color="#fb923c" />
            <StatCard icon="trending_up" label="Success Rate" value={`${Math.round((overview.prs.merged / (overview.prs.total || 1)) * 100)}%`} color="#a855f7" />
          </Stack>
        </Box>

        {/* Repositories */}
        <Box>
          <Typography sx={{ color: "#a1a1aa", fontWeight: 600, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", mb: 1.5 }}>
            Repositories
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <StatCard icon="folder_code" label="Tracked Repos" value={overview.repositories.total} color="#3b82f6" />
            <StatCard icon="check_circle" label="Active Repos" value={overview.repositories.active} color="#22c55e" />
            <StatCard
              icon="monitoring"
              label="Activation Rate"
              value={`${Math.round((overview.repositories.active / (overview.repositories.total || 1)) * 100)}%`}
              color={accentColor}
            />
          </Stack>
        </Box>

        {/* Activity Trend */}
        <ChartCard
          title="Activity Trend"
          subtitle="Daily issues created, claims started, and merged PRs over the last 30 days"
        >
          {hasActivityData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activitySeries} margin={{ top: 4, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  stroke="#71717a"
                  tickFormatter={formatAxisDate}
                  minTickGap={28}
                />
                <YAxis stroke="#71717a" allowDecimals={false} />
                <RechartsTooltip
                  labelFormatter={(label) => formatAxisDate(String(label))}
                  contentStyle={{
                    backgroundColor: "#050509",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    color: "#fff"
                  }}
                  cursor={{ stroke: "#27272a" }}
                />
                <Legend wrapperStyle={{ color: "#a1a1aa", paddingTop: 8 }} />
                <Line
                  type="monotone"
                  dataKey="issues"
                  name="Issues"
                  stroke={accentColor}
                  strokeWidth={2.4}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="claims"
                  name="Claims"
                  stroke="#22c55e"
                  strokeWidth={2.2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="mergedPrs"
                  name="Merged PRs"
                  stroke="#a855f7"
                  strokeWidth={2.2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState message="No trend data available for the selected period" />
          )}
        </ChartCard>

        {/* Distribution Charts */}
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <ChartCard
              title="Issue Status Distribution"
              subtitle="Current split of open, claimed, and closed issues"
            >
              {hasIssueDistribution ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={issueDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={88}
                      paddingAngle={2}
                    >
                      {issueDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ color: "#a1a1aa", paddingTop: 6 }} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#050509",
                        border: "1px solid #27272a",
                        borderRadius: "8px",
                        color: "#fff"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState message="No issue status data available" />
              )}
            </ChartCard>
          </Box>

          <Box sx={{ flex: 1 }}>
            <ChartCard
              title="PR Status Distribution"
              subtitle="Current split of open, merged, and closed pull requests"
            >
              {hasPrDistribution ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prDistribution} margin={{ top: 4, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#71717a" />
                    <YAxis stroke="#71717a" allowDecimals={false} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#050509",
                        border: "1px solid #27272a",
                        borderRadius: "8px",
                        color: "#fff"
                      }}
                    />
                    <Bar dataKey="value" name="PRs" radius={[8, 8, 0, 0]}>
                      {prDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState message="No PR status data available" />
              )}
            </ChartCard>
          </Box>
        </Stack>

        {/* Top Repository Activity */}
        <ChartCard
          title="Top Repositories"
          subtitle="Most active repositories by total issues and claimed issues"
        >
          {hasRepoData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topRepositoryChartData}
                layout="vertical"
                margin={{ top: 4, right: 8, left: 24, bottom: 8 }}
              >
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#71717a" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={150} stroke="#71717a" />
                <RechartsTooltip
                  formatter={(value, name) => [value ?? 0, name === "totalIssues" ? "Total Issues" : "Claimed Issues"]}
                  labelFormatter={(_, payload) => {
                    const item = payload && payload[0] ? payload[0].payload : null;
                    return item?.fullName || "Repository";
                  }}
                  contentStyle={{
                    backgroundColor: "#050509",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    color: "#fff"
                  }}
                />
                <Legend wrapperStyle={{ color: "#a1a1aa", paddingTop: 4 }} />
                <Bar dataKey="totalIssues" name="Total Issues" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                <Bar dataKey="claimedIssues" name="Claimed Issues" fill="#22c55e" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState message="No repository data available" />
          )}
        </ChartCard>

        {!isModeratorRoute && (
          <ChartCard
            title="Top Contributors"
            subtitle="Users with the most merged pull requests"
          >
            {hasContributorData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topContributorChartData} margin={{ top: 4, right: 8, left: 0, bottom: 16 }}>
                  <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="login"
                    stroke="#71717a"
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis stroke="#71717a" allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#050509",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                      color: "#fff"
                    }}
                  />
                  <Bar dataKey="mergedPrCount" name="Merged PRs" fill={accentColor} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message="No contributor data available" />
            )}
          </ChartCard>
        )}
      </Stack>
    </AdminLayout>
  );
}
