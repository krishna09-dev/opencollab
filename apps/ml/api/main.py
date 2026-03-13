"""
OpenCollab ML Recommendation API
FastAPI service for serving personalized issue recommendations.

This service processes REAL issues from the MongoDB database passed in via API,
NOT from CSV files or pre-generated data.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import RecommendationResponse, RecommendRequest
from services import compute_recommendations

app = FastAPI(
    title="OpenCollab ML API",
    description="Issue recommendation service using TF-IDF matching on real database issues",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "OpenCollab ML API",
        "version": "2.0.0",
        "description": "Real-time recommendations from database issues"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "mode": "real-time",
        "description": "Processing issues from database on-the-fly"
    }


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


@app.get("/model/info")
async def model_info():
    """Get information about the recommendation system."""
    return {
        "mode": "real-time",
        "method": "TF-IDF with cosine similarity",
        "features": {
            "max_features": 5000,
            "ngram_range": [1, 2],
            "stop_words": "english"
        },
        "diversity_constraints": {
            "max_per_repo": 3
        },
        "description": "Processes real database issues on each request, no CSV or pre-computed data"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
