export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface GoodFirstIssue {
  _id: string;
  githubNumber: number;
  repoOwner: string;
  repoName: string;
  repoLanguage?: string | null;
  title: string;
  body: string;
  summary: string;
  status: "open" | "claimed" | "closed";
  labels: string[];
  requiredSkills: string[];
  beginnerFriendly: boolean;
  githubCreatedAt: string;
  githubUpdatedAt: string;
  claimedByLogin?: string | null;
  githubUrl: string;
  difficulty: DifficultyLevel;
  matchScore?: number;
}

export interface GoodFirstIssuesFilters {
  page?: number;
  limit?: number;
  difficulty?: DifficultyLevel;
  language?: string;
  search?: string;
}

export interface GoodFirstIssuesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DifficultyConfig {
  level: DifficultyLevel;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  beginner: {
    level: "beginner",
    label: "Beginner",
    description: "Perfect for first-time contributors. Simple fixes, documentation, or typos.",
    color: "#2dd4bf",
    bgColor: "rgba(45,212,191,0.1)",
    borderColor: "rgba(45,212,191,0.3)",
    icon: "emoji_objects"
  },
  intermediate: {
    level: "intermediate",
    label: "Intermediate",
    description: "Some coding experience needed. Feature additions or bug fixes.",
    color: "#facc15",
    bgColor: "rgba(250,204,21,0.1)",
    borderColor: "rgba(250,204,21,0.3)",
    icon: "code"
  },
  advanced: {
    level: "advanced",
    label: "Advanced",
    description: "For experienced developers. Complex features or architectural changes.",
    color: "#f87171",
    bgColor: "rgba(248,113,113,0.1)",
    borderColor: "rgba(248,113,113,0.3)",
    icon: "rocket_launch"
  }
};
