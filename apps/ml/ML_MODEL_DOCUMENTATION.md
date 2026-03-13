# OpenCollab ML Recommendation System

This document explains how the machine learning recommendation system works in OpenCollab, from data collection to production deployment.

---

## Table of Contents
1. [Overview](#overview)
2. [Data Collection](#data-collection)
3. [Data Preprocessing](#data-preprocessing)
4. [Model Architecture](#model-architecture)
5. [How the Model Works](#how-the-model-works)
6. [Evaluation & Scores](#evaluation--scores)
7. [System Integration](#system-integration)
8. [API Usage](#api-usage)

---

## Overview

OpenCollab uses a **Hybrid Recommendation System** that combines two powerful techniques:
- **TF-IDF (Term Frequency-Inverse Document Frequency)** for keyword matching
- **Sentence-BERT (SBERT)** for semantic understanding

This helps match users with relevant GitHub issues based on their skills, preferred languages, and interests.

---

## Data Collection

### Dataset Source
We collected **500 GitHub issues** from various open-source repositories. The dataset includes issues across multiple:
- Programming languages (Python, JavaScript, TypeScript, Go, Rust, Java, etc.)
- Difficulty levels (beginner, intermediate, advanced)
- Topics (web, cli, database, ml, api, testing, automation)

### Dataset Fields

| Field | Description |
|-------|-------------|
| `issue_id` | Unique identifier for each issue |
| `repo_name` | Repository name (e.g., "flask-blog-starter") |
| `issue_title` | Title of the GitHub issue |
| `issue_body` | Full description of the issue |
| `labels` | Issue labels (bug, documentation, good first issue, etc.) |
| `language` | Primary programming language |
| `difficulty` | Difficulty level (beginner/intermediate/advanced) |
| `topics` | Topic categories (web, api, ml, etc.) |
| `is_open` | Whether the issue is still open |
| `created_at` | Issue creation date |
| `comments_count` | Number of comments on the issue |

### Data Files
- **Raw data**: `dataset.csv` (500 issues)
- **Processed data**: `data/processed_issues.csv` (with cleaned text and scores)

---

## Data Preprocessing

### Text Cleaning Pipeline

1. **Combine Text Fields**: Merge title + body + labels + language + topics into one text field
2. **Lowercase**: Convert all text to lowercase
3. **Remove Special Characters**: Keep only alphanumeric characters and spaces
4. **Tokenization**: Split text into words
5. **Stemming/Lemmatization**: Reduce words to root form (e.g., "running" → "run")

```python
# Example preprocessing
combined_text = f"{title} {body} {labels} {language} {topics}"
cleaned_text = re.sub(r"[^a-z0-9\s]", " ", combined_text.lower())
cleaned_text = re.sub(r"\s+", " ", cleaned_text).strip()
```

### Difficulty Scoring
Issues are assigned numerical difficulty scores:
- **Beginner**: 1
- **Intermediate**: 2
- **Advanced**: 3

---

## Model Architecture

### 1. TF-IDF Vectorizer
Converts text into numerical vectors based on word importance.

| Parameter | Value |
|-----------|-------|
| Max Features | 5,000 |
| N-grams | Unigrams + Bigrams (1, 2) |
| Stop Words | English |

**Output**: A matrix of size `(500 issues × 5000 features)`

### 2. Sentence-BERT Embeddings
Uses pre-trained transformer model for semantic similarity.

| Parameter | Value |
|-----------|-------|
| Model | all-MiniLM-L6-v2 |
| Embedding Dimension | 384 |

**Output**: A matrix of size `(500 issues × 384 dimensions)`

### 3. Hybrid Scoring
Combines both methods using a weighted average:

```
hybrid_score = (1 - α) × TF-IDF_similarity + α × SBERT_similarity
```

| Hyperparameter | Value | Description |
|----------------|-------|-------------|
| `alpha` | 0.5 | Weight for SBERT (semantic matching) |
| `mmr_lambda` | 0.7 | Diversity vs relevance balance |
| `max_per_language` | 3 | Max recommendations per language |
| `max_per_repo` | 2 | Max recommendations per repository |

---

## How the Model Works

### Step 1: Build User Profile
When a user requests recommendations, we build a query from their preferences:
- Preferred programming languages
- Experience level (beginner/intermediate/advanced)
- Topics of interest
- Keywords

```python
user_query = "python javascript beginner web api"
```

### Step 2: Compute Similarity Scores
1. Transform user query using TF-IDF vectorizer
2. Calculate **cosine similarity** between user query and all issues
3. If SBERT is available, also compute semantic similarity
4. Combine scores using hybrid formula

### Step 3: Apply Filters
- **Difficulty Filter**: Only show issues at or below user's level
- **Language Boost**: Prioritize user's preferred languages

### Step 4: Ensure Diversity (MMR)
Use **Maximal Marginal Relevance** to avoid showing too-similar issues:

```
MMR = λ × Relevance - (1 - λ) × max_similarity_to_selected
```

This ensures users get diverse recommendations across different repos and languages.

### Step 5: Return Top-N Recommendations
Return the top 10 (default) most relevant and diverse issues.

---

## Evaluation & Scores

### Evaluation Metrics

We evaluated the model on test users with known preferences:

| Metric | Description | Average Score |
|--------|-------------|---------------|
| **Precision@5** | Relevant issues in top 5 | 0.85 (85%) |
| **Precision@10** | Relevant issues in top 10 | 0.75 (75%) |
| **Diversity** | Variety in recommendations | 0.95 (95%) |
| **Language Diversity** | Languages covered | 0.33 |

### Test Results

| Test User | Precision@5 | Precision@10 | Top Score |
|-----------|-------------|--------------|-----------|
| User 1 (Beginner Python) | 80% | 60% | 0.271 |
| User 2 (Intermediate Go) | 100% | 100% | 0.209 |
| User 3 (Beginner JS) | 100% | 100% | 0.198 |
| User 4 (Advanced Rust) | 60% | 40% | 0.319 |

### Model Comparison

| Approach | Precision@10 | Diversity |
|----------|--------------|-----------|
| TF-IDF Only | 65% | 80% |
| **Hybrid (TF-IDF + SBERT)** | **75%** | **95%** |

The hybrid approach outperforms pure TF-IDF by capturing semantic meaning.

---

## System Integration

This section explains how the ML recommendation model is integrated into the OpenCollab application and how different services communicate to deliver personalized recommendations to users.

### Architecture Diagram

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Frontend  │────▶│  Express API    │────▶│  FastAPI ML API  │
│  (React)    │     │  (Node.js)      │     │  (Python)        │
└─────────────┘     └─────────────────┘     └──────────────────┘
                           │                        │
                           ▼                        ▼
                    ┌─────────────┐          ┌─────────────┐
                    │  MongoDB    │          │  Model Files │
                    │  (Users)    │          │  (.pkl/.npy) │
                    └─────────────┘          └─────────────┘
```

### Component Responsibilities

| Component | Technology | Role |
|-----------|------------|------|
| **Frontend** | React | Displays the user interface, collects user preferences, and renders recommended issues |
| **Express API** | Node.js | Acts as the main backend server, handles authentication, manages user data, and routes requests to the ML service |
| **FastAPI ML API** | Python | Hosts the machine learning model, processes recommendation requests, and returns scored results |
| **MongoDB** | NoSQL Database | Stores user profiles, preferences, saved issues, and application data |
| **Model Files** | Pickle/NumPy | Pre-trained model artifacts loaded by the ML service at startup |

### Integration Flow (Step-by-Step)

#### Step 1: User Authentication & Profile Loading
When a user logs into OpenCollab, the frontend retrieves their profile from the Express API. This profile contains:
- Programming languages the user knows
- Experience level (beginner/intermediate/advanced)
- Topics they're interested in (web, api, ml, etc.)
- Previously saved or completed issues

#### Step 2: Requesting Recommendations
When the user navigates to the Feed page, the frontend makes a request to the Express API:
```
GET /api/recommendations
Authorization: Bearer <user_token>
```

#### Step 3: Express API Processes the Request
The Express backend performs the following actions:
1. **Validates** the user's authentication token
2. **Fetches** the user's profile and preferences from MongoDB
3. **Constructs** a recommendation request payload containing the user's languages, difficulty level, topics, and any keywords
4. **Forwards** this payload to the FastAPI ML service via an internal HTTP call

```javascript
// Example: Express calling the ML service
const mlResponse = await axios.post('http://ml-service:8000/recommend', {
  languages: user.languages,
  difficulty: user.experienceLevel,
  topics: user.interests,
  keywords: []
});
```

#### Step 4: ML Service Computes Recommendations
The FastAPI ML service receives the request and:
1. **Loads** pre-trained model files (TF-IDF vectorizer, embeddings) if not already cached
2. **Builds** a query string from the user's preferences
3. **Computes** TF-IDF similarity scores between the query and all 500 indexed issues
4. **Computes** SBERT semantic similarity scores (if available)
5. **Combines** scores using the hybrid formula: `(1-α) × TF-IDF + α × SBERT`
6. **Applies** filters (difficulty level, language preferences)
7. **Applies** MMR algorithm for diversity
8. **Returns** the top-N ranked issues with similarity scores

#### Step 5: Response Flows Back to User
The Express API receives the ML recommendations and:
1. **Enriches** the results with additional data (e.g., repo URLs, fresh metadata)
2. **Filters out** issues the user has already completed or saved
3. **Returns** the final list to the frontend
4. **Frontend renders** the issues as cards in the Feed

### Model Files Loaded at Startup

The ML service loads these pre-computed files when it starts, ensuring fast response times for recommendations:

| File | Size | Purpose |
|------|------|---------|
| `vectorizer.pkl` | 62 KB | Fitted TF-IDF vectorizer (transforms new text into vectors) |
| `tfidf_matrix.npy` | 5.5 MB | Pre-computed TF-IDF vectors for all 500 issues |
| `sbert_embeddings.npy` | 662 KB | Pre-computed semantic embeddings for all 500 issues |
| `issues_index.csv` | 302 KB | Issue metadata (titles, repos, labels, difficulty) |
| `hybrid_hyperparams.pkl` | 149 B | Tuned model parameters (alpha, MMR lambda, etc.) |

### Why This Architecture?

- **Separation of Concerns**: The ML logic is isolated in its own Python service, making it easy to update models without touching the main backend
- **Scalability**: The ML service can be scaled independently based on recommendation request volume
- **Language Flexibility**: Python is ideal for ML tasks (sklearn, sentence-transformers), while Node.js handles web API routing efficiently
- **Fast Responses**: Pre-computed embeddings mean recommendations are generated in milliseconds, not seconds

---

## API Usage

### Get Recommendations

**Endpoint**: `POST /recommend`

**Request**:
```json
{
  "languages": ["Python", "JavaScript"],
  "difficulty": "beginner",
  "topics": ["web", "api"],
  "keywords": []
}
```

**Response**:
```json
{
  "recommendations": [
    {
      "issue_id": "10",
      "repo_name": "cli-task-runner",
      "issue_title": "Add example usage in README",
      "language": "Python",
      "difficulty": "beginner",
      "labels": "documentation",
      "topics": "cli",
      "similarity_score": 0.271
    }
  ],
  "method": "hybrid",
  "user_profile": {...}
}
```

### Health Check

**Endpoint**: `GET /health`

```json
{
  "status": "ok",
  "model_loaded": true,
  "issues_indexed": 500
}
```

---

## Summary

| Component | Technology |
|-----------|------------|
| **Vectorization** | TF-IDF (sklearn) |
| **Semantic Embeddings** | Sentence-BERT (all-MiniLM-L6-v2) |
| **Similarity Metric** | Cosine Similarity |
| **Diversity Algorithm** | Maximal Marginal Relevance (MMR) |
| **ML API** | FastAPI (Python) |
| **Backend Integration** | Express.js (Node.js) |
| **Dataset Size** | 500 issues |

The hybrid approach ensures users get **relevant** recommendations based on their skills while maintaining **diversity** across repositories and languages, helping contributors find the perfect issues to work on.
