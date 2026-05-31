# Frontend Project Structure

`Capstone` is the frontend workspace for SkillMap. The Flask backend source of truth is `../BE-Capstone`.

```txt
Capstone/
|-- apps/
|   `-- web/              # React + Vite frontend application
|       |-- src/          # UI, API client, Supabase client, and styles
|       |-- index.html
|       |-- package.json
|       |-- vite.config.js
|       `-- .env.example
|-- docs/                 # Frontend-facing docs and API references
|-- package.json          # Frontend convenience scripts
`-- README.md
```

## Where To Work

- Frontend UI, pages, state, and styles: `apps/web/src`.
- Browser API calls: `apps/web/src/api.js`.
- Supabase browser client: `apps/web/src/supabaseClient.js`.
- Frontend package and Vite settings: `apps/web/package.json`, `apps/web/vite.config.js`.
- Frontend environment example: `apps/web/.env.example`.

## Separate Repositories

- Backend API work belongs in `../BE-Capstone`.
- AI/model work belongs to the AI team and is out of frontend scope.
- The frontend talks to the backend only through `VITE_API_URL`.

## Placement Rules

- Keep frontend-specific code inside `apps/web`.
- Keep backend secrets out of this workspace.
- Keep generated dependency folders such as `node_modules`, build output, and local env files out of git.
