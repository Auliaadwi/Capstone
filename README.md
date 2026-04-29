# SkillMap

SkillMap is a starter monorepo for CV analysis and AI-assisted learning path recommendations.

## Structure

- `apps/api` - Express API for CV upload, quiz, and dashboard data
- `apps/web` - Vite React frontend with Axios API calls and responsive dashboard UI
- `services/ai` - Flask service that mimics the AI extraction layer
- `database/schema.sql` - PostgreSQL schema for the MVP

## Run locally

1. Install Node dependencies inside `apps/api` and `apps/web`.
2. Install Python dependencies from `services/ai/requirements.txt`.
3. Start the AI service on port `5000`.
4. Start the API on port `3001`.
5. Start the web app on port `5173`.

Optional API environment variables:

- `DATABASE_URL` for PostgreSQL persistence
- `PORT` to override the API port

## Environment

Create `apps/web/.env` from `apps/web/.env.example` if you want to override the API URL.

## Deployment

- Frontend: deploy `apps/web` to Netlify or Vercel.
- API: deploy `apps/api` to Render, Railway, or a small VPS.
- Static hosting like GitHub Pages is fine for the frontend only, but the API must be deployed separately.
- Keep `VITE_API_URL` pointed to the deployed Express API.

## API flow

1. User uploads a CV through the web app.
2. API forwards metadata to the AI service.
3. AI service returns extracted skills, gaps, and a learning path.
4. Frontend renders the analysis in the dashboard.

## API endpoints

- `GET /health`
- `POST /api/cv/upload`
- `GET /api/quiz/questions`
- `POST /api/quiz/submit`
- `GET /api/dashboard/overview`

## Database persistence

The API writes CV analysis and quiz submissions to PostgreSQL when `DATABASE_URL` is available. If the database is not configured, the API still serves the same JSON responses so the MVP stays usable.

