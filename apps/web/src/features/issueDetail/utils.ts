import type { IssueDto } from "./types";

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export function timeAgo(input: string | Date | null | undefined) {
  if (!input) return "";
  const d = typeof input === "string" ? new Date(input) : input;
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days} days ago`;
}

export function labelColorDot(label: string) {
  const x = label.toLowerCase();
  if (x.includes("bug")) return "#ef4444";
  if (x.includes("core")) return "#60a5fa";
  if (x.includes("ssr")) return "#a78bfa";
  if (x.includes("docs")) return "#34d399";
  return "#a3a3a3";
}

function normalizeDifficulty(value?: string | null): DifficultyLevel | null {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "beginner" || normalized === "intermediate" || normalized === "advanced") {
    return normalized;
  }
  return null;
}

export function detectDifficulty(issue: IssueDto): DifficultyLevel {
  const explicit = normalizeDifficulty(issue.difficulty) || normalizeDifficulty(issue.difficultyOverride);
  if (explicit) return explicit;

  const labels = (issue.labels || []).map((l) => l.toLowerCase());
  const hasBeginnerSignals = issue.beginnerFriendly || labels.some((l) =>
    l.includes("good first issue") || l.includes("beginner") || l.includes("easy")
  );
  const hasAdvancedSignals =
    labels.some((l) => l.includes("hard") || l.includes("advanced") || l.includes("complex")) ||
    (issue.requiredSkills || []).length > 5 ||
    String(issue.body || "").length > 2000;

  if (hasBeginnerSignals && !hasAdvancedSignals) return "beginner";
  if (hasAdvancedSignals && !hasBeginnerSignals) return "advanced";
  return "intermediate";
}

export function statusPill(issue: IssueDto) {
  if (issue.status === "open") {
    return { text: "Open", icon: "adjust", fg: "#19e66b", bg: "rgba(25,230,107,0.10)", bd: "rgba(25,230,107,0.20)" };
  }
  if (issue.status === "claimed") {
    return { text: "Accepted", icon: "adjust", fg: "#19e66b", bg: "rgba(25,230,107,0.10)", bd: "rgba(25,230,107,0.20)" };
  }
  return { text: "Closed", icon: "adjust", fg: "#fb923c", bg: "rgba(251,146,60,0.10)", bd: "rgba(251,146,60,0.20)" };
}

export function difficultyPill(level: DifficultyLevel) {
  if (level === "beginner") return { text: "Beginner", icon: "bolt", fg: "#19e66b", bg: "rgba(25,230,107,0.10)", bd: "rgba(25,230,107,0.20)" };
  if (level === "advanced") return { text: "Advanced", icon: "bolt", fg: "#fb7185", bg: "rgba(251,113,133,0.10)", bd: "rgba(251,113,133,0.20)" };
  return { text: "Intermediate", icon: "bolt", fg: "#fb923c", bg: "rgba(251,146,60,0.10)", bd: "rgba(251,146,60,0.20)" };
}
