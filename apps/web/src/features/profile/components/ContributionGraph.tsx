import { Box, Button, Stack, Typography, Skeleton, Tooltip } from "@mui/material";
import type { ContributionData, ContributionSource } from "../types";

// Color palette matching GitHub's contribution graph
const LEVEL_COLORS = [
  "#161b22", // Level 0 - no contributions
  "#0e4429", // Level 1 - low
  "#006d32", // Level 2 - medium-low  
  "#26a641", // Level 3 - medium-high
  "#39d353"  // Level 4 - high
];

interface ContributionGraphProps {
  data: ContributionData | null;
  loading: boolean;
  error: string | null;
  source: ContributionSource;
  onSourceChange: (source: ContributionSource) => void;
}

const sourceButtonSx = (active: boolean) => ({
  textTransform: "none" as const,
  minHeight: 32,
  px: 1.5,
  borderRadius: "10px",
  fontSize: 12,
  fontWeight: 700,
  border: "1px solid",
  borderColor: active ? "rgba(25,230,107,0.45)" : "#27272a",
  color: active ? "#19e66b" : "#a1a1aa",
  bgcolor: active ? "rgba(25,230,107,0.10)" : "transparent",
  "&:hover": {
    borderColor: active ? "rgba(25,230,107,0.65)" : "rgba(161,161,170,0.45)",
    bgcolor: active ? "rgba(25,230,107,0.14)" : "rgba(255,255,255,0.03)"
  }
});

export default function ContributionGraph({
  data,
  loading,
  error,
  source,
  onSourceChange
}: ContributionGraphProps) {
  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];
  const sourceLabel = source === "github" ? "GitHub" : "OpenCollab";
  
  // Get month labels from the contribution data
  const getMonthLabels = () => {
    if (!data?.weeks.length) return [];
    
    const months: { label: string; position: number }[] = [];
    let lastMonth = -1;
    
    data.weeks.forEach((week, weekIndex) => {
      if (week.days.length > 0) {
        const date = new Date(week.days[0].date);
        const month = date.getMonth();
        if (month !== lastMonth) {
          months.push({
            label: date.toLocaleDateString("en-US", { month: "short" }),
            position: weekIndex
          });
          lastMonth = month;
        }
      }
    });
    
    return months;
  };

  const monthLabels = getMonthLabels();

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
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
        <Stack spacing={0.6}>
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 700,
              color: "#fff"
            }}
          >
            {sourceLabel} Contribution Graph
          </Typography>
          {data && (
            <Typography
              sx={{
                fontSize: 14,
                color: "#a1a1aa"
              }}
            >
              {data.totalContributions.toLocaleString()} {sourceLabel} contributions in the last year
            </Typography>
          )}
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            onClick={() => onSourceChange("open-collab")}
            sx={sourceButtonSx(source === "open-collab")}
          >
            OpenCollab
          </Button>
          <Button
            onClick={() => onSourceChange("github")}
            sx={sourceButtonSx(source === "github")}
          >
            GitHub
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Skeleton
          variant="rounded"
          width="100%"
          height={128}
          sx={{ bgcolor: "#27272a" }}
        />
      ) : error ? (
        <Typography sx={{ color: "#a1a1aa", fontSize: 14, py: 1 }}>
          {error}
        </Typography>
      ) : data ? (
        <Box sx={{ overflowX: "auto" }}>
          {/* Month labels */}
          <Box sx={{ display: "flex", ml: "32px", mb: 0.5, position: "relative", height: 16 }}>
            {monthLabels.map((month, i) => (
              <Typography
                key={i}
                sx={{
                  fontSize: 10,
                  color: "#a1a1aa",
                  position: "absolute",
                  left: month.position * 13,
                  whiteSpace: "nowrap"
                }}
              >
                {month.label}
              </Typography>
            ))}
          </Box>
          
          <Box sx={{ display: "flex", mt: 1 }}>
            {/* Day labels */}
            <Stack spacing={0} sx={{ mr: 0.5 }}>
              {dayLabels.map((label, i) => (
                <Typography
                  key={i}
                  sx={{
                    fontSize: 9,
                    color: "#a1a1aa",
                    height: 11,
                    lineHeight: "11px",
                    width: 24,
                    textAlign: "right",
                    pr: 0.5
                  }}
                >
                  {label}
                </Typography>
              ))}
            </Stack>

            {/* Contribution grid */}
            <Box sx={{ display: "flex", gap: "3px" }}>
              {data.weeks.map((week, weekIndex) => (
                <Stack key={weekIndex} spacing="3px">
                  {week.days.map((day, dayIndex) => (
                    <Tooltip
                      key={dayIndex}
                      title={`${day.count} ${sourceLabel} contributions on ${new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}`}
                      arrow
                      placement="top"
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "2px",
                          bgcolor: LEVEL_COLORS[day.level],
                          cursor: "pointer",
                          "&:hover": {
                            outline: "1px solid rgba(255,255,255,0.3)"
                          }
                        }}
                      />
                    </Tooltip>
                  ))}
                </Stack>
              ))}
            </Box>
          </Box>

          {/* Legend */}
          <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5} sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: 10, color: "#a1a1aa", mr: 0.5 }}>Less</Typography>
            {LEVEL_COLORS.map((color, i) => (
              <Box
                key={i}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "2px",
                  bgcolor: color
                }}
              />
            ))}
            <Typography sx={{ fontSize: 10, color: "#a1a1aa", ml: 0.5 }}>More</Typography>
          </Stack>
        </Box>
      ) : (
        <Typography sx={{ color: "#a1a1aa", fontSize: 14, py: 1 }}>
          No contribution data available.
        </Typography>
      )}
    </Box>
  );
}
