"""
ML Beginner Score Calculator

Computes a beginnerScore (0-1) for GitHub issues based on:
- Labels (good first issue, beginner, etc.)
- Description length and clarity
- Keyword analysis
- Complexity indicators
"""

import re
from typing import Dict, List, Tuple, Optional
from datetime import datetime


# ==================== CONFIGURATION ====================

# Labels that indicate beginner-friendly issues (weight: high, medium, low)
BEGINNER_LABELS = {
    "high": [
        "good first issue",
        "good-first-issue",
        "beginner",
        "beginner-friendly",
        "first-timers-only",
        "first timers only",
        "easy",
        "starter",
        "newbie",
        "low-hanging-fruit",
        "easy fix",
        "easy-fix",
        "help wanted",
        "help-wanted",
    ],
    "medium": [
        "documentation",
        "docs",
        "typo",
        "spelling",
        "readme",
        "simple",
        "minor",
        "trivial",
        "small",
        "quick-win",
        "good-for-learning",
    ],
    "low": [
        "enhancement",
        "feature",
        "improvement",
        "test",
        "testing",
        "refactor",
    ],
}

# Labels that indicate complexity (negative weight)
COMPLEX_LABELS = [
    "complex",
    "advanced",
    "expert",
    "hard",
    "difficult",
    "breaking-change",
    "breaking change",
    "critical",
    "security",
    "performance",
    "architecture",
    "core",
]

# Keywords in description that indicate beginner-friendliness
BEGINNER_KEYWORDS = [
    "simple",
    "easy",
    "straightforward",
    "beginner",
    "first contribution",
    "getting started",
    "no experience required",
    "well documented",
    "step by step",
    "tutorial",
    "learn",
    "example",
    "starter",
    "introduction",
    "basic",
]

# Keywords that indicate complexity
COMPLEX_KEYWORDS = [
    "complex",
    "complicated",
    "advanced",
    "expert",
    "deep understanding",
    "requires knowledge",
    "performance critical",
    "security sensitive",
    "breaking change",
    "architecture",
    "refactoring",
    "migration",
]

# Ideal description length range for beginners (in characters)
IDEAL_DESC_MIN = 200
IDEAL_DESC_MAX = 2000

MODEL_VERSION = "beginner-scorer-v1.0"


# ==================== SCORING FUNCTIONS ====================

def compute_label_score(labels: List[str]) -> Tuple[float, List[str]]:
    """
    Compute score based on issue labels.
    Returns (score, matched_labels)
    """
    if not labels:
        return 0.0, []

    labels_lower = [l.lower().strip() for l in labels]
    matched = []
    score = 0.0

    # Check for beginner-friendly labels
    for label in labels_lower:
        if label in BEGINNER_LABELS["high"]:
            score += 0.4
            matched.append(f"+{label}")
        elif label in BEGINNER_LABELS["medium"]:
            score += 0.2
            matched.append(f"+{label}")
        elif label in BEGINNER_LABELS["low"]:
            score += 0.1
            matched.append(f"+{label}")

    # Check for complex labels (negative)
    for label in labels_lower:
        if label in COMPLEX_LABELS:
            score -= 0.3
            matched.append(f"-{label}")

    # Normalize to 0-1
    score = max(0.0, min(1.0, score))
    return score, matched


def compute_description_length_score(body: str) -> Tuple[float, str]:
    """
    Score based on description length.
    Too short = unclear, too long = potentially complex.
    """
    if not body:
        return 0.2, "No description provided"

    length = len(body.strip())

    if length < 50:
        return 0.1, f"Very short description ({length} chars)"
    elif length < IDEAL_DESC_MIN:
        # Scale from 0.3 to 0.6
        score = 0.3 + (length / IDEAL_DESC_MIN) * 0.3
        return score, f"Short description ({length} chars)"
    elif length <= IDEAL_DESC_MAX:
        return 1.0, f"Good description length ({length} chars)"
    elif length <= 4000:
        # Slightly penalize very long descriptions
        return 0.8, f"Long description ({length} chars)"
    else:
        return 0.6, f"Very long description ({length} chars)"


def compute_keyword_score(title: str, body: str) -> Tuple[float, List[str]]:
    """
    Score based on beginner-friendly and complex keywords.
    """
    text = f"{title} {body}".lower()
    matched = []
    score = 0.5  # Start neutral

    # Check for beginner keywords
    for keyword in BEGINNER_KEYWORDS:
        if keyword in text:
            score += 0.05
            matched.append(f"+'{keyword}'")

    # Check for complex keywords
    for keyword in COMPLEX_KEYWORDS:
        if keyword in text:
            score -= 0.1
            matched.append(f"-'{keyword}'")

    score = max(0.0, min(1.0, score))
    return score, matched


def compute_complexity_score(body: str) -> Tuple[float, str]:
    """
    Estimate complexity based on:
    - Code blocks (many = potentially complex)
    - Technical jargon density
    - Links to other issues (dependencies)
    """
    if not body:
        return 0.7, "No code complexity indicators"

    # Count code blocks
    code_blocks = len(re.findall(r'```[\s\S]*?```', body))
    inline_code = len(re.findall(r'`[^`]+`', body))

    # Count references to other issues/PRs
    issue_refs = len(re.findall(r'#\d+', body))

    # Count URLs (external dependencies)
    urls = len(re.findall(r'https?://[^\s]+', body))

    complexity = 0

    if code_blocks > 3:
        complexity += 0.3
    elif code_blocks > 1:
        complexity += 0.1

    if inline_code > 10:
        complexity += 0.2
    elif inline_code > 5:
        complexity += 0.1

    if issue_refs > 3:
        complexity += 0.2

    if urls > 5:
        complexity += 0.1

    # Convert to beginner-friendliness score (inverse of complexity)
    score = max(0.0, 1.0 - complexity)

    explanation = f"Code blocks: {code_blocks}, refs: {issue_refs}"
    return score, explanation


