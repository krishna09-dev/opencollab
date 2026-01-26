export type LanguageOption = {
  value: string;
  label: string;
  dot: string;
};

export type ExperienceOption = {
  value: string;
  label: string;
};

export type InterestOption = {
  value: string;
  label: string;
};

export const languageOptions: LanguageOption[] = [
  { value: "javascript", label: "JavaScript", dot: "#facc15" },
  { value: "react", label: "React", dot: "#38bdf8" },
  { value: "nextjs", label: "Next Js", dot: "#9ca3af" },
  { value: "python", label: "Python", dot: "#9ca3af" }
];

export const experienceOptions: ExperienceOption[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" }
];

export const interestOptions: InterestOption[] = [
  { value: "frontend", label: "Frontend / UI" },
  { value: "backend", label: "Backend / APIs" },
  { value: "devtools", label: "Dev tools" },
  { value: "docs", label: "Documentation" },
  { value: "testing", label: "Testing / QA" },
  { value: "data", label: "Data / ML" },
  { value: "infra", label: "Infra / DevOps" }
];
