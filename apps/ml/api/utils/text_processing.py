"""Text processing utilities for ML recommendations."""

import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.schemas import DatabaseIssue, UserProfile


LANGUAGE_KEYWORDS = {
    "python": "Python",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "java": "Java",
    "go": "Go",
    "rust": "Rust",
    "ruby": "Ruby",
    "php": "PHP",
    "c++": "C++",
    "cpp": "C++",
    "c#": "C#",
    "csharp": "C#",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "scala": "Scala",
    "react": "JavaScript",
    "vue": "JavaScript",
    "angular": "TypeScript",
    "node": "JavaScript",
    "django": "Python",
    "flask": "Python",
    "fastapi": "Python",
    "rails": "Ruby",
}

BEGINNER_LABELS = ["good first issue", "beginner", "easy", "starter", "first-timers"]
ADVANCED_LABELS = ["complex", "advanced", "expert", "hard", "difficult"]


def clean_text(text: str) -> str:
    """Clean text for TF-IDF matching."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def build_user_query(user_profile: "UserProfile") -> str:
    """Convert user preferences into a text query for similarity matching."""
    parts = []
    parts.extend(user_profile.languages)
    parts.append(user_profile.difficulty)
    parts.extend(user_profile.topics)
    parts.extend(user_profile.keywords)

    # Boost preferred language
    if user_profile.languages:
        parts.extend([user_profile.languages[0]] * 3)

    return " ".join(parts).lower()


def build_issue_text(issue: "DatabaseIssue") -> str:
    """Build searchable text from an issue."""
    parts = [
        issue.title,
        issue.body,
        " ".join(issue.labels),
        " ".join(issue.requiredSkills),
        issue.repoName,
        issue.repoOwner
    ]
    return " ".join(parts)


def infer_language_from_issue(issue: "DatabaseIssue") -> str:
    """Infer programming language from issue labels and repo name."""
    # Check labels first
    for label in issue.labels:
        label_lower = label.lower()
        for keyword, lang in LANGUAGE_KEYWORDS.items():
            if keyword in label_lower:
                return lang

    # Check skills
    for skill in issue.requiredSkills:
        skill_lower = skill.lower()
        for keyword, lang in LANGUAGE_KEYWORDS.items():
            if keyword in skill_lower:
                return lang

    # Check repo name
    repo_lower = issue.repoName.lower()
    for keyword, lang in LANGUAGE_KEYWORDS.items():
        if keyword in repo_lower:
            return lang

    return "Unknown"


def infer_difficulty(issue: "DatabaseIssue") -> str:
    """Infer difficulty from issue properties."""
    if issue.beginnerFriendly:
        return "beginner"

    labels_lower = [label.lower() for label in issue.labels]

    for label in BEGINNER_LABELS:
        if any(label in ll for ll in labels_lower):
            return "beginner"

    for label in ADVANCED_LABELS:
        if any(label in ll for ll in labels_lower):
            return "advanced"

    return "intermediate"