def compute_clarity_score(title: str, body: str) -> Tuple[float, str]:
    """
    Score based on how clear and well-structured the issue is.
    """
    score = 0.5
    notes = []

    # Title clarity
    title_words = len(title.split())
    if 3 <= title_words <= 12:
        score += 0.1
        notes.append("Good title length")
    elif title_words < 3:
        score -= 0.1
        notes.append("Title too short")

    if not body:
        return max(0.0, score - 0.2), "No description"

    # Check for structure (headers, lists)
    has_headers = bool(re.search(r'^#+\s', body, re.MULTILINE))
    has_lists = bool(re.search(r'^[\*\-]\s', body, re.MULTILINE))
    has_numbered_lists = bool(re.search(r'^\d+\.\s', body, re.MULTILINE))

    if has_headers:
        score += 0.1
        notes.append("Has headers")

    if has_lists or has_numbered_lists:
        score += 0.15
        notes.append("Has lists")

    # Check for expected sections
    lower_body = body.lower()
    if any(x in lower_body for x in ["expected", "actual", "steps to reproduce", "description"]):
        score += 0.1
        notes.append("Has structured sections")

    # Check for acceptance criteria
    if any(x in lower_body for x in ["acceptance criteria", "done when", "success criteria"]):
        score += 0.1
        notes.append("Has acceptance criteria")

    score = max(0.0, min(1.0, score))
    return score, "; ".join(notes) if notes else "No structure detected"


def compute_beginner_score(
    title: str,
    body: str,
    labels: List[str],
    required_skills: Optional[List[str]] = None
) -> Dict:
    """
    Main scoring function. Returns complete scoring object.
    """
    # Compute individual scores
    label_score, label_matches = compute_label_score(labels)
    desc_score, desc_note = compute_description_length_score(body)
    keyword_score, keyword_matches = compute_keyword_score(title, body)
    complexity_score, complexity_note = compute_complexity_score(body)
    clarity_score, clarity_note = compute_clarity_score(title, body)

    # Weighted combination
    weights = {
        "label": 0.35,
        "description": 0.15,
        "keyword": 0.15,
        "complexity": 0.20,
        "clarity": 0.15,
    }

    beginner_score = (
        label_score * weights["label"] +
        desc_score * weights["description"] +
        keyword_score * weights["keyword"] +
        complexity_score * weights["complexity"] +
        clarity_score * weights["clarity"]
    )

    # Confidence based on available information
    confidence = 0.5
    if labels:
        confidence += 0.2
    if body and len(body) > 100:
        confidence += 0.2
    if required_skills:
        confidence += 0.1

    confidence = min(1.0, confidence)

    # Build explanation
    explanation_parts = []

    if label_matches:
        explanation_parts.append(f"Labels: {', '.join(label_matches[:3])}")
    else:
        explanation_parts.append("No beginner labels found")

    explanation_parts.append(desc_note)

    if keyword_matches:
        explanation_parts.append(f"Keywords: {', '.join(keyword_matches[:3])}")

    explanation_parts.append(f"Clarity: {clarity_note}")

    explanation = ". ".join(explanation_parts)

    return {
        "beginnerScore": round(beginner_score, 3),
        "confidence": round(confidence, 3),
        "features": {
            "labelScore": round(label_score, 3),
            "descriptionLength": round(desc_score, 3),
            "keywordScore": round(keyword_score, 3),
            "complexityScore": round(complexity_score, 3),
            "clarityScore": round(clarity_score, 3),
        },
        "explanation": explanation,
        "scoredAt": datetime.utcnow().isoformat(),
        "modelVersion": MODEL_VERSION,
    }


def should_auto_approve(scoring: Dict, threshold: float = 0.7) -> Tuple[bool, str]:
    """
    Determine if an issue should be auto-approved as beginner-friendly.
    Returns (should_approve, reason)
    """
    score = scoring["beginnerScore"]
    confidence = scoring["confidence"]

    if score >= threshold and confidence >= 0.6:
        return True, f"High beginner score ({score:.2f}) with good confidence ({confidence:.2f})"
    elif score >= 0.8:
        return True, f"Very high beginner score ({score:.2f})"
    else:
        return False, f"Score ({score:.2f}) or confidence ({confidence:.2f}) below threshold"


def compare_with_manual_label(
    scoring: Dict,
    manual_beginner_friendly: bool
) -> Dict:
    """
    Compare ML score with manual beginner-friendly label.
    Returns comparison analysis.
    """
    ml_suggests_beginner = scoring["beginnerScore"] >= 0.5
    agreement = ml_suggests_beginner == manual_beginner_friendly

    return {
        "mlScore": scoring["beginnerScore"],
        "mlSuggestsBeginner": ml_suggests_beginner,
        "manualLabel": manual_beginner_friendly,
        "agreement": agreement,
        "discrepancy": abs(scoring["beginnerScore"] - (1.0 if manual_beginner_friendly else 0.0)),
        "recommendation": "Review needed" if not agreement else "Labels aligned",
    }
