# SkillMap

SkillMap is a capstone MVP for "Navigator Pembelajaran Keterampilan yang Dipersonalisasi". It helps final-year students and fresh graduates compare their CV/profile against target role requirements, validate readiness through an adaptive quiz, and receive a personalized learning roadmap.

## Project Fit

Core features are aligned with the CC26-PSU401 project plan:

- CV upload and NLP-style skill extraction
- Adaptive quiz for practical readiness signals
- Skill gap mapping against target roles
- Personalized learning path recommendation
- Dashboard insight for skills, gaps, roadmap, and recent activity

Project limitations and MVP boundaries are documented in [BATASAN.md](BATASAN.md).

## Stack

- Frontend: React + Vite, Axios networking calls, responsive UI
- Main API: Express REST API
- Persistence: PostgreSQL with in-memory fallback when `DATABASE_URL` is not configured
- AI/ML integration: contract-ready endpoints for CV analysis, recommendation, and future Flask/FastAPI model serving
- Data Science integration: dashboard and requirement contracts ready for EDA/Streamlit outputs

The previous Flask API files are still present as a useful starting point for a separate AI/model service. The main full-stack REST API now runs on Express to satisfy the web-backend requirement.

## Structure

- `apps/api` - Express API for CV upload, quiz, recommendations, roles, dashboard data, and lead capture
- `apps/web` - Vite React frontend with Axios API calls and responsive SkillMap UI
- `services/ai` - reserved folder for future model service integration
- `database/schema.sql` - PostgreSQL schema for users, CVs, skills, learning paths, quiz attempts, and leads

## Run Locally

Install dependencies:

```bash
npm --prefix apps/api install
npm --prefix apps/web install
```

Start the API:

```bash
npm --prefix apps/api run dev
```

Start the web app:

```bash
npm --prefix apps/web run dev
```

Default URLs:

- Web: `http://localhost:5173`
- API: `http://localhost:3001`
- Health: `http://localhost:3001/health`

On Windows PowerShell, use `npm.cmd` if the execution policy blocks `npm.ps1`.

## Local PostgreSQL

This repository includes helper scripts for a project-local PostgreSQL cluster.

- Start DB: `npm run dev:db:start`
- Stop DB: `npm run dev:db:stop`
- Check status: `npm run dev:db:status`

Optional API environment variables:

- `DATABASE_URL` for PostgreSQL persistence
- `PORT` to override API port
- `CORS_ORIGIN` to allow frontend origins
- `AUTO_CREATE_TABLES` to let Express create base tables automatically
- `DATABASE_SSL=true` when a hosted PostgreSQL provider requires SSL

If `DATABASE_URL` is empty, the API still works with an in-memory store so the MVP demo does not crash.

## REST API

- `GET /health`
- `GET /api/roles`
- `POST /api/cv/upload`
- `GET /api/quiz/questions?domain=technology&targetRole=fullstack-web-developer`
- `POST /api/quiz/submit`
- `POST /api/recommendations`
- `GET /api/dashboard/overview`
- `GET /api/dashboard/:userId`
- `POST /api/leads`
- `GET /api/project/requirements`

## Deployment

Frontend deployment can use Netlify, Vercel, or GitHub Pages. Set `VITE_API_URL` to the deployed API URL.

Backend deployment can use Render, Railway, or a VPS. This repository includes:

- `render.yaml` for Render Node service + PostgreSQL
- `apps/api/Dockerfile` for Express API containerization
- `docker-compose.backend.yml` for API + PostgreSQL
- `deploy/nginx-skillmap-api.conf.example` for reverse proxy setup

## AI/ML And Data Science Handoff

The Express API currently uses a deterministic recommendation service so the app can be demonstrated end to end. The AI team can replace or augment the service behind the same contract with:

- TensorFlow model export (`.keras` or SavedModel)
- Inference service through Flask/FastAPI
- Generative AI as a secondary feature for roadmap explanation
- TensorBoard logs and model evaluation artifacts

The Data Science team can connect their outputs through dashboard-ready artifacts:

- Data dictionary
- EDA visualizations
- Feature engineering outputs
- A/B testing results
- Streamlit dashboard URL
- Final technical report PDF
