"""
OpenCollab ML Recommendation API
FastAPI service for serving personalized issue recommendations and ML scoring.

This service processes REAL issues from the MongoDB database passed in via API,
NOT from CSV files or pre-generated data.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from .models import RecommendationResponse, RecommendRequest
from .services import compute_recommendations
from .services.beginner_scorer import (
    compute_beginner_score,
    should_auto_approve,
    compare_with_manual_label,
    MODEL_VERSION
)

app = FastAPI(
    title="OpenCollab ML API",
    description="Issue recommendation and scoring service",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== SCORING SCHEMAS ====================

class ScoreIssueRequest(BaseModel):
    """Request to score a single issue."""
    title: str
    body: str = ""
    labels: List[str] = []
    required_skills: Optional[List[str]] = None
    manual_beginner_friendly: Optional[bool] = None


class ScoreBatchRequest(BaseModel):
    """Request to score multiple issues."""
    issues: List[ScoreIssueRequest]


class MlFeatures(BaseModel):
    labelScore: float
    descriptionLength: float
    keywordScore: float
    complexityScore: float
    clarityScore: float


class ScoringResult(BaseModel):
    beginnerScore: float
    confidence: float
    features: MlFeatures
    explanation: str
    scoredAt: str
    modelVersion: str
    autoApprove: Optional[bool] = None
    autoApproveReason: Optional[str] = None
    comparison: Optional[dict] = None


# ==================== HEALTH ENDPOINTS ====================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "OpenCollab ML API",
        "version": "2.1.0",
        "description": "Real-time recommendations and ML scoring"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "mode": "real-time",
        "features": ["recommendations", "scoring"],
        "description": "Processing issues from database on-the-fly"
    }


# ==================== RECOMMENDATION ENDPOINTS ====================

@app.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendRequest):
    """
    Get personalized issue recommendations from database issues.

    This endpoint receives REAL issues from the MongoDB database
    and computes recommendations on-the-fly.
    """
    try:
        recommendations = compute_recommendations(
            user=request.user,
            issues=request.issues,
            top_n=request.top_n
        )

        profile_dict = {
            "languages": request.user.languages,
            "difficulty": request.user.difficulty,
            "topics": request.user.topics,
            "keywords": request.user.keywords
        }

        return RecommendationResponse(
            recommendations=recommendations,
            method="tfidf-realtime",
            user_profile=profile_dict,
            total_issues_analyzed=len(request.issues)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Recommendation failed: {str(e)}"
        )


# ==================== SCORING ENDPOINTS ====================

@app.post("/score", response_model=ScoringResult)
async def score_issue(request: ScoreIssueRequest):
    """
    Compute beginner-friendliness score for a single issue.

    Returns ML score with feature breakdown and explanation.
    """
    try:
        scoring = compute_beginner_score(
            title=request.title,
            body=request.body,
            labels=request.labels,
            required_skills=request.required_skills
        )

        # Add auto-approve recommendation
        auto_approve, approve_reason = should_auto_approve(scoring)
        scoring["autoApprove"] = auto_approve
        scoring["autoApproveReason"] = approve_reason

        # Add comparison if manual label provided
        if request.manual_beginner_friendly is not None:
            scoring["comparison"] = compare_with_manual_label(
                scoring,
                request.manual_beginner_friendly
            )

        return ScoringResult(**scoring)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Scoring failed: {str(e)}"
        )


@app.post("/score/batch")
async def score_issues_batch(request: ScoreBatchRequest):
    """
    Compute beginner-friendliness scores for multiple issues.

    Returns list of scores with overall statistics.
    """
    try:
        results = []
        for issue in request.issues:
            scoring = compute_beginner_score(
                title=issue.title,
                body=issue.body,
                labels=issue.labels,
                required_skills=issue.required_skills
            )
            auto_approve, approve_reason = should_auto_approve(scoring)
            scoring["autoApprove"] = auto_approve
            scoring["autoApproveReason"] = approve_reason

            if issue.manual_beginner_friendly is not None:
                scoring["comparison"] = compare_with_manual_label(
                    scoring,
                    issue.manual_beginner_friendly
                )

            results.append(scoring)

        # Compute statistics
        scores = [r["beginnerScore"] for r in results]
        avg_score = sum(scores) / len(scores) if scores else 0
        auto_approve_count = sum(1 for r in results if r.get("autoApprove"))

        return {
            "results": results,
            "stats": {
                "total": len(results),
                "avgScore": round(avg_score, 3),
                "autoApproveCount": auto_approve_count,
                "autoApproveRate": round(auto_approve_count / len(results), 3) if results else 0
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Batch scoring failed: {str(e)}"
        )


@app.get("/model/info")
async def model_info():
    """Get information about the recommendation and scoring systems."""
    return {
        "mode": "real-time",
        "recommendation": {
            "method": "TF-IDF with cosine similarity",
            "features": {
                "max_features": 5000,
                "ngram_range": [1, 2],
                "stop_words": "english"
            },
            "diversity_constraints": {
                "max_per_repo": 3
            }
        },
        "scoring": {
            "method": "Rule-based ML scoring",
            "version": MODEL_VERSION,
            "features": [
                "label_score",
                "description_length",
                "keyword_score",
                "complexity_score",
                "clarity_score"
            ],
            "weights": {
                "label": 0.35,
                "description": 0.15,
                "keyword": 0.15,
                "complexity": 0.20,
                "clarity": 0.15
            }
        },
        "description": "Processes real database issues on each request"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
