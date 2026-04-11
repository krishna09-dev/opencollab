# OpenCollab

OpenCollab is a full-stack platform for discovering open-source issues, claiming work, tracking pull requests, and moderating contribution quality.

The repository contains three running services:

- Web app: React + TypeScript + Vite in `apps/web`
- API: Express + TypeScript + MongoDB in `apps/api`
- ML service: FastAPI + Python scoring/recommendation service in `apps/ml/api`

## What Is Implemented

OpenCollab currently includes:

- GitHub OAuth login for users and moderation flow
- User onboarding and personalized issue recommendations
- Issue listing, search, filters, detail view, claim/abort flows, and refresh from GitHub
- PR submission and PR tracking with status sync (open, merged, closed)
- Admin/moderator moderation panels for issues, claims, PR verification, and analytics
- Repository request workflow (moderator submits, admin approves/rejects)
- Learning resources library with moderation and admin direct publishing
- Reporting system for issue/PR/user abuse workflows
- ML scoring endpoints for beginner-friendliness (with local fallback when ML API is unavailable)

## Monorepo Layout

```text
OpenCollab/
  apps/
    api/          Express API (TypeScript)
    web/          React frontend (Vite)
    ml/           Python ML assets + FastAPI app in apps/ml/api
  docs/           Deployment and internal docs
  package.json    Workspace root scripts
```

## Tech Stack

- Frontend: React 19, React Router 7, TypeScript, Vite, MUI, Recharts
- Backend: Node.js, Express, TypeScript, Mongoose, Zod, JWT
- ML service: FastAPI, scikit-learn, pandas, numpy
- Database: MongoDB

## Prerequisites

- Node.js 18+
- npm 9+ or pnpm 8+
- Python 3.10+
- MongoDB instance (local or Atlas)
- GitHub OAuth app credentials

## Local Development Setup

1. Install JavaScript dependencies from repository root.

```bash
pnpm install
```

2. Create API environment file at `apps/api/.env`.

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/opencollab

GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_CALLBACK_URL=http://localhost:5001/auth/github/callback

FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173

JWT_SECRET=replace_with_strong_secret
JWT_EXPIRES_IN=604800

GITHUB_SYSTEM_TOKEN=your_github_personal_access_token
ML_SERVICE_URL=http://localhost:8001

INGESTION_ENABLED=true
INGESTION_INTERVAL_MINUTES=15
INGESTION_REPO_CONCURRENCY=3
INGESTION_MAX_PAGES=10

PR_SYNC_ENABLED=true
```

3. Create web environment file at `apps/web/.env`.

```env
VITE_API_BASE_URL=http://localhost:5001
VITE_PUBLIC_APP_URL=http://localhost:5173
```

4. Create Python environment and install ML service dependencies.

```bash
cd apps/ml/api
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
```

5. Start all services in separate terminals.

```bash
# API
cd apps/api
pnpm dev
```

```bash
# Web
cd apps/web
pnpm dev
```

```bash
# ML
cd apps/ml/api
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

6. Verify local health checks.

- API health: `GET http://localhost:5001/health`
- ML health: `GET http://localhost:8001/health`
- Web app: `http://localhost:5173`

## Scripts

Root (`package.json`):

- `pnpm dev:api` - run API from workspace root

API (`apps/api/package.json`):

- `pnpm dev` - run API with ts-node-dev
- `pnpm build` - compile TypeScript
- `pnpm start` - run compiled server (`dist/index.js`)
- `pnpm clear:prs` - clear PR tracking records
- `pnpm cleanup:stale-prs` - cleanup stale PR tracking data

Web (`apps/web/package.json`):

- `pnpm dev` - start Vite dev server
- `pnpm build` - TypeScript build + production bundle
- `pnpm lint` - run ESLint
- `pnpm preview` - preview production build

If you prefer npm workspaces, you can run equivalents such as:

- `npm run --workspace api dev`
- `npm run --workspace web dev`

## API Surface (High-Level)

Main groups served by the API:

- `GET /health`
- `GET /auth/github`, `GET /auth/github/callback`
- `GET /auth/admin/github`, `POST /auth/admin/register`, `POST /auth/admin/login`
- `/api/issues/*` for issue list/detail/claim/abort/refresh/languages/stats
- `/api/recommendations/*` for personalized and custom recommendations
- `/api/pr-tracking/*` for submit/add/list/refresh/detail tracking flows
- `/api/resources/*` for browsing resources and submitting suggestions
- `/api/notifications/*` for notification list and mark-all-read
- `/api/reports/*` for abuse reports and moderation workflows
- `/api/moderator/*` for moderator request submission/history
- `/api/admin/*` for repo/issue/claim/PR/request/analytics moderation
- `/api/ml/*` for ML health/model info and score/override administration

## Product Routes (Frontend)

User-facing routes include:

- `/`, `/login`, `/auth/callback`, `/onboarding`, `/feed`
- `/good-first-issues`, `/issues/:id`, `/resources`, `/saved`
- `/pr-tracking`, `/pr-tracking/:id`
- `/profile`, `/profile/claimed-issues`

Admin/moderator routes include:

- `/admin/*` (repos, issues, claims, analytics, requests)
- `/moderator/*` (dashboard, analytics, issues, claims, resource/repo requests)
- `/moderation`, `/moderation/callback` (moderator OAuth entry)

## Operational Notes

- Background workers start with API boot:
  - issue ingestion worker
  - PR sync worker
- Repository seed list in `apps/api/src/config/approvedRepos.ts` is empty by default. Repositories are expected to be added through admin/moderation flows.
- Issue ingestion pulls open issues for approved repositories and classifies beginner-friendly status from labels.
- Notifications are currently stored in-memory in the API process (`apps/api/src/routes/notifications.routes.ts`).

## Additional Documentation

- Deployment guide: `docs/DEPLOYMENT.md`
- ML model documentation: `apps/ml/ML_MODEL_DOCUMENTATION.md`

## Testing And Validation

There is currently no unified automated test suite configured at the repo root.

Practical validation commands:

- Build API: `cd apps/api && pnpm build`
- Build web: `cd apps/web && pnpm build`
- Lint web: `cd apps/web && pnpm lint`

## License

ISC
