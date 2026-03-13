"""Pydantic models for request/response schemas."""

from typing import List

from pydantic import BaseModel


class UserProfile(BaseModel):
    languages: List[str] = []
    difficulty: str = "beginner"
    topics: List[str] = []
    keywords: List[str] = []


class DatabaseIssue(BaseModel):
    """Issue data passed from the MongoDB database."""
    id: str
    repoOwner: str
    repoName: str
    title: str
    body: str = ""
    labels: List[str] = []
    requiredSkills: List[str] = []
    beginnerFriendly: bool = False


class RecommendRequest(BaseModel):
    """Request containing user profile and database issues."""
    user: UserProfile
    issues: List[DatabaseIssue]
    top_n: int = 10


class IssueRecommendation(BaseModel):
    issue_id: str
    repo_name: str
    issue_title: str
    language: str
    difficulty: str
    labels: str
    topics: str
    similarity_score: float


class RecommendationResponse(BaseModel):
    recommendations: List[IssueRecommendation]
    method: str
    user_profile: dict
    total_issues_analyzed: int
