# SkillMap — Frontend

Aplikasi web React + Vite untuk capstone MVP **SkillMap: Navigator Pembelajaran Keterampilan yang Dipersonalisasi**.

Repo ini adalah workspace frontend. Backend Flask ada di `../BE-Capstone`, dan service AI dikelola oleh tim AI secara terpisah.

## Ruang Lingkup

- Antarmuka pengguna SkillMap berbasis web
- Auth email/password melalui Supabase (browser-side)
- Alur upload CV, form profil, job match, mini quiz, hasil akhir, dan dashboard
- Semua request API diarahkan melalui `VITE_API_URL`

Perubahan backend tidak dilakukan di repo ini. Gunakan `../BE-Capstone` untuk pekerjaan Flask API.

## Struktur Folder

```
Capstone/
├── apps/
│   └── web/              # Aplikasi React + Vite
│       ├── src/          # UI, state, Supabase client, dan Axios API client
│       ├── index.html
│       ├── package.json
│       ├── vite.config.js
│       └── .env.example
├── docs/                 # Dokumentasi frontend dan referensi API
├── package.json
└── README.md
```

## Menjalankan Secara Lokal

Install dependensi:

```bash
npm --prefix apps/web install
```

Buat file environment frontend:

```powershell
Copy-Item apps/web/.env.example apps/web/.env
```

Isi variabel backend URL dan Supabase di file `.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Jalankan frontend:

```bash
npm --prefix apps/web run dev
```

Frontend berjalan di:

```
http://localhost:5173
```

Jalankan backend dari `../BE-Capstone`:

```bash
cd ../BE-Capstone
flask --app src.app run --port 3001 --reload
```

> Di Windows PowerShell, gunakan `npm.cmd` jika eksekusi `npm.ps1` diblokir oleh execution policy.

## Kontrak API

Frontend membaca base URL dari `VITE_API_URL` dan memanggil endpoint berikut:

| Method | Endpoint |
|--------|----------|
| GET | `/health` |
| GET | `/api/profile` |
| GET | `/api/profile/cv-analyses` |
| POST | `/api/cvs` |
| POST | `/api/career-fit-quizzes` |
| POST | `/api/career-results` |
| POST | `/api/recommendations` |

Konfigurasi backend, database, CORS, dan AI service diatur di `../BE-Capstone/server.env`.

## Deployment

Deploy hanya dari workspace ini. Set environment variable berikut di platform hosting:

```env
VITE_API_URL=https://your-backend-domain.com
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Build command:

```bash
npm --prefix apps/web run build
```

Output build:

```
apps/web/dist
```
