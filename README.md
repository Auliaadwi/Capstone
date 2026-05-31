# SkillMap Frontend

SkillMap frontend is the React + Vite web app for the capstone MVP "Navigator Pembelajaran Keterampilan yang Dipersonalisasi".

This repository is now treated as the frontend workspace. The authoritative backend lives in `../BE-Capstone`, and the AI/model service is owned separately by the AI team.

## Scope

- User-facing SkillMap web interface
- Supabase email/password auth from the browser
- CV upload flow, profile form, job match view, mini quiz, final result, and dashboard UI
- API calls through `VITE_API_URL`

Do not add new backend changes in this repository. Use `../BE-Capstone` for Flask API work.

## Structure

- `apps/web` - React + Vite frontend application
- `apps/web/src` - UI, client state, Supabase client, and Axios API client
- `apps/web/.env.example` - frontend environment template
- `docs` - frontend-facing project notes and API references

AI/model files are intentionally left untouched because they are owned outside the frontend scope.

## Run Locally

Install dependencies:

```bash
npm --prefix apps/web install
```

Create frontend env:

```powershell
Copy-Item apps/web/.env.example apps/web/.env
```

Set the backend URL and Supabase browser keys:

```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Start the frontend:

```bash
npm --prefix apps/web run dev
```

Default frontend URL:

```txt
http://localhost:5173
```

Run the backend from `../BE-Capstone`:

```bash
cd ../BE-Capstone
flask --app src.app run --port 3001 --reload
```

On Windows PowerShell, use `npm.cmd` if the execution policy blocks `npm.ps1`.

## API Contract

The frontend expects the backend base URL from `VITE_API_URL` and calls these main endpoints:

- `GET /health`
- `GET /api/profile`
- `GET /api/profile/cv-analyses`
- `GET /api/roles`
- `POST /api/cvs`
- `POST /api/career-fit-quizzes`
- `POST /api/career-results`
- `POST /api/recommendations`

Backend secrets, database configuration, CORS, and AI service configuration belong in `../BE-Capstone/server.env`.

## Deployment

Deploy only the frontend from this workspace. Set these provider environment variables:

```env
VITE_API_URL=https://your-backend-domain.com
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Build command:

```bash
npm --prefix apps/web run build
```

Build output:

```txt
apps/web/dist
```
