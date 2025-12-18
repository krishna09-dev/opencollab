export type ResourceDifficulty = "beginner" | "intermediate" | "advanced";
export type ResourceType = "docs" | "video" | "guide" | "cheatsheet" | "article";

export type ResourceCategory =
  | "Git"
  | "GitHub"
  | "Project Setup"
  | "Debugging"
  | "Testing"
  | "CI/CD"
  | "Docs"
  | "General";

/** ✅ NEW */
export type ResourceSource = "official" | "community";
/** ✅ NEW */
export type ResourceStatus = "approved" | "pending" | "rejected";

export type ResourceItem = {
  id: string;
  title: string;
  description: string;
  url: string;

  category: ResourceCategory;
  difficulty: ResourceDifficulty;
  type: ResourceType;
  language?: string | null;

  isFeatured?: boolean;

  /**
   * ✅ Keep for backward compatibility.
   * Prefer `source` going forward.
   */
  isOfficial?: boolean;

  /** ✅ NEW: comes from backend */
  source?: ResourceSource; // official/community
  /** ✅ NEW: comes from backend */
  status?: ResourceStatus; // approved/pending/rejected

  minutes?: number | null;
  tags?: string[];
};

export type ResourceFilterState = {
  q: string;
  category: ResourceCategory | "All";
  difficulty: ResourceDifficulty | "All";
  language: string | "All";
  type: ResourceType | "All";

  /** (Optional) if you later add filter chips for this */
  // source?: ResourceSource | "All";
};