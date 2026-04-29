# SkillMap

SkillMap is a starter monorepo for CV analysis and adaptive learning path recommendations.

The current scaffold is aligned to the capstone full-stack scope first:
- Frontend: React + Vite
- Backend: Flask REST API
- Database: PostgreSQL + SQLAlchemy
- AI service: reserved for a later integration phase

## Structure

- `apps/api` - Flask API for CV upload, quiz, dashboard data, and mock analysis
- `apps/web` - Vite React frontend with Axios API calls and responsive dashboard UI
- `services/ai` - reserved folder for future AI or DS integration
- `database/schema.sql` - PostgreSQL schema for the MVP

## Run locally

1. Install frontend dependencies inside `apps/web`.
2. Install Python dependencies from `apps/api/requirements.txt`.
3. Copy `apps/api/.env.example` to `apps/api/.env` if you want local environment variables.
4. Start the Flask API on port `3001`.
5. Start the web app on port `5173`.

### Local PostgreSQL for this project

This repository now includes a project-local PostgreSQL cluster in `.postgres-data` that listens on port `5433`.

- Start DB: `npm run dev:db:start`
- Stop DB: `npm run dev:db:stop`
- Check status: `npm run dev:db:status`

The backend connection string is stored in `apps/api/.env`.

Optional API environment variables:

- `DATABASE_URL` for PostgreSQL persistence
- `PORT` to override the API port
- `CORS_ORIGIN` to allow the frontend origin
- `AUTO_CREATE_TABLES` to let SQLAlchemy create the base tables automatically

## Environment

Create `apps/web/.env` from `apps/web/.env.example` if you want to override the API URL.

## Deployment

- Frontend: deploy `apps/web` to Netlify or Vercel.
- API: deploy `apps/api` to Render, Railway, or a small VPS with Python support.
- Static hosting like GitHub Pages is fine for the frontend only, but the API must be deployed separately.
- Keep `VITE_API_URL` pointed to the deployed Flask API.

## API flow

1. User uploads a CV through the web app.
2. Flask API runs temporary rule-based analysis logic for the MVP.
3. API can persist CV analysis and quiz submissions when PostgreSQL is configured.
4. Frontend renders the analysis in the dashboard.

## API endpoints

- `GET /health`
- `POST /api/cv/upload`
- `GET /api/quiz/questions`
- `POST /api/quiz/submit`
- `GET /api/dashboard/overview`

## Database persistence

The API writes CV analysis and quiz submissions to PostgreSQL when `DATABASE_URL` is available. If the database is not configured, the API still serves the same JSON responses so the MVP stays usable.

## Notes

- The repository is intentionally full-stack first because AI and DS components are not ready yet.
- When the AI team starts integration, `services/ai` can be activated as a separate service without changing the frontend contract.

