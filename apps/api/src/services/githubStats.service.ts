// apps/api/src/services/githubStats.service.ts
import axios from "axios";
import { GITHUB } from "../config/github";

interface GitHubEvent {
  type: string;
  created_at: string;
  payload?: {
    action?: string;
    commits?: Array<{ sha: string }>;
  };
}

interface GitHubUser {
  public_repos: number;
  followers: number;
  following: number;
}

export interface GitHubStats {
  commits: number;
  pullRequests: number;
  issues: number;
  codeReviews: number;
  publicRepos: number;
  followers: number;
}

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

/**
 * Fetch GitHub activity stats for a user
 */
export async function fetchGitHubStats(
  accessToken: string,
  username: string
): Promise<GitHubStats> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  try {
    // Fetch user profile and events in parallel
    const [userRes, eventsRes] = await Promise.all([
      axios.get<GitHubUser>(`${GITHUB.apiBaseUrl}/user`, { headers }),
      axios.get<GitHubEvent[]>(`${GITHUB.apiBaseUrl}/users/${username}/events`, {
        headers,
        params: { per_page: 100 }
      })
    ]);

    const user = userRes.data;
    const events = eventsRes.data;

    // Count different event types
    let commits = 0;
    let pullRequests = 0;
    let issues = 0;
    let codeReviews = 0;

    for (const event of events) {
      switch (event.type) {
        case "PushEvent":
          // Each push can have multiple commits
          commits += event.payload?.commits?.length || 1;
          break;
        case "PullRequestEvent":
          if (event.payload?.action === "opened") {
            pullRequests++;
          }
          break;
        case "IssuesEvent":
          if (event.payload?.action === "opened") {
            issues++;
          }
          break;
        case "PullRequestReviewEvent":
          codeReviews++;
          break;
        case "PullRequestReviewCommentEvent":
          // Also count review comments as reviews
          codeReviews++;
          break;
      }
    }

    return {
      commits,
      pullRequests,
      issues,
      codeReviews,
      publicRepos: user.public_repos,
      followers: user.followers
    };
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    throw error;
  }
}

/**
 * Fetch contribution calendar data using GitHub GraphQL API
 */
export async function fetchContributionData(
  accessToken: string,
  username: string
): Promise<ContributionData> {
  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                contributionLevel
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      "https://api.github.com/graphql",
      {
        query,
        variables: { username }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    const calendar = response.data.data?.user?.contributionsCollection?.contributionCalendar;

    if (!calendar) {
      throw new Error("Unable to fetch contribution data");
    }

    // Map contribution levels to numbers (0-4)
    const levelMap: Record<string, number> = {
      NONE: 0,
      FIRST_QUARTILE: 1,
      SECOND_QUARTILE: 2,
      THIRD_QUARTILE: 3,
      FOURTH_QUARTILE: 4
    };

    const weeks: ContributionWeek[] = calendar.weeks.map(
      (week: { contributionDays: Array<{ date: string; contributionCount: number; contributionLevel: string }> }) => ({
        days: week.contributionDays.map((day) => ({
          date: day.date,
          count: day.contributionCount,
          level: levelMap[day.contributionLevel] || 0
        }))
      })
    );

    return {
      totalContributions: calendar.totalContributions,
      weeks
    };
  } catch (error) {
    console.error("Error fetching contribution data:", error);
    throw error;
  }
}
