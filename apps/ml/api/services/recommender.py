"""Recommendation service using TF-IDF similarity."""

from typing import List

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from models.schemas import DatabaseIssue, IssueRecommendation, UserProfile
from utils.text_processing import (
    build_issue_text,
    build_user_query,
    clean_text,
    infer_difficulty,
    infer_language_from_issue,
)

DIFFICULTY_MAP = {"beginner": 1, "intermediate": 2, "advanced": 3}
MAX_PER_REPO = 3


def compute_recommendations(
    user: UserProfile,
    issues: List[DatabaseIssue],
    top_n: int = 10
) -> List[IssueRecommendation]:
    """
    Compute recommendations for database issues on-the-fly using TF-IDF.
    This processes REAL issues from the database, not pre-computed CSV data.
    """
    if not issues:
        return []

    # Build user query
    user_query = build_user_query(user)
    user_query_clean = clean_text(user_query)

    # Build issue texts
    issue_texts = [clean_text(build_issue_text(issue)) for issue in issues]

    # Create TF-IDF vectorizer and fit on issues
    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        stop_words="english"
    )

    # Fit and transform issues
    try:
        tfidf_matrix = vectorizer.fit_transform(issue_texts)
    except ValueError:
        # If all documents are empty after preprocessing
        return []

    # Transform user query
    user_vector = vectorizer.transform([user_query_clean])

    # Compute cosine similarity
    similarities = cosine_similarity(user_vector, tfidf_matrix).flatten()

    # Filter by difficulty level
    user_level = DIFFICULTY_MAP.get(user.difficulty.lower(), 2)

    # Create scored issues list
    scored_issues = []
    for idx, issue in enumerate(issues):
        issue_difficulty = infer_difficulty(issue)
        issue_level = DIFFICULTY_MAP.get(issue_difficulty, 2)

        # Filter: only show issues at or below user's level
        if issue_level <= user_level:
            scored_issues.append({
                "issue": issue,
                "score": float(similarities[idx]),
                "difficulty": issue_difficulty,
                "language": infer_language_from_issue(issue)
            })

    # Sort by similarity score
    scored_issues.sort(key=lambda x: x["score"], reverse=True)

    # Apply diversity constraints (max per repo)
    diverse_results = _apply_diversity_constraints(scored_issues, top_n)

    # Build recommendations
    return _build_recommendations(diverse_results)


def _apply_diversity_constraints(
    scored_issues: List[dict],
    top_n: int
) -> List[dict]:
    """Apply diversity constraints - max N issues per repo."""
    repo_counts = {}
    diverse_results = []

    for item in scored_issues:
        repo = f"{item['issue'].repoOwner}/{item['issue'].repoName}"
        if repo_counts.get(repo, 0) < MAX_PER_REPO:
            diverse_results.append(item)
            repo_counts[repo] = repo_counts.get(repo, 0) + 1

        if len(diverse_results) >= top_n:
            break

    return diverse_results


def _build_recommendations(scored_items: List[dict]) -> List[IssueRecommendation]:
    """Convert scored items to IssueRecommendation objects."""
    recommendations = []

    for item in scored_items:
        issue = item["issue"]
        recommendations.append(IssueRecommendation(
            issue_id=issue.id,
            repo_name=f"{issue.repoOwner}/{issue.repoName}",
            issue_title=issue.title,
            language=item["language"],
            difficulty=item["difficulty"],
            labels=", ".join(issue.labels[:5]),
            topics=", ".join(issue.requiredSkills[:5]),
            similarity_score=round(item["score"], 4)
        ))

    return recommendations
