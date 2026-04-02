import { Types } from "mongoose";
import { Issue } from "../models/Issue";
import { PrTracking } from "../models/PrTracking";

export interface ContributionDay {
  date: string;
  count: number;
  level: number; // 0-4 for color intensity
}

export interface ContributionWeek {
  days: ContributionDay[];
}

export interface ContributionData {
  totalContributions: number;
  weeks: ContributionWeek[];
}

interface ContributionThresholds {
  q1: number;
  q2: number;
  q3: number;
}

interface AggregateCountRow {
  _id: string;
  count: number;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function quantile(sortedValues: number[], percentile: number): number {
  if (!sortedValues.length) return 0;
  const index = Math.floor((sortedValues.length - 1) * percentile);
  return sortedValues[index];
}

function getContributionLevel(count: number, thresholds: ContributionThresholds): number {
  if (count <= 0) return 0;
  if (count <= thresholds.q1) return 1;
  if (count <= thresholds.q2) return 2;
  if (count <= thresholds.q3) return 3;
  return 4;
}

export async function fetchOpenCollabContributionData(userId: string): Promise<ContributionData> {
  const now = new Date();
  const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startDate = addUtcDays(endDate, -364);

  // Build full week columns (Sun-Sat) so the graph stays aligned.
  const calendarStart = addUtcDays(startDate, -startDate.getUTCDay());
  const calendarEnd = addUtcDays(endDate, 6 - endDate.getUTCDay());

  const countsByDate = new Map<string, number>();

  const claimedIssueContributions = await Issue.aggregate<AggregateCountRow>([
    {
      $match: {
        claimedByUserId: userId,
        claimedAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$claimedAt",
            timezone: "UTC"
          }
        },
        count: { $sum: 1 }
      }
    }
  ]);

  for (const row of claimedIssueContributions) {
    countsByDate.set(row._id, (countsByDate.get(row._id) ?? 0) + row.count);
  }

  if (Types.ObjectId.isValid(userId)) {
    const prSubmissionContributions = await PrTracking.aggregate<AggregateCountRow>([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          prUrl: { $ne: null },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "UTC"
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    for (const row of prSubmissionContributions) {
      countsByDate.set(row._id, (countsByDate.get(row._id) ?? 0) + row.count);
    }
  }

  const nonZeroCounts = [...countsByDate.values()].filter((count) => count > 0).sort((a, b) => a - b);
  const thresholds: ContributionThresholds = {
    q1: quantile(nonZeroCounts, 0.25),
    q2: quantile(nonZeroCounts, 0.5),
    q3: quantile(nonZeroCounts, 0.75)
  };

  const weeks: ContributionWeek[] = [];
  let totalContributions = 0;
  let cursor = new Date(calendarStart);

  while (cursor <= calendarEnd) {
    const days: ContributionDay[] = [];

    for (let i = 0; i < 7; i++) {
      const inLastYear = cursor >= startDate && cursor <= endDate;
      const dateKey = toDateKey(cursor);
      const count = inLastYear ? countsByDate.get(dateKey) ?? 0 : 0;

      if (inLastYear) {
        totalContributions += count;
      }

      days.push({
        date: dateKey,
        count,
        level: getContributionLevel(count, thresholds)
      });

      cursor = addUtcDays(cursor, 1);
    }

    weeks.push({ days });
  }

  return {
    totalContributions,
    weeks
  };
}
